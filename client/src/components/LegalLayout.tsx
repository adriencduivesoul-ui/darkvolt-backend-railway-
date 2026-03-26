/* ============================================================
   DARKVOLT — LEGAL LAYOUT
   Shared wrapper for all legal / static pages.
   Design: full dark tech-panel style, consistent with landing.
   ============================================================ */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Navigation from './Navigation';
import Footer from './Footer';

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  tag: string;
  tagColor?: 'green' | 'red';
  lastUpdate?: string;
  children: React.ReactNode;
}

const CLIP = (s = 18) =>
  `polygon(0 0, calc(100% - ${s}px) 0, 100% ${s}px, 100% 100%, ${s}px 100%, 0 calc(100% - ${s}px))`;

/* ── Reusable tech-panel section card ─────────────────────── */
export function LegalCard({
  title,
  accent = 'green',
  children,
}: {
  title?: string;
  accent?: 'green' | 'red' | 'none';
  children: React.ReactNode;
}) {
  const c = accent === 'green' ? '#39FF14' : accent === 'red' ? '#FF1A1A' : '#e8e8e8';
  const borderBg =
    accent === 'green'
      ? 'linear-gradient(135deg, rgba(57,255,20,0.22) 0%, rgba(57,255,20,0.06) 50%, rgba(57,255,20,0.18) 100%)'
      : accent === 'red'
      ? 'linear-gradient(135deg, rgba(255,26,26,0.22) 0%, rgba(255,26,26,0.06) 50%, rgba(255,26,26,0.18) 100%)'
      : 'rgba(255,255,255,0.07)';

  return (
    <div
      style={{
        clipPath: CLIP(16),
        background: borderBg,
        padding: '1px',
        marginBottom: '24px',
      }}
    >
      <div
        className="relative"
        style={{ background: '#0a0a0a', clipPath: CLIP(16), padding: '32px 36px' }}
      >
        {/* Corner bracket — top-left */}
        <div
          style={{
            position: 'absolute', top: 10, left: 10, width: 16, height: 16,
            borderTop: `1.5px solid ${c}`, borderLeft: `1.5px solid ${c}`,
            opacity: 0.6, pointerEvents: 'none',
          }}
        />
        {/* Diagonal accent — top-right */}
        <div
          style={{
            position: 'absolute', top: 0, right: 0, width: 0, height: 0,
            borderStyle: 'solid', borderWidth: '0 16px 16px 0',
            borderColor: `transparent ${c === '#e8e8e8' ? 'rgba(255,255,255,0.1)' : accent === 'green' ? 'rgba(57,255,20,0.25)' : 'rgba(255,26,26,0.25)'} transparent transparent`,
            pointerEvents: 'none',
          }}
        />
        {title && (
          <h2
            className="font-orbitron font-bold text-sm tracking-[0.25em] uppercase mb-6"
            style={{ color: c, opacity: 0.9 }}
          >
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}

/* ── Paragraph helper ─────────────────────────────────────── */
export function LP({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-space text-sm leading-relaxed mb-4" style={{ color: '#e8e8e8bb' }}>
      {children}
    </p>
  );
}

/* ── Article title helper ─────────────────────────────────── */
export function LH({ n, children }: { n?: string | number; children: React.ReactNode }) {
  return (
    <h3
      className="font-orbitron font-bold text-xs tracking-[0.2em] uppercase mt-6 mb-3"
      style={{ color: '#e8e8e8cc' }}
    >
      {n ? `${n}. ` : ''}{children}
    </h3>
  );
}

/* ── List helper ──────────────────────────────────────────── */
export function LL({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2 mb-4 pl-4">
      {items.map((item, i) => (
        <li key={i} className="font-space text-sm leading-relaxed flex gap-3" style={{ color: '#e8e8e8aa' }}>
          <span style={{ color: '#39FF14', flexShrink: 0, marginTop: '2px' }}>▸</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── Main layout wrapper ──────────────────────────────────── */
export default function LegalLayout({
  title,
  subtitle,
  tag,
  tagColor = 'green',
  lastUpdate,
  children,
}: LegalLayoutProps) {
  const { t } = useTranslation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const tc = tagColor === 'green' ? '#39FF14' : '#FF1A1A';

  return (
    <div style={{ background: '#050505', minHeight: '100vh' }}>
      <Navigation />

      {/* ── Hero banner ───────────────────────────────────── */}
      <div
        className="relative overflow-hidden pt-32 pb-16"
        style={{
          background: 'linear-gradient(180deg, #0a0a0a 0%, #050505 100%)',
          borderBottom: '1px solid rgba(57,255,20,0.07)',
        }}
      >
        {/* Scan-line texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(57,255,20,0.015) 2px, rgba(57,255,20,0.015) 4px)',
          }}
        />
        {/* Diagonal accent line */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: 0, right: '8%', width: '1px', height: '100%',
            background: 'linear-gradient(180deg, transparent 0%, rgba(57,255,20,0.12) 40%, transparent 100%)',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            top: 0, right: 'calc(8% + 6px)', width: '1px', height: '100%',
            background: 'linear-gradient(180deg, transparent 0%, rgba(57,255,20,0.05) 40%, transparent 100%)',
          }}
        />

        <div className="container relative">
          {/* Tag badge */}
          <div className="mb-5 flex items-center gap-3">
            <div
              className="font-orbitron font-bold text-xs tracking-[0.3em] uppercase px-4 py-1.5"
              style={{
                background: `${tc}11`,
                border: `1px solid ${tc}44`,
                color: tc,
                clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
              }}
            >
              {tag}
            </div>
            {lastUpdate && (
              <span className="font-mono-space text-xs" style={{ color: '#e8e8e833' }}>
                {t('legalLayout.updated')} {lastUpdate}
              </span>
            )}
          </div>

          {/* Title */}
          <h1
            className="font-orbitron font-black uppercase leading-none mb-4"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              color: '#e8e8e8',
              textShadow: `0 0 40px ${tc}22`,
            }}
          >
            {title}
          </h1>

          {/* Subtitle */}
          <p
            className="font-space text-sm max-w-xl leading-relaxed"
            style={{ color: '#e8e8e855' }}
          >
            {subtitle}
          </p>

          {/* Decorative line */}
          <div
            className="mt-8"
            style={{
              width: '80px', height: '2px',
              background: `linear-gradient(90deg, ${tc}, transparent)`,
              boxShadow: `0 0 12px ${tc}44`,
            }}
          />
        </div>
      </div>

      {/* ── Content area ──────────────────────────────────── */}
      <div className="container py-16">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </div>

      <Footer />
    </div>
  );
}
