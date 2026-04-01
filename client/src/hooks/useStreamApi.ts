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

// FORCER RAILWAY EN PRODUCTION - PLUS DE VARIABLES D'ENVIRONNEMENT
const API = 'https://darkvolt-backend-production.up.railway.app';

// DEBUG : Forcer le rebuild
console.log('🚀 API URL FORCED:', API);

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

  const headers = (): Record<string, string> => {
    const token = localStorage.getItem('darkvolt_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(userId ? { 'x-user-id': userId } : {}),
    };
  };

  const fetchStatus = useCallback(async () => {
    console.log('🔍 fetchStatus: appel de l\'API...');
    try {
      const r = await fetch(`${API}/api/stream/status`, { headers: headers() });
      if (r.ok) {
        const data = await r.json();
        console.log('✅ fetchStatus: réponse API reçue:', data);
        // Convertir le format Superbase vers le format frontend
        const converted = {
          isLive: data.status === 'live',
          title: data.title || '',
          description: data.description || '',
          genre: data.genre || '',
          streamerName: data.streamer_name || (data.streamer_id ? `Streamer-${data.streamer_id.slice(0, 8)}` : ''),
          streamerId: data.streamer_id || '',
          startedAt: data.started_at ? new Date(data.started_at).getTime() : null,
          viewers: data.viewer_count || 0,
          peakViewers: data.peak_viewers || 0,
          key: data.stream_key || '',
          hasBroadcastVideo: data.has_broadcast_video || false,
        };
        console.log('✅ fetchStatus: status converti:', converted);
        setStatus(converted);
      } else {
        console.log('❌ fetchStatus: erreur API', r.status);
        setStatus(DEFAULT);
      }
    } catch (error) {
      console.log('❌ fetchStatus: erreur catch:', error);
      setStatus(DEFAULT);
    }
  }, [userId]);

  const fetchKey = useCallback(async () => {
    if (!userId) return;
    try {
      const r = await fetch(`${API}/api/stream/key`, { headers: headers() });
      if (r.ok) {
        const d = await r.json();
        setStreamKey(d.key);
        setRtmpServer(d.server);
      }
    } catch {}
  }, [userId]);

  const fetchHistory = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/stream/history`, { headers: headers() });
      if (r.ok) setHistory(await r.json());
    } catch {}
  }, [userId]);

  useEffect(() => {
    console.log('🚀 useStreamApi: useEffect appelé');
    fetchStatus();
    fetchKey();
    fetchHistory();
    pollRef.current = setInterval(fetchStatus, 8000);

    const toFront = (s: any): StreamStatus => ({
      isLive: 'isLive' in s ? s.isLive : s.status === 'live',
      title: s.title || '',
      description: s.description || '',
      genre: s.genre || '',
      streamerName: s.streamer_name || s.streamerName || '',
      streamerId: s.streamer_id || s.streamerId || '',
      startedAt: s.started_at ? new Date(s.started_at).getTime() : (s.startedAt ?? null),
      viewers: s.viewer_count ?? s.viewers ?? 0,
      peakViewers: s.peak_viewers ?? s.peakViewers ?? 0,
      key: s.stream_key || s.key || '',
      hasBroadcastVideo: s.has_video || s.hasBroadcastVideo || false,
    });

    const onStatus    = (s: any) => setStatus(toFront(s));
    const onViewers   = (d: { viewers: number; peakViewers: number }) =>
      setStatus(prev => ({ ...prev, viewers: d.viewers, peakViewers: Math.max(prev.peakViewers, d.peakViewers) }));
    const onStreamStart  = (s: any) => setStatus(toFront(s));
    const onStreamEnd    = () => setStatus(prev => ({ ...DEFAULT, key: prev.key }));
    const onStreamUpdate = (s: any) => setStatus(toFront(s));

    socket.on('stream:status', onStatus);
    socket.on('stream:viewers', onViewers);
    socket.on('stream:start', onStreamStart);
    socket.on('stream:end', onStreamEnd);
    socket.on('stream:update', onStreamUpdate);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      socket.off('stream:status', onStatus);
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
        const raw = d.stream || d.status;
        if (raw) {
          setStatus({
            isLive: 'isLive' in raw ? raw.isLive : raw.status === 'live',
            title: raw.title || '',
            description: raw.description || '',
            genre: raw.genre || '',
            streamerName: raw.streamer_name || raw.streamerName || '',
            streamerId: raw.streamer_id || raw.streamerId || '',
            startedAt: raw.started_at ? new Date(raw.started_at).getTime() : (raw.startedAt ?? null),
            viewers: raw.viewer_count ?? raw.viewers ?? 0,
            peakViewers: raw.peak_viewers ?? raw.peakViewers ?? 0,
            key: raw.stream_key || raw.key || '',
            hasBroadcastVideo: raw.has_video || raw.hasBroadcastVideo || false,
          });
        }
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
        const raw = d.status || d.stream;
        if (raw) {
          setStatus({
            isLive: 'isLive' in raw ? raw.isLive : raw.status === 'live',
            title: raw.title || '',
            description: raw.description || '',
            genre: raw.genre || '',
            streamerName: raw.streamer_name || raw.streamerName || '',
            streamerId: raw.streamer_id || raw.streamerId || '',
            startedAt: raw.started_at ? new Date(raw.started_at).getTime() : (raw.startedAt ?? null),
            viewers: raw.viewer_count ?? raw.viewers ?? 0,
            peakViewers: raw.peak_viewers ?? raw.peakViewers ?? 0,
            key: raw.stream_key || raw.key || '',
            hasBroadcastVideo: raw.has_video || raw.hasBroadcastVideo || false,
          });
        }
      }
    } catch {}
  }, []);

  const resetKey = useCallback(async () => {
    if (!userId) return;
    try {
      const r = await fetch(`${API}/api/stream/key/reset`, {
        method: 'POST',
        headers: headers(),
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
