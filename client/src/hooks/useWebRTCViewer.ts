import { useState, useRef, useEffect, useCallback } from 'react';
import socket from '../lib/socket';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useWebRTCViewer(userId: string, username: string) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connected, setConnected] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const joinedRef = useRef(false);

  const join = useCallback(() => {
    if (joinedRef.current) return;
    console.log('🎥 WebRTC Viewer: Joining stream as', username);
    joinedRef.current = true;
    socket.emit('viewer:join', { userId, username });
  }, [userId, username]);

  const leave = useCallback(() => {
    if (!joinedRef.current) return;
    joinedRef.current = false;
    socket.emit('viewer:leave');
    pcRef.current?.close();
    pcRef.current = null;
    setRemoteStream(null);
    setConnected(false);
  }, []);

  useEffect(() => {
    const onOffer = async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      console.log('🎥 WebRTC Viewer: Received offer from', from);
      console.log('🎥 WebRTC Viewer: Offer details:', offer);
      
      pcRef.current?.close();

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;
      console.log('🎥 WebRTC Viewer: Created RTCPeerConnection');

      const stream = new MediaStream();
      setRemoteStream(stream);
      console.log('🎥 WebRTC Viewer: Created remote stream');

      pc.ontrack = e => {
        console.log('🎥 WebRTC Viewer: Received track', e.track.kind, e.track.enabled ? 'enabled' : 'disabled');
        stream.addTrack(e.track);
        if (e.track.kind === 'video') {
          console.log('🎥 WebRTC Viewer: Video track received, setting hasVideo to true');
          setHasVideo(true);
        }
      };

      pc.onicecandidate = e => {
        if (e.candidate) {
          console.log('🎥 WebRTC Viewer: Sending ICE candidate to', from);
          socket.emit('webrtc:ice', { to: from, candidate: e.candidate });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('🎥 WebRTC Viewer: Connection state changed to', pc.connectionState);
        if (pc.connectionState === 'connected') {
          console.log('🎥 WebRTC Viewer: Connected! Banner should appear now.');
          setConnected(true);
        }
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          console.log('🎥 WebRTC Viewer: Disconnected');
          setConnected(false);
          setRemoteStream(null);
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('🎥 WebRTC Viewer: Set remote description');
      const answer = await pc.createAnswer();
      console.log('🎥 WebRTC Viewer: Created answer');
      await pc.setLocalDescription(answer);
      console.log('🎥 WebRTC Viewer: Set local description, sending answer to', from);
      socket.emit('webrtc:answer', { to: from, answer });
    };

    const onIce = async ({ candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      try {
        if (pcRef.current) await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {}
    };

    const onBroadcasterStopped = () => {
      pcRef.current?.close();
      pcRef.current = null;
      setRemoteStream(null);
      setConnected(false);
      setHasVideo(false);
    };

    socket.on('webrtc:offer', onOffer);
    socket.on('webrtc:ice', onIce);
    socket.on('broadcaster:stopped', onBroadcasterStopped);

    return () => {
      socket.off('webrtc:offer', onOffer);
      socket.off('webrtc:ice', onIce);
      socket.off('broadcaster:stopped', onBroadcasterStopped);
    };
  }, []);

  return { remoteStream, connected, hasVideo, join, leave };
}
