import { useState, useEffect, useCallback, useRef } from 'react';
import socket from '../lib/socket';

export interface StreamStatus {
  isLive: boolean;
  title: string;
  description: string;
  genre: string;
  streamerName: string;
  streamerId: string;
  startedAt: number | null;
  viewers: number;
  peakViewers: number;
  key: string;
  hasBroadcastVideo: boolean;
}

export interface StreamRecord {
  id: string;
  title: string;
  genre: string;
  streamerName: string;
  startedAt: number;
  endedAt: number;
  duration: number;
  peakViewers: number;
  totalMessages: number;
}

const API = (import.meta.env.VITE_API_URL as string) || '';

const DEFAULT: StreamStatus = {
  isLive: false, title: '', description: '', genre: '',
  streamerName: '', streamerId: '', startedAt: null,
  viewers: 0, peakViewers: 0, key: '', hasBroadcastVideo: false,
};

export function useStreamApi(userId?: string) {
  const [status, setStatus]   = useState<StreamStatus>(DEFAULT);
  const [history, setHistory] = useState<StreamRecord[]>([]);
  const [streamKey, setStreamKey] = useState('');
  const [rtmpServer, setRtmpServer] = useState('rtmp://localhost:1935/live');
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const headers = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...(userId ? { 'x-user-id': userId } : {}),
  });

  const fetchStatus = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/stream/status`);
      if (r.ok) setStatus(await r.json());
    } catch {}
  }, []);

  const fetchKey = useCallback(async () => {
    if (!userId) return;
    try {
      const r = await fetch(`${API}/api/stream/key`, { headers: { 'x-user-id': userId } });
      if (r.ok) {
        const d = await r.json();
        setStreamKey(d.key);
        setRtmpServer(d.server);
      }
    } catch {}
  }, [userId]);

  const fetchHistory = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/stream/history`);
      if (r.ok) setHistory(await r.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchKey();
    fetchHistory();
    pollRef.current = setInterval(fetchStatus, 8000);

    const onViewers = (d: { viewers: number; peakViewers: number }) => {
      setStatus(prev => ({ ...prev, viewers: d.viewers, peakViewers: Math.max(prev.peakViewers, d.peakViewers) }));
    };
    const onStreamStart = (s: StreamStatus) => setStatus(s);
    const onStreamEnd = () => setStatus(prev => ({ ...DEFAULT, key: prev.key }));
    const onStreamUpdate = (s: StreamStatus) => setStatus(s);

    socket.on('stream:viewers', onViewers);
    socket.on('stream:start', onStreamStart);
    socket.on('stream:end', onStreamEnd);
    socket.on('stream:update', onStreamUpdate);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      socket.off('stream:viewers', onViewers);
      socket.off('stream:start', onStreamStart);
      socket.off('stream:end', onStreamEnd);
      socket.off('stream:update', onStreamUpdate);
    };
  }, [fetchStatus, fetchKey, fetchHistory]);

  const goLive = useCallback(async (config: { title: string; description: string; genre: string; streamerName: string }) => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/stream/start`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ ...config, streamerId: userId }),
      });
      if (r.ok) {
        const d = await r.json();
        setStatus(d.status);
      }
    } catch {}
    setLoading(false);
  }, [userId]);

  const endStream = useCallback(async () => {
    try {
      await fetch(`${API}/api/stream/end`, { method: 'POST', headers: headers() });
      setStatus(prev => ({ ...DEFAULT, key: prev.key }));
      fetchHistory();
    } catch {}
  }, [fetchHistory]);

  const updateStream = useCallback(async (data: { title?: string; description?: string; genre?: string }) => {
    try {
      const r = await fetch(`${API}/api/stream/update`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(data),
      });
      if (r.ok) {
        const d = await r.json();
        setStatus(d.status);
      }
    } catch {}
  }, []);

  const resetKey = useCallback(async () => {
    if (!userId) return;
    try {
      const r = await fetch(`${API}/api/stream/key/reset`, {
        method: 'POST',
        headers: { 'x-user-id': userId },
      });
      if (r.ok) {
        const d = await r.json();
        setStreamKey(d.key);
      }
    } catch {}
  }, [userId]);

  const getLiveDuration = useCallback(() => {
    if (!status.isLive || !status.startedAt) return '00:00:00';
    const s = Math.floor((Date.now() - status.startedAt) / 1000);
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  }, [status]);

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h${String(m).padStart(2, '0')}m` : `${m}m`;
  };

  return { status, history, streamKey, rtmpServer, loading, goLive, endStream, updateStream, resetKey, getLiveDuration, formatDuration, fetchStatus };
}
