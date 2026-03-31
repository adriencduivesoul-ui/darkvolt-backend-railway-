import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { useStreamApi } from '../hooks/useStreamApi';
import { useSchedule } from '../hooks/useSchedule';
import { useWebRTCViewer } from '../hooks/useWebRTCViewer';
import { useStreamerProfile } from '../hooks/useStreamerProfile';
import AudioPlayer from '../components/dashboard/AudioPlayer';
import ChatPanel from '../components/dashboard/ChatPanel';

const G = '#39FF14';
const R = '#FF1A1A';
const CLIP = (s = 10) => `polygon(0 0, calc(100% - ${s}px) 0, 100% ${s}px, 100% 100%, ${s}px 100%, 0 calc(100% - ${s}px))`;

const LOCKED_FEATURE_ICONS = ['📼', '�', '�', '�'];

export default function GuestDashboard() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { status } = useStreamApi();
  const { events: scheduleEvents, isLiveNow } = useSchedule();
  const { profile } = useStreamerProfile();
  const [guestId] = useState(() => 'guest_' + Math.random().toString(36).slice(2));
  const { remoteStream, hasVideo, join, leave } = useWebRTCViewer(guestId, 'Invité', status?.streamerId);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [schedFilter, setSchedFilter] = useState<'upcoming' | 'all'>('upcoming');

  const LOCKED_FEATURES = (t('guestDash.features', { returnObjects: true }) as { label: string; desc: string }[]).map((f, i) => ({ ...f, icon: LOCKED_FEATURE_ICONS[i] }));

  useEffect(() => {
    if (videoRef.current && remoteStream) videoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    if (status.isLive) {
      join();
      return () => leave();
    }
  }, [status.isLive, join, leave]);

  const filteredSchedule = () => {
    const now = new Date();
    if (schedFilter === 'upcoming') return scheduleEvents.filter(e => new Date(e.date + 'T' + e.startTime) >= now);
    return scheduleEvents;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#050505', color: '#e8e8e8' }}>
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
      }} />

      {/* Live Banner */}
      {status.isLive && (
        <div className="relative z-50 flex items-center justify-between px-6 py-2 shrink-0"
          style={{ background: 'rgba(255,26,26,0.07)', borderBottom: `1px solid ${R}33` }}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ background: R, animation: 'live-dot 1s ease-in-out infinite', boxShadow: `0 0 6px ${R}` }} />
            <span className="font-orbitron font-bold text-xs tracking-[0.2em]" style={{ color: R }}>LIVE — {status.title}</span>
          </div>
          <span className="font-mono-space text-xs" style={{ color: `${G}66` }}>👁 {status.viewers}</span>
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="relative z-50 flex items-center justify-between px-6 py-3 shrink-0"
        style={{ background: 'rgba(5,5,5,0.96)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${G}08`, position: 'sticky', top: status.isLive ? '41px' : 0 }}>
        <a href="/"><img src="/img/DarkVolt.png" alt="DarkVolt" style={{ height: '36px', filter: `drop-shadow(0 0 8px ${G}55)` }} /></a>

        <div className="flex items-center gap-2 px-4 py-1.5" style={{ border: `1px solid ${R}22`, background: `${R}06` }}>
          <span style={{ fontSize: '10px' }}>👁️</span>
          <span className="font-orbitron text-[10px] tracking-[0.2em] uppercase" style={{ color: '#e8e8e855' }}>{t('guestDash.guestMode')}</span>
        </div>

        <div className="flex items-center gap-3">
          <a href="/auth" className="font-orbitron font-bold text-[10px] tracking-[0.2em] uppercase px-5 py-2.5 transition-all"
            style={{ background: G, color: '#050505', boxShadow: `0 0 16px ${G}44`, clipPath: CLIP(6) }}>
            {t('guestDash.createAccount')}
          </a>
          <button onClick={() => { logout(); navigate('/'); }}
            className="font-orbitron text-[10px] tracking-[0.1em] uppercase px-3 py-2 transition-all"
            style={{ border: `1px solid ${R}22`, color: `${R}44`, background: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = R; (e.currentTarget as HTMLButtonElement).style.borderColor = R; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = `${R}44`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${R}22`; }}>
            {t('guestDash.quit')}
          </button>
        </div>
      </header>

      {/* ── MAIN GRID ── */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0" style={{ minHeight: 0 }}>

        {/* LEFT — Player + Schedule */}
        <div className="lg:col-span-2 flex flex-col" style={{ borderRight: `1px solid ${G}08` }}>

          {/* Player / Video */}
          <div className="p-6" style={{ borderBottom: `1px solid ${G}08`, background: `linear-gradient(160deg, ${status.isLive ? R : G}06 0%, transparent 60%)` }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6" style={{ background: `linear-gradient(90deg, transparent, ${status.isLive ? R : G})` }} />
              <span className="font-orbitron text-[10px] tracking-[0.4em] uppercase" style={{ color: `${status.isLive ? R : G}77` }}>
                {status.isLive ? `● LIVE — ${status.title}` : t('guestDash.streamLabel')}
              </span>
            </div>

            {status.isLive && hasVideo && remoteStream ? (
              <div className="relative" style={{ background: '#000', clipPath: CLIP(10), aspectRatio: '16/9', maxHeight: '340px', overflow: 'hidden' }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1" style={{ background: 'rgba(255,26,26,0.85)', clipPath: CLIP(4) }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#fff', animation: 'live-dot 1s ease-in-out infinite' }} />
                  <span className="font-orbitron text-[9px]" style={{ color: '#fff' }}>LIVE</span>
                </div>
              </div>
            ) : (
              <AudioPlayer />
            )}

            {/* Streamer info */}
            {status.isLive && (
              <div className="mt-4 flex items-center gap-3 px-4 py-3" style={{ background: `${G}04`, border: `1px solid ${G}12`, clipPath: CLIP(7) }}>
                {profile.avatar
                  ? <img src={profile.avatar} alt="" style={{ width: '36px', height: '36px', objectFit: 'cover', clipPath: CLIP(5) }} />
                  : <div style={{ width: '36px', height: '36px', background: `${G}0a`, clipPath: CLIP(5), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎧</div>
                }
                <div className="flex-1">
                  <p className="font-orbitron font-bold text-xs" style={{ color: '#e8e8e8' }}>{status.streamerName}</p>
                  <p className="font-space text-xs" style={{ color: `${G}66` }}>{status.genre}</p>
                </div>
                <span className="font-orbitron font-bold text-sm" style={{ color: G }}>{status.viewers} <span className="text-[9px] font-normal" style={{ color: '#e8e8e844' }}>viewers</span></span>
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="p-6 flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-px w-6" style={{ background: `linear-gradient(90deg, transparent, ${G})` }} />
                <span className="font-orbitron text-[10px] tracking-[0.35em] uppercase" style={{ color: `${G}77` }}>{t('guestDash.scheduleLabel')}</span>
              </div>
              <div className="flex gap-1">
                {(['upcoming', 'all'] as const).map(f => (
                  <button key={f} onClick={() => setSchedFilter(f)}
                    className="font-orbitron text-[8px] tracking-[0.1em] uppercase px-2 py-1 transition-all"
                    style={{ background: schedFilter === f ? `${G}15` : 'transparent', border: `1px solid ${schedFilter === f ? G : `${G}15`}`, color: schedFilter === f ? G : '#e8e8e833', cursor: 'pointer', clipPath: CLIP(3) }}>
                    {f === 'upcoming' ? 'À VENIR' : 'TOUS'}
                  </button>
                ))}
              </div>
            </div>

            {filteredSchedule().length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10" style={{ border: `1px dashed ${G}10` }}>
                <span style={{ fontSize: '2rem', opacity: 0.12 }}>📅</span>
                <p className="font-orbitron text-[9px] tracking-[0.3em] uppercase" style={{ color: '#e8e8e818' }}>AUCUN SHOW PROGRAMMÉ</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {filteredSchedule().slice(0, 8).map(ev => {
                  const live = isLiveNow(ev);
                  const c = ev.color === 'green' ? G : R;
                  return (
                    <div key={ev.id} className="flex items-center gap-4 px-4 py-3 transition-all duration-200"
                      style={{ background: live ? `${c}06` : 'rgba(255,255,255,0.02)', border: `1px solid ${live ? c : `${c}14`}` }}
                      onMouseEnter={e => { if (!live) (e.currentTarget as HTMLDivElement).style.borderColor = `${c}28`; }}
                      onMouseLeave={e => { if (!live) (e.currentTarget as HTMLDivElement).style.borderColor = `${c}14`; }}>
                      <div className="w-14 shrink-0 text-center">
                        {live ? (
                          <div className="flex items-center gap-1 justify-center">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: c, animation: 'live-dot 1.5s ease-in-out infinite', boxShadow: `0 0 4px ${c}` }} />
                            <span className="font-orbitron text-[9px] font-bold" style={{ color: c }}>NOW</span>
                          </div>
                        ) : (
                          <div>
                            <p className="font-orbitron text-xs" style={{ color: `${c}77` }}>{ev.startTime}</p>
                            <p className="font-mono text-[8px]" style={{ color: '#e8e8e822' }}>{new Date(ev.date + 'T00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                          </div>
                        )}
                      </div>
                      <div className="w-px self-stretch" style={{ background: `${c}12` }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-orbitron font-bold text-sm truncate" style={{ color: '#e8e8e8' }}>{ev.title}</p>
                        <p className="font-space text-xs mt-0.5 truncate" style={{ color: '#e8e8e844' }}>{ev.djName} — {ev.genre}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Chat */}
        <div className="flex flex-col" style={{ minHeight: '400px', maxHeight: 'calc(100vh - 62px)', position: 'sticky', top: '62px' }}>
          <ChatPanel />
        </div>
      </div>

      {/* ── LOCKED FEATURES CTA ── */}
      <div className="relative z-10 px-6 py-8" style={{ borderTop: `1px solid ${G}08`, background: 'rgba(0,0,0,0.4)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${G}33, transparent)` }} />
            <span className="font-orbitron font-bold text-[10px] tracking-[0.4em] uppercase" style={{ color: '#e8e8e844' }}>{t('guestDash.unlockTitle')}</span>
            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${G}33)` }} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {LOCKED_FEATURES.map(f => (
              <div key={f.label} className="flex flex-col gap-2 px-4 py-4 transition-all duration-300"
                style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${G}09`, opacity: 0.65, clipPath: CLIP(8) }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0.9'; (e.currentTarget as HTMLDivElement).style.borderColor = `${G}28`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0.65'; (e.currentTarget as HTMLDivElement).style.borderColor = `${G}09`; }}>
                <span style={{ fontSize: '1.5rem' }}>{f.icon}</span>
                <p className="font-orbitron font-bold text-xs" style={{ color: '#e8e8e8', letterSpacing: '0.05em' }}>{f.label}</p>
                <p className="font-space text-xs" style={{ color: '#e8e8e833' }}>{f.desc}</p>
                <div className="mt-auto font-orbitron text-[9px] tracking-[0.1em]" style={{ color: `${R}55` }}>{t('guestDash.accountRequired')}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <a href="/auth" className="font-orbitron font-black text-sm tracking-[0.3em] uppercase px-12 py-4 transition-all duration-300"
              style={{ background: G, color: '#050505', boxShadow: `0 0 30px ${G}44`, clipPath: CLIP(10) }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 0 50px ${G}`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 0 30px ${G}44`; }}>
              {t('guestDash.joinBtn')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
