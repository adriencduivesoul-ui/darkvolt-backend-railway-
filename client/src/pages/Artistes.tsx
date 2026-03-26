/* ============================================================
   DARKVOLT — PAGE ARTISTES
   Design: Award-winning 2026 — dark tech asymmetric grid
   ============================================================ */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

/* ── Design tokens ────────────────────────────────────────── */
const G = '#39FF14';
const R = '#FF1A1A';
const O = '#FF6B35';
const CLIP = (s = 18) =>
  `polygon(0 0, calc(100% - ${s}px) 0, 100% ${s}px, 100% 100%, ${s}px 100%, 0 calc(100% - ${s}px))`;
const CLIP_SM = CLIP(10);
const CLIP_LG = CLIP(22);

/* ── Artist data ─────────────────────────────────────────── */
const GENRES_STATIC = ['TECHNO', 'INDUSTRIAL', 'DARK ELECTRO', 'TRIBECORE', 'HARDTEK', 'EXPÉRIMENTAL'];

interface Artist {
  id: string;
  name: string;
  alias?: string;
  genres: string[];
  mixes: number;
  bio: string;
  accent: string;
  accent2: string;
  symbol: string;
  featured?: boolean;
  origin: string;
}

const ARTISTS: Artist[] = [
  {
    id: 'darklouxxx',
    name: 'DarklouXxX',
    alias: 'LE FONDATEUR',
    genres: ['TRIBECORE', 'HARDTEK', 'TECHNO'],
    mixes: 4,
    bio: 'Fondateur de DarkVolt et pionnier de la scène Tribecore française. Ses sets bruts à l\'XDJ-700 définissent l\'identité sonore underground du label.',
    accent: G,
    accent2: G,
    symbol: 'D×',
    featured: true,
    origin: 'France',
  },
  {
    id: 'v0id',
    name: 'V0ID',
    alias: 'SYSTÈME D\'ERREUR',
    genres: ['INDUSTRIAL', 'EXPÉRIMENTAL'],
    mixes: 7,
    bio: 'Architecture sonore industrielle. Chaque set est une dissection du bruit — précision chirurgicale, chaos contrôlé.',
    accent: R,
    accent2: O,
    symbol: '∅',
    origin: 'Berlin',
  },
  {
    id: 'glitch_shrine',
    name: 'GLITCH.SHRINE',
    alias: 'ENTITÉ NUMÉRIQUE',
    genres: ['DARK ELECTRO', 'EXPÉRIMENTAL'],
    mixes: 12,
    bio: 'Quelque part entre la corrupted data et la transe. GLITCH.SHRINE traverse les fréquences interdites.',
    accent: R,
    accent2: R,
    symbol: '⌀',
    origin: 'Paris',
  },
  {
    id: 'nx_null',
    name: 'NX/NULL',
    alias: 'PROTOCOLE NOIR',
    genres: ['TECHNO', 'INDUSTRIAL'],
    mixes: 9,
    bio: 'Techno pure, sans ornements. NX/NULL construit des murs de son avec une efficacité redoutable.',
    accent: O,
    accent2: O,
    symbol: '//N',
    origin: 'Lyon',
  },
  {
    id: 'sekte_108',
    name: 'SEKTE.108',
    alias: 'SIGNAL ANOMALIE',
    genres: ['TRIBECORE', 'HARDTEK'],
    mixes: 6,
    bio: 'Les racines tek free party irriguent chaque production. SEKTE.108 maintient la flamme underground allumée.',
    accent: O,
    accent2: R,
    symbol: 'S∞',
    origin: 'Toulouse',
  },
  {
    id: 'ferrofluid',
    name: 'FERROFLUID',
    alias: 'MATTER OBSCURE',
    genres: ['DARK ELECTRO', 'TECHNO'],
    mixes: 5,
    bio: 'Fusion de synthèse analogique et de traitement numérique radical. Une matière sonore en constante mutation.',
    accent: G,
    accent2: G,
    symbol: 'Fe',
    origin: 'Nantes',
  },
  {
    id: 'deadzone',
    name: 'DEADZONE',
    alias: 'ZONE D\'EXCLUSION',
    genres: ['INDUSTRIAL', 'HARDTEK'],
    mixes: 3,
    bio: 'Post-industriel, post-humain. DEADZONE fait de chaque performance une cérémonie de la désintégration.',
    accent: R,
    accent2: R,
    symbol: 'DZ',
    origin: 'Bordeaux',
  },
  {
    id: 'phase_inv',
    name: 'PHASE.INV',
    alias: 'INVERSION TOTALE',
    genres: ['EXPÉRIMENTAL', 'DARK ELECTRO'],
    mixes: 11,
    bio: 'Compositions génératives, structures rythmiques impossibles. PHASE.INV repousse les frontières de ce qui est jouable.',
    accent: O,
    accent2: R,
    symbol: 'φ',
    origin: 'Marseille',
  },
];

