/* ============================================================
   DARKVOLT — PAGE ARCHIVES
   Connectée à : usePlaylist (playlist.json / o2switch),
   RADIO_CONFIG (audioBaseUrl), Web Audio API (lecture in-page)
   ============================================================ */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { usePlaylist, type PlaylistTrack } from '@/hooks/usePlaylist';
import { RADIO_CONFIG } from '@/config/radio';

const G = '#39FF14';
const R = '#FF1A1A';
const CLIP = (s = 12) =>
  `polygon(0 0, calc(100% - ${s}px) 0, 100% ${s}px, 100% 100%, ${s}px 100%, 0 calc(100% - ${s}px))`;

const fmt = (s: number) =>
  s >= 3600
    ? `${Math.floor(s / 3600)}h${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`
    : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/* ── Audio engine hook ────────────────────────────────────── */
type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

function useArchivePlayer(tracks: PlaylistTrack[]) {
  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const activeRef  = useRef<number | null>(null);
  const [active,   setActive]  = useState<number | null>(null);
  const [status,   setStatus]  = useState<PlayerStatus>('idle');
  const [elapsed,  setElapsed] = useState(0);
  const [volume,   setVolumeState] = useState(0.8);

  const audioBase = RADIO_CONFIG.audioBaseUrl.replace(/\/$/, '') || '/audio/tracks';

  /* Keep ref in sync */
  useEffect(() => { activeRef.current = active; }, [active]);

  /* Elapsed ticker */
  useEffect(() => {
    if (status !== 'playing') return;
    const id = setInterval(() => {
      if (audioRef.current) setElapsed(Math.floor(audioRef.current.currentTime));
    }, 500);
    return () => clearInterval(id);
  }, [status]);

  /* Cleanup on unmount */
  useEffect(() => () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
  }, []);

  const playTrack = useCallback((idx: number) => {
    if (tracks.length === 0) return;
    const track = tracks[idx];
    if (!track) return;

    /* Stop current */
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }

    const url = track.file.startsWith('http')
      ? track.file
      : `${audioBase}/${track.file}`;

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audio.volume = volume;
    audio.src = url;
    audioRef.current = audio;

    setActive(idx);
    setElapsed(0);
    setStatus('loading');

    audio.addEventListener('playing', () => setStatus('playing'), { once: true });
    audio.addEventListener('error',   () => setStatus('error'),   { once: true });
    audio.addEventListener('ended', () => {
      const next = ((activeRef.current ?? idx) + 1) % tracks.length;
      playTrack(next);
    });

    audio.play().catch(() => setStatus('error'));
  }, [tracks, audioBase, volume]);

  const togglePlay = useCallback((idx: number) => {
    if (active === idx) {
      if (status === 'playing') {
        audioRef.current?.pause();
        setStatus('paused');
      } else if (status === 'paused' && audioRef.current) {
        audioRef.current.play().catch(() => setStatus('error'));
        setStatus('playing');
      }
    } else {
      playTrack(idx);
    }
  }, [active, status, playTrack]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    setActive(null);
    setStatus('idle');
    setElapsed(0);
  }, []);

  const next = useCallback(() => {
    if (active === null || tracks.length === 0) return;
    playTrack((active + 1) % tracks.length);
  }, [active, tracks.length, playTrack]);

  const prev = useCallback(() => {
    if (active === null || tracks.length === 0) return;
    playTrack((active - 1 + tracks.length) % tracks.length);
  }, [active, tracks.length, playTrack]);

  return { active, status, elapsed, volume, togglePlay, setVolume, stop, next, prev };
}

