/* ============================================================
   DARKVOLT — LIVE PLAYER SECTION v6
   Lecteur custom — playlist MP3 o2switch (VITE_PLAYLIST_URL)
   Web Audio API (spectre réel), play/pause, volume, track info
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlaylist } from '@/hooks/usePlaylist';
import { RADIO_CONFIG } from '@/config/radio';
import { radioAnalyserBridge } from '@/lib/radioAnalyserBridge';

type Status = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/* ─── Jingle system ────────────────────────────────────────────
   4 jingles aléatoires : au démarrage + toutes les 3-6 pistes.
   ──────────────────────────────────────────────────────────── */
const JINGLES = [
  '/audio/Jingles/jingle-01.mp3',
  '/audio/Jingles/jingle-02.mp3',
  '/audio/Jingles/jingle-03.mp3',
  '/audio/Jingles/jingle-04.mp3',
];
const pickJingle    = () => JINGLES[Math.floor(Math.random() * JINGLES.length)];
const nextJingleIn  = () => 3 + Math.floor(Math.random() * 4); // 3, 4, 5 ou 6 pistes

/* ─── DJ Rotary Knob ────────────────────────────────────────────
   Drag ↑ to increase, ↓ to decrease. SVG arcs show 270° sweep.
   ──────────────────────────────────────────────────────────── */
