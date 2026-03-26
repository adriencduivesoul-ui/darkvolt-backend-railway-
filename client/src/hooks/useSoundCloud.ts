/* ============================================================
   DARKVOLT — SOUNDCLOUD WIDGET HOOK
   Contrôle l'iframe SC Widget : lecture, métadonnées, artwork.
   Aucune clé API requise — gratuit, public.
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from 'react';

// ── SoundCloud Widget typings ───────────────────────────────────────────────
declare global {
  interface Window {
    SC?: {
      Widget: SCWidgetConstructor & {
        Events: {
          READY: string;
          PLAY: string;
          PAUSE: string;
          FINISH: string;
          PLAY_PROGRESS: string;
          ERROR: string;
        };
      };
    };
  }
}

interface SCWidgetConstructor {
  (element: HTMLIFrameElement): SCWidget;
}
interface SCWidget {
  play(): void;
  pause(): void;
  toggle(): void;
  next(): void;
  prev(): void;
  seekTo(ms: number): void;
  setVolume(volume: number): void;
  getVolume(cb: (v: number) => void): void;
  getCurrentSound(cb: (sound: RawSCSound | null) => void): void;
  getDuration(cb: (ms: number) => void): void;
  getPosition(cb: (ms: number) => void): void;
  bind(event: string, cb: (e?: SCProgressEvent) => void): void;
  unbind(event: string): void;
}

interface RawSCSound {
  title: string;
  artwork_url: string | null;
  user: { username: string };
  genre: string;
  tag_list: string;
  duration: number;       // ms
  permalink_url: string;
}

interface SCProgressEvent {
  currentPosition: number;  // ms
  relativePosition: number; // 0–1
}

// ── Public types ────────────────────────────────────────────────────────────
export interface SCTrack {
  title: string;
  artist: string;
  artworkUrl: string | null;
  genre: string;
  tags: string[];
  duration: number;       // seconds
  permalinkUrl: string;
}

export type SCStatus = 'idle' | 'loading' | 'ready' | 'error';

// ── Singleton script loader ─────────────────────────────────────────────────
let _scriptState: 'none' | 'loading' | 'loaded' = 'none';
const _callbacks: Array<() => void> = [];

function loadSCScript(onLoad: () => void): void {
  if (_scriptState === 'loaded') { onLoad(); return; }
  _callbacks.push(onLoad);
  if (_scriptState === 'loading') return;
  _scriptState = 'loading';

  const s = document.createElement('script');
  s.src = 'https://w.soundcloud.com/player/api.js';
  s.async = true;
  s.onload = () => {
    _scriptState = 'loaded';
    _callbacks.splice(0).forEach(cb => cb());
  };
  s.onerror = () => { _scriptState = 'none'; };
  document.head.appendChild(s);
}

// ── Utility ─────────────────────────────────────────────────────────────────
function mapSound(raw: RawSCSound): SCTrack {
  const art = raw.artwork_url
    ? raw.artwork_url.replace('-large', '-t500x500')
    : null;
  return {
    title:        raw.title,
    artist:       raw.user?.username ?? 'Unknown Artist',
    artworkUrl:   art,
    genre:        raw.genre ?? '',
    tags:         raw.tag_list
                    ? raw.tag_list.replace(/"/g, '').split(' ').filter(Boolean)
                    : [],
    duration:     Math.floor(raw.duration / 1000),
    permalinkUrl: raw.permalink_url ?? '',
  };
}

// ── Hook ────────────────────────────────────────────────────────────────────
export function useSoundCloud(iframeRef: React.RefObject<HTMLIFrameElement | null>) {
  const [status, setStatus]           = useState<SCStatus>('idle');
  const [isPlaying, setIsPlaying]     = useState(false);
  const [currentTrack, setCurrentTrack] = useState<SCTrack | null>(null);
  const [position, setPosition]       = useState(0); // seconds

  const widgetRef = useRef<SCWidget | null>(null);

  const initWidget = useCallback(() => {
    if (!iframeRef.current || !window.SC || widgetRef.current) return;

    setStatus('loading');
    const widget = window.SC.Widget(iframeRef.current);
    widgetRef.current = widget;

    // Timeout: if READY never fires (SC 403 on localhost / bot detection), bail out
    // 3s in dev for faster local testing, 12s in prod
    const timeoutMs = import.meta.env.DEV ? 3_000 : 12_000;
    const readyTimeout = setTimeout(() => {
      if (widgetRef.current && !iframeRef.current?.contentDocument) return;
      setStatus('error');
    }, timeoutMs);

    widget.bind(window.SC.Widget.Events.READY, () => {
      clearTimeout(readyTimeout);
      setStatus('ready');
      widget.getCurrentSound(sound => {
        if (sound) setCurrentTrack(mapSound(sound));
      });
    });

    widget.bind(window.SC.Widget.Events.PLAY, () => {
      setIsPlaying(true);
      widget.getCurrentSound(sound => {
        if (sound) setCurrentTrack(mapSound(sound));
      });
    });

    widget.bind(window.SC.Widget.Events.PAUSE,  () => setIsPlaying(false));
    widget.bind(window.SC.Widget.Events.FINISH, () => {
      setIsPlaying(false);
      // Auto-advance to next track
      setTimeout(() => widget.next(), 300);
    });

    widget.bind(window.SC.Widget.Events.PLAY_PROGRESS, (e) => {
      if (e) setPosition(Math.floor(e.currentPosition / 1000));
    });

    widget.bind(window.SC.Widget.Events.ERROR, () => setStatus('error'));
  }, [iframeRef]);

  // Load SC script once, then init widget
  useEffect(() => {
    loadSCScript(() => {
      if (iframeRef.current) initWidget();
    });
  }, [initWidget, iframeRef]);

  // Retry init if iframe appears after script was already loaded
  useEffect(() => {
    if (_scriptState === 'loaded' && iframeRef.current && !widgetRef.current) {
      initWidget();
    }
  }, [initWidget, iframeRef]);

  const controls = {
    play:      () => widgetRef.current?.play(),
    pause:     () => widgetRef.current?.pause(),
    toggle:    () => isPlaying ? widgetRef.current?.pause() : widgetRef.current?.play(),
    next:      () => widgetRef.current?.next(),
    prev:      () => widgetRef.current?.prev(),
    setVolume: (v: number) => widgetRef.current?.setVolume(v),
  };

  return { status, isPlaying, currentTrack, position, controls };
}
