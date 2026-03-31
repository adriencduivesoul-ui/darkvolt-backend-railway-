import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import Footer from '@/components/Footer';
import AvatarUpload from '@/components/AvatarUpload';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { StreamlabsControl } from '../components/StreamlabsControl';
import { useAuth } from '../contexts/AuthContext';
import { useStreamApi, type StreamRecord } from '../hooks/useStreamApi';
import { useChatSocket } from '../hooks/useChatSocket';
import { useSchedule } from '../hooks/useSchedule';
import { useStreamerProfile } from '../hooks/useStreamerProfile';
import { useWebRTCBroadcaster } from '../hooks/useWebRTCBroadcaster';

const G = '#39FF14';
const R = '#FF1A1A';
const CLIP = (s = 10) => `polygon(0 0, calc(100% - ${s}px) 0, 100% ${s}px, 100% 100%, ${s}px 100%, 0 calc(100% - ${s}px))`;
const GENRES = ['Industrial Techno', 'Dark Ambient', 'EBM', 'Noise', 'Horror Electro', 'Darkwave', 'Power Electronics', 'Black Metal Electro', 'Harsh Noise', 'Post-Industrial'];

type Tab = 'accueil' | 'studio' | 'chat' | 'stats' | 'archive' | 'schedule' | 'profile';

/* ── Bento Card ── */
function BentoCard({ title, dot = G, children, style = {} }: { title: string; dot?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.45)', border: `1px solid ${G}18`, borderRadius: '10px', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', ...style }}>
      <div style={{ padding: '10px 14px 8px', borderBottom: `1px solid ${G}10`, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dot, boxShadow: `0 0 6px ${dot}` }} />
        <span className="font-orbitron" style={{ fontSize: '9px', letterSpacing: '0.3em', color: G, textTransform: 'uppercase' }}>{title}</span>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

/* ── Input ── */
const inputCls = "w-full font-space text-sm bg-transparent outline-none transition-all";
const inputStyle: React.CSSProperties = { padding: '8px 12px', border: `1px solid ${G}20`, borderRadius: '6px', color: '#e8e8e8', background: 'rgba(57,255,20,0.03)', fontSize: '12px' };

