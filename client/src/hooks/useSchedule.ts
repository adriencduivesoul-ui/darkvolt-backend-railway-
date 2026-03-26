import { useState, useEffect, useCallback } from 'react';
import socket from '../lib/socket';

export interface ScheduleEvent {
  id: string;
  title: string;
  djName: string;
  genre: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  duration: number;   // minutes
  description: string;
  color: 'green' | 'red';
  recurring: 'weekly' | 'monthly' | null;
}

const API = (import.meta.env.VITE_API_URL as string) || '';

export function useSchedule() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);

  useEffect(() => {
    fetch(`${API}/api/schedule`)
      .then(r => r.ok ? r.json() : [])
      .then(setEvents)
      .catch(() => {});

    const handler = (evs: ScheduleEvent[]) => setEvents(evs);
    socket.on('schedule:updated', handler);
    return () => { socket.off('schedule:updated', handler); };
  }, []);

  const addEvent = useCallback(async (ev: Omit<ScheduleEvent, 'id'>) => {
    try {
      const r = await fetch(`${API}/api/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ev),
      });
      if (r.ok) {
        const created = await r.json();
        setEvents(prev => [...prev, created].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)));
        return created as ScheduleEvent;
      }
    } catch {}
    return null;
  }, []);

  const updateEvent = useCallback(async (id: string, patch: Partial<ScheduleEvent>) => {
    try {
      const r = await fetch(`${API}/api/schedule/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (r.ok) {
        const updated = await r.json();
        setEvents(prev => prev.map(e => e.id === id ? updated : e).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)));
      }
    } catch {}
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    try {
      await fetch(`${API}/api/schedule/${id}`, { method: 'DELETE' });
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch {}
  }, []);

  /* helpers */
  const todayEvents = () => {
    const today = new Date().toISOString().slice(0, 10);
    return events.filter(e => e.date === today);
  };

  const upcomingEvents = (days = 7) => {
    const from = new Date();
    const to = new Date(from.getTime() + days * 86400000);
    return events.filter(e => {
      const d = new Date(e.date);
      return d >= from && d <= to;
    });
  };

  const isLiveNow = (ev: ScheduleEvent) => {
    const now = new Date();
    const start = new Date(`${ev.date}T${ev.startTime}`);
    const end = new Date(start.getTime() + ev.duration * 60000);
    return now >= start && now <= end;
  };

  return { events, addEvent, updateEvent, deleteEvent, todayEvents, upcomingEvents, isLiveNow };
}
