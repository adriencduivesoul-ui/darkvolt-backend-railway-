/* ============================================================
   DARKVOLT — SHOWS SECTION
   Design: Dark grid of upcoming shows / schedule
   Features: Show cards, DJ info, genre tags, hover effects
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import GlitchText from './GlitchText';
import { useSchedule } from '../hooks/useSchedule';

export default function ShowsSection() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [, navigate] = useLocation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const { events: allEvents, isLiveNow } = useSchedule();

  /* show up to 6 upcoming or live events */
  const now = new Date();
  const shows = allEvents
    .filter(e => new Date(e.date + 'T' + e.startTime + ':00') >= new Date(now.getTime() - e.duration * 60000))
    .slice(0, 6);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="shows"
      ref={sectionRef}
      className="relative py-24 overflow-hidden"
      style={{ background: '#080808' }}
    >
      {/* Diagonal top divider */}
      <div
        className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
        style={{
          background: '#050505',
          clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 100%)',
        }}
      />

      <div className="container relative z-10">
        {/* Header */}
        <div
          className="mb-12"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="h-[1px] w-12" style={{ background: 'linear-gradient(90deg, transparent, #FF1A1A, #39FF14)' }} />
            <span className="font-mono-space text-xs tracking-[0.4em] uppercase" style={{ color: '#FF1A1A', textShadow: '0 0 8px rgba(255,26,26,0.4)' }}>
              {t('shows.scheduleLabel')}
            </span>
          </div>
          <GlitchText
            speed={0.55}
            enableShadows
            bgColor="#080808"
            className="font-bebas text-5xl md:text-7xl"
            style={{ color: '#e8e8e8', letterSpacing: '0.05em', lineHeight: 1 }}
          >
            {t('shows.scheduleTitle')}
          </GlitchText>
        </div>

        {/* Shows grid */}
        {shows.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16" style={{ border: '1px dashed rgba(57,255,20,0.1)' }}>
            <span style={{ fontSize: '2.5rem', opacity: 0.15 }}>📅</span>
            <p className="font-orbitron text-xs tracking-[0.4em] uppercase" style={{ color: '#e8e8e822' }}>AUCUN SHOW PLANIFIÉ</p>
            <p className="font-space text-sm" style={{ color: '#e8e8e833' }}>Ajoutez des shows depuis le Dashboard Streamer</p>
          </div>
        ) : (
        <div className="flex flex-col gap-2">
          {shows.map((show, i) => {
            const live = isLiveNow(show);
            const gc = show.color === 'green';
            const accent = gc ? '#39FF14' : '#FF1A1A';
            const accentRgb = gc ? '57,255,20' : '255,26,26';
            const borderAlpha = live ? '0.5' : '0.22';
            const clip = 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)';
            const dur = `${Math.floor(show.duration / 60)}H${show.duration % 60 > 0 ? String(show.duration % 60).padStart(2,'0') : ''}`;
            const dayLabel = new Date(show.date + 'T00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase();
            return (
              <div
                key={show.id}
                style={{
                  clipPath: clip,
                  background: `rgba(${accentRgb},${borderAlpha})`,
                  padding: '1px',
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateX(0)' : 'translateX(-40px)',
                  transition: `opacity 0.6s ease ${i * 0.08}s, transform 0.6s ease ${i * 0.08}s, filter 0.3s ease`,
                  filter: live ? `drop-shadow(0 0 8px rgba(${accentRgb},0.3))` : 'none',
                }}
              >
                <div
                  className="group relative flex items-center gap-4 md:gap-8 px-4 md:px-6 py-4 md:py-5 cursor-pointer"
                  style={{
                    clipPath: clip,
                    background: live ? `rgba(${accentRgb},0.06)` : '#0a0a0a',
                    transition: 'background 0.3s ease, transform 0.25s ease, filter 0.3s ease',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.background = `rgba(${accentRgb},0.08)`;
                    el.style.transform = 'translateX(4px)';
                    (el.closest('div[style*="padding: 1px"]') as HTMLDivElement | null)
                      ?.style.setProperty('filter', `drop-shadow(0 0 14px rgba(${accentRgb},0.4))`);
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.background = live ? `rgba(${accentRgb},0.06)` : '#0a0a0a';
                    el.style.transform = 'translateX(0)';
                    (el.closest('div[style*="padding: 1px"]') as HTMLDivElement | null)
                      ?.style.setProperty('filter', live ? `drop-shadow(0 0 8px rgba(${accentRgb},0.3))` : 'none');
                  }}
                >
                  <div style={{ position:'absolute', top:8, left:8, width:12, height:12, borderTop:`1px solid ${accent}`, borderLeft:`1px solid ${accent}`, opacity:0.5, pointerEvents:'none' }} />
                  <div style={{ position:'absolute', top:0, right:0, width:0, height:0, borderStyle:'solid', borderWidth:`0 12px 12px 0`, borderColor:`transparent rgba(${accentRgb},0.25) transparent transparent`, pointerEvents:'none' }} />

                  <div className="flex flex-col items-center min-w-[60px]">
                    {live ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: '#FF1A1A', animation: 'live-dot 1.5s ease-in-out infinite', boxShadow: '0 0 6px #FF1A1A' }} />
                        <span className="font-mono-space text-xs" style={{ color: '#FF1A1A' }}>LIVE</span>
                      </div>
                    ) : (
                      <span className="font-orbitron font-bold text-sm" style={{ color: '#e8e8e833' }}>{show.startTime}</span>
                    )}
                    <span className="font-mono-space text-xs" style={{ color: '#e8e8e822' }}>{dayLabel}</span>
                  </div>

                  <div className="w-[1px] self-stretch" style={{ background: `rgba(${accentRgb},0.2)` }} />

                  <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                    <div className="flex-1">
                      <h3 className="font-orbitron font-black text-sm md:text-base tracking-wider" style={{ color: '#e8e8e8' }}>{show.title}</h3>
                      <p className="font-space text-xs md:text-sm" style={{ color: `${accent}88` }}>{show.djName}</p>
                    </div>
                    <div className="hidden md:flex items-center">
                      <span className="font-mono-space text-xs tracking-widest px-3 py-1"
                        style={{ clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)', background: `rgba(${accentRgb},0.1)`, color: `${accent}99` }}>
                        {show.genre}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-orbitron font-bold text-sm" style={{ color: `${accent}66` }}>{dur}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={`${accent}55`} strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}

        {/* View all button */}
        <div
          className="mt-8 flex justify-center"
          style={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.8s ease 0.6s',
          }}
        >
          <button
            className="font-orbitron font-bold text-xs tracking-[0.3em] uppercase px-8 py-4 transition-all duration-300"
            style={{
              background: 'transparent',
              border: '1px solid rgba(57,255,20,0.3)',
              color: '#39FF1488',
              clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#39FF14';
              (e.currentTarget as HTMLButtonElement).style.color = '#39FF14';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(57,255,20,0.2)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(57,255,20,0.3)';
              (e.currentTarget as HTMLButtonElement).style.color = '#39FF1488';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
            onClick={() => navigate('/live')}>
            {t('shows.viewFull')}
          </button>
        </div>
      </div>
    </section>
  );
}