function DJKnob({
  value, onChange, muted,
}: {
  value: number; onChange: (v: number) => void; muted: boolean;
}) {
  const valueRef    = useRef(value);
  valueRef.current  = value;
  const cbRef       = useRef(onChange);
  cbRef.current     = onChange;

  const rotation = value * 270 - 135; // -135° (min) → +135° (max)
  const color = muted ? 'rgba(255,255,255,0.15)'
    : value > 0.88 ? '#FF1A1A'
    : value > 0.65 ? '#FF6B35'
    : '#39FF14';

  const R = 21;
  const C = 2 * Math.PI * R;          // ≈ 131.95
  const arcLen = (270 / 360) * C;     // ≈ 98.96 (full sweep arc)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX   = e.clientX;
    const startVal = valueRef.current;
    const onMove   = (ev: MouseEvent) => {
      const delta  = ev.clientX - startX;
      cbRef.current(Math.max(0, Math.min(1, startVal + delta / 160)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      title="Volume (← →)"
      style={{ position: 'relative', width: 52, height: 52, cursor: 'ew-resize', userSelect: 'none', flexShrink: 0 }}
    >
      {/* Track arcs */}
      <svg viewBox="0 0 52 52" width="52" height="52" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="26" cy="26" r={R} fill="none"
          stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={`${arcLen} ${C}`}
          transform="rotate(135 26 26)" />
        {!muted && value > 0 && (
          <circle cx="26" cy="26" r={R} fill="none"
            stroke={color} strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray={`${value * arcLen} ${C}`}
            transform="rotate(135 26 26)"
            style={{ filter: `drop-shadow(0 0 2px ${color})` }} />
        )}
      </svg>
      {/* Rotating knob body */}
      <div style={{
        position: 'absolute', top: 6, left: 6, right: 6, bottom: 6,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 38% 32%, #2a2a2a 0%, #111 55%, #0a0a0a 100%)',
        boxShadow: '0 3px 8px rgba(0,0,0,0.85), inset 0 1px 1px rgba(255,255,255,0.09), 0 0 0 1px rgba(255,255,255,0.05)',
        transform: `rotate(${rotation}deg)`,
      }}>
        <div style={{
          position: 'absolute', top: 3, left: '50%', transform: 'translateX(-50%)',
          width: 2, height: 7, borderRadius: 1,
          background: muted ? '#333' : color,
          boxShadow: muted ? 'none' : `0 0 4px ${color}, 0 0 8px ${color}66`,
        }} />
      </div>
      {/* Centre dimple */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 8, height: 8, borderRadius: '50%',
        background: '#060606',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

export default function LivePlayer() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [status,  setStatus]  = useState<Status>('idle');
  const [volume,  setVolume]  = useState(0.8);
  const [muted,     setMuted]     = useState(false);
  const [btnPressed, setBtnPressed] = useState(false);

  const tracks  = usePlaylist(RADIO_CONFIG.playlistUrl);

  const [trackIdx,        setTrackIdx]        = useState(0);
  const [playlistElapsed, setPlaylistElapsed] = useState(0);
  const trackIdxRef = useRef(0);

  const sectionRef  = useRef<HTMLDivElement>(null);
  const spectrumRef = useRef<HTMLCanvasElement>(null);
  const animRef     = useRef<number>(0);
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef   = useRef<MediaElementAudioSourceNode | null>(null);
  const fftRef      = useRef<Uint8Array>(new Uint8Array(128));
  const playingRef          = useRef(false);
  const [isJingle, setIsJingle] = useState(false);
  const isJingleRef             = useRef(false);
  const tracksUntilJingleRef    = useRef(0);
  const tracksRef               = useRef(tracks);

  const isPlaying     = status === 'playing';
  const isPaused       = status === 'paused';
  const isPlaylistMode = RADIO_CONFIG.playlistUrl.length > 0;

  // keep ref in sync so spectrum draw loop sees current state without deps
  useEffect(() => { playingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { tracksRef.current  = tracks;    }, [tracks]);

  // ── Feed the hero wave effect bridge ────────────────────────
  useEffect(() => {
    radioAnalyserBridge.isPlaying = isPlaying;
  }, [isPlaying]);

  // ── Intersection observer ────────────────────────────────────────
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  // ── Spectrum canvas (runs once, reads analyser + playingRef) ─────
  useEffect(() => {
    const canvas = spectrumRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const BARS = 72;
    const GAP  = 2;
    let t = 0;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      t += 0.011;

      const bw = Math.max(1, (W - GAP * (BARS - 1)) / BARS);

      if (analyserRef.current && playingRef.current) {
        analyserRef.current.getByteFrequencyData(fftRef.current as Uint8Array<ArrayBuffer>);
      }

      for (let i = 0; i < BARS; i++) {
        let bh: number;
        if (analyserRef.current && playingRef.current) {
          const bin = Math.floor((i / BARS) * (fftRef.current.length * 0.75));
          bh = Math.max(3, (fftRef.current[bin] / 255) * H * 0.88);
        } else {
          const w = Math.sin(i * 0.35 + t) * 0.25
                  + Math.sin(i * 0.18 + t * 0.6) * 0.15
                  + Math.sin(i * 0.07 + t * 0.3) * 0.1;
          bh = Math.max(3, (0.055 + Math.max(0, w) * 0.2) * H);
        }
        const x  = i * (bw + GAP);
        const a  = playingRef.current ? 0.75 : 0.22;
        const g  = ctx.createLinearGradient(0, H - bh, 0, H);
        g.addColorStop(0, `rgba(57,255,20,${(a * 0.6).toFixed(2)})`);
        g.addColorStop(1, `rgba(57,255,20,${a.toFixed(2)})`);
        ctx.shadowColor = '#39FF14';
        ctx.shadowBlur  = playingRef.current ? 5 : 1;
        ctx.fillStyle   = g;
        ctx.fillRect(x, H - bh, bw, bh);
      }
      ctx.shadowBlur = 0;
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, []);

  // ── Volume sync ──────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // ── Play / Pause / Resume ────────────────────────────────────
  const handlePlay = useCallback(async () => {
    if (status === 'loading') return;

    // ── PAUSE ─────────────────────────────────────────────────
    if (isPlaying) {
      audioRef.current?.pause();
      setStatus('paused');
      return;
    }

    // ── RESUME (ne reset pas la source) ───────────────────────────
    if (isPaused && audioRef.current) {
      try {
        if (audioCtxRef.current?.state === 'suspended') await audioCtxRef.current.resume();
        await audioRef.current.play();
        setStatus('playing');
      } catch { setStatus('error'); }
      return;
    }

    // ── FRESH START ───────────────────────────────────────────────
    setStatus('loading');
    try {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.volume = muted ? 0 : volume;
      audio.preload = 'none';
      audioRef.current = audio;

      if (!audioCtxRef.current) {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AC();
        analyserRef.current = audioCtxRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        fftRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.connect(audioCtxRef.current.destination);
      }
      if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();

      sourceRef.current?.disconnect();
      sourceRef.current = audioCtxRef.current.createMediaElementSource(audio);
      sourceRef.current.connect(analyserRef.current!);
      radioAnalyserBridge.analyser = analyserRef.current;

      if (isPlaylistMode && tracks.length > 0) {
        const startIdx = Math.floor(Math.random() * tracks.length);
        trackIdxRef.current = startIdx;
        setTrackIdx(startIdx);
        setPlaylistElapsed(0);
        const base = RADIO_CONFIG.audioBaseUrl.replace(/\/$/, '');

        // ── Universal ended handler (tracks + jingles) ─────────
        audio.addEventListener('ended', () => {
          const list = tracksRef.current;
          if (isJingleRef.current) {
            // Jingle fini → jouer la piste déjà indexée
            isJingleRef.current = false;
            setIsJingle(false);
            const t   = list[trackIdxRef.current];
            const url = t.file.startsWith('http') ? t.file : `${base}/${t.file}`;
            if (audioRef.current) { audioRef.current.src = url; audioRef.current.play().catch(() => setStatus('error')); }
          } else {
            // Piste finie → avancer + éventuellement jingle
            setPlaylistElapsed(0);
            tracksUntilJingleRef.current -= 1;
            const nextIdx = (trackIdxRef.current + 1) % list.length;
            trackIdxRef.current = nextIdx;
            setTrackIdx(nextIdx);
            if (tracksUntilJingleRef.current <= 0) {
              tracksUntilJingleRef.current = nextJingleIn();
              isJingleRef.current = true;
              setIsJingle(true);
              if (audioRef.current) { audioRef.current.src = pickJingle(); audioRef.current.play().catch(() => setStatus('error')); }
            } else {
              const nt  = list[nextIdx];
              const url = nt.file.startsWith('http') ? nt.file : `${base}/${nt.file}`;
              if (audioRef.current) { audioRef.current.src = url; audioRef.current.play().catch(() => setStatus('error')); }
            }
          }
        });

        audio.addEventListener('playing', () => setStatus('playing'), { once: true });
        audio.addEventListener('error',   () => setStatus('error'),   { once: true });

        // ── Jingle au démarrage ─────────────────────────────────
        tracksUntilJingleRef.current = nextJingleIn();
        isJingleRef.current = true;
        setIsJingle(true);
        audio.src = pickJingle();
      }

      await audio.play();
    } catch {
      setStatus('error');
    }
  }, [status, isPlaying, isPaused, volume, muted, tracks, isPlaylistMode]);

  // ── Playlist elapsed timer (tick +1s while playing) ─────────────────
  useEffect(() => {
    if (!isPlaying || !isPlaylistMode) return;
    const id = setInterval(() => setPlaylistElapsed(e => e + 1), 1_000);
    return () => clearInterval(id);
  }, [isPlaying, isPlaylistMode, trackIdx]);

  // ── Auto-advance on error in playlist mode ──────────────────────────
  // Also clear paused audio ref on error so next play starts fresh
  useEffect(() => {
    if (status !== 'error' || tracks.length === 0) return;
    const id = setTimeout(() => {
      const nextIdx = (trackIdxRef.current + 1) % tracks.length;
      trackIdxRef.current = nextIdx;
      setTrackIdx(nextIdx);
      setPlaylistElapsed(0);
      setStatus('idle');
    }, 3_000);
    return () => clearTimeout(id);
  }, [status, isPlaylistMode, tracks.length]);

  // ── Cleanup on unmount ───────────────────────────────────────────
  useEffect(() => () => {
    cancelAnimationFrame(animRef.current);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    audioCtxRef.current?.close();
  }, []);

  const configured      = isPlaylistMode && tracks.length > 0;
  const currentTrack    = tracks[trackIdx] ?? null;
  const displayTitle    = isJingle ? 'DARKVOLT RADIO'              : (currentTrack?.title   ?? 'SIGNAL UNDERGROUND');
  const displayArtist   = isJingle ? 'JINGLE'                      : (currentTrack?.artist  ?? '');
  const displayArt      = isJingle ? null                          : (currentTrack?.art     ?? null);
  const displayElapsed  = playlistElapsed;
  const displayDuration = isJingle ? 0                             : (currentTrack?.duration ?? 0);
  const displayTags     = isJingle ? []                            : (currentTrack?.tags    ?? []);
  const nextTrack       = !isJingle && tracks.length > 1 ? (tracks[(trackIdx + 1) % tracks.length] ?? null) : null;
  const progress        = displayDuration > 0 ? Math.min(displayElapsed / displayDuration, 1) : 0;

  // ── Render ──────────────────────────────────────────────────────
  return (
    <section
      id="player"
      ref={sectionRef}
      className="relative py-24 overflow-hidden"
      style={{ background: '#050505' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isPlaying
            ? 'radial-gradient(ellipse 55% 40% at 50% 60%, rgba(57,255,20,0.04) 0%, transparent 70%)'
            : 'radial-gradient(ellipse 55% 40% at 50% 60%, rgba(57,255,20,0.015) 0%, transparent 70%)',
          transition: 'background 1.5s ease',
        }}
      />

      <div className="container relative z-10">
        {/* ── Section header ──────────────────────────────────── */}
        <div
          className="mb-10"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="h-[1px] w-12" style={{ background: 'linear-gradient(90deg, transparent, #FF1A1A, #39FF14)' }} />
            <span className="font-mono-space text-xs tracking-[0.4em] uppercase" style={{ color: '#FF1A1A', textShadow: '0 0 8px rgba(255,26,26,0.4)' }}>
              LIVE STREAM
            </span>
          </div>
          <h2
            className="font-bebas text-5xl md:text-7xl glitch-text"
            style={{
              color: '#e8e8e8',
              letterSpacing: '0.05em',
              lineHeight: 1,
              '--after-duration': '7s',
              '--before-duration': '5.3s',
              '--after-shadow': '-2px 0 rgba(255, 30, 30, 0.55)',
              '--before-shadow': '2px 0 rgba(0, 210, 255, 0.45)',
              '--glitch-bg': '#050505',
            } as React.CSSProperties}
            data-text={t('player.frequencyLive')}
          >
            {t('player.frequencyLive')}
          </h2>
        </div>

        {/* ── Player card ─────────────────────────────────────── */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(40px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
            /* tech-panel border wrapper */
            clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))',
            background: isPlaying
              ? 'linear-gradient(135deg, rgba(57,255,20,0.5) 0%, rgba(57,255,20,0.1) 45%, rgba(255,26,26,0.35) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08) 100%)',
            padding: '1px',
            filter: isPlaying
              ? 'drop-shadow(0 0 20px rgba(57,255,20,0.18)) drop-shadow(0 0 40px rgba(57,255,20,0.07))'
              : 'none',
          }}
        >
          <div
            className="relative overflow-hidden"
            style={{
              background: '#090909',
              clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))',
              transition: 'all 0.8s ease',
            }}
          >
            {/* Diagonal accent — top-right */}
            <div style={{ position:'absolute', top:0, right:0, width:0, height:0, borderStyle:'solid', borderWidth:'0 24px 24px 0', borderColor:`transparent ${isPlaying ? 'rgba(57,255,20,0.35)' : 'rgba(255,255,255,0.06)'} transparent transparent`, transition:'all 0.8s ease', zIndex:20, pointerEvents:'none' }} />
            {/* ── Top status bar ──────────────────────────────── */}
            <div
              className="flex items-center justify-between px-5 py-2.5 gap-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: '#060606' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: status === 'error' ? '#FF1A1A' : isPlaying ? '#39FF14' : isPaused ? '#FF8C00' : '#2a2a2a',
                    boxShadow: status === 'error' ? '0 0 8px #FF1A1A' : isPlaying ? '0 0 8px #39FF14' : 'none',
                    animation: (isPlaying || status === 'error') ? 'pulse 2s ease-in-out infinite' : 'none',
                    transition: 'all 0.5s ease',
                  }}
                />
                <span
                  className="font-mono-space text-xs tracking-[0.3em] uppercase"
                  style={{
                    color: isPlaying ? '#39FF14cc' : isPaused ? '#39FF1488' : '#39FF1466',
                    textShadow: isPlaying ? '0 0 12px rgba(57,255,20,0.5), 0 0 24px rgba(57,255,20,0.2)' : '0 0 8px rgba(57,255,20,0.15)',
                    transition: 'all 0.6s ease',
                  }}
                >
                  {isPlaying ? t('player.onAir') : isPaused ? t('player.paused') : t('player.underground')}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono-space text-xs" style={{ color: '#39FF1444' }}>
                  {RADIO_CONFIG.stationName}
                </span>
                <span
                  className="font-mono-space text-xs tracking-[0.25em]"
                  style={{
                    color: isPlaying ? '#39FF14bb' : '#39FF1455',
                    textShadow: isPlaying ? '0 0 10px rgba(57,255,20,0.6), 0 0 20px rgba(57,255,20,0.25)' : '0 0 6px rgba(57,255,20,0.2)',
                    transition: 'all 0.6s ease',
                    fontWeight: 600,
                  }}
                >
                  24/7
                </span>
              </div>
            </div>

            {/* ── Track info area ──────────────────────────────── */}
            <div className="relative overflow-hidden" style={{ minHeight: '200px', background: '#060606' }}>
              {/* Artwork background blur */}
              {displayArt && (
                <img
                  src={displayArt}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  style={{ filter: 'blur(50px) brightness(0.25) saturate(0.6)', transform: 'scale(1.3)' }}
                />
              )}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, #060606 0%, rgba(6,6,6,0.65) 50%, #060606 100%)' }}
              />

              <div className="relative flex items-center gap-6 px-6 md:px-8 py-7">
                {/* ── Vinyl Record ── */}
                <div
                  className="flex-shrink-0 relative"
                  style={{
                    width: '108px', height: '108px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    animation: 'vinyl-spin 3s linear infinite',
                    animationPlayState: isPlaying ? 'running' : 'paused',
                    willChange: 'transform',
                    boxShadow: isPlaying
                      ? '0 0 0 1px rgba(57,255,20,0.18), 0 0 18px rgba(57,255,20,0.18), 0 0 36px rgba(255,26,26,0.08)'
                      : '0 0 0 1px rgba(255,255,255,0.07), 0 0 14px rgba(0,0,0,0.7)',
                    transition: 'box-shadow 0.7s ease',
                  }}
                >
                  {/* Vinyl disc — groove texture via radial-gradient */}
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: `radial-gradient(circle,
                      #030303 0% 3%,
                      #0d0d0d 3% 26%,
                      #232323 26% 27.5%,
                      #0c0c0c 27.5% 30%,
                      #1d1d1d 30% 31.5%, #080808 31.5% 35%,
                      #1a1a1a 35% 36.5%, #060606 36.5% 40%,
                      #181818 40% 41.5%, #050505 41.5% 45%,
                      #161616 45% 46.5%, #040404 46.5% 50%,
                      #141414 50% 51.5%, #030303 51.5% 55%,
                      #121212 55% 56.5%, #020202 56.5% 60%,
                      #101010 60% 61.5%, #020202 61.5% 65%,
                      #0f0f0f 65% 66.5%, #010101 66.5% 70%,
                      #0e0e0e 70% 71.5%, #010101 71.5% 75%,
                      #0d0d0d 75% 76.5%, #010101 76.5% 80%,
                      #0c0c0c 80% 81.5%, #010101 81.5% 85%,
                      #0b0b0b 85% 86.5%, #010101 86.5% 91%,
                      #111111 91% 93%,
                      #010101 93% 100%
                    )`,
                  }} />

                  {/* Artwork label — circular, centred */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '54%', height: '54%',
                    borderRadius: '50%', overflow: 'hidden',
                    boxShadow: '0 0 0 1.5px rgba(255,255,255,0.10), 0 0 0 2.5px rgba(0,0,0,0.5)',
                  }}>
                    {isJingle ? (
                      <img
                        src="/img/DarkVolt.png" alt="DarkVolt"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block',
                          padding: '6px', filter: 'drop-shadow(0 0 6px rgba(57,255,20,0.6))' }}
                      />
                    ) : displayArt ? (
                      <img
                        src={displayArt} alt="artwork"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        background: 'radial-gradient(circle, #1e1e1e 0%, #0a0a0a 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(57,255,20,0.25)" strokeWidth="1.5">
                          <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Specular sheen */}
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 45%, rgba(255,255,255,0.02) 100%)',
                    pointerEvents: 'none',
                  }} />

                  {/* Centre spindle hole */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: '#020202',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.10)',
                    zIndex: 10,
                  }} />
                </div>

                {/* Title + artist + progress */}
                <div className="flex-1 min-w-0">
                  {isPlaying ? (
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-1 h-1 rounded-full" style={{ background: '#39FF14', animation: 'pulse 1.5s ease-in-out infinite' }} />
                      <span className="font-mono-space text-xs tracking-[0.25em]" style={{ color: '#39FF1466' }}>NOW PLAYING</span>
                    </div>
                  ) : isPaused ? (
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-1 h-1 rounded-full" style={{ background: '#FF8C00', opacity: 0.7 }} />
                      <span className="font-mono-space text-xs tracking-[0.25em]" style={{ color: '#FF8C0077' }}>EN PAUSE</span>
                    </div>
                  ) : null}
                  <h3
                    className="font-bebas text-3xl md:text-4xl truncate"
                    style={{ color: '#e8e8e8', letterSpacing: '0.05em', lineHeight: 1.1 }}
                  >
                    {displayTitle}
                  </h3>
                  <p className="font-mono-space text-sm mt-1 truncate" style={{ color: '#e8e8e840' }}>
                    {displayArtist}
                  </p>

                  {/* Style / genre tags */}
                  {displayTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {displayTags.map(tag => (
                        <span
                          key={tag}
                          className="font-mono-space text-xs tracking-widest"
                          style={{
                            color: '#39FF14',
                            background: 'rgba(57,255,20,0.07)',
                            border: '1px solid rgba(57,255,20,0.18)',
                            padding: '2px 8px',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Next track preview */}
                  {nextTrack && isPlaying && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-mono-space text-xs flex-shrink-0" style={{ color: '#e8e8e818', letterSpacing: '0.2em' }}>NEXT</span>
                      <span className="font-mono-space text-xs truncate" style={{ color: '#e8e8e828' }}>{nextTrack.title}</span>
                    </div>
                  )}

                </div>

                {/* ── Play/Pause — CDJ tactile button ─────────── */}
                <div className="flex-shrink-0 relative" style={{ width: 76, height: 76 }}>
                  {/* Outer bezel with status glow */}
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: 'radial-gradient(circle at 40% 35%, #1c1c1c, #0a0a0a)',
                    boxShadow: isPlaying
                      ? '0 0 0 2px rgba(57,255,20,0.4), 0 0 22px rgba(57,255,20,0.18), 0 4px 18px rgba(0,0,0,0.85)'
                      : '0 0 0 1px rgba(255,255,255,0.08), 0 4px 18px rgba(0,0,0,0.85)',
                    transition: 'box-shadow 0.4s ease',
                  }} />
                  {/* Inner dome */}
                  <button
                    onClick={handlePlay}
                    disabled={!configured}
                    onMouseDown={() => setBtnPressed(true)}
                    onMouseUp={() => setBtnPressed(false)}
                    onMouseLeave={() => setBtnPressed(false)}
                    title={!configured ? 'Configurer le stream en premier' : isPlaying ? 'Pause' : isPaused ? 'Reprendre' : 'Écouter'}
                    style={{
                      position: 'absolute',
                      top: 7, left: 7, right: 7, bottom: 7,
                      borderRadius: '50%', border: 'none',
                      background: btnPressed
                        ? 'radial-gradient(circle at 45% 42%, #111, #080808)'
                        : isPlaying
                          ? 'radial-gradient(circle at 38% 32%, #1d2f1a, #0b160a)'
                          : 'radial-gradient(circle at 38% 32%, #202020, #0d0d0d)',
                      boxShadow: btnPressed
                        ? 'inset 0 3px 8px rgba(0,0,0,0.95)'
                        : 'inset 0 -3px 6px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.09)',
                      cursor: configured ? 'pointer' : 'not-allowed',
                      transform: btnPressed ? 'scale(0.95) translateY(1px)' : 'scale(1)',
                      transition: 'transform 0.07s ease, background 0.3s ease, box-shadow 0.07s ease',
                      opacity: configured ? 1 : 0.35,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {status === 'loading' ? (
                      <div style={{ width: 20, height: 20, border: '2px solid rgba(57,255,20,0.2)', borderTopColor: '#39FF14', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    ) : isPlaying ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <defs><linearGradient id="ig_pause" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FF1A1A" /><stop offset="100%" stopColor="#FF8C00" />
                        </linearGradient></defs>
                        <rect x="4" y="3" width="5.5" height="18" rx="2" fill="url(#ig_pause)" />
                        <rect x="14.5" y="3" width="5.5" height="18" rx="2" fill="url(#ig_pause)" />
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 2 }}>
                        <defs><linearGradient id="ig_play" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#39FF14" /><stop offset="100%" stopColor="#FF1A1A" />
                        </linearGradient></defs>
                        <path d="M5 2.5L5 21.5L21 12Z" fill="url(#ig_play)" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Spectrum analyzer ───────────────────────────── */}
            <div className="relative" style={{ height: '120px', background: '#040404' }}>
              <canvas ref={spectrumRef} className="w-full h-full" style={{ display: 'block' }} />
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(90deg, #040404 0%, transparent 5%, transparent 95%, #040404 100%)' }} />
              <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
                style={{ background: 'linear-gradient(to top, #090909, transparent)' }} />
            </div>

            {/* ── Volume controls + tags ───────────────────────── */}
            <div
              className="flex items-center gap-4 px-6 md:px-8 py-3.5"
              style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: '#060606' }}
            >
              {/* Mute toggle */}
              <button
                onClick={() => setMuted(m => !m)}
                className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                title={muted ? 'Activer le son' : 'Couper le son'}
              >
                {muted ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e8e8e8" strokeWidth="2">
                    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e8e8e8" strokeWidth="2">
                    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                )}
              </button>

              {/* Volume knob — DJ rotary */}
              <DJKnob
                value={muted ? 0 : volume}
                onChange={v => { setMuted(false); setVolume(v); }}
                muted={muted}
              />

              {/* Station tagline */}
              <div className="hidden md:flex items-center gap-3 ml-2">
                <span
                  className="font-mono-space text-xs tracking-[0.2em]"
                  style={{
                    color: '#39FF1499',
                    textShadow: '0 0 8px rgba(57,255,20,0.3)',
                  }}
                >
                  {t('player.webRadio')}
                </span>
                <span style={{ color: '#39FF1444', fontSize: '8px' }}>&#9670;</span>
                <span
                  className="font-mono-space text-xs tracking-[0.15em]"
                  style={{
                    color: '#39FF1477',
                    textShadow: '0 0 6px rgba(57,255,20,0.2)',
                  }}
                >
                  {t('player.slogan')}
                </span>
              </div>
            </div>

            {/* ── Error state ─────────────────────────────────── */}
            {status === 'error' && (
              <div
                className="flex items-center gap-3 px-6 py-3"
                style={{ background: 'rgba(255,50,50,0.04)', borderTop: '1px solid rgba(255,50,50,0.1)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="font-mono-space text-xs" style={{ color: '#FF1A1A99' }}>
                  ERREUR DE LECTURE — Passage au track suivant...
                </span>
              </div>
            )}

            {/* ── Not configured notice ────────────────── */}
            {!configured && !isPlaylistMode && (
              <div
                className="flex items-center gap-3 px-6 py-3"
                style={{ background: 'rgba(57,255,20,0.02)', borderTop: '1px solid rgba(57,255,20,0.06)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#39FF1466" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="font-mono-space text-xs" style={{ color: '#39FF1444' }}>
                  Configure VITE_PLAYLIST_URL dans .env pour activer le lecteur
                </span>
              </div>
            )}
            {isPlaylistMode && tracks.length === 0 && (
              <div
                className="flex items-center gap-3 px-6 py-3"
                style={{ background: 'rgba(57,255,20,0.02)', borderTop: '1px solid rgba(57,255,20,0.06)' }}
              >
                <div style={{ width: '10px', height: '10px', border: '1.5px solid rgba(57,255,20,0.25)', borderTopColor: '#39FF14', borderRadius: '50%', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                <span className="font-mono-space text-xs" style={{ color: '#39FF1444' }}>
                  Chargement de la playlist...
                </span>
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}
