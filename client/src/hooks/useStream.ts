import { useState, useEffect, useCallback, useRef } from 'react';

export interface StreamStatus {
  isLive: boolean;
  title: string;
  description: string;
  genre: string;
  streamerName: string;
  startedAt: number | null;
  viewers: number;
}

const STREAM_KEY = 'darkvolt_stream_status';

const DEFAULT_STATUS: StreamStatus = {
  isLive: false,
  title: '',
  description: '',
  genre: '',
  streamerName: '',
  startedAt: null,
  viewers: 0,
};

function loadStatus(): StreamStatus {
  try { return { ...DEFAULT_STATUS, ...JSON.parse(localStorage.getItem(STREAM_KEY) || '{}') }; }
  catch { return DEFAULT_STATUS; }
}

function saveStatus(s: StreamStatus) {
  localStorage.setItem(STREAM_KEY, JSON.stringify(s));
}

export function useStream() {
  const [status, setStatus] = useState<StreamStatus>(loadStatus);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STREAM_KEY) setStatus(loadStatus());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Simulate viewers fluctuation when live
  useEffect(() => {
    if (status.isLive) {
      timerRef.current = setInterval(() => {
        setStatus(prev => {
          const delta = Math.floor(Math.random() * 7) - 3;
          const next = { ...prev, viewers: Math.max(1, prev.viewers + delta) };
          saveStatus(next);
          return next;
        });
      }, 8000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status.isLive]);

  const goLive = useCallback((config: { title: string; description: string; genre: string; streamerName: string }) => {
    const next: StreamStatus = {
      isLive: true,
      ...config,
      startedAt: Date.now(),
      viewers: Math.floor(Math.random() * 40) + 5,
    };
    saveStatus(next);
    setStatus(next);
  }, []);

  const endStream = useCallback(() => {
    const next: StreamStatus = { ...DEFAULT_STATUS };
    saveStatus(next);
    setStatus(next);
  }, []);

  const getLiveDuration = useCallback(() => {
    if (!status.isLive || !status.startedAt) return '00:00:00';
    const s = Math.floor((Date.now() - status.startedAt) / 1000);
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  }, [status]);

  return { status, goLive, endStream, getLiveDuration };
}
