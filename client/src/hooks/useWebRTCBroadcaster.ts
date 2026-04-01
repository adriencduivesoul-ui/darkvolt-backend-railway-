import { useState, useRef, useCallback, useEffect } from 'react';
import socket from '../lib/socket';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useWebRTCBroadcaster() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true); // État du micro
  const peers = useRef<Map<string, RTCPeerConnection>>(new Map());
  const streamRef = useRef<MediaStream | null>(null);
  const micTrackRef = useRef<MediaStreamTrack | null>(null);
  const audioMixCtxRef = useRef<AudioContext | null>(null);

  // Toggle microphone en temps réel (utilise la référence directe du track mic)
  const toggleMicrophone = useCallback(() => {
    const newState = !microphoneEnabled;
    setMicrophoneEnabled(newState);
    if (micTrackRef.current) {
      micTrackRef.current.enabled = newState;
      console.log('🎙 Microphone', newState ? 'enabled' : 'muted');
    }
  }, [microphoneEnabled]);

  const toggleVideo = useCallback(() => {
    if (!streamRef.current) return;
    const videoTracks = streamRef.current.getVideoTracks();
    videoTracks.forEach(track => {
      track.enabled = !track.enabled;
    });
    setVideoEnabled(!videoEnabled);
  }, [videoEnabled]);

  const toggleAudio = useCallback(() => {
    if (!streamRef.current) return;
    const audioTracks = streamRef.current.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = !track.enabled;
    });
    setAudioEnabled(!audioEnabled);
  }, [audioEnabled]);

  const makeOffer = useCallback(async (viewerSocketId: string) => {
    if (!streamRef.current) {
      console.log('🎥 WebRTC Broadcaster: No stream available, cannot make offer');
      return;
    }
    console.log('🎥 WebRTC Broadcaster: Making offer to viewer', viewerSocketId);
    console.log('🎥 WebRTC Broadcaster: Stream tracks available:', streamRef.current.getTracks().length);
    
    const pc = new RTCPeerConnection(RTC_CONFIG);
    peers.current.set(viewerSocketId, pc);

    streamRef.current.getTracks().forEach(track => {
      console.log('🎥 WebRTC Broadcaster: Adding track to peer connection', track.kind);
      pc.addTrack(track, streamRef.current!);
    });

    pc.onicecandidate = e => {
      if (e.candidate) {
        console.log('🎥 WebRTC Broadcaster: Sending ICE candidate to', viewerSocketId);
        socket.emit('webrtc:ice', { to: viewerSocketId, candidate: e.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🎥 WebRTC Broadcaster: Connection state with', viewerSocketId, 'changed to', pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        peers.current.delete(viewerSocketId);
        pc.close();
      }
    };

    const offer = await pc.createOffer();
    console.log('🎥 WebRTC Broadcaster: Created offer, sending to', viewerSocketId);
    await pc.setLocalDescription(offer);
    socket.emit('webrtc:offer', { to: viewerSocketId, offer });
    console.log('🎥 WebRTC Broadcaster: Offer sent to', viewerSocketId);
  }, []);

  useEffect(() => {
    const onViewerNew = async (viewerSocketId: string) => {
      console.log('🎥 WebRTC Broadcaster: Received viewer:new event', viewerSocketId, 'broadcasting:', broadcasting);
      console.log('🎥 WebRTC Broadcaster: Current peers count:', peers.current.size);
      
      if (broadcasting) {
        console.log('🎥 WebRTC Broadcaster: Making offer to new viewer', viewerSocketId);
        makeOffer(viewerSocketId);
      } else {
        console.log('🎥 WebRTC Broadcaster: Not broadcasting, ignoring viewer:new');
      }
    };

    const onAnswer = async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      const pc = peers.current.get(from);
      if (pc && pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const onIce = async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      const pc = peers.current.get(from);
      if (pc) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      }
    };

    socket.on('viewer:new', onViewerNew);
    socket.on('webrtc:answer', onAnswer);
    socket.on('webrtc:ice', onIce);

    return () => {
      socket.off('viewer:new', onViewerNew);
      socket.off('webrtc:answer', onAnswer);
      socket.off('webrtc:ice', onIce);
    };
  }, [broadcasting, makeOffer]);

  const startBroadcast = useCallback(async (opts: { video: boolean; audio: boolean; microphone?: boolean; extraAudioDeviceId?: string; preAuthorizedSysStream?: MediaStream }) => {
    setError(null);
    try {
      let stream: MediaStream;
      const videoConstraints = opts.video
        ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
        : false;

      if (opts.extraAudioDeviceId === 'system:audio') {
        // ── Mode Son Système : capture WASAPI loopback via getDisplayMedia (Boom 3D, VoiceMeeter…) ──
        let sysStream: MediaStream;
        // Utilise le stream pré-autorisé depuis le Dashboard (sélectionné avant GO LIVE = pas de popup)
        if (opts.preAuthorizedSysStream && opts.preAuthorizedSysStream.getAudioTracks().some(t => t.readyState === 'live')) {
          sysStream = opts.preAuthorizedSysStream;
        } else {
          // Fallback : demande à nouveau getDisplayMedia si pas pré-autorisé
          try {
            try {
              sysStream = await (navigator.mediaDevices as any).getDisplayMedia({
                audio: { suppressLocalAudioPlayback: false, echoCancellation: false, autoGainControl: false, noiseSuppression: false },
                video: false,
              });
            } catch {
              sysStream = await (navigator.mediaDevices as any).getDisplayMedia({
                audio: { suppressLocalAudioPlayback: false, echoCancellation: false, autoGainControl: false, noiseSuppression: false },
                video: true,
              });
              sysStream.getVideoTracks().forEach(t => t.stop());
            }
          } catch {
            throw new Error('Accès au son système refusé. Cochez "Partager le son du système" dans le popup navigateur.');
          }
        }
        const audioTracks = sysStream.getAudioTracks();
        if (!audioTracks.length) throw new Error('Aucun son système capturé — cochez "Partager le son" dans la boîte de dialogue.');
        micTrackRef.current = null;
        if (opts.microphone) {
          try {
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: { autoGainControl: true, echoCancellation: true, noiseSuppression: true }, video: false });
            micTrackRef.current = micStream.getAudioTracks()[0] || null;
            const ctx = new AudioContext();
            audioMixCtxRef.current = ctx;
            await ctx.resume();
            const dest = ctx.createMediaStreamDestination();
            ctx.createMediaStreamSource(sysStream).connect(dest);
            ctx.createMediaStreamSource(micStream).connect(dest);
            const videoTracks = opts.video ? (await navigator.mediaDevices.getUserMedia({ audio: false, video: videoConstraints })).getVideoTracks() : [];
            stream = new MediaStream([...dest.stream.getAudioTracks(), ...videoTracks]);
          } catch {
            const videoTracks = opts.video ? (await navigator.mediaDevices.getUserMedia({ audio: false, video: videoConstraints })).getVideoTracks() : [];
            stream = new MediaStream([...audioTracks, ...videoTracks]);
          }
        } else {
          const videoTracks = opts.video ? (await navigator.mediaDevices.getUserMedia({ audio: false, video: videoConstraints })).getVideoTracks() : [];
          stream = new MediaStream([...audioTracks, ...videoTracks]);
        }
        console.log('🖥️ Son système capturé via getDisplayMedia (WASAPI loopback)');

      } else if (opts.extraAudioDeviceId) {
        // ── Mode DJ: source audio sélectionnée (line-in, carte son, périphérique virtuel Boom 3D…) ──
        let djStream: MediaStream;
        try {
          djStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              deviceId: { exact: opts.extraAudioDeviceId },
              autoGainControl: false,
              echoCancellation: false,
              noiseSuppression: false,
              sampleRate: 48000,
              channelCount: 2,
            },
            video: false,
          });
        } catch {
          djStream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: opts.extraAudioDeviceId } },
            video: false,
          });
        }

        if (opts.microphone) {
          // ── Mode DJ + Micro : mixage WebAudio des deux sources ──
          try {
            const micStream = await navigator.mediaDevices.getUserMedia({
              audio: { autoGainControl: true, echoCancellation: true, noiseSuppression: true },
              video: false,
            });
            micTrackRef.current = micStream.getAudioTracks()[0] || null;

            const ctx = new AudioContext();
            audioMixCtxRef.current = ctx;
            await ctx.resume();
            const dest = ctx.createMediaStreamDestination();
            ctx.createMediaStreamSource(djStream).connect(dest);
            ctx.createMediaStreamSource(micStream).connect(dest);

            const videoTracks = opts.video
              ? (await navigator.mediaDevices.getUserMedia({ audio: false, video: videoConstraints })).getVideoTracks()
              : [];
            stream = new MediaStream([...dest.stream.getAudioTracks(), ...videoTracks]);
            console.log('🏛️ + 🎙 DJ source mixée avec micro capturé');
          } catch {
            // Micro non disponible, DJ seul
            micTrackRef.current = null;
            const videoTracks = opts.video
              ? (await navigator.mediaDevices.getUserMedia({ audio: false, video: videoConstraints })).getVideoTracks()
              : [];
            stream = new MediaStream([...djStream.getAudioTracks(), ...videoTracks]);
            console.log('🏛️ Source DJ seule (micro indisponible):', opts.extraAudioDeviceId);
          }
        } else {
          // DJ sans micro
          micTrackRef.current = null;
          const videoTracks = opts.video
            ? (await navigator.mediaDevices.getUserMedia({ audio: false, video: videoConstraints })).getVideoTracks()
            : [];
          stream = new MediaStream([...djStream.getAudioTracks(), ...videoTracks]);
          console.log('�️ Source DJ capturée:', opts.extraAudioDeviceId);
        }

      } else {
        // ── Mode micro/défaut ──
        stream = await navigator.mediaDevices.getUserMedia({
          audio: opts.audio
            ? { autoGainControl: true, echoCancellation: true, noiseSuppression: true, sampleRate: 48000 }
            : false,
          video: videoConstraints,
        });
        micTrackRef.current = stream.getAudioTracks()[0] || null;
        console.log('🎤 Source micro/défaut capturée');
      }

      streamRef.current = stream;
      setLocalStream(stream);
      setVideoEnabled(opts.video);
      setAudioEnabled(opts.audio);
      setBroadcasting(true);
      socket.emit('broadcaster:register', { hasVideo: opts.video });
      return true;

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Accès média refusé';
      console.error('🎥 WebRTC Broadcaster: Error starting broadcast', err);
      setError(msg);
      return false;
    }
  }, []);

  const stopBroadcast = useCallback(() => {
    audioMixCtxRef.current?.close().catch(() => {});
    audioMixCtxRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    micTrackRef.current?.stop();
    micTrackRef.current = null;
    peers.current.forEach(pc => pc.close());
    peers.current.clear();
    streamRef.current = null;
    setLocalStream(null);
    setBroadcasting(false);
    setMicrophoneEnabled(true);
    socket.emit('broadcaster:stop');
  }, []);

  return { 
    localStream, 
    broadcasting, 
    videoEnabled, 
    audioEnabled, 
    error, 
    startBroadcast, 
    stopBroadcast, 
    toggleVideo, 
    toggleAudio,
    toggleMicrophone,
    microphoneEnabled
  };
}
