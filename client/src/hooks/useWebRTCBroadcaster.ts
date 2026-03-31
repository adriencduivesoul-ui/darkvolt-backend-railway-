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
  const audioMixCtxRef = useRef<AudioContext | null>(null);

  // Toggle microphone en temps réel
  const toggleMicrophone = useCallback(() => {
    if (!streamRef.current) return;
    
    const newMicrophoneState = !microphoneEnabled;
    setMicrophoneEnabled(newMicrophoneState);
    
    const audioTracks = streamRef.current.getAudioTracks();
    audioTracks.forEach(track => {
      if (track.label && (track.label.toLowerCase().includes('microphone') || 
                         track.label.toLowerCase().includes('mic') ||
                         track.label.toLowerCase().includes('default'))) {
        track.enabled = newMicrophoneState;
        console.log('🎙 Microphone track', newMicrophoneState ? 'enabled' : 'disabled', ':', track.label);
      }
    });
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

  const startBroadcast = useCallback(async (opts: { video: boolean; audio: boolean; microphone?: boolean; extraAudioDeviceId?: string }) => {
    setError(null);
    try {
      let stream: MediaStream;
      const videoConstraints = opts.video
        ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
        : false;

      if (opts.extraAudioDeviceId) {
        // ── Mode DJ: source audio sélectionnée directement (line-in, carte son, etc.) ──
        let audioStream: MediaStream;
        try {
          // Tentative avec contraintes optimales (Chrome/Edge)
          audioStream = await navigator.mediaDevices.getUserMedia({
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
          // Fallback Firefox : contraintes minimales (juste le deviceId)
          audioStream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: opts.extraAudioDeviceId } },
            video: false,
          });
        }

        if (opts.video) {
          const videoStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: videoConstraints });
          stream = new MediaStream([...audioStream.getAudioTracks(), ...videoStream.getVideoTracks()]);
        } else {
          stream = audioStream;
        }
        console.log('🎛️ Source DJ capturée directement:', opts.extraAudioDeviceId);

      } else {
        // ── Mode micro/défaut ──
        stream = await navigator.mediaDevices.getUserMedia({
          audio: opts.audio
            ? { autoGainControl: true, echoCancellation: true, noiseSuppression: true, sampleRate: 48000 }
            : false,
          video: videoConstraints,
        });
        console.log('🎤 Source micro/défaut capturée');
      }

      streamRef.current = stream;
      setLocalStream(stream);
      setVideoEnabled(opts.video);
      setAudioEnabled(opts.audio);
      setBroadcasting(true);
      socket.emit('broadcaster:register', { hasVideo: opts.video });

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Accès média refusé';
      console.error('🎥 WebRTC Broadcaster: Error starting broadcast', err);
      setError(msg);
    }
  }, []);

  const stopBroadcast = useCallback(() => {
    audioMixCtxRef.current?.close().catch(() => {});
    audioMixCtxRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    peers.current.forEach(pc => pc.close());
    peers.current.clear();
    streamRef.current = null;
    setLocalStream(null);
    setBroadcasting(false);
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