/* ── Track card ───────────────────────────────────────────── */
function TrackCard({
  track, idx, isActive, isPlaying, elapsed, visible, delay,
  onPlay,
}: {
  track: PlaylistTrack;
  idx: number;
  isActive: boolean;
  isPlaying: boolean;
  elapsed: number;
  visible: boolean;
  delay: number;
  onPlay: (idx: number) => void;
}) {
  const [hov, setHov] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const progress = track.duration && track.duration > 0 ? Math.min(elapsed / track.duration, 1) : 0;
  const accent = isActive ? G : '#e8e8e8';
  const borderAlpha = isActive ? '44' : hov ? '22' : '0f';

  /* Unique gradient per track index */
  const gradients = [
    `linear-gradient(135deg, ${G}22 0%, #050505 100%)`,
    `linear-gradient(135deg, ${R}22 0%, #050505 100%)`,
    `linear-gradient(135deg, #8B00FF22 0%, #050505 100%)`,
    `linear-gradient(135deg, #FF660022 0%, #050505 100%)`,
  ];
  const fallbackGrad = gradients[idx % gradients.length];
  const symbols = ['D×', '∅', '⌀', '//N', 'S∞', 'Fe', 'DZ', 'φ'];
  const sym = symbols[idx % symbols.length];

  return (
    <div
      style={{
        clipPath: CLIP(12),
        background: `linear-gradient(135deg, ${G}${isActive ? '33' : hov ? '18' : '0a'} 0%, ${G}${isActive ? '14' : '04'} 100%)`,
        padding: '1px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.96)',
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, background 0.35s`,
        filter: isActive
          ? `drop-shadow(0 0 24px ${G}44)`
          : hov
          ? `drop-shadow(0 0 12px ${G}18)`
          : 'none',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ background: '#080808', clipPath: CLIP(12), overflow: 'hidden' }}>

        {/* ── Art area ───────────────────────────────────── */}
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{ height: '180px', background: fallbackGrad, cursor: 'none' }}
          onClick={() => onPlay(idx)}
        >
          {/* Cover art */}
          {track.art && !imgErr ? (
            <img
              src={track.art}
              alt={track.title}
              onError={() => setImgErr(true)}
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                filter: isActive ? 'none' : 'grayscale(0.7) brightness(0.6)',
                transition: 'all 0.5s ease',
                transform: hov ? 'scale(1.05)' : 'scale(1)',
              }}
            />
          ) : (
            /* Fallback symbol */
            <span
              className="font-orbitron font-black select-none"
              style={{
                fontSize: '52px',
                color: G,
                opacity: isActive ? 0.7 : hov ? 0.4 : 0.2,
                textShadow: isActive ? `0 0 30px ${G}, 0 0 60px ${G}44` : 'none',
                transition: 'all 0.4s ease',
                transform: isActive ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              {sym}
            </span>
          )}

          {/* Dark overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: isActive
                ? 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)'
                : 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%)',
              transition: 'background 0.4s',
            }}
          />

          {/* Grid overlay when hovered/active */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `linear-gradient(${G}08 1px, transparent 1px), linear-gradient(90deg, ${G}08 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
            opacity: isActive || hov ? 0.8 : 0,
            transition: 'opacity 0.4s',
          }} />

          {/* Play / Pause overlay button */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ opacity: hov || isActive ? 1 : 0, transition: 'opacity 0.3s' }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: isActive ? `${G}22` : 'rgba(0,0,0,0.7)',
                border: `1.5px solid ${isActive ? G : 'rgba(255,255,255,0.4)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isActive ? `0 0 20px ${G}55` : 'none',
                transition: 'all 0.3s',
              }}
            >
              {isActive && isPlaying ? (
                /* Pause */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="4"  y="3" width="5" height="18" rx="1.5" fill={G} />
                  <rect x="15" y="3" width="5" height="18" rx="1.5" fill={G} />
                </svg>
              ) : (
                /* Play */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 3L6 21L21 12Z" fill={isActive ? G : '#ffffff'} />
                </svg>
              )}
            </div>
          </div>

          {/* Duration badge */}
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              background: 'rgba(0,0,0,0.75)',
              border: `1px solid ${isActive ? G + '44' : 'rgba(255,255,255,0.12)'}`,
              padding: '2px 8px',
              clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)',
            }}
          >
            <span className="font-orbitron text-xs tracking-wider" style={{ color: isActive ? G : '#e8e8e877', fontSize: '9px' }}>
              {isActive ? fmt(elapsed) + ' / ' + fmt(track.duration ?? 0) : fmt(track.duration ?? 0)}
            </span>
          </div>

          {/* Index badge */}
          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <span className="font-orbitron font-black" style={{ fontSize: '11px', color: isActive ? G : '#e8e8e833' }}>
              {String(idx + 1).padStart(2, '0')}
            </span>
          </div>

          {/* Scan line on active */}
          {isActive && isPlaying && (
            <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${G}cc, transparent)`, animation: 'scan-line-anim 2s ease-in-out infinite', top: 0, pointerEvents: 'none' }} />
          )}
        </div>

        {/* ── Progress bar (only when active) ────────────── */}
        {isActive && (
          <div style={{ height: '2px', background: '#111', position: 'relative' }}>
            <div
              style={{
                height: '100%',
                width: `${progress * 100}%`,
                background: `linear-gradient(90deg, ${R}, ${G})`,
                transition: 'width 0.5s linear',
                boxShadow: `0 0 6px ${G}`,
              }}
            />
          </div>
        )}

        {/* ── Track info ──────────────────────────────────── */}
        <div className="p-4 flex flex-col gap-3">
          <div>
            <h3
              className="font-orbitron font-black text-sm tracking-wide leading-tight"
              style={{ color: isActive ? '#ffffff' : hov ? '#e8e8e8' : '#e8e8e8cc', transition: 'color 0.3s', textShadow: isActive ? `0 0 16px ${G}44` : 'none' }}
            >
              {track.title}
            </h3>
            <p className="font-space text-xs mt-1" style={{ color: isActive ? `${G}99` : '#e8e8e855' }}>
              {track.artist}
            </p>
          </div>

          {/* Tags */}
          {track.tags && track.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {track.tags.map(tag => (
                <span
                  key={tag}
                  className="font-orbitron text-xs tracking-wider uppercase px-2 py-0.5"
                  style={{
                    background: `${G}08`,
                    border: `1px solid ${G}${isActive ? '33' : '18'}`,
                    color: `${G}${isActive ? 'aa' : '66'}`,
                    clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)',
                    fontSize: '8px',
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Mini sticky player ───────────────────────────────────── */
function MiniPlayer({
  track, status, elapsed, volume, onStop, onNext, onPrev, onVolume,
}: {
  track: PlaylistTrack;
  status: PlayerStatus;
  elapsed: number;
  volume: number;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
  onVolume: (v: number) => void;
}) {
  const isPlaying = status === 'playing';
  const progress = track.duration && track.duration > 0 ? Math.min(elapsed / track.duration, 1) : 0;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(6,6,6,0.97)',
        backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${G}33`,
        boxShadow: `0 -4px 32px rgba(0,0,0,0.8), 0 -1px 0 ${G}22`,
      }}
    >
      {/* Progress line */}
      <div style={{ height: '2px', background: '#111' }}>
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            background: `linear-gradient(90deg, ${R}, ${G})`,
            transition: 'width 0.5s linear',
            boxShadow: `0 0 4px ${G}`,
          }}
        />
      </div>

      <div className="container flex items-center gap-4 py-3">
        {/* Track info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center"
            style={{
              background: `${G}12`,
              border: `1px solid ${G}33`,
              clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)',
            }}
          >
            {isPlaying ? (
              <div className="flex gap-0.5 items-end h-4">
                {[3, 5, 4, 6, 3].map((h, i) => (
                  <div key={i} style={{ width: '2px', background: G, height: `${h}px`, animation: `pulse ${0.4 + i * 0.1}s ease-in-out infinite alternate`, borderRadius: '1px' }} />
                ))}
              </div>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24"><path d="M6 3L6 21L21 12Z" fill={G} /></svg>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-orbitron font-bold text-xs tracking-wider truncate" style={{ color: '#e8e8e8' }}>{track.title}</p>
            <p className="font-space text-xs truncate mt-0.5" style={{ color: `${G}77` }}>{track.artist}</p>
          </div>
        </div>

        {/* Time */}
        <span className="font-orbitron text-xs hidden sm:block" style={{ color: `${G}66`, flexShrink: 0 }}>
          {fmt(elapsed)} / {fmt(track.duration ?? 0)}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {[
            { icon: '⏮', action: onPrev, label: 'Précédent' },
            { icon: isPlaying ? '⏸' : '▶', action: () => {}, label: isPlaying ? 'Pause' : 'Play' },
            { icon: '⏭', action: onNext, label: 'Suivant' },
          ].map(({ icon, action, label }, i) => (
            <button
              key={label}
              onClick={action}
              title={label}
              className="font-orbitron text-sm transition-all duration-200 w-8 h-8 flex items-center justify-center"
              style={{
                background: i === 1 ? `${G}15` : 'transparent',
                border: `1px solid ${i === 1 ? `${G}44` : 'rgba(255,255,255,0.08)'}`,
                color: i === 1 ? G : '#e8e8e866',
                clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = G; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = i === 1 ? G : '#e8e8e866'; }}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Volume */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0" style={{ minWidth: '100px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={`${G}55`} strokeWidth="2">
            <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
          <input
            type="range" min="0" max="1" step="0.01" value={volume}
            onChange={e => onVolume(parseFloat(e.target.value))}
            className="flex-1 h-0.5 appearance-none"
            style={{ background: `linear-gradient(to right, ${G} ${volume * 100}%, #222 ${volume * 100}%)`, outline: 'none' }}
          />
        </div>

        {/* Close */}
        <button
          onClick={onStop}
          className="font-orbitron text-xs transition-colors duration-200 w-7 h-7 flex items-center justify-center flex-shrink-0"
          style={{ background: 'transparent', border: '1px solid rgba(255,26,26,0.3)', color: `${R}66`, clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = R; (e.currentTarget as HTMLButtonElement).style.borderColor = `${R}88`; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = `${R}66`; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,26,26,0.3)'; }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */
export default function Archives() {
  const { t } = useTranslation();
  /* Playlist — fallback to local public file if env not set */
  const playlistUrl = RADIO_CONFIG.playlistUrl || '/audio/playlist.json';
  const tracks = usePlaylist(playlistUrl);
  const { active, status, elapsed, volume, togglePlay, setVolume, stop, next, prev } = useArchivePlayer(tracks);

  const [activeFilter, setActiveFilter] = useState(() => t('archives.filterAll'));
  const [visible, setVisible] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridVisible, setGridVisible] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setGridVisible(true); }, { threshold: 0.03 });
    if (gridRef.current) obs.observe(gridRef.current);
    return () => obs.disconnect();
  }, []);

  /* Collect all unique tags from playlist */
  const filterAll = t('archives.filterAll');
  const allTags = [filterAll, ...Array.from(new Set(tracks.flatMap(tr => tr.tags ?? [])))];

  const filtered = activeFilter === filterAll
    ? tracks
    : tracks.filter(tr => (tr.tags ?? []).includes(activeFilter));

  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration ?? 0), 0);
  const activeTrack = active !== null ? tracks[active] : null;

  return (
    <div style={{ background: '#050505', minHeight: '100vh', paddingBottom: active !== null ? '80px' : '0' }}>
      <Navigation />

      {/* ═══════════════ HERO ═══════════════ */}
      <div
        className="relative overflow-hidden"
        style={{ paddingTop: '96px', paddingBottom: '0', background: 'linear-gradient(180deg, #070707 0%, #050505 100%)' }}
      >
        {/* Scan lines */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(57,255,20,0.01) 3px, rgba(57,255,20,0.01) 4px)' }} />
        {[92, 94, 96].map((p, i) => (
          <div key={i} className="absolute inset-y-0 pointer-events-none" style={{ left: `${p}%`, width: '1px', background: `linear-gradient(180deg, transparent, rgba(57,255,20,${0.06 - i * 0.015}), transparent)` }} />
        ))}

        <div className="container relative pb-10">
          {/* Tag */}
          <div className="flex items-center gap-4 mb-5"
            style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease' }}
          >
            <div className="font-orbitron font-bold text-xs tracking-[0.3em] uppercase px-4 py-1.5"
              style={{ background: `${G}11`, border: `1px solid ${G}44`, color: G, clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)' }}>
              {t('archives.tag')}
            </div>
            <div className="h-px flex-1 max-w-[60px]" style={{ background: `linear-gradient(90deg, ${G}44, transparent)` }} />
          </div>

          {/* Title — ARCHIVES clearly readable in white */}
          <h1
            className="font-orbitron font-black uppercase leading-none mb-3"
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 7rem)',
              color: '#ffffff',
              textShadow: `0 0 60px rgba(255,255,255,0.08)`,
              letterSpacing: '-0.02em',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            ARCHIVES
          </h1>
          <div
            className="flex items-center gap-3 mb-1"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.08s',
            }}
          >
            <div className="h-px w-10" style={{ background: `linear-gradient(90deg, ${G}66, transparent)` }} />
            <span
              className="font-orbitron font-bold tracking-[0.45em] uppercase"
              style={{ fontSize: 'clamp(0.75rem, 2vw, 1rem)', color: G, textShadow: `0 0 16px ${G}88` }}
            >
              DARKVOLT
            </span>
          </div>

          <p className="font-space text-sm max-w-lg mt-4 leading-relaxed"
            style={{ color: '#e8e8e855', opacity: visible ? 1 : 0, transition: 'opacity 0.7s ease 0.3s' }}
          >
            {t('archives.subtitle')}
          </p>
        </div>

        {/* Stats bar */}
        <div
          style={{
            background: 'rgba(5,5,5,0.9)',
            borderTop: `1px solid rgba(57,255,20,0.07)`,
            borderBottom: `1px solid rgba(57,255,20,0.07)`,
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.7s ease 0.4s',
          }}
        >
          <div className="container">
            <div className="flex flex-wrap items-center">
              {[
                { label: t('archives.statsLabel.mixes'),   value: tracks.length ? String(tracks.length) : '—',                                         accent: G },
                { label: t('archives.statsLabel.duration'), value: tracks.length ? fmt(totalDuration) : '—',                                            accent: G },
                { label: t('archives.statsLabel.artists'),  value: tracks.length ? String(new Set(tracks.map(tr => tr.artist)).size) : '—',             accent: G },
                { label: t('archives.statsLabel.genres'),   value: tracks.length ? String(new Set(tracks.flatMap(tr => tr.tags ?? [])).size) : '—',     accent: R },
              ].map(({ label, value, accent }, i, arr) => (
                <div key={label} className="flex flex-col items-center gap-1 px-6 py-4"
                  style={{ borderRight: i < arr.length - 1 ? `1px solid rgba(57,255,20,0.06)` : 'none' }}
                >
                  <span className="font-orbitron font-black" style={{ fontSize: '22px', color: accent, textShadow: `0 0 16px ${accent}44` }}>{value}</span>
                  <span className="font-orbitron text-xs tracking-[0.25em] uppercase" style={{ color: '#e8e8e833', fontSize: '9px' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ FILTER BAR ═══════════════ */}
      {allTags.length > 1 && (
        <div
          className="sticky top-16 z-40"
          style={{ background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(20px)', borderBottom: `1px solid rgba(57,255,20,0.06)` }}
        >
          <div className="container py-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="font-orbitron text-xs tracking-[0.2em] mr-2" style={{ color: '#e8e8e833' }}>{t('archives.filterLabel')}</span>
              {allTags.map(tag => {
                const isActive = activeFilter === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setActiveFilter(tag)}
                    className="font-orbitron font-bold text-xs tracking-[0.2em] uppercase px-4 py-2 transition-all duration-300"
                    style={{
                      background: isActive ? G : 'transparent',
                      border: `1px solid ${isActive ? G : 'rgba(255,255,255,0.1)'}`,
                      color: isActive ? '#050505' : '#e8e8e855',
                      clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
                      boxShadow: isActive ? `0 0 16px ${G}44` : 'none',
                    }}
                    onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.borderColor = `${G}55`; (e.currentTarget as HTMLButtonElement).style.color = G; } }}
                    onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#e8e8e855'; } }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ TRACK GRID ═══════════════ */}
      <div ref={gridRef} className="container py-14">
        {/* Loading */}
        {tracks.length === 0 && (
          <div className="flex flex-col items-center gap-6 py-24">
            <div style={{ width: '40px', height: '40px', border: `2px solid rgba(57,255,20,0.15)`, borderTopColor: G, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p className="font-orbitron text-sm tracking-[0.3em]" style={{ color: '#e8e8e833' }}>
              {t('archives.loading')}
            </p>
            <p className="font-space text-xs text-center max-w-xs" style={{ color: '#e8e8e822' }}>
              {t('archives.loadingDesc')}
            </p>
          </div>
        )}

        {/* No results after filter */}
        {tracks.length > 0 && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="font-orbitron text-sm tracking-widest" style={{ color: '#e8e8e833' }}>{t('archives.noResults')}</p>
          </div>
        )}

        {/* Grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((track, i) => {
              const realIdx = tracks.indexOf(track);
              return (
                <TrackCard
                  key={`${track.file}-${i}`}
                  track={track}
                  idx={realIdx}
                  isActive={active === realIdx}
                  isPlaying={active === realIdx && status === 'playing'}
                  elapsed={active === realIdx ? elapsed : 0}
                  visible={gridVisible}
                  delay={Math.min(i * 0.07, 0.35)}
                  onPlay={togglePlay}
                />
              );
            })}
          </div>
        )}

        {/* Submit CTA */}
        {tracks.length > 0 && (
          <div
            className="mt-16 text-center"
            style={{ opacity: gridVisible ? 1 : 0, transition: 'opacity 0.8s ease 0.5s' }}
          >
            <p className="font-space text-sm mb-5" style={{ color: '#e8e8e844' }}>
              {t('archives.submitCta')}
            </p>
            <a
              href="/soumettre-un-mix"
              className="font-orbitron font-bold text-xs tracking-[0.3em] uppercase px-8 py-4 transition-all duration-300 inline-block"
              style={{
                background: 'transparent',
                border: `1px solid ${G}55`,
                color: `${G}88`,
                clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)',
                textDecoration: 'none',
              }}
              onMouseEnter={e => { const a = e.currentTarget as HTMLAnchorElement; a.style.background = G; a.style.color = '#050505'; a.style.borderColor = G; a.style.boxShadow = `0 0 24px ${G}`; }}
              onMouseLeave={e => { const a = e.currentTarget as HTMLAnchorElement; a.style.background = 'transparent'; a.style.color = `${G}88`; a.style.borderColor = `${G}55`; a.style.boxShadow = 'none'; }}
            >
              {t('archives.submitBtn')}
            </a>
          </div>
        )}
      </div>

      {/* ═══════════════ MINI PLAYER (sticky bottom) ═══════════════ */}
      {activeTrack && status !== 'idle' && (
        <MiniPlayer
          track={activeTrack}
          status={status}
          elapsed={elapsed}
          volume={volume}
          onStop={stop}
          onNext={next}
          onPrev={prev}
          onVolume={setVolume}
        />
      )}

      <Footer />
    </div>
  );
}