/* ── Artist Card (regular) ────────────────────────────────── */
function ArtistCard({ artist, visible, delay = 0 }: { artist: Artist; visible: boolean; delay?: number }) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const [, navigate] = useLocation();
  const c = artist.accent;
  const borderBg = `linear-gradient(135deg, ${c}${hovered ? '55' : '22'} 0%, ${c}${hovered ? '22' : '08'} 50%, ${c}${hovered ? '44' : '18'} 100%)`;

  return (
    <div
      style={{
        clipPath: CLIP_SM,
        background: borderBg,
        padding: '1px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.96)',
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, background 0.35s ease`,
        filter: hovered ? `drop-shadow(0 0 18px ${c}44)` : 'none',
        cursor: 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="relative overflow-hidden flex flex-col h-full"
        style={{ background: '#080808', clipPath: CLIP_SM }}
      >
        {/* ── Diagonal accent top-right ── */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: `0 10px 10px 0`, borderColor: `transparent ${c}33 transparent transparent`, zIndex: 10, pointerEvents: 'none' }} />

        {/* ── Visual area ── */}
        <div
          className="relative overflow-hidden flex items-center justify-center"
          style={{
            height: '180px',
            background: `linear-gradient(135deg, #0a0a0a 0%, ${c}18 50%, #050505 100%)`,
            transition: 'all 0.5s ease',
          }}
        >
          {/* Grid lines */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `linear-gradient(${c}08 1px, transparent 1px), linear-gradient(90deg, ${c}08 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
            transition: 'opacity 0.5s',
            opacity: hovered ? 1 : 0.4,
          }} />
          {/* Center scan line on hover */}
          {hovered && (
            <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${c}88, transparent)`, animation: 'scan-line-anim 1.2s ease-in-out infinite', top: '50%' }} />
          )}
          {/* Symbol */}
          <span
            className="font-orbitron font-black select-none relative z-10"
            style={{
              fontSize: '56px',
              color: c,
              opacity: hovered ? 0.9 : 0.4,
              textShadow: hovered ? `0 0 40px ${c}, 0 0 80px ${c}44` : 'none',
              transform: hovered ? 'scale(1.08)' : 'scale(1)',
              transition: 'all 0.4s ease',
              letterSpacing: '-2px',
            }}
          >
            {artist.symbol}
          </span>
          {/* Origin badge */}
          <div style={{ position: 'absolute', bottom: 10, right: 10, background: `${c}15`, border: `1px solid ${c}33`, padding: '2px 8px', clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}>
            <span className="font-orbitron text-xs tracking-widest" style={{ color: `${c}88`, fontSize: '9px' }}>{artist.origin}</span>
          </div>
        </div>

        {/* ── Info area ── */}
        <div className="flex flex-col gap-3 p-5 flex-1">
          {/* Alias */}
          {artist.alias && (
            <span className="font-orbitron text-xs tracking-[0.25em] uppercase" style={{ color: `${c}66`, fontSize: '9px' }}>{artist.alias}</span>
          )}
          {/* Name */}
          <h3
            className="font-orbitron font-black uppercase leading-none"
            style={{
              fontSize: 'clamp(16px, 2.5vw, 22px)',
              color: hovered ? '#ffffff' : '#e8e8e8cc',
              textShadow: hovered ? `0 0 20px ${c}66` : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            {artist.name}
          </h3>

          {/* Genre tags */}
          <div className="flex flex-wrap gap-1.5">
            {artist.genres.map(g => (
              <span
                key={g}
                className="font-orbitron text-xs tracking-wider uppercase px-2 py-0.5"
                style={{
                  background: `${c}0a`,
                  border: `1px solid ${c}22`,
                  color: `${c}99`,
                  clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)',
                  fontSize: '8px',
                }}
              >
                {g}
              </span>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Footer */}
          <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${c}11` }}>
            <span className="font-orbitron text-xs" style={{ color: `${c}55`, fontSize: '10px' }}>
              {artist.mixes} MIX{artist.mixes > 1 ? 'ES' : ''}
            </span>
            <button
              className="font-orbitron font-bold text-xs tracking-[0.2em] uppercase px-4 py-1.5 transition-all duration-300"
              style={{
                background: hovered ? c : 'transparent',
                border: `1px solid ${c}88`,
                color: hovered ? '#050505' : `${c}88`,
                clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
                fontSize: '9px',
                boxShadow: hovered ? `0 0 16px ${c}66` : 'none',
              }}
            >
              {t('artists.listenSingle')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Featured Artist Card ─────────────────────────────────── */
function FeaturedCard({ artist, visible }: { artist: Artist; visible: boolean }) {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [, navigate] = useLocation();
  const c = artist.accent;

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = ((e.clientX - left) / width - 0.5) * 12;
    const y = -((e.clientY - top) / height - 0.5) * 8;
    setTilt({ x, y });
  }, []);

  return (
    <div
      ref={cardRef}
      style={{
        clipPath: CLIP_LG,
        background: `linear-gradient(135deg, ${c}${hovered ? '55' : '28'} 0%, ${c}0a 40%, ${R}22 100%)`,
        padding: '1px',
        opacity: visible ? 1 : 0,
        transform: visible
          ? `perspective(1200px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg) scale(${hovered ? 1.01 : 1})`
          : 'translateY(50px) scale(0.95)',
        transition: hovered
          ? 'opacity 0.7s ease, filter 0.4s ease, background 0.4s ease'
          : 'all 0.7s cubic-bezier(0.16,1,0.3,1)',
        filter: hovered ? `drop-shadow(0 0 30px ${c}55)` : `drop-shadow(0 8px 32px rgba(0,0,0,0.6))`,
        gridColumn: 'span 5',
        cursor: 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }); }}
      onMouseMove={onMove}
    >
      <div
        className="relative overflow-hidden h-full"
        style={{ background: '#060606', clipPath: CLIP_LG, minHeight: '460px' }}
      >
        {/* Background grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(${c}06 1px, transparent 1px), linear-gradient(90deg, ${c}06 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          opacity: hovered ? 1 : 0.5,
          transition: 'opacity 0.5s',
        }} />

        {/* Diagonal accent lines */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: `0 22px 22px 0`, borderColor: `transparent ${c}55 transparent transparent`, zIndex: 20, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, right: 22, width: 0, height: 0, borderStyle: 'solid', borderWidth: `0 8px 8px 0`, borderColor: `transparent ${c}22 transparent transparent`, zIndex: 20, pointerEvents: 'none' }} />

        {/* Corner brackets */}
        <div style={{ position: 'absolute', top: 16, left: 16, width: 24, height: 24, borderTop: `2px solid ${c}`, borderLeft: `2px solid ${c}`, opacity: hovered ? 1 : 0.5, transition: 'all 0.4s', zIndex: 20, boxShadow: hovered ? `inset 6px 6px 0 -5px ${c}33` : 'none', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 16, right: 16, width: 24, height: 24, borderBottom: `2px solid ${c}55`, borderRight: `2px solid ${c}55`, opacity: hovered ? 1 : 0.4, transition: 'all 0.4s', zIndex: 20, pointerEvents: 'none' }} />

        {/* FEATURED badge */}
        <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 30 }}>
          <div className="font-orbitron font-black text-xs tracking-[0.3em] uppercase px-4 py-1.5"
            style={{ background: `${c}18`, border: `1px solid ${c}55`, color: c, clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)', fontSize: '9px', boxShadow: `0 0 20px ${c}22` }}>
            {t('artists.featuredBadge')}
          </div>
        </div>

        {/* Big symbol visual */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.07 }}>
          <span className="font-orbitron font-black" style={{ fontSize: '280px', color: c, lineHeight: 1, letterSpacing: '-10px' }}>
            {artist.symbol}
          </span>
        </div>

        {/* Scan line on hover */}
        {hovered && (
          <div className="absolute inset-x-0 pointer-events-none" style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${c}cc, transparent)`, animation: 'scan-line-anim 1.8s ease-in-out infinite', top: '0', zIndex: 15 }} />
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-8 pt-16">
          {/* Stats row */}
          <div className="flex gap-6 mb-auto mt-24">
            {[
              { label: t('artists.stats.artists'), value: String(ARTISTS.length), accent: G },
              { label: t('artists.stats.mixes'), value: '47', accent: G },
              { label: t('artists.stats.genres'), value: '8', accent: G },
              { label: t('artists.stats.signal'), value: '24/7', accent: R },
            ].map(({ label, value, accent }) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="font-orbitron font-black" style={{ fontSize: '24px', color: accent, textShadow: hovered ? `0 0 20px ${accent}` : 'none', transition: 'text-shadow 0.4s' }}>{value}</span>
                <span className="font-orbitron text-xs tracking-[0.2em]" style={{ color: '#e8e8e833', fontSize: '9px' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="my-6" style={{ height: '1px', background: `linear-gradient(90deg, ${c}44, transparent)` }} />

          {/* Name */}
          <div className="mb-2">
            <span className="font-orbitron text-xs tracking-[0.3em] uppercase" style={{ color: `${c}66`, fontSize: '10px' }}>
              {artist.alias}
            </span>
          </div>
          <h2
            className="font-orbitron font-black uppercase leading-none mb-4"
            style={{
              fontSize: 'clamp(28px, 4vw, 48px)',
              color: '#ffffff',
              textShadow: hovered ? `0 0 40px ${c}77` : 'none',
              transition: 'text-shadow 0.4s',
            }}
          >
            {artist.name}
          </h2>

          {/* Genre tags */}
          <div className="flex flex-wrap gap-2 mb-5">
            {artist.genres.map(g => (
              <span key={g} className="font-orbitron text-xs tracking-wider uppercase px-3 py-1"
                style={{ background: `${c}12`, border: `1px solid ${c}33`, color: `${c}cc`, clipPath: 'polygon(5px 0%, 100% 0%, calc(100% - 5px) 100%, 0% 100%)', fontSize: '9px' }}>
                {g}
              </span>
            ))}
          </div>

          {/* Bio */}
          <p className="font-space text-sm leading-relaxed mb-6" style={{ color: '#e8e8e877', maxWidth: '420px' }}>
            {artist.bio}
          </p>

          {/* CTA buttons */}
          <div className="flex gap-3">
            <button
              className="font-orbitron font-bold text-xs tracking-[0.25em] uppercase px-6 py-3 transition-all duration-300"
              style={{
                background: hovered ? c : 'transparent',
                border: `1px solid ${c}`,
                color: hovered ? '#050505' : c,
                clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
                boxShadow: hovered ? `0 0 28px ${c}66` : `0 0 10px ${c}22`,
              }}
            >
              {t('artists.listenBtn')}
            </button>
            <button
              className="font-orbitron font-bold text-xs tracking-[0.25em] uppercase px-6 py-3 transition-all duration-300"
              style={{
                background: 'transparent',
                border: `1px solid ${R}44`,
                color: `${R}88`,
                clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = R; (e.currentTarget as HTMLButtonElement).style.color = R; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = `${R}44`; (e.currentTarget as HTMLButtonElement).style.color = `${R}88`; }}
            >
              {t('artists.profileBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Stat counter ─────────────────────────────────────────── */
function StatBlock({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-8 py-6 relative">
      <span className="font-orbitron font-black" style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: accent, textShadow: `0 0 30px ${accent}55` }}>
        {value}
      </span>
      <span className="font-orbitron text-xs tracking-[0.3em] uppercase" style={{ color: '#e8e8e833' }}>
        {label}
      </span>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */
export default function Artistes() {
  const { t } = useTranslation();
  const filterAll = t('artists.filterAll');
  const GENRES = [filterAll, ...GENRES_STATIC];
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [, navigate] = useLocation();
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.05 });
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const activeFilter = activeGenre ?? filterAll;
  const filtered = activeFilter === filterAll
    ? ARTISTS
    : ARTISTS.filter(a => a.genres.includes(activeFilter));

  const featured = filtered.find(a => a.featured) ?? filtered[0];
  const others = filtered.filter(a => a.id !== featured?.id);

  return (
    <div style={{ background: '#050505', minHeight: '100vh' }}>
      <Navigation />

      {/* ── HERO ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ paddingTop: '96px', paddingBottom: '0', background: 'linear-gradient(180deg, #080808 0%, #050505 100%)' }}>
        {/* Scan-line texture */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(57,255,20,0.012) 3px, rgba(57,255,20,0.012) 4px)' }} />

        {/* Diagonal accent lines */}
        {[8, 10, 14].map((pct, i) => (
          <div key={i} className="absolute inset-y-0 pointer-events-none" style={{
            left: `${pct}%`,
            width: '1px',
            background: `linear-gradient(180deg, transparent, rgba(57,255,20,${0.06 - i * 0.015}), transparent)`,
          }} />
        ))}
        {[88, 90, 93].map((pct, i) => (
          <div key={i} className="absolute inset-y-0 pointer-events-none" style={{
            left: `${pct}%`,
            width: '1px',
            background: `linear-gradient(180deg, transparent, rgba(255,26,26,${0.05 - i * 0.012}), transparent)`,
          }} />
        ))}

        <div className="container relative">
          {/* Tag */}
          <div className="mb-6 flex items-center gap-4">
            <div className="font-orbitron font-bold text-xs tracking-[0.3em] uppercase px-4 py-1.5"
              style={{ background: `${G}11`, border: `1px solid ${G}44`, color: G, clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)' }}>
              {t('artists.tag')}
            </div>
            <div className="h-px flex-1 max-w-[80px]" style={{ background: `linear-gradient(90deg, ${G}44, transparent)` }} />
          </div>

          {/* Title — ARTISTES clearly readable in white, DARKVOLT as subtitle accent */}
          <h1
            className="font-orbitron font-black uppercase mb-3"
            style={{
              fontSize: 'clamp(3.5rem, 10vw, 9rem)',
              lineHeight: 0.9,
              letterSpacing: '-0.02em',
              color: '#ffffff',
              textShadow: `0 0 60px rgba(255,255,255,0.08)`,
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.9s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            ARTISTES
          </h1>
          <div
            className="flex items-center gap-3 mb-6"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.9s cubic-bezier(0.16,1,0.3,1) 0.08s',
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

          <p className="font-space text-base max-w-xl mb-10 leading-relaxed"
            style={{
              color: '#e8e8e855',
              opacity: visible ? 1 : 0,
              transition: 'opacity 0.7s ease 0.3s',
            }}
          >
            {t('artists.subtitle')}
          </p>
        </div>

        {/* ── Stats bar ─────────────────────────────────── */}
        <div
          className="border-t border-b"
          style={{
            borderColor: `rgba(57,255,20,0.07)`,
            background: 'rgba(5,5,5,0.8)',
            backdropFilter: 'blur(10px)',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.7s ease 0.4s',
          }}
        >
          <div className="container">
            <div className="flex items-center justify-around flex-wrap divide-x divide-[rgba(57,255,20,0.06)]"
            >
              <StatBlock value={`${ARTISTS.length}`} label={t('artists.stats.artists')} accent={G} />
              <div style={{ width: '1px', background: `${G}10`, height: '60px', alignSelf: 'center' }} />
              <StatBlock value={`${ARTISTS.reduce((s, a) => s + a.mixes, 0)}`} label={t('artists.stats.mixes')} accent={G} />
              <div style={{ width: '1px', background: `${G}10`, height: '60px', alignSelf: 'center' }} />
              <StatBlock value={`${GENRES_STATIC.length}`} label={t('artists.stats.genres')} accent={R} />
              <div style={{ width: '1px', background: `${G}10`, height: '60px', alignSelf: 'center' }} />
              <StatBlock value="24/7" label={t('artists.stats.signal')} accent={G} />
            </div>
          </div>
        </div>
      </div>

      {/* ── GENRE FILTER ──────────────────────────────────── */}
      <div
        className="sticky top-16 z-40"
        style={{ background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(20px)', borderBottom: `1px solid rgba(57,255,20,0.06)` }}
      >
        <div className="container py-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-orbitron text-xs tracking-[0.2em] mr-2" style={{ color: '#e8e8e833' }}>{t('artists.filterLabel')}</span>
            {GENRES.map(g => {
              const isActive = (activeGenre ?? filterAll) === g;
              return (
                <button
                  key={g}
                  onClick={() => setActiveGenre(g)}
                  className="font-orbitron font-bold text-xs tracking-[0.2em] uppercase px-4 py-2 transition-all duration-300"
                  style={{
                    background: isActive ? G : 'transparent',
                    border: `1px solid ${isActive ? G : 'rgba(255,255,255,0.1)'}`,
                    color: isActive ? '#050505' : '#e8e8e855',
                    clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
                    boxShadow: isActive ? `0 0 16px ${G}44` : 'none',
                  }}
                  onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.borderColor = `${G}66`; (e.currentTarget as HTMLButtonElement).style.color = G; } }}
                  onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#e8e8e855'; } }}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ARTIST GRID ───────────────────────────────────── */}
      <div ref={sectionRef} className="container py-16">

        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-orbitron text-sm tracking-widest" style={{ color: '#e8e8e833' }}>{t('artists.noResults')}</p>
          </div>
        ) : (
          <>
            {/* Main grid: featured left + 4 cards right */}
            <div
              className="grid gap-4 mb-4"
              style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}
            >
              {/* Featured */}
              {featured && (
                <div style={{ gridColumn: 'span 5' }}>
                  <FeaturedCard artist={featured} visible={visible} />
                </div>
              )}

              {/* First 4 regular cards (2×2) */}
              <div style={{ gridColumn: 'span 7', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {others.slice(0, 4).map((artist, i) => (
                  <ArtistCard key={artist.id} artist={artist} visible={visible} delay={0.1 + i * 0.08} />
                ))}
              </div>
            </div>

            {/* Remaining cards — 3 per row */}
            {others.length > 4 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {others.slice(4).map((artist, i) => (
                  <ArtistCard key={artist.id} artist={artist} visible={visible} delay={0.2 + i * 0.08} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── CTA — REJOINDRE ───────────────────────────────── */}
      <div
        className="relative overflow-hidden py-24"
        style={{ borderTop: `1px solid rgba(57,255,20,0.07)` }}
      >
        {/* Background pulse */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${G}07, transparent)` }} />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(57,255,20,0.01) 3px, rgba(57,255,20,0.01) 4px)' }} />

        <div className="container relative text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-16" style={{ background: `linear-gradient(90deg, transparent, ${G}55)` }} />
            <span className="font-orbitron text-xs tracking-[0.4em] uppercase" style={{ color: `${G}66` }}>{t('artists.rosterLabel')}</span>
            <div className="h-px w-16" style={{ background: `linear-gradient(90deg, ${G}55, transparent)` }} />
          </div>

          <h2
            className="font-orbitron font-black uppercase mb-6"
            style={{
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              lineHeight: 1.1,
              color: '#ffffff',
              textShadow: `0 0 60px ${G}22`,
            }}
          >
            {t('artists.rosterTitle')}
          </h2>

          <p className="font-space text-base max-w-lg mx-auto mb-10 leading-relaxed" style={{ color: '#e8e8e866' }}>
            {t('artists.rosterDesc')}
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate('/soumettre-un-mix')}
              className="font-orbitron font-bold text-xs tracking-[0.3em] uppercase px-8 py-4 transition-all duration-300"
              style={{
                background: 'transparent',
                border: `1px solid ${G}`,
                color: G,
                clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)',
                boxShadow: `0 0 20px ${G}33`,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = G; (e.currentTarget as HTMLButtonElement).style.color = '#050505'; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 40px ${G}`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = G; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 20px ${G}33`; }}
            >
              {t('artists.submitBtn')}
            </button>
            <a
              href="https://discord.com/invite/yr25MqEN"
              target="_blank"
              rel="noopener noreferrer"
              className="font-orbitron font-bold text-xs tracking-[0.3em] uppercase px-8 py-4 transition-all duration-300"
              style={{
                background: 'transparent',
                border: `1px solid rgba(255,26,26,0.4)`,
                color: `${R}88`,
                clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)',
                textDecoration: 'none',
                display: 'inline-block',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = R; (e.currentTarget as HTMLAnchorElement).style.color = R; (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 0 20px ${R}44`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,26,26,0.4)'; (e.currentTarget as HTMLAnchorElement).style.color = `${R}88`; (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none'; }}
            >
              {t('artists.discordBtn')}
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