export default function StreamerDashboard() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { status, history, goLive, endStream, updateStream, getLiveDuration, formatDuration } = useStreamApi(user?.id);
  const { messages, bannedUsers, connected: chatConnected, sendMessage, clearChat, unbanUser } = useChatSocket();
  const { events: scheduleEvents, addEvent, deleteEvent } = useSchedule();
  const { profile, saving: profileSaving, saved: profileSaved, saveProfile } = useStreamerProfile();
  const { broadcasting, videoEnabled, audioEnabled, error: rtcError, startBroadcast, stopBroadcast, toggleVideo, toggleAudio } = useWebRTCBroadcaster();
  const [tab, setTab] = useState<Tab>('accueil');
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState('');
  const [desc, setDesc]   = useState('');
  const [genre, setGenre] = useState(GENRES[0]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [extraAudioDevice, setExtraAudioDevice] = useState('');

  const refreshAudioDevices = useCallback(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devs => setAudioDevices(devs.filter(d => d.kind === 'audioinput')))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshAudioDevices();
    navigator.mediaDevices.addEventListener('devicechange', refreshAudioDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', refreshAudioDevices);
  }, [refreshAudioDevices]);

  useEffect(() => { if (broadcasting) refreshAudioDevices(); }, [broadcasting, refreshAudioDevices]);

  // ── Camera preview ──
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);
  useEffect(() => {
    if (tab !== 'studio') {
      previewStreamRef.current?.getTracks().forEach(t => t.stop());
      previewStreamRef.current = null;
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
        previewStreamRef.current = stream;
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
          previewVideoRef.current.play().catch(() => {});
        }
      }).catch(() => {});
    return () => {
      previewStreamRef.current?.getTracks().forEach(t => t.stop());
      previewStreamRef.current = null;
    };
  }, [tab]);

  // ── VU Meters L/R ──
  const vuLBarRef = useRef<HTMLDivElement>(null);
  const vuRBarRef = useRef<HTMLDivElement>(null);
  const vuCtxRef = useRef<AudioContext | null>(null);
  const vuStreamRef = useRef<MediaStream | null>(null);
  const vuAnimRef = useRef<number>(0);
  useEffect(() => {
    if (tab !== 'studio') {
      cancelAnimationFrame(vuAnimRef.current);
      vuCtxRef.current?.close().catch(() => {});
      vuCtxRef.current = null;
      vuStreamRef.current?.getTracks().forEach(t => t.stop());
      vuStreamRef.current = null;
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const constraints: MediaStreamConstraints = extraAudioDevice
          ? { audio: { deviceId: { exact: extraAudioDevice } }, video: false }
          : { audio: true, video: false };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        vuStreamRef.current = stream;
        const ctx = new AudioContext();
        vuCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const splitter = ctx.createChannelSplitter(2);
        const aL = ctx.createAnalyser(); aL.fftSize = 512;
        const aR = ctx.createAnalyser(); aR.fftSize = 512;
        source.connect(splitter);
        splitter.connect(aL, 0);
        splitter.connect(aR, 1);
        const bufL = new Float32Array(aL.fftSize);
        const bufR = new Float32Array(aR.fftSize);
        const pct = (rms: number) => Math.max(0, Math.min(100, (20 * Math.log10(Math.max(rms, 1e-7)) + 60) / 60 * 100));
        const tick = () => {
          aL.getFloatTimeDomainData(bufL);
          aR.getFloatTimeDomainData(bufR);
          const rmsL = Math.sqrt(bufL.reduce((s, v) => s + v * v, 0) / bufL.length);
          const rmsR = Math.sqrt(bufR.reduce((s, v) => s + v * v, 0) / bufR.length);
          if (vuLBarRef.current) vuLBarRef.current.style.height = pct(rmsL) + '%';
          if (vuRBarRef.current) vuRBarRef.current.style.height = pct(rmsR) + '%';
          vuAnimRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {}
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(vuAnimRef.current);
      vuCtxRef.current?.close().catch(() => {});
      vuCtxRef.current = null;
      vuStreamRef.current?.getTracks().forEach(t => t.stop());
      vuStreamRef.current = null;
    };
  }, [tab, extraAudioDevice]);

  const handleStartBroadcast = useCallback(() => {
    if (!title.trim()) { alert(t('streamerDash.noTitle')); return; }
    goLive({ title: title.trim(), description: desc.trim(), genre, streamerName: user?.username || 'Anonymous' });
    startBroadcast({ video: true, audio: true, microphone: true, extraAudioDeviceId: extraAudioDevice });
  }, [title, desc, genre, user?.username, goLive, startBroadcast, extraAudioDevice, t]);

  const handleStopBroadcast = useCallback(() => {
    endStream(); stopBroadcast();
  }, [endStream, stopBroadcast]);

  const sendChatMsg = useCallback(() => {
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim());
    setChatInput('');
  }, [chatInput, sendMessage]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [schedForm, setSchedForm] = useState({ title: '', date: '', startTime: '', duration: 60, genre: GENRES[0], recurring: null as 'weekly' | 'monthly' | null, djName: user?.username || '' });
  const submitSched = useCallback(() => {
    if (!schedForm.title || !schedForm.date || !schedForm.startTime) return;
    addEvent({ title: schedForm.title, date: schedForm.date, startTime: schedForm.startTime, duration: schedForm.duration, genre: schedForm.genre, recurring: schedForm.recurring, djName: schedForm.djName, color: 'green', description: '' });
    setSchedForm({ title: '', date: '', startTime: '', duration: 60, genre: GENRES[0], recurring: null, djName: user?.username || '' });
  }, [schedForm, addEvent, user?.username]);

  const [profForm, setProfForm] = useState({ bio: profile.bio, avatar: profile.avatar, instagram: profile.instagram, facebook: profile.facebook, discord: profile.discord, twitch: profile.twitch, soundcloud: profile.soundcloud, website: profile.website });
  const saveProf = useCallback(() => saveProfile(profForm), [profForm, saveProfile]);

  const liveDuration = status?.isLive ? Number(getLiveDuration()) : 0;
  const viewerHistory = status?.isLive ? Array.from({ length: Math.min(20, Math.floor(liveDuration / 30)) }, (_, i) => ({
    time: new Date(Date.now() - (20 - i) * 30000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    viewers: Math.max(1, (status.viewers || 0) + Math.floor(Math.random() * 10 - 5))
  })) : [];
  const totalHours = history.reduce((acc: number, s: StreamRecord) => acc + (s.duration / 3600), 0);
  const peakAbsolute = history.reduce((acc: number, s: StreamRecord) => Math.max(acc, s.peakViewers || 0), 0);

  const NAV: { key: Tab; icon: string; label: string }[] = [
    { key: 'accueil',  icon: '🏠', label: t('streamerDash.navAccueil') },
    { key: 'studio',   icon: '🎛️', label: t('streamerDash.navStudio') },
    { key: 'chat',     icon: '💬', label: t('streamerDash.navChat') },
    { key: 'stats',    icon: '📊', label: t('streamerDash.navStats') },
    { key: 'archive',  icon: '💾', label: t('streamerDash.navArchive') },
    { key: 'schedule', icon: '📅', label: t('streamerDash.navSchedule') },
    { key: 'profile',  icon: '👤', label: t('streamerDash.navProfile') },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#050505', color: '#e8e8e8' }}>
      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)' }} />

      {/* ════════════ HEADER ════════════ */}
      <header className="relative z-50 flex items-center justify-between px-6 h-14 shrink-0"
        style={{ background: 'rgba(5,5,5,0.97)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${G}12`, position: 'sticky', top: 0 }}>
        <a href="/"><img src="/img/DarkVolt.png" alt="DarkVolt" style={{ height: '34px', filter: `drop-shadow(0 0 8px ${G}66)` }} /></a>

        <nav className="hidden md:flex items-center">
          {NAV.map(n => (
            <button key={n.key} onClick={() => setTab(n.key)}
              className="flex items-center gap-2 px-5 h-14 font-orbitron text-[10px] tracking-[0.2em] uppercase transition-all duration-200"
              style={{ background: 'transparent', color: tab === n.key ? G : '#e8e8e833', borderBottom: tab === n.key ? `2px solid ${G}` : '2px solid transparent', cursor: 'pointer' }}>
              <span>{n.icon}</span><span>{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <div className="text-right hidden sm:block">
            <p className="font-orbitron text-xs font-bold" style={{ color: '#e8e8e8' }}>{user?.username}</p>
            <p style={{ color: `${G}55`, fontSize: '9px', letterSpacing: '0.2em', fontFamily: 'monospace' }}>{t('streamerDash.role')}</p>
          </div>
          <button onClick={() => { logout(); navigate('/'); }}
            className="font-orbitron text-xs tracking-[0.1em] uppercase px-4 py-2 transition-all"
            style={{ border: `1px solid ${R}22`, color: `${R}44`, background: 'none', cursor: 'pointer', clipPath: CLIP(5) }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = R; (e.currentTarget as HTMLButtonElement).style.borderColor = R; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = `${R}44`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${R}22`; }}>
            {t('streamerDash.logout')}
          </button>
        </div>
      </header>

      {/* Mobile tabs */}
      <div className="md:hidden flex border-b z-40 relative" style={{ borderColor: `${G}08`, background: '#050505' }}>
        {NAV.map(n => (
          <button key={n.key} onClick={() => setTab(n.key)} className="flex-1 py-3 font-orbitron text-xs uppercase transition-all"
            style={{ color: tab === n.key ? G : '#e8e8e833', borderBottom: tab === n.key ? `2px solid ${G}` : '2px solid transparent', background: 'transparent', cursor: 'pointer' }}>
            {n.icon}
          </button>
        ))}
      </div>

      {/* ════════════ MAIN ════════════ */}
      <div className="relative z-10 flex-1">

        {/* ════════════ ACCUEIL TAB ════════════ */}
        {tab === 'accueil' && (
          <div style={{ height: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            {status?.isLive && !broadcasting ? (
              /* ── Quelqu'un d'autre streame ── */
              <div style={{ maxWidth: '520px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `${R}18`, border: `2px solid ${R}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${R}22` }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: R, boxShadow: `0 0 12px ${R}` }} />
                </div>
                <div>
                  <p className="font-orbitron" style={{ fontSize: '13px', letterSpacing: '0.3em', color: R, marginBottom: '8px' }}>{t('streamerDash.streamBlockedTitle')}</p>
                  {status.title && <p className="font-space" style={{ fontSize: '14px', color: '#e8e8e8cc', marginBottom: '6px' }}>« {status.title} »</p>}
                  <p className="font-space" style={{ fontSize: '12px', color: '#e8e8e855', lineHeight: 1.6 }}>{t('streamerDash.streamBlockedMsg')}</p>
                </div>
                <div style={{ background: `${R}0a`, border: `1px solid ${R}22`, borderRadius: '10px', padding: '16px 24px', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="font-orbitron" style={{ fontSize: '9px', letterSpacing: '0.2em', color: `${R}88` }}>{t('streamerDash.statsListeners')}</span>
                    <span className="font-orbitron" style={{ fontSize: '14px', color: R, fontWeight: 700 }}>{status.viewers || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="font-orbitron" style={{ fontSize: '9px', letterSpacing: '0.2em', color: `${R}88` }}>{t('streamerDash.statsDuration')}</span>
                    <span className="font-orbitron" style={{ fontSize: '14px', color: R, fontWeight: 700 }}>{formatDuration(liveDuration)}</span>
                  </div>
                </div>
                <button onClick={() => navigate('/dashboard')} className="font-orbitron transition-all w-full"
                  style={{ padding: '14px', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '8px', background: `${G}18`, border: `1px solid ${G}44`, color: G, boxShadow: `0 0 15px ${G}22` }}
                  onMouseEnter={e => (e.currentTarget.style.background = `${G}28`)}
                  onMouseLeave={e => (e.currentTarget.style.background = `${G}18`)}>
                  👁 {t('streamerDash.watchStream')}
                </button>
              </div>
            ) : broadcasting ? (
              /* ── Toi tu streames ── */
              <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `${R}18`, border: `2px solid ${R}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${R}44`, animation: 'live-dot 1.5s ease-in-out infinite' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: R, boxShadow: `0 0 12px ${R}` }} />
                </div>
                <p className="font-orbitron" style={{ fontSize: '13px', letterSpacing: '0.3em', color: R }}>{t('streamerDash.youAreLive')}</p>
                <div style={{ background: `${R}0a`, border: `1px solid ${R}22`, borderRadius: '10px', padding: '16px 24px', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p className="font-orbitron" style={{ fontSize: '28px', color: R, fontWeight: 700 }}>{status?.viewers || 0}</p>
                    <p className="font-orbitron" style={{ fontSize: '8px', letterSpacing: '0.2em', color: `${R}66` }}>{t('streamerDash.statsListeners')}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p className="font-orbitron" style={{ fontSize: '28px', color: R, fontWeight: 700 }}>{formatDuration(liveDuration)}</p>
                    <p className="font-orbitron" style={{ fontSize: '8px', letterSpacing: '0.2em', color: `${R}66` }}>{t('streamerDash.statsDuration')}</p>
                  </div>
                </div>
                <button onClick={() => setTab('studio')} className="font-orbitron transition-all w-full"
                  style={{ padding: '14px', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '8px', background: `${G}18`, border: `1px solid ${G}44`, color: G }}>
                  🎛️ {t('streamerDash.navStudio')}
                </button>
              </div>
            ) : (
              /* ── Personne ne streame, prêt ── */
              <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: `${G}0d`, border: `2px solid ${G}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${G}18` }}>
                    <span style={{ fontSize: '36px' }}>🎛️</span>
                  </div>
                  <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '20px', height: '20px', borderRadius: '50%', background: G, boxShadow: `0 0 8px ${G}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '10px' }}>✓</span>
                  </div>
                </div>
                <div>
                  <p className="font-orbitron" style={{ fontSize: '18px', letterSpacing: '0.3em', color: G, marginBottom: '8px' }}>{t('streamerDash.welcomeTitle')}, {user?.username}</p>
                  <p className="font-space" style={{ fontSize: '13px', color: '#e8e8e855' }}>{t('streamerDash.welcomeSub')} — {t('streamerDash.welcomeReady')}</p>
                </div>
                <div style={{ height: '1px', width: '100%', background: `linear-gradient(90deg, transparent, ${G}33, transparent)` }} />
                <button onClick={() => setTab('studio')} className="font-orbitron transition-all w-full"
                  style={{ padding: '16px', fontSize: '12px', letterSpacing: '0.3em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '8px', background: `${G}18`, border: `1px solid ${G}55`, color: G, boxShadow: `0 0 20px ${G}22` }}
                  onMouseEnter={e => (e.currentTarget.style.background = `${G}2a`)}
                  onMouseLeave={e => (e.currentTarget.style.background = `${G}18`)}>
                  🎛️ {t('streamerDash.gotoStudio')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════════════ STUDIO TAB — NO SCROLL ════════════ */}
        {tab === 'studio' && (
          <div style={{ height: 'calc(100vh - 56px)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>

            {/* ── Bar header ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, height: '28px' }}>
              <div style={{ width: '20px', height: '1px', background: `linear-gradient(90deg, transparent, ${G})` }} />
              <span className="font-orbitron" style={{ fontSize: '10px', letterSpacing: '0.4em', color: G, textTransform: 'uppercase' }}>{t('streamerDash.studioTitle')}</span>
              <span className="font-orbitron" style={{ fontSize: '9px', color: '#e8e8e833' }}>{t('streamerDash.proControl')}</span>
              {broadcasting && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: R, animation: 'live-dot 1s ease-in-out infinite', boxShadow: `0 0 8px ${R}` }} />
                  <span className="font-orbitron" style={{ fontSize: '9px', letterSpacing: '0.2em', color: R }}>LIVE</span>
                </div>
              )}
            </div>

            {/* ── Main grid ── */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '420px 1fr 260px', gap: '10px', overflow: 'hidden', minHeight: 0 }}>

              {/* ── Left col ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden', minHeight: 0 }}>

                {/* Camera preview bento */}
                <BentoCard title="PREVIEW CAM" style={{ flex: '1 1 0', overflow: 'hidden', minHeight: 0 }}>
                  <div style={{ flex: 1, position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <video ref={previewVideoRef} autoPlay muted playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    {broadcasting && (
                      <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px', border: `1px solid ${R}44` }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: R, boxShadow: `0 0 6px ${R}` }} />
                        <span className="font-orbitron" style={{ fontSize: '8px', color: R, letterSpacing: '0.15em' }}>LIVE</span>
                      </div>
                    )}
                    {!previewStreamRef.current && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '28px', opacity: 0.2 }}>📷</span>
                        <span className="font-orbitron" style={{ fontSize: '8px', color: '#e8e8e822', letterSpacing: '0.2em' }}>NO CAMERA</span>
                      </div>
                    )}
                  </div>
                </BentoCard>

                {/* Audio sources + VU meters bento */}
                <BentoCard title={t('streamerDash.audioSection')} style={{ flexShrink: 0 }}>
                  <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      {/* Source select */}
                      <div style={{ flex: 1 }}>
                        <label className="font-orbitron" style={{ fontSize: '8px', letterSpacing: '0.2em', color: `${G}88`, display: 'block', marginBottom: '5px' }}>{t('streamerDash.djSource')}</label>
                        <select value={extraAudioDevice} onChange={e => setExtraAudioDevice(e.target.value)} style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}>
                          <option value="">{t('streamerDash.noSource')}</option>
                          {audioDevices.map(d => (
                            <option key={d.deviceId} value={d.deviceId} style={{ background: '#080808' }}>
                              {d.label || `Device (${d.deviceId.slice(0, 6)}…)`}
                            </option>
                          ))}
                        </select>
                      </div>
                      {/* VU meters L/R */}
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-end', paddingTop: '16px' }}>
                        {/* Scale */}
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '60px', paddingBottom: '2px' }}>
                          {['0', '-12', '-30', '-60'].map(v => (
                            <span key={v} className="font-orbitron" style={{ fontSize: '7px', color: '#e8e8e822', lineHeight: 1 }}>{v}</span>
                          ))}
                        </div>
                        {/* L bar */}
                        <div style={{ width: '18px', height: '60px', background: '#ffffff08', borderRadius: '3px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                          <div ref={vuLBarRef} style={{ width: '100%', height: '0%', background: `linear-gradient(to top, ${G} 0%, #aaff00 60%, #ffff00 80%, ${R} 100%)`, transition: 'height 0.04s linear', borderRadius: '3px' }} />
                        </div>
                        {/* R bar */}
                        <div style={{ width: '18px', height: '60px', background: '#ffffff08', borderRadius: '3px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                          <div ref={vuRBarRef} style={{ width: '100%', height: '0%', background: `linear-gradient(to top, ${G} 0%, #aaff00 60%, #ffff00 80%, ${R} 100%)`, transition: 'height 0.04s linear', borderRadius: '3px' }} />
                        </div>
                        {/* L R labels */}
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '60px', gap: '2px', paddingBottom: '1px' }}>
                          <span className="font-orbitron" style={{ fontSize: '7px', color: `${G}66` }}>L</span>
                          <span className="font-orbitron" style={{ fontSize: '7px', color: `${G}66`, marginTop: '2px' }}>R</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </BentoCard>
              </div>

              {/* ── Right col ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden', minHeight: 0 }}>

                {/* Config bento */}
                <BentoCard title={t('streamerDash.configLabel')} style={{ flexShrink: 0 }}>
                  <div style={{ padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label className="font-orbitron" style={{ fontSize: '8px', letterSpacing: '0.2em', color: `${G}88`, display: 'block', marginBottom: '5px' }}>{t('streamerDash.titleField')}</label>
                      <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('streamerDash.noTitle')}
                        className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className="font-orbitron" style={{ fontSize: '8px', letterSpacing: '0.2em', color: `${G}88`, display: 'block', marginBottom: '5px' }}>{t('streamerDash.genreField')}</label>
                      <input type="text" value={genre} onChange={e => setGenre(e.target.value)} placeholder="Ex: Industrial Techno, Dark Ambient…"
                        className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className="font-orbitron" style={{ fontSize: '8px', letterSpacing: '0.2em', color: `${G}88`, display: 'block', marginBottom: '5px' }}>{t('streamerDash.descField')}</label>
                      <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder={t('streamerDash.descPh')}
                        className={inputCls} style={inputStyle} />
                    </div>
                  </div>
                </BentoCard>

                {/* Controls bento */}
                <BentoCard title={t('streamerDash.streamControls')} style={{ flex: '1 1 0', overflow: 'hidden' }}>
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflow: 'auto' }}>

                    {/* Main button */}
                    <button onClick={() => broadcasting ? handleStopBroadcast() : handleStartBroadcast()}
                      className="font-orbitron w-full transition-all"
                      style={{
                        padding: '14px', fontSize: '13px', letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', borderRadius: '8px',
                        background: broadcasting ? `${R}22` : `${G}1a`,
                        border: `1px solid ${broadcasting ? R : G}`,
                        color: broadcasting ? R : G,
                        boxShadow: broadcasting ? `0 0 20px ${R}33` : `0 0 15px ${G}22`
                      }}>
                      {broadcasting ? `⏹ ${t('streamerDash.endStream')}` : `▶ ${t('streamerDash.goLive')}`}
                    </button>

                    {/* VID / AUDIO toggles when live */}
                    {broadcasting && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {[
                          { label: t('streamerDash.videoLabel'), active: videoEnabled, fn: toggleVideo },
                          { label: t('streamerDash.audioLabel'), active: audioEnabled, fn: toggleAudio },
                        ].map(({ label, active, fn }) => (
                          <button key={label} onClick={fn} className="font-orbitron transition-all"
                            style={{ padding: '8px', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '6px', border: `1px solid ${active ? G : '#e8e8e815'}`, color: active ? G : '#e8e8e830', background: active ? `${G}0d` : 'transparent' }}>
                            {label}: {active ? 'ON' : 'OFF'}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Status panel */}
                    <div style={{ background: '#08080888', border: `1px solid ${G}10`, borderRadius: '8px', padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span className="font-orbitron" style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#e8e8e855' }}>{t('streamerDash.statsStatus')}</span>
                        <span className="font-orbitron" style={{ fontSize: '9px', letterSpacing: '0.15em', padding: '3px 8px', borderRadius: '20px', background: broadcasting ? `${R}22` : '#ffffff08', border: `1px solid ${broadcasting ? R : '#ffffff10'}`, color: broadcasting ? R : '#e8e8e833' }}>
                          {broadcasting ? t('streamerDash.statusLive') : t('streamerDash.statusOffline')}
                        </span>
                      </div>
                      {broadcasting && status && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div style={{ background: `${G}06`, border: `1px solid ${G}11`, borderRadius: '6px', padding: '8px 10px' }}>
                            <p className="font-orbitron" style={{ fontSize: '7px', letterSpacing: '0.2em', color: `${G}66`, marginBottom: '3px' }}>{t('streamerDash.statsListeners')}</p>
                            <p className="font-orbitron" style={{ fontSize: '20px', color: G, fontWeight: 700 }}>{status.viewers || 0}</p>
                          </div>
                          <div style={{ background: `${G}06`, border: `1px solid ${G}11`, borderRadius: '6px', padding: '8px 10px' }}>
                            <p className="font-orbitron" style={{ fontSize: '7px', letterSpacing: '0.2em', color: `${G}66`, marginBottom: '3px' }}>{t('streamerDash.statsDuration')}</p>
                            <p className="font-orbitron" style={{ fontSize: '20px', color: G, fontWeight: 700 }}>{formatDuration(liveDuration)}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {rtcError && (
                      <p className="font-space" style={{ fontSize: '11px', color: R, padding: '6px 10px', background: `${R}11`, border: `1px solid ${R}22`, borderRadius: '6px' }}>⚠ {rtcError}</p>
                    )}
                  </div>
                </BentoCard>
              </div>

              {/* ── Chat col ── */}
              <BentoCard title={t('streamerDash.chatLiveLabel')} dot={chatConnected ? G : R} style={{ overflow: 'hidden', minHeight: 0 }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px', minHeight: 0 }}>
                  {messages.slice(-80).map((m, i) => (
                    <div key={i} style={{ padding: '4px 6px', borderRadius: '4px', background: m.role === 'streamer' ? `${G}0a` : 'transparent', borderLeft: m.role === 'streamer' ? `2px solid ${G}66` : '2px solid transparent' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '4px', marginBottom: '1px' }}>
                        <span className="font-orbitron" style={{ fontSize: '8px', letterSpacing: '0.1em', color: m.role === 'streamer' ? G : '#e8e8e8aa', flexShrink: 0 }}>{m.username}</span>
                        <span className="font-space" style={{ fontSize: '8px', color: '#e8e8e822', flexShrink: 0 }}>{new Date(m.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="font-space" style={{ fontSize: '11px', color: '#e8e8e8aa', lineHeight: 1.4, wordBreak: 'break-word' }}>{m.content}</p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div style={{ padding: '8px', borderTop: `1px solid ${G}10`, display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') sendChatMsg(); }}
                    placeholder={t('streamerDash.chatPlaceholder')}
                    className={inputCls}
                    style={{ ...inputStyle, flex: 1, fontSize: '11px', padding: '6px 10px' }}
                  />
                  <button onClick={sendChatMsg}
                    className="font-orbitron transition-all"
                    style={{ padding: '6px 10px', fontSize: '10px', cursor: 'pointer', borderRadius: '6px', background: `${G}18`, border: `1px solid ${G}44`, color: G, flexShrink: 0 }}>
                    →
                  </button>
                </div>
              </BentoCard>
            </div>
          </div>
        )}

        {/* ════════════ CHAT TAB ════════════ */}
        {tab === 'chat' && (
          <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '20px', height: '1px', background: `linear-gradient(90deg, transparent, ${G})` }} />
              <span className="font-orbitron" style={{ fontSize: '10px', letterSpacing: '0.4em', color: G, textTransform: 'uppercase' }}>{t('streamerDash.liveChatTitle')}</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <BentoCard title={t('streamerDash.liveChatSub')}>
                  <div style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                      <button onClick={clearChat} className="font-orbitron text-xs tracking-[0.1em] uppercase px-4 py-2 transition-all"
                        style={{ border: `1px solid ${R}22`, color: `${R}66`, background: 'none', cursor: 'pointer', borderRadius: '6px' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = R; (e.currentTarget as HTMLButtonElement).style.borderColor = R; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = `${R}66`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${R}22`; }}>
                        {t('streamerDash.clearChat')}
                      </button>
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {messages.slice(-50).map((m, i) => (
                        <div key={i} style={{ background: '#08080888', border: `1px solid ${G}0d`, borderRadius: '6px', padding: '8px 12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                            <span className="font-orbitron" style={{ fontSize: '10px', color: (m.role as string) === 'streamer' ? G : '#e8e8e8cc' }}>{m.username}</span>
                            <span className="font-space" style={{ fontSize: '10px', color: `${G}44` }}>{new Date(m.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="font-space" style={{ fontSize: '12px', color: '#e8e8e8aa' }}>{m.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </BentoCard>
              </div>
              <div>
                <BentoCard title={`${t('streamerDash.bannedTitle')} (${bannedUsers.length})`} dot={R}>
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {bannedUsers.length === 0
                      ? <p className="font-space" style={{ fontSize: '11px', color: '#e8e8e833', textAlign: 'center', padding: '16px' }}>{t('streamerDash.noBanned')}</p>
                      : bannedUsers.map(u => (
                          <div key={u.userId} style={{ background: `${R}08`, border: `1px solid ${R}18`, borderRadius: '6px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="font-space" style={{ fontSize: '12px', color: '#e8e8e8aa' }}>{u.username}</span>
                            <button onClick={() => unbanUser(u.userId)} className="font-orbitron" style={{ fontSize: '8px', letterSpacing: '0.15em', color: G, background: `${G}11`, border: `1px solid ${G}33`, padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                              {t('streamerDash.unban')}
                            </button>
                          </div>
                        ))
                    }
                  </div>
                </BentoCard>
              </div>
            </div>
          </div>
        )}

        {/* ════════════ STATS TAB ════════════ */}
        {tab === 'stats' && (
          <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '20px', height: '1px', background: `linear-gradient(90deg, transparent, ${G})` }} />
              <span className="font-orbitron" style={{ fontSize: '10px', letterSpacing: '0.4em', color: G, textTransform: 'uppercase' }}>{t('streamerDash.statsSection')}</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: t('streamerDash.liveDurationLabel'), value: formatDuration(liveDuration) },
                { label: t('streamerDash.currentViewersLabel'), value: String(status?.viewers || 0), sub: `PIC ${status?.peakViewers || 0}` },
                { label: t('streamerDash.totalPeakLabel'), value: String(peakAbsolute) },
                { label: t('streamerDash.msgCountLabel'), value: String(messages.length) },
              ].map(card => (
                <div key={card.label} style={{ background: 'rgba(0,0,0,0.45)', border: `1px solid ${G}18`, borderRadius: '10px', padding: '16px', backdropFilter: 'blur(10px)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="font-orbitron" style={{ fontSize: '8px', letterSpacing: '0.2em', color: `${G}66`, textTransform: 'uppercase' }}>{card.label}</span>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: G, boxShadow: `0 0 6px ${G}` }} />
                  </div>
                  <p className="font-orbitron" style={{ fontSize: '24px', fontWeight: 700, color: G }}>{card.value}</p>
                  {card.sub && <p className="font-space" style={{ fontSize: '10px', color: '#e8e8e833', marginTop: '2px' }}>{card.sub}</p>}
                </div>
              ))}
            </div>
            {viewerHistory.length > 0 && (
              <BentoCard title={t('streamerDash.viewerHistoryLabel')}>
                <div style={{ padding: '12px', height: '260px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={viewerHistory}>
                      <defs>
                        <linearGradient id="cgv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={G} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={G} stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#e8e8e822" fontSize={9} />
                      <YAxis stroke="#e8e8e822" fontSize={9} />
                      <Tooltip contentStyle={{ background: '#080808', border: `1px solid ${G}33`, borderRadius: '6px', fontSize: '11px' }} />
                      <Area type="monotone" dataKey="viewers" stroke={G} strokeWidth={2} fillOpacity={1} fill="url(#cgv)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </BentoCard>
            )}
          </div>
        )}

        {/* ════════════ ARCHIVE TAB ════════════ */}
        {tab === 'archive' && (
          <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '20px', height: '1px', background: `linear-gradient(90deg, transparent, ${G})` }} />
              <span className="font-orbitron" style={{ fontSize: '10px', letterSpacing: '0.4em', color: G, textTransform: 'uppercase' }}>{t('streamerDash.archiveTitle')} ({history.length})</span>
            </div>
            {history.length === 0 ? (
              <div style={{ background: 'rgba(0,0,0,0.45)', border: `1px solid ${G}18`, borderRadius: '10px', padding: '48px', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
                <div className="font-orbitron" style={{ fontSize: '40px', marginBottom: '12px', color: `${R}22` }}>◎</div>
                <p className="font-orbitron" style={{ fontSize: '11px', letterSpacing: '0.3em', color: '#e8e8e822', marginBottom: '8px' }}>{t('streamerDash.archiveEmpty')}</p>
                <p className="font-space" style={{ fontSize: '13px', color: '#e8e8e833' }}>{t('streamerDash.archiveHint')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {history.map(s => (
                  <div key={s.id} style={{ background: 'rgba(0,0,0,0.45)', border: `1px solid ${G}18`, borderRadius: '10px', padding: '16px 20px', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 className="font-orbitron" style={{ fontSize: '14px', color: '#e8e8e8', marginBottom: '6px' }}>{s.title}</h3>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                        <span className="font-space" style={{ color: `${G}88` }}>{s.genre}</span>
                        <span style={{ color: '#e8e8e822' }}>•</span>
                        <span className="font-space" style={{ color: `${G}88` }}>{formatDuration(s.duration)}</span>
                        <span style={{ color: '#e8e8e822' }}>•</span>
                        <span className="font-space" style={{ color: '#e8e8e844' }}>{new Date(s.startedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', marginLeft: '24px' }}>
                      <p className="font-orbitron" style={{ fontSize: '22px', fontWeight: 700, color: G }}>{s.peakViewers}</p>
                      <p className="font-orbitron" style={{ fontSize: '8px', letterSpacing: '0.2em', color: `${G}55` }}>{t('streamerDash.peakViewersLabel')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════ SCHEDULE TAB ════════════ */}
        {tab === 'schedule' && (
          <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '20px', height: '1px', background: `linear-gradient(90deg, transparent, ${G})` }} />
              <span className="font-orbitron" style={{ fontSize: '10px', letterSpacing: '0.4em', color: G, textTransform: 'uppercase' }}>{t('streamerDash.schedulingTitle')}</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BentoCard title={t('streamerDash.addEventLabel')}>
                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { lbl: t('streamerDash.titleField'), val: schedForm.title, key: 'title', ph: t('streamerDash.eventTitlePh'), type: 'text' },
                    { lbl: 'Date', val: schedForm.date, key: 'date', ph: '', type: 'date' },
                    { lbl: 'Heure', val: schedForm.startTime, key: 'startTime', ph: '', type: 'time' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="font-orbitron" style={{ fontSize: '8px', letterSpacing: '0.2em', color: `${G}88`, display: 'block', marginBottom: '4px' }}>{f.lbl}</label>
                      <input type={f.type} value={f.val} placeholder={f.ph}
                        onChange={e => setSchedForm({ ...schedForm, [f.key]: e.target.value })}
                        className={inputCls} style={inputStyle} />
                    </div>
                  ))}
                  <div>
                    <label className="font-orbitron" style={{ fontSize: '8px', letterSpacing: '0.2em', color: `${G}88`, display: 'block', marginBottom: '4px' }}>{t('streamerDash.genreField')}</label>
                    <select value={schedForm.genre} onChange={e => setSchedForm({ ...schedForm, genre: e.target.value })} style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}>
                      {GENRES.map(g => <option key={g} value={g} style={{ background: '#080808' }}>{g}</option>)}
                    </select>
                  </div>
                  <button onClick={submitSched} className="font-orbitron transition-all w-full"
                    style={{ padding: '10px', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '6px', background: `${G}18`, border: `1px solid ${G}44`, color: G }}>
                    + {t('streamerDash.addEventLabel')}
                  </button>
                </div>
              </BentoCard>
              <BentoCard title={t('streamerDash.upcomingLabel')}>
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '340px' }}>
                  {scheduleEvents.length === 0
                    ? <p className="font-space" style={{ fontSize: '12px', color: '#e8e8e833', textAlign: 'center', padding: '20px' }}>Aucun événement</p>
                    : scheduleEvents.map(ev => (
                        <div key={ev.id} style={{ background: '#08080888', border: `1px solid ${G}0d`, borderRadius: '6px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 className="font-orbitron" style={{ fontSize: '11px', color: G, marginBottom: '3px' }}>{ev.title}</h4>
                            <p className="font-space" style={{ fontSize: '11px', color: '#e8e8e866' }}>{ev.date} · {ev.startTime}</p>
                          </div>
                          <button onClick={() => deleteEvent(ev.id)} className="font-orbitron"
                            style={{ fontSize: '8px', letterSpacing: '0.1em', color: R, background: `${R}11`, border: `1px solid ${R}22`, padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                            {t('streamerDash.deleteLabel')}
                          </button>
                        </div>
                      ))
                  }
                </div>
              </BentoCard>
            </div>
          </div>
        )}

        {/* ════════════ PROFILE TAB ════════════ */}
        {tab === 'profile' && (
          <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '20px', height: '1px', background: `linear-gradient(90deg, transparent, ${G})` }} />
              <span className="font-orbitron" style={{ fontSize: '10px', letterSpacing: '0.4em', color: G, textTransform: 'uppercase' }}>{t('streamerDash.profileTitle')}</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BentoCard title={t('streamerDash.avatarLabel')}>
                <div style={{ padding: '16px' }}>
                  <AvatarUpload currentAvatar={profile.avatar} onAvatarChange={(url: string) => setProfForm({ ...profForm, avatar: url })} />
                </div>
              </BentoCard>
              <BentoCard title={t('streamerDash.profileInfoLabel')}>
                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { lbl: 'Bio', val: profForm.bio, key: 'bio', ph: t('streamerDash.bioPh') },
                    { lbl: t('streamerDash.instagramLabel'), val: profForm.instagram, key: 'instagram', ph: '@username' },
                    { lbl: t('streamerDash.twitchLabel'), val: profForm.twitch, key: 'twitch', ph: 'channel_name' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="font-orbitron" style={{ fontSize: '8px', letterSpacing: '0.2em', color: `${G}88`, display: 'block', marginBottom: '4px' }}>{f.lbl}</label>
                      <input type="text" value={f.val || ''} placeholder={f.ph}
                        onChange={e => setProfForm({ ...profForm, [f.key]: e.target.value })}
                        className={inputCls} style={inputStyle} />
                    </div>
                  ))}
                  <button onClick={saveProf} disabled={profileSaving} className="font-orbitron transition-all w-full"
                    style={{ padding: '10px', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', cursor: profileSaving ? 'default' : 'pointer', borderRadius: '6px', background: profileSaving ? '#ffffff08' : `${G}18`, border: `1px solid ${G}44`, color: G, opacity: profileSaving ? 0.5 : 1 }}>
                    {profileSaving ? t('streamerDash.savingBtn') : t('streamerDash.saveBtn')}
                  </button>
                  {profileSaved && (
                    <p className="font-space" style={{ fontSize: '12px', color: G, textAlign: 'center' }}>✓ {t('streamerDash.savedMsg')}</p>
                  )}
                </div>
              </BentoCard>
            </div>
          </div>
        )}

      </div>

      {tab !== 'studio' && <Footer />}
    </div>
  );
}
