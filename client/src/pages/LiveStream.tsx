/* ============================================================
   DARKVOLT — PAGE LIVE STREAM
   Connectée à : useStreamApi (backend API), RADIO_CONFIG, LivePlayer
   ============================================================ */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import LivePlayer from '@/components/LivePlayer';
import { useStreamApi } from '@/hooks/useStreamApi';
import { useSchedule } from '@/hooks/useSchedule';
import type { ScheduleEvent } from '@/hooks/useSchedule';
import { RADIO_CONFIG } from '@/config/radio';

const G = '#39FF14';
const R = '#FF1A1A';
const CLIP = (s = 14) =>
  `polygon(0 0, calc(100% - ${s}px) 0, 100% ${s}px, 100% 100%, ${s}px 100%, 0 calc(100% - ${s}px))`;

/* ── Info card ────────────────────────────────────────────── */
function InfoCard({
  label, value, sub, accent = G,
}: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div
      className="flex flex-col gap-2 p-5"
      style={{
        background: '#080808',
        border: `1px solid ${accent}15`,
        clipPath: CLIP(10),
      }}
    >
      <span className="font-orbitron text-xs tracking-[0.25em] uppercase" style={{ color: `${accent}66` }}>
        {label}
      </span>
      <span className="font-orbitron font-black text-lg" style={{ color: accent, textShadow: `0 0 20px ${accent}44` }}>
        {value}
      </span>
      {sub && <span className="font-space text-xs" style={{ color: '#e8e8e844' }}>{sub}</span>}
    </div>
  );
}

