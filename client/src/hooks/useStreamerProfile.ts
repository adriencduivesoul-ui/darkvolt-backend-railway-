import { useState, useEffect, useCallback } from 'react';
import socket from '../lib/socket';

export interface StreamerProfile {
  username: string;
  bio: string;
  avatar: string;
  genres: string[];
  instagram: string;
  facebook: string;
  discord: string;
  twitch: string;
  soundcloud: string;
  website: string;
}

const DEFAULT: StreamerProfile = {
  username: 'DJ DarkVolt', bio: '', avatar: '', genres: [],
  instagram: '', facebook: '', discord: '', twitch: '', soundcloud: '', website: '',
};

const API = (import.meta.env.VITE_API_URL as string) || '';

export function useStreamerProfile() {
  const [profile, setProfile] = useState<StreamerProfile>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/profile`)
      .then(r => r.ok ? r.json() : DEFAULT)
      .then(setProfile)
      .catch(() => {});

    const handler = (p: StreamerProfile) => setProfile(p);
    socket.on('profile:updated', handler);
    return () => { socket.off('profile:updated', handler); };
  }, []);

  const saveProfile = useCallback(async (patch: Partial<StreamerProfile>) => {
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (r.ok) {
        const updated = await r.json();
        setProfile(updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch {}
    setSaving(false);
  }, []);

  return { profile, saving, saved, saveProfile };
}
