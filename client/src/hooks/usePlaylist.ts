/* ============================================================
   DARKVOLT — PLAYLIST HOOK
   Fetches a JSON playlist hosted on the same server (o2switch).
   Zero external dependencies, no CORS issues (same origin).
   ============================================================ */

import { useEffect, useState } from 'react';

export interface PlaylistTrack {
  title:     string;
  artist:    string;
  file:      string;    // filename relatif ou URL complète
  art?:      string;    // chemin pochette ou URL
  duration?: number;    // durée en secondes (optionnel)
  tags?:     string[];  // style / genre (ex: ['Tribecore', 'Electro'])
}

export function usePlaylist(url: string): PlaylistTrack[] {
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);

  useEffect(() => {
    if (!url) return;
    fetch(url, { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.json(); })
      .then((data: unknown) => {
        if (Array.isArray(data) && data.length > 0) {
          setTracks(data as PlaylistTrack[]);
        }
      })
      .catch(() => {});
  }, [url]);

  return tracks;
}