/* ── Schedule card ──────────────────────────────────── */
type ShowItem = ScheduleEvent & { isLiveNow: boolean };
function ShowCard({ show, delay = 0, visible }: { show: ShowItem; delay?: number; visible: boolean }) {
  const [hov, setHov] = useState(false);
  const c = show.color === 'green' ? G : R;
  return (
    <div
      style={{
        clipPath: CLIP(10),
        background: hov || show.isLiveNow ? `${c}22` : `${c}0a`,
        padding: '1px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-30px)',
        transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
        filter: show.isLiveNow || hov ? `drop-shadow(0 0 10px ${c}33)` : 'none',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div
        className="flex items-center gap-4 px-5 py-4"
        style={{ background: '#090909', clipPath: CLIP(10) }}
      >
        {/* Diagonal top-right accent */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 10px 10px 0', borderColor: `transparent ${c}33 transparent transparent`, pointerEvents: 'none' }} />

        {/* Time column */}
        <div className="flex flex-col items-center min-w-[52px]">
          {show.isLiveNow ? (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}`, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <span className="font-orbitron text-xs font-bold" style={{ color: c }}>LIVE</span>
            </div>
          ) : (
            <span className="font-orbitron font-bold text-sm" style={{ color: `${c}66` }}>{show.startTime}</span>
          )}
          <span className="font-orbitron text-xs mt-0.5" style={{ color: '#e8e8e822' }}>{new Date(show.date + 'T00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()}</span>
        </div>

        {/* Divider */}
        <div className="self-stretch w-px" style={{ background: `${c}22` }} />

        {/* Info */}
        <div className="flex-1">
          <h4 className="font-orbitron font-black text-sm tracking-wider" style={{ color: hov || show.isLiveNow ? '#ffffff' : '#e8e8e8cc' }}>
            {show.title}
          </h4>
          <p className="font-space text-xs mt-0.5" style={{ color: `${c}88` }}>{show.djName}</p>
        </div>

        {/* Genre badge */}
        <div className="hidden sm:block">
          <span
            className="font-orbitron text-xs tracking-wider uppercase px-3 py-1"
            style={{ background: `${c}0a`, border: `1px solid ${c}22`, color: `${c}77`, clipPath: 'polygon(5px 0%, 100% 0%, calc(100% - 5px) 100%, 0% 100%)', fontSize: '9px' }}
          >
            {show.genre}
          </span>
        </div>

        {/* Duration */}
        <span className="font-orbitron font-bold text-sm" style={{ color: `${c}55` }}>{Math.floor(show.duration/60)}H{show.duration%60>0?String(show.duration%60).padStart(2,'0'):''}</span>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */
export default function LiveStream() {
  const { status: streamStatus, getLiveDuration } = useStreamApi();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [liveDuration, setLiveDuration] = useState('00:00:00');
  const scheduleRef = useRef<HTMLDivElement>(null);
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const { events: allEvents, isLiveNow: checkLive } = useSchedule();
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const SHOWS: ShowItem[] = allEvents
    .filter(e => e.date >= todayStr)
    .slice(0, 8)
    .map(e => ({ ...e, isLiveNow: checkLive(e) }));

  useEffect(() => {
    window.scrollTo(0, 0);
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  /* Live duration ticker */
  useEffect(() => {
    if (!streamStatus.isLive) return;
    const id = setInterval(() => setLiveDuration(getLiveDuration()), 1000);
    return () => clearInterval(id);
  }, [streamStatus.isLive, getLiveDuration]);

  /* Schedule intersection */
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setScheduleVisible(true); }, { threshold: 0.05 });
    if (scheduleRef.current) obs.observe(scheduleRef.current);
    return () => obs.disconnect();
  }, []);

  const isConfigured = RADIO_CONFIG.playlistUrl.length > 0;
  const isLiveNow = streamStatus.isLive;
  const statusLabel = isLiveNow
    ? `LIVE — ${streamStatus.streamerName || t('live.djLive')}`
    : isConfigured
    ? t('live.autoDj')
    : t('live.signalReady');
  const statusColor = isLiveNow ? R : isConfigured ? G : '#666666';

  return (
    <div style={{ background: '#050505', minHeight: '100vh' }}>
      <Navigation />

      {/* ═══════════════ HERO ═══════════════ */}
      <div
        className="relative overflow-hidden"
        style={{
          paddingTop: '96px',
          paddingBottom: '0',
          background: 'linear-gradient(180deg, #060606 0%, #050505 100%)',
        }}
      >
        {/* Scan lines */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(57,255,20,0.01) 3px, rgba(57,255,20,0.01) 4px)' }} />

        {/* Vertical accent lines */}
        {[6, 8, 10].map((p, i) => (
          <div key={i} className="absolute inset-y-0 pointer-events-none" style={{ left: `${p}%`, width: '1px', background: `linear-gradient(180deg, transparent, rgba(57,255,20,${0.06 - i * 0.015}), transparent)` }} />
        ))}
        {[90, 92, 94].map((p, i) => (
          <div key={i} className="absolute inset-y-0 pointer-events-none" style={{ left: `${p}%`, width: '1px', background: `linear-gradient(180deg, transparent, rgba(255,26,26,${0.05 - i * 0.012}), transparent)` }} />
        ))}

        <div className="container relative pb-10">
          {/* Tag row */}
          <div
            className="flex items-center gap-4 mb-5"
            style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease' }}
          >
            <div
              className="font-orbitron font-bold text-xs tracking-[0.3em] uppercase px-4 py-1.5 flex items-center gap-2"
              style={{ background: `${statusColor}11`, border: `1px solid ${statusColor}44`, color: statusColor, clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)' }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}`, animation: isLiveNow || isConfigured ? 'pulse 2s ease-in-out infinite' : 'none' }}
              />
              {statusLabel}
            </div>
            {isLiveNow && streamStatus.viewers > 0 && (
              <span className="font-orbitron text-xs tracking-[0.2em]" style={{ color: `${G}55` }}>
                {streamStatus.viewers} {t('live.listeners')}
              </span>
            )}
            <div className="h-px flex-1 max-w-[60px]" style={{ background: `linear-gradient(90deg, ${statusColor}44, transparent)` }} />
          </div>

          {/* Main title — LIVE STREAM clearly readable in white */}
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s',
            }}
          >
            <h1
              className="font-orbitron font-black uppercase leading-none mb-3"
              style={{
                fontSize: 'clamp(2.5rem, 8vw, 7rem)',
                color: '#ffffff',
                textShadow: `0 0 60px rgba(255,255,255,0.08)`,
                letterSpacing: '-0.02em',
              }}
            >
              LIVE STREAM
            </h1>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-px w-10" style={{ background: `linear-gradient(90deg, ${G}66, transparent)` }} />
              <span
                className="font-orbitron font-bold tracking-[0.45em] uppercase"
                style={{ fontSize: 'clamp(0.75rem, 2vw, 1rem)', color: G, textShadow: `0 0 16px ${G}88` }}
              >
                DARKVOLT
              </span>
            </div>
          </div>

          <p
            className="font-space text-sm max-w-lg mt-4 leading-relaxed"
            style={{
              color: '#e8e8e855',
              opacity: visible ? 1 : 0,
              transition: 'opacity 0.7s ease 0.3s',
            }}
          >
            {t('player.slogan')} — Techno, Industrial, Dark Electro, Tribecore.
            {isLiveNow && streamStatus.isLive && ` ${t('live.onAirSince', { duration: liveDuration })}`}
          </p>
        </div>

        {/* ── Stats bar ─────────────────────────────────── */}
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
            <div className="flex flex-wrap items-center gap-0 divide-x" style={{ borderColor: 'rgba(57,255,20,0.06)' }}>
              {[
                { label: 'FORMAT',                     value: RADIO_CONFIG.format,  accent: G },
                { label: 'BITRATE',                    value: RADIO_CONFIG.bitrate, accent: G },
                { label: t('live.statsFrequency'),     value: '24/7',               accent: G },
                {
                  label: t('live.statsStatus'),
                  value: isLiveNow ? 'LIVE' : isConfigured ? t('live.statusAuto') : t('live.statusReady'),
                  accent: statusColor,
                },
                ...(isLiveNow && streamStatus.viewers > 0 ? [{ label: 'LISTENERS', value: String(streamStatus.viewers), accent: G }] : []),
              ].map(({ label, value, accent }, i, arr) => (
                <div key={label} className="flex flex-col items-center gap-1 px-6 py-4" style={{ borderColor: 'rgba(57,255,20,0.06)' }}>
                  <span
                    className="font-orbitron font-black"
                    style={{ fontSize: '20px', color: accent, textShadow: `0 0 16px ${accent}44` }}
                  >
                    {value}
                  </span>
                  <span
                    className="font-orbitron text-xs tracking-[0.25em] uppercase"
                    style={{ color: '#e8e8e833', fontSize: '9px' }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ LIVE PLAYER (full component) ═══════════════ */}
      <LivePlayer />

      {/* ═══════════════ SCHEDULE ═══════════════ */}
      <div
        ref={scheduleRef}
        className="relative py-20 overflow-hidden"
        style={{ background: '#080808', borderTop: `1px solid rgba(57,255,20,0.06)` }}
      >
        {/* Scan lines */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,26,26,0.008) 3px, rgba(255,26,26,0.008) 4px)' }} />

        <div className="container relative">
          {/* Header */}
          <div
            className="mb-10"
            style={{
              opacity: scheduleVisible ? 1 : 0,
              transform: scheduleVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${R}, ${G})` }} />
              <span className="font-orbitron text-xs tracking-[0.4em] uppercase" style={{ color: R }}>{t('live.scheduleLabel')}</span>
            </div>
            <h2
              className="font-orbitron font-black uppercase"
              style={{ fontSize: 'clamp(1.8rem, 5vw, 4rem)', color: '#e8e8e8', letterSpacing: '0.03em', lineHeight: 1 }}
            >
              {t('live.scheduleTitle')}
            </h2>
            <p className="font-space text-sm mt-3" style={{ color: '#e8e8e844' }}>
              {t('live.scheduleSubtitle')}
            </p>
          </div>

          {/* 2-col grid on large, 1-col on small */}
          {SHOWS.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16" style={{ border: '1px dashed rgba(57,255,20,0.08)' }}>
              <span style={{ fontSize: '2.5rem', opacity: 0.15 }}>📅</span>
              <p className="font-orbitron text-xs tracking-[0.4em] uppercase" style={{ color: '#e8e8e822' }}>AUCUN SHOW PLANIFIÉ</p>
              <p className="font-space text-sm" style={{ color: '#e8e8e833' }}>Le planning sera affiché ici dès qu'un show est créé</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {SHOWS.map((show, i) => (
              <ShowCard key={show.id} show={show} visible={scheduleVisible} delay={i * 0.07} />
            ))}
          </div>
          )}

          {/* Note */}
          <p
            className="mt-6 font-space text-xs text-center"
            style={{
              color: '#e8e8e822',
              opacity: scheduleVisible ? 1 : 0,
              transition: 'opacity 0.7s ease 0.6s',
            }}
          >
            {t('live.scheduleNote')}
          </p>
        </div>
      </div>

      {/* ═══════════════ STATION INFO ═══════════════ */}
      <div className="py-16" style={{ background: '#050505', borderTop: `1px solid rgba(57,255,20,0.06)` }}>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard
              label={t('live.infoMission')}
              value={t('live.infoMissionValue')}
              sub={t('live.infoMissionDesc')}
              accent={G}
            />
            <InfoCard
              label={t('live.infoTech')}
              value={RADIO_CONFIG.format}
              sub={`${RADIO_CONFIG.bitrate} ${t('live.infoTechDesc')}`}
              accent={G}
            />
            <InfoCard
              label={t('live.infoAvailability')}
              value="24/7"
              sub={t('live.infoAvailabilityDesc')}
              accent={R}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════ COMMUNITY CTA ═══════════════ */}
      <div
        className="relative py-20 overflow-hidden"
        style={{ background: '#080808', borderTop: `1px solid rgba(57,255,20,0.06)` }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 50% 40% at 50% 50%, ${G}06, transparent)` }} />
        <div className="container relative text-center">
          <div className="inline-flex items-center gap-3 mb-5">
            <div className="h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${G}44)` }} />
            <span className="font-orbitron text-xs tracking-[0.4em] uppercase" style={{ color: `${G}55` }}>{t('live.communityLabel')}</span>
            <div className="h-px w-12" style={{ background: `linear-gradient(90deg, ${G}44, transparent)` }} />
          </div>

          <h2
            className="font-orbitron font-black uppercase mb-4"
            style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)', color: '#ffffff', textShadow: `0 0 40px ${G}18` }}
          >
            {t('live.communityTitle')}
          </h2>
          <p className="font-space text-sm max-w-md mx-auto mb-8 leading-relaxed" style={{ color: '#e8e8e855' }}>
            {t('live.communityDesc')}
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="https://discord.com/invite/yr25MqEN"
              target="_blank"
              rel="noopener noreferrer"
              className="font-orbitron font-bold text-xs tracking-[0.3em] uppercase px-8 py-4 transition-all duration-300"
              style={{
                background: 'transparent',
                border: `1px solid ${G}`,
                color: G,
                clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)',
                boxShadow: `0 0 16px ${G}22`,
                textDecoration: 'none',
                display: 'inline-block',
              }}
              onMouseEnter={e => { const a = e.currentTarget as HTMLAnchorElement; a.style.background = G; a.style.color = '#050505'; a.style.boxShadow = `0 0 32px ${G}`; }}
              onMouseLeave={e => { const a = e.currentTarget as HTMLAnchorElement; a.style.background = 'transparent'; a.style.color = G; a.style.boxShadow = `0 0 16px ${G}22`; }}
            >
              {t('live.joinDiscord')}
            </a>
            <a
              href="/archives"
              className="font-orbitron font-bold text-xs tracking-[0.3em] uppercase px-8 py-4 transition-all duration-300"
              style={{
                background: 'transparent',
                border: `1px solid rgba(255,26,26,0.4)`,
                color: `${R}88`,
                clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)',
                textDecoration: 'none',
                display: 'inline-block',
              }}
              onMouseEnter={e => { const a = e.currentTarget as HTMLAnchorElement; a.style.borderColor = R; a.style.color = R; a.style.boxShadow = `0 0 16px ${R}44`; }}
              onMouseLeave={e => { const a = e.currentTarget as HTMLAnchorElement; a.style.borderColor = 'rgba(255,26,26,0.4)'; a.style.color = `${R}88`; a.style.boxShadow = 'none'; }}
            >
              {t('live.archiveMixes')}
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
