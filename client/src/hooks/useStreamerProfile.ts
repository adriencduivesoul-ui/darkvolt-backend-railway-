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

const API = 'https://darkvolt-backend-production.up.railway.app';

const authHeaders = () => {
  const token = localStorage.getItem('darkvolt_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export function useStreamerProfile() {
  const [profile, setProfile] = useState<StreamerProfile>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/profile`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : DEFAULT)
      .then(data => { setProfile(data); setLoaded(true); })
      .catch(() => { setLoaded(true); });

    const handler = (p: StreamerProfile) => setProfile(p);
    socket.on('profile:updated', handler);
    return () => { socket.off('profile:updated', handler); };
  }, []);

  const saveProfile = useCallback(async (patch: Partial<StreamerProfile>) => {
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/profile`, {
        method: 'PUT',
        headers: authHeaders(),
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

  return { profile, saving, saved, loaded, saveProfile };
}
