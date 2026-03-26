import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ChatPanel from '@/components/dashboard/ChatPanel';
import AvatarUpload from '@/components/AvatarUpload';
import { useAuth } from '../contexts/AuthContext';
import { useStreamApi, type StreamRecord } from '../hooks/useStreamApi';
import { useChatSocket } from '../hooks/useChatSocket';
import { useSchedule, type ScheduleEvent } from '../hooks/useSchedule';
import { useStreamerProfile } from '../hooks/useStreamerProfile';
import { useWebRTCBroadcaster } from '../hooks/useWebRTCBroadcaster';
import { useAudioCapture } from '../hooks/useAudioCapture';

const G = '#39FF14';
const R = '#FF1A1A';
const CLIP = (s = 14) => `polygon(0 0, calc(100% - ${s}px) 0, 100% ${s}px, 100% 100%, ${s}px 100%, 0 calc(100% - ${s}px))`;
const GENRES = ['Industrial Techno', 'Dark Ambient', 'EBM', 'Noise', 'Horror Electro', 'Darkwave', 'Power Electronics', 'Black Metal Electro', 'Harsh Noise', 'Post-Industrial'];
const SOCIALS = ['instagram','facebook','discord','twitch','soundcloud','website'] as const;

type Tab = 'studio' | 'chat' | 'stats' | 'archive' | 'schedule' | 'profile';

/* ── Stat Card ── */
function StatCard({ label, value, color = G, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-4 relative overflow-hidden" style={{ background: '#080808', border: `1px solid ${color}22`, clipPath: CLIP(10) }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: `0 10px 10px 0`, borderColor: `transparent ${color}33 transparent transparent` }} />
      <p className="font-orbitron text-[9px] tracking-[0.3em] uppercase" style={{ color: `${color}66` }}>{label}</p>
      <p className="font-orbitron font-black text-2xl" style={{ color, textShadow: `0 0 20px ${color}44` }}>{value}</p>
      {sub && <p className="font-space text-xs" style={{ color: '#e8e8e833' }}>{sub}</p>}
    </div>
  );
}

/* ── Section Header ── */
function SectionHeader({ label, color = G }: { label: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="h-px w-8" style={{ background: `linear-gradient(90deg, transparent, ${color})` }} />
      <span className="font-orbitron text-[10px] tracking-[0.4em] uppercase" style={{ color: `${color}88` }}>{label}</span>
    </div>
  );
}

/* ── Archive Stream Item ── */
function ArchiveStreamItem({ stream, formatDuration }: { stream: StreamRecord; formatDuration: (seconds: number) => string }) {
  const [expanded, setExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="transition-all duration-200" style={{ background: '#070707', border: `1px solid ${G}08`, clipPath: CLIP(10) }}>
      {/* Header */}
      <div 
        className="flex items-center gap-4 px-5 py-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${G}22`; (e.currentTarget as HTMLDivElement).style.background = `${G}04`; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${G}08`; (e.currentTarget as HTMLDivElement).style.background = '#070707'; }}
      >
        <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: `${R}0a`, border: `1px solid ${R}22`, clipPath: CLIP(6) }}>
          <span style={{ fontSize: '14px', color: R }}>{expanded ? '▼' : '▶'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-orbitron font-bold text-sm" style={{ color: '#e8e8e8' }}>{stream.title}</p>
          <p className="font-space text-xs mt-0.5" style={{ color: '#e8e8e844' }}>
            {new Date(stream.startedAt).toLocaleDateString('fr-FR')} — {stream.genre}
          </p>
        </div>
        <div className="shrink-0 text-right hidden sm:block">
          <p className="font-orbitron text-xs font-bold" style={{ color: G }}>{formatDuration(stream.duration)}</p>
          <p className="font-mono text-[9px] mt-0.5" style={{ color: '#e8e8e833' }}>{stream.totalMessages} msgs</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-orbitron font-bold text-sm" style={{ color: G }}>{stream.peakViewers}</p>
          <p className="font-mono text-[9px]" style={{ color: '#e8e8e833' }}>peak 👁</p>
        </div>
      </div>

      {/* Expanded Player */}
      {expanded && (
        <div className="px-5 pb-4 border-t" style={{ borderColor: `${G}08` }}>
          <div className="mt-4 p-4" style={{ background: '#050505', border: `1px solid ${G}12`, clipPath: CLIP(8) }}>
            {/* Audio Player */}
            <audio 
              ref={audioRef}
              src={`/api/stream/archive/${stream.id}/audio`}
              preload="metadata"
            />
            
            {/* Controls */}
            <div className="flex items-center gap-4 mb-3">
              <button 
                onClick={togglePlay}
                className="w-12 h-12 flex items-center justify-center"
                style={{ background: G, color: '#050505', border: 'none', cursor: 'pointer', clipPath: CLIP(6) }}
              >
                <span style={{ fontSize: '18px' }}>{isPlaying ? '⏸' : '▶'}</span>
              </button>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs font-mono" style={{ color: '#e8e8e866' }}>
                  <span>{formatDuration(Math.floor(currentTime))}</span>
                  <div className="flex-1 h-1 bg-gray-800 rounded" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div 
                      className="h-full rounded transition-all duration-100"
                      style={{ 
                        width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                        background: G
                      }}
                    />
                  </div>
                  <span>{formatDuration(Math.floor(duration))}</span>
                </div>
              </div>
            </div>

            {/* Stream Info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-orbitron" style={{ color: `${G}66` }}>DÉBUT</p>
                <p className="font-mono" style={{ color: '#e8e8e844' }}>
                  {new Date(stream.startedAt).toLocaleString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="font-orbitron" style={{ color: `${G}66` }}>PIC AUDITEURS</p>
                <p className="font-mono" style={{ color: '#e8e8e844' }}>{stream.peakViewers}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StreamerDashboard() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { status, history, streamKey, rtmpServer, loading, goLive, endStream, updateStream, resetKey, getLiveDuration, formatDuration } = useStreamApi(user?.id);
  const { messages, bannedUsers, connected, clearChat, unbanUser } = useChatSocket();
  const { events: scheduleEvents, addEvent, updateEvent, deleteEvent, isLiveNow } = useSchedule();
  const { profile, saving: profileSaving, saved: profileSaved, saveProfile } = useStreamerProfile();
  const { localStream, broadcasting, videoEnabled, audioEnabled, error: rtcError, startBroadcast, stopBroadcast, toggleVideo, toggleAudio, toggleMicrophone, microphoneEnabled } = useWebRTCBroadcaster();
  const { audioSources, capturing, error: audioError } = useAudioCapture();
  const [tab, setTab] = useState<Tab>('studio');

  /* ── Stream config form ── */
  const [title, setTitle]   = useState('');
  const [desc, setDesc]     = useState('');
  const [genre, setGenre]   = useState(GENRES[0]);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDesc, setEditingDesc]   = useState('');
  const [editingGenre, setEditingGenre] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);

  /* ── Live timer ── */
  const [liveDuration, setLiveDuration] = useState('00:00:00');

  /* ── Viewers chart data ── */
  const [viewerHistory, setViewerHistory] = useState<{ t: string; v: number }[]>([]);

  /* ── Webcam video ref ── */
  const webcamRef = useRef<HTMLVideoElement>(null);

  /* ── Sélecteur source audio DJ (Stereo Mix, Virtual Cable...) ── */
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [extraAudioDevice, setExtraAudioDevice] = useState<string>('');

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

  /* ── Start broadcast avec option micro + source DJ ── */
  const handleStartBroadcast = useCallback(() => {
    startBroadcast({ 
      video: true, 
      audio: true, 
      microphone: microphoneEnabled,
      extraAudioDeviceId: extraAudioDevice || undefined
    });
  }, [startBroadcast, microphoneEnabled, extraAudioDevice]);

  /* ── Audio meter (Web Audio API) ── */
  const audioCtxRef   = useRef<AudioContext | null>(null);
  const analyserLRef  = useRef<AnalyserNode | null>(null);
  const analyserRRef  = useRef<AnalyserNode | null>(null);
  const meterAnimRef  = useRef<number>(0);
  const [audioLevelL, setAudioLevelL] = useState(-60);
  const [audioLevelR, setAudioLevelR] = useState(-60);

  /* ── Schedule form ── */
  const [schedForm, setSchedForm] = useState<Partial<ScheduleEvent> & { open: boolean; editId?: string }>({
    open: false, title: '', djName: user?.username || '', genre: GENRES[0],
    date: new Date().toISOString().slice(0, 10), startTime: '20:00',
    duration: 120, description: '', color: 'green', recurring: null,
  });

  /* ── Profile form ── */
  const [profForm, setProfForm] = useState({ ...profile });
  useEffect(() => { setProfForm({ ...profile }); }, [profile]);

  /* ── Live timer update ── */
  useEffect(() => {
    if (!status.isLive) return;
    const iv = setInterval(() => setLiveDuration(getLiveDuration()), 1000);
    return () => clearInterval(iv);
  }, [status.isLive, getLiveDuration]);

  /* ── Viewer history for chart ── */
  useEffect(() => {
    if (!status.isLive) return;
    const now = new Date();
    const label = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    setViewerHistory(prev => [...prev.slice(-20), { t: label, v: status.viewers }]);
  }, [status.viewers]);

  /* ── Connecter l'analyseur audio au vrai stream en temps réel ── */
  useEffect(() => {
    cancelAnimationFrame(meterAnimRef.current);
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }

    if (!localStream || !broadcasting) {
      setAudioLevelL(-60);
      setAudioLevelR(-60);
      return;
    }

    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) {
      setAudioLevelL(-60);
      setAudioLevelR(-60);
      return;
    }

    let cancelled = false;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // Forcer la reprise du contexte (politique autoplay navigateur)
    ctx.resume().then(() => {
      if (cancelled) return;

      const src = ctx.createMediaStreamSource(localStream);
      const anL = ctx.createAnalyser();
      const anR = ctx.createAnalyser();
      anL.fftSize = 512;
      anR.fftSize = 512;
      anL.smoothingTimeConstant = 0.6;
      anR.smoothingTimeConstant = 0.6;

      // Tenter la séparation stéréo, fallback mono si ça échoue
      try {
        const splitter = ctx.createChannelSplitter(2);
        src.connect(splitter);
        splitter.connect(anL, 0);
        splitter.connect(anR, 1);
      } catch {
        // Stream mono : connecter le même analyseur aux deux canaux
        src.connect(anL);
        src.connect(anR);
      }

      analyserLRef.current = anL;
      analyserRRef.current = anR;

      const dataL = new Float32Array(anL.fftSize);
      const dataR = new Float32Array(anR.fftSize);

      const tick = () => {
        if (cancelled) return;
        anL.getFloatTimeDomainData(dataL);
        anR.getFloatTimeDomainData(dataR);

        let sumL = 0, sumR = 0;
        for (let i = 0; i < dataL.length; i++) sumL += dataL[i] * dataL[i];
        for (let i = 0; i < dataR.length; i++) sumR += dataR[i] * dataR[i];
        const rmsL = Math.sqrt(sumL / dataL.length);
        const rmsR = Math.sqrt(sumR / dataR.length);

        const dbL = rmsL > 0.00001 ? Math.max(-60, 20 * Math.log10(rmsL)) : -60;
        const dbR = rmsR > 0.00001 ? Math.max(-60, 20 * Math.log10(rmsR)) : -60;

        setAudioLevelL(dbL);
        setAudioLevelR(dbR);
        meterAnimRef.current = requestAnimationFrame(tick);
      };
      tick();
    }).catch(err => {
      console.error('AudioContext resume failed:', err);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(meterAnimRef.current);
      ctx.close().catch(() => {});
    };
  }, [localStream, broadcasting]);

  /* ── Webcam → video element ── */
  useEffect(() => {
    if (webcamRef.current && localStream) {
      webcamRef.current.srcObject = localStream;
    }
  }, [localStream]);

  /* ── Schedule handlers ── */
  const resetSchedForm = () => setSchedForm({
    open: false, title: '', djName: user?.username || '', genre: GENRES[0],
    date: new Date().toISOString().slice(0, 10), startTime: '20:00',
    duration: 120, description: '', color: 'green', recurring: null,
  });

  const submitSched = async () => {
    const { open, editId, ...payload } = schedForm;
    if (!payload.title || !payload.date || !payload.startTime) return;
    if (editId) await updateEvent(editId, payload);
    else await addEvent(payload as Omit<ScheduleEvent, 'id'>);
    resetSchedForm();
  };

  /* ── Handlers ── */
  const handleGoLive = async () => {
    if (!title.trim()) return;
    setViewerHistory([]);
    await goLive({ title, description: desc, genre, streamerName: user?.username || '' });
    setEditingTitle(title);
    setEditingDesc(desc);
    setEditingGenre(genre);
  };

  const handleUpdate = async () => {
    await updateStream({ title: editingTitle, description: editingDesc, genre: editingGenre });
  };

  const copyKey = () => {
    navigator.clipboard.writeText(streamKey).then(() => {
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    });
  };

  /* ── Total computed stats from history ── */
  const totalHours = history.reduce((acc, s) => acc + s.duration, 0);
  const totalViewers = history.reduce((acc, s) => acc + s.peakViewers, 0);
  const peakAbsolute = history.reduce((acc, s) => Math.max(acc, s.peakViewers), 0);

  const NAV: { key: Tab; icon: string; label: string }[] = [
    { key: 'studio',   icon: '🎛️', label: t('streamerDash.navStudio') },
    { key: 'chat',     icon: '💬', label: t('streamerDash.navChat') },
    { key: 'stats',    icon: '📊', label: t('streamerDash.navStats') },
    { key: 'archive',  icon: '💾', label: t('streamerDash.navArchive') },
    { key: 'schedule', icon: '📅', label: t('streamerDash.navSchedule') },
    { key: 'profile',  icon: '👤', label: t('streamerDash.navProfile') },
  ];

  const inputCls: React.CSSProperties = {
    background: '#060606', border: '1px solid rgba(57,255,20,0.18)', color: '#e8e8e8',
    padding: '10px 14px', width: '100%', fontFamily: 'Space Grotesk, sans-serif',
    fontSize: '13px', outline: 'none', clipPath: CLIP(6),
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#050505', color: '#e8e8e8' }}>
      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(57,255,20,0.008) 3px, rgba(57,255,20,0.008) 4px)',
      }} />
      {/* Vertical accent lines */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[8, 25, 75, 92].map(p => (
          <div key={p} className="absolute top-0 bottom-0" style={{ left: `${p}%`, width: '1px', background: p < 50 ? `linear-gradient(180deg, transparent, ${G}08, transparent)` : `linear-gradient(180deg, transparent, ${R}08, transparent)` }} />
        ))}
      </div>

      {/* ── LIVE STATUS BAR ── */}
      {status.isLive && (
        <div className="relative z-50 flex items-center justify-between px-6 py-2 shrink-0"
          style={{ background: `rgba(255,26,26,0.08)`, borderBottom: `1px solid ${R}44` }}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ background: R, animation: 'live-dot 1s ease-in-out infinite', boxShadow: `0 0 8px ${R}` }} />
            <span className="font-orbitron font-bold text-xs tracking-[0.2em] uppercase" style={{ color: R }}>
              ● LIVE — {status.title}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <span className="font-mono-space text-xs" style={{ color: `${R}88` }}>⏱ {liveDuration}</span>
            <span className="font-mono-space text-xs" style={{ color: `${G}88` }}>👁 {status.viewers} auditeurs</span>
            <button onClick={endStream} className="font-orbitron font-bold text-xs tracking-[0.15em] uppercase px-4 py-1.5 transition-all"
              style={{ background: R, color: '#fff', border: 'none', cursor: 'pointer', clipPath: CLIP(6) }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.8'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}>
              ■ {t('streamerDash.endStream')}
            </button>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="relative z-50 flex items-center justify-between px-6 h-14 shrink-0"
        style={{ background: 'rgba(5,5,5,0.98)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${G}12`, position: 'sticky', top: status.isLive ? '41px' : 0 }}>
        <a href="/" className="flex items-center gap-3">
          <img src="/img/DarkVolt.png" alt="DarkVolt" style={{ height: '32px', filter: `drop-shadow(0 0 10px ${G}55)` }} />
          <div className="hidden sm:flex items-center gap-2">
            <div style={{ width: '1px', height: '20px', background: `${G}22` }} />
            <span className="font-orbitron text-[9px] tracking-[0.35em] uppercase" style={{ color: `${G}55` }}>STUDIO</span>
          </div>
        </a>

        <nav className="hidden md:flex items-center">
          {NAV.map(n => (
            <button key={n.key} onClick={() => setTab(n.key)}
              className="flex items-center gap-2 px-5 h-14 font-orbitron text-[10px] tracking-[0.18em] uppercase transition-all duration-200"
              style={{ background: 'transparent', color: tab === n.key ? G : '#e8e8e822', borderBottom: tab === n.key ? `2px solid ${G}` : '2px solid transparent', cursor: 'pointer' }}>
              <span style={{ opacity: tab === n.key ? 1 : 0.5 }}>{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {/* Socket status */}
          <div className="hidden sm:flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: connected ? G : R, boxShadow: `0 0 6px ${connected ? G : R}` }} />
            <span className="font-orbitron text-[8px] tracking-[0.2em] uppercase" style={{ color: connected ? `${G}55` : `${R}55` }}>
              {connected ? 'CONNECTÉ' : 'DÉCONNECTÉ'}
            </span>
          </div>
          <div className="text-right hidden sm:block">
            <p className="font-orbitron text-xs font-bold" style={{ color: '#e8e8e8' }}>{user?.username}</p>
            <p className="font-mono-space" style={{ color: `${R}66`, fontSize: '9px', letterSpacing: '0.2em' }}>STREAMER</p>
          </div>
          <button onClick={() => { logout(); navigate('/'); }}
            className="font-orbitron text-[10px] tracking-[0.1em] uppercase px-4 py-2 transition-all"
            style={{ border: `1px solid ${R}22`, color: `${R}44`, background: 'none', cursor: 'pointer', clipPath: CLIP(6) }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = R; (e.currentTarget as HTMLButtonElement).style.borderColor = R; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = `${R}44`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${R}22`; }}>
            {t('streamerDash.logout')}
          </button>
        </div>
      </header>

      {/* Mobile nav */}
      <div className="md:hidden flex border-b z-40 relative" style={{ borderColor: `${G}12`, background: '#050505' }}>
        {NAV.map(n => (
          <button key={n.key} onClick={() => setTab(n.key)} className="flex-1 py-3 font-orbitron text-xs uppercase transition-all"
            style={{ color: tab === n.key ? G : '#e8e8e822', borderBottom: tab === n.key ? `2px solid ${G}` : '2px solid transparent', background: 'transparent', cursor: 'pointer' }}>
            {n.icon}
          </button>
        ))}
      </div>

      {/* ── MAIN ── */}
      <div className="relative z-10 flex-1">

        {/* ════════════ STUDIO TAB ════════════ */}
        {tab === 'studio' && (
          <div style={{
            height: 'calc(100vh - 56px)',
            display: 'grid',
            gridTemplateColumns: '244px 1fr 300px',
            gridTemplateRows: '1fr 82px',
            overflow: 'hidden',
            background: '#050505'
          }}>

            {/* ══ COL 1 / ROW 1 : CAMÉRA + CONTRÔLES ══ */}
            <div style={{
              gridColumn: '1', gridRow: '1',
              borderRight: `1px solid ${G}09`,
              display: 'flex', flexDirection: 'column',
              padding: '14px', gap: '8px', overflow: 'hidden'
            }}>
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="font-orbitron text-[8px] tracking-[0.35em] uppercase" style={{ color: `${G}55` }}>CAMÉRA</span>
                <button onClick={() => broadcasting ? stopBroadcast() : handleStartBroadcast()}
                  className="font-orbitron text-[7px] tracking-[0.15em] uppercase px-3 py-1 transition-all duration-200"
                  style={{ background: broadcasting ? `${R}20` : `${G}16`, border: `1px solid ${broadcasting ? R : G}`, color: broadcasting ? R : G, cursor: 'pointer', clipPath: CLIP(4), boxShadow: broadcasting ? `0 0 12px ${R}33` : `0 0 8px ${G}22` }}>
                  {broadcasting ? '⏹ STOP' : '▶ START'}
                </button>
              </div>

              {/* Webcam preview */}
              {rtcError && <p className="font-space text-[8px]" style={{ color: R }}>⚠ {rtcError}</p>}
              <div style={{ position: 'relative', background: '#000', border: `1px solid ${G}12`, clipPath: CLIP(6), aspectRatio: '16/9', flexShrink: 0 }}>
                {broadcasting
                  ? <video ref={webcamRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                      <span style={{ fontSize: '1.4rem', opacity: 0.1 }}>📹</span>
                      <p className="font-orbitron text-[6px] tracking-[0.3em] uppercase" style={{ color: '#e8e8e815' }}>INACTIF</p>
                    </div>
                }
                {broadcasting && (
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5" style={{ background: `${R}cc`, clipPath: CLIP(2) }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#fff', animation: 'live-dot 1s ease-in-out infinite' }} />
                    <span className="font-orbitron text-[6px] tracking-[0.2em]" style={{ color: '#fff' }}>LIVE</span>
                  </div>
                )}
              </div>

              {/* Toggles vidéo / son */}
              {broadcasting && (
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: '📹 VID', active: videoEnabled, fn: toggleVideo },
                    { label: '🔊 SON', active: audioEnabled, fn: toggleAudio },
                  ].map(({ label, active, fn }) => (
                    <button key={label} onClick={fn}
                      className="font-orbitron text-[7px] tracking-[0.1em] uppercase py-1 transition-all"
                      style={{ border: `1px solid ${active ? G : '#e8e8e815'}`, color: active ? G : '#e8e8e830', background: active ? `${G}0d` : 'transparent', cursor: 'pointer', clipPath: CLIP(3) }}>
                      {label} {active ? 'ON' : 'OFF'}
                    </button>
                  ))}
                </div>
              )}

              {/* Séparateur */}
              <div style={{ height: '1px', background: `linear-gradient(90deg, ${G}15, transparent)`, flexShrink: 0 }} />

              {/* Microphone */}
              <button onClick={toggleMicrophone}
                className="font-orbitron text-[8px] tracking-[0.15em] uppercase py-2 transition-all w-full"
                style={{ border: `1px solid ${microphoneEnabled ? G : '#e8e8e815'}`, color: microphoneEnabled ? G : '#e8e8e830', background: microphoneEnabled ? `${G}0d` : 'rgba(255,255,255,0.02)', cursor: 'pointer', clipPath: CLIP(4), boxShadow: microphoneEnabled ? `0 0 8px ${G}22` : 'none' }}>
                🎙 MIC {microphoneEnabled ? 'ON' : 'OFF'}
              </button>

              {/* Sélecteur source DJ */}
              <div style={{ padding: '7px 10px', background: extraAudioDevice ? `${G}06` : `${R}04`, border: `1px solid ${extraAudioDevice ? `${G}18` : `${R}12`}`, clipPath: CLIP(4), flexShrink: 0 }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-orbitron text-[7px] tracking-[0.2em] uppercase" style={{ color: '#e8e8e830' }}>🎛 SOURCE DJ</span>
                  {extraAudioDevice
                    ? <span className="font-orbitron text-[6px]" style={{ color: G }}>● MIXÉE</span>
                    : <span className="font-orbitron text-[6px]" style={{ color: `${R}77` }}>○ AUCUNE</span>
                  }
                </div>
                <select
                  value={extraAudioDevice}
                  onChange={e => setExtraAudioDevice(e.target.value)}
                  style={{ width: '100%', background: '#080808', border: `1px solid ${G}15`, color: extraAudioDevice ? G : '#e8e8e844', fontSize: '8px', padding: '3px 5px', outline: 'none', fontFamily: 'Space Grotesk, sans-serif', cursor: 'pointer' }}>
                  <option value="" style={{ background: '#080808', color: '#e8e8e844' }}>— Aucune source DJ —</option>
                  {audioDevices.map(d => (
                    <option key={d.deviceId} value={d.deviceId} style={{ background: '#080808', color: '#e8e8e8' }}>
                      {d.label || `Périphérique (${d.deviceId.slice(0, 6)}…)`}
                    </option>
                  ))}
                </select>
                {audioDevices.length === 0 && (
                  <p className="font-space text-[6px] mt-1" style={{ color: '#e8e8e830' }}>Cliquez START pour voir les périphériques</p>
                )}
              </div>

              {/* Audio sources */}
              <div style={{ padding: '7px 10px', background: `${G}04`, border: `1px solid ${G}0c`, clipPath: CLIP(4), flexShrink: 0 }}>
                <div className="flex items-center justify-between">
                  <span className="font-orbitron text-[7px] tracking-[0.2em] uppercase" style={{ color: '#e8e8e830' }}>AUDIO IN</span>
                  <span className="font-mono text-[7px]" style={{ color: audioSources.length > 0 ? G : '#e8e8e830' }}>
                    {audioSources.length > 0 ? '● ACTIF' : '○ ATTENTE'}
                  </span>
                </div>
                {audioSources.slice(0, 1).map((src: string, i: number) => (
                  <p key={i} className="font-space text-[6px] mt-1 truncate" style={{ color: '#e8e8e840' }}>{src}</p>
                ))}
              </div>
            </div>

            {/* ══ COL 2 / ROW 1 : CONFIG STREAM / VUE LIVE ══ */}
            <div style={{
              gridColumn: '2', gridRow: '1',
              borderRight: `1px solid ${G}09`,
              display: 'flex', flexDirection: 'column',
              padding: '14px', gap: '10px', overflow: 'hidden'
            }}>
              {!status.isLive ? (
                <>
                  {/* Label */}
                  <div className="flex items-center justify-between" style={{ flexShrink: 0 }}>
                    <SectionHeader label={t('streamerDash.configLabel')} color={G} />
                    <span className="font-orbitron text-[7px] tracking-[0.2em] uppercase px-2 py-0.5" style={{ border: `1px solid ${G}18`, color: `${G}44`, clipPath: CLIP(3) }}>OFFLINE</span>
                  </div>

                  {/* Titre + Genre */}
                  <div className="grid grid-cols-2 gap-3" style={{ flexShrink: 0 }}>
                    <div>
                      <label className="font-orbitron text-[7px] tracking-[0.25em] uppercase block mb-1.5" style={{ color: `${G}55` }}>{t('streamerDash.titleField')}</label>
                      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="DARK FREQUENCY #48"
                        style={{ ...inputCls, borderColor: title ? `${G}44` : `${G}18` }}
                        onFocus={e => (e.currentTarget.style.borderColor = `${G}66`)}
                        onBlur={e => (e.currentTarget.style.borderColor = title ? `${G}44` : `${G}18`)} />
                    </div>
                    <div>
                      <label className="font-orbitron text-[7px] tracking-[0.25em] uppercase block mb-1.5" style={{ color: `${G}55` }}>{t('streamerDash.genreField')}</label>
                      <input value={genre} onChange={e => setGenre(e.target.value)} placeholder="Techno, House…"
                        style={{ ...inputCls, borderColor: genre ? `${G}44` : `${G}18` }}
                        onFocus={e => (e.currentTarget.style.borderColor = `${G}66`)}
                        onBlur={e => (e.currentTarget.style.borderColor = genre ? `${G}44` : `${G}18`)} />
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{ flexShrink: 0 }}>
                    <label className="font-orbitron text-[7px] tracking-[0.25em] uppercase block mb-1.5" style={{ color: `${G}55` }}>{t('streamerDash.descField')}</label>
                    <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder={t('streamerDash.descPh')}
                      style={{ ...inputCls, resize: 'none' }}
                      onFocus={e => (e.currentTarget.style.borderColor = `${G}55`)}
                      onBlur={e => (e.currentTarget.style.borderColor = `${G}18`)} />
                  </div>

                  {/* GO LIVE */}
                  <button onClick={handleGoLive} disabled={!title.trim() || loading}
                    className="font-orbitron font-black text-sm tracking-[0.3em] uppercase py-4 transition-all duration-300"
                    style={{ background: title.trim() ? R : `${R}33`, color: '#fff', border: 'none', cursor: title.trim() ? 'pointer' : 'default', boxShadow: title.trim() ? `0 0 28px ${R}44` : 'none', clipPath: CLIP(10), flexShrink: 0 }}
                    onMouseEnter={e => { if (title.trim()) (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 50px ${R}77`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 28px ${R}44`; }}>
                    {loading ? '…' : `▶ ${t('streamerDash.goLive')}`}
                  </button>

                  {/* OBS Config compact */}
                  <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.013)', border: `1px solid ${G}0f`, clipPath: CLIP(6), flex: 1, minHeight: 0 }}>
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="font-orbitron text-[8px] tracking-[0.25em] uppercase" style={{ color: `${G}44` }}>CONFIG OBS</p>
                      <span className="font-orbitron text-[7px] tracking-[0.15em] uppercase px-1.5 py-0.5" style={{ background: `${G}10`, color: `${G}55`, clipPath: CLIP(3) }}>RTMP</span>
                    </div>
                    {[
                      { label: 'SERVER', value: rtmpServer },
                      { label: 'KEY', value: showKey ? streamKey : (streamKey ? '••••••••••••' : '…') },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${G}08` }}>
                        <span className="font-orbitron text-[7px] tracking-[0.2em]" style={{ color: '#e8e8e830' }}>{item.label}</span>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-[9px] truncate" style={{ color: `${G}88`, maxWidth: '200px' }}>{item.value}</code>
                          {item.label === 'KEY' && (
                            <button onClick={() => setShowKey(p => !p)} style={{ background: 'none', border: 'none', color: `${G}44`, cursor: 'pointer', fontSize: '10px', lineHeight: 1, padding: 0 }}>{showKey ? '🙈' : '👁'}</button>
                          )}
                          <button onClick={() => navigator.clipboard.writeText(item.value)}
                            style={{ background: 'none', border: 'none', color: `${G}33`, cursor: 'pointer', fontSize: '12px', lineHeight: 1, padding: 0 }}
                            onMouseEnter={e => (e.currentTarget.style.color = G)}
                            onMouseLeave={e => (e.currentTarget.style.color = `${G}33`)}>⎘</button>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-3">
                      <button onClick={copyKey}
                        className="flex-1 font-orbitron text-[7px] tracking-[0.15em] uppercase py-1.5 transition-all"
                        style={{ background: keyCopied ? `${G}18` : 'transparent', border: `1px solid ${G}1f`, color: keyCopied ? G : `${G}44`, cursor: 'pointer', clipPath: CLIP(4) }}>
                        {keyCopied ? '✓ COPIÉ' : '⎘ COPIER CLÉ'}
                      </button>
                      <button onClick={() => { if (confirm('Régénérer la clé ?')) resetKey(); }}
                        className="font-orbitron text-[7px] tracking-[0.15em] uppercase px-3 py-1.5 transition-all"
                        style={{ background: 'transparent', border: `1px solid ${R}22`, color: `${R}44`, cursor: 'pointer', clipPath: CLIP(4) }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = R; (e.currentTarget as HTMLButtonElement).style.borderColor = `${R}55`; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = `${R}44`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${R}22`; }}>
                        ↺ RESET
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* ── VUE LIVE ── */
                <>
                  <div className="flex items-center justify-between" style={{ flexShrink: 0 }}>
                    <SectionHeader label="● DIFFUSION EN COURS" color={R} />
                    <span className="font-orbitron text-[7px] tracking-[0.2em] uppercase px-2 py-0.5" style={{ border: `1px solid ${R}44`, color: R, clipPath: CLIP(3), animation: 'live-dot 1.5s ease-in-out infinite' }}>● LIVE</span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-2" style={{ flexShrink: 0 }}>
                    <StatCard label="DURÉE" value={liveDuration} color={R} />
                    <StatCard label="AUDITEURS" value={String(status.viewers)} color={G} />
                    <StatCard label="PEAK" value={String(status.peakViewers)} color={G} />
                    <StatCard label="GENRE" value={status.genre} color="#e8e8e866" />
                  </div>

                  {/* Modifier en direct */}
                  <div style={{ padding: '10px 14px', background: `${G}04`, border: `1px solid ${G}12`, clipPath: CLIP(6), flexShrink: 0 }}>
                    <p className="font-orbitron text-[7px] tracking-[0.25em] uppercase mb-2.5" style={{ color: `${G}55` }}>MODIFIER EN DIRECT</p>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input value={editingTitle} onChange={e => setEditingTitle(e.target.value)} placeholder="Titre"
                        style={inputCls} onFocus={e => (e.currentTarget.style.borderColor = `${G}55`)} onBlur={e => (e.currentTarget.style.borderColor = `${G}18`)} />
                      <input value={editingGenre} onChange={e => setEditingGenre(e.target.value)} placeholder="Genre"
                        style={inputCls} onFocus={e => (e.currentTarget.style.borderColor = `${G}55`)} onBlur={e => (e.currentTarget.style.borderColor = `${G}18`)} />
                    </div>
                    <button onClick={handleUpdate}
                      className="font-orbitron text-[8px] tracking-[0.2em] uppercase px-5 py-2 transition-all"
                      style={{ background: G, color: '#050505', border: 'none', cursor: 'pointer', clipPath: CLIP(5), fontWeight: 700, boxShadow: `0 0 14px ${G}44` }}>
                      ↑ METTRE À JOUR
                    </button>
                  </div>

                  {/* Audience chart */}
                  {viewerHistory.length > 1 && (
                    <div style={{ flex: 1, padding: '10px 14px', background: '#060606', border: `1px solid ${G}10`, clipPath: CLIP(6), minHeight: 0 }}>
                      <p className="font-orbitron text-[7px] tracking-[0.2em] uppercase mb-2" style={{ color: `${G}44` }}>AUDIENCE EN DIRECT</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={viewerHistory}>
                          <defs>
                            <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={G} stopOpacity={0.18} />
                              <stop offset="95%" stopColor={G} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="t" tick={{ fill: '#e8e8e820', fontSize: 8 }} axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Tooltip contentStyle={{ background: '#0a0a0a', border: `1px solid ${G}33`, borderRadius: 0, fontFamily: 'Orbitron, sans-serif', fontSize: '9px' }} />
                          <Area type="monotone" dataKey="v" stroke={G} strokeWidth={1.5} fill="url(#vg)" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ══ AUDIO STRIP — COL 1+2 / ROW 2 ══ */}
            <div style={{
              gridColumn: '1 / 3', gridRow: '2',
              borderTop: `1px solid ${G}09`,
              borderRight: `1px solid ${G}09`,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr auto',
              alignItems: 'center',
              gap: '20px',
              padding: '10px 18px',
              background: `linear-gradient(90deg, ${G}04 0%, transparent 60%)`
            }}>
              {/* L meter */}
              {[{ ch: 'L', level: audioLevelL }, { ch: 'R', level: audioLevelR }].map(({ ch, level }) => (
                <div key={ch} className="flex items-center gap-3">
                  <span className="font-orbitron text-[10px] font-bold tracking-[0.2em]" style={{ color: level > -3 ? R : level > -12 ? '#FF6B35' : `${G}77`, minWidth: '12px', textShadow: `0 0 8px ${level > -3 ? R : level > -12 ? '#FF6B35' : G}66` }}>{ch}</span>
                  <div style={{ flex: 1, height: '12px', background: 'rgba(255,255,255,0.025)', border: `1px solid ${G}0a`, position: 'relative', overflow: 'hidden', clipPath: CLIP(2) }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.max(0, Math.min(100, (level + 60) * 1.67))}%`,
                      background: level > -3 ? R : level > -12 ? '#FF6B35' : G,
                      transition: 'width 0.05s ease',
                      boxShadow: level > -30 && broadcasting ? `0 0 8px ${level > -3 ? R : level > -12 ? '#FF6B35' : G}66` : 'none'
                    }} />
                    <div style={{ position: 'absolute', top: 0, left: '70%', width: '20%', height: '100%', background: 'rgba(255,107,53,0.07)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: 0, left: '90%', width: '10%', height: '100%', background: 'rgba(255,26,26,0.07)', pointerEvents: 'none' }} />
                  </div>
                  <span className="font-mono text-[8px] tabular-nums" style={{ color: level > -3 ? R : level > -12 ? '#FF6B35' : `${G}55`, minWidth: '48px', textAlign: 'right' }}>
                    {level > -60 ? level.toFixed(1) + ' dB' : '−∞'}
                  </span>
                </div>
              ))}

              {/* Status + légende */}
              <div className="flex flex-col items-end gap-1.5">
                <span className="font-orbitron text-[9px] tracking-[0.2em] uppercase"
                  style={{ color: Math.max(audioLevelL, audioLevelR) > -3 ? R : Math.max(audioLevelL, audioLevelR) > -12 ? '#FF6B35' : broadcasting ? G : '#e8e8e830', textShadow: broadcasting ? `0 0 10px ${Math.max(audioLevelL, audioLevelR) > -3 ? R : Math.max(audioLevelL, audioLevelR) > -12 ? '#FF6B35' : G}55` : 'none' }}>
                  {Math.max(audioLevelL, audioLevelR) > -3 ? '⚠ CLIPPING' : Math.max(audioLevelL, audioLevelR) > -12 ? '⚡ ÉLEVÉ' : broadcasting ? '✓ OPTIMAL' : '— INACTIF'}
                </span>
                <div className="flex items-center gap-3">
                  {[{ c: G, l: 'OPTIMAL' }, { c: '#FF6B35', l: 'ÉLEVÉ' }, { c: R, l: 'CLIP' }].map(({ c, l }) => (
                    <div key={l} className="flex items-center gap-1">
                      <div style={{ width: '5px', height: '5px', background: c, opacity: 0.55 }} />
                      <span className="font-orbitron text-[5px] tracking-[0.1em]" style={{ color: '#e8e8e825' }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ══ COL 3 : CHAT (full height) ══ */}
            <div style={{ gridColumn: '3', gridRow: '1 / 3', display: 'flex', flexDirection: 'column' }}>
              <ChatPanel />
            </div>

          </div>
        )}

        {/* ════════════ CHAT MOD TAB ════════════ */}
        {tab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0" style={{ minHeight: 'calc(100vh - 56px)' }}>
            {/* Live chat */}
            <div style={{ height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${G}08` }}>
              <div className="p-4 shrink-0 flex items-center justify-between" style={{ borderBottom: `1px solid ${G}08` }}>
                <span className="font-orbitron text-[10px] tracking-[0.3em] uppercase" style={{ color: `${G}66` }}>CHAT LIVE</span>
                <button onClick={() => { if (confirm(t('streamerDash.clearChat') + ' ?')) clearChat(); }}
                  className="font-orbitron text-[9px] tracking-[0.1em] uppercase px-4 py-1.5 transition-all"
                  style={{ border: `1px solid ${R}33`, color: `${R}66`, background: 'none', cursor: 'pointer', clipPath: CLIP(6) }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = R; (e.currentTarget as HTMLButtonElement).style.borderColor = R; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = `${R}66`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${R}33`; }}>
                  {t('streamerDash.clearChat')}
                </button>
              </div>
              <div className="flex-1 overflow-hidden"><ChatPanel compact /></div>
            </div>

            {/* Moderation */}
            <div className="p-6 overflow-y-auto">
              <SectionHeader label="MODÉRATION" color={R} />

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'MESSAGES', value: messages.length, c: G },
                  { label: 'BANNIS', value: bannedUsers.length, c: R },
                  { label: 'UNIQUES', value: new Set(messages.map((m: {userId: string}) => m.userId)).size, c: G },
                ].map(s => (
                  <div key={s.label} className="px-3 py-3 text-center" style={{ background: '#080808', border: `1px solid ${s.c}18`, clipPath: CLIP(8) }}>
                    <p className="font-orbitron font-black text-xl" style={{ color: s.c }}>{s.value}</p>
                    <p className="font-orbitron text-[8px] tracking-[0.2em] mt-1" style={{ color: '#e8e8e833' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <p className="font-orbitron text-[9px] tracking-[0.25em] uppercase mb-3" style={{ color: '#e8e8e833' }}>DERNIERS MESSAGES</p>
                <div className="flex flex-col gap-1 max-h-52 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: `${G}22 transparent` }}>
                  {messages.slice(-10).reverse().map((m: {id: string; role: string; username: string; content: string}) => (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2" style={{ background: 'rgba(255,255,255,0.015)', border: `1px solid ${G}06` }}>
                      <div className="w-1 h-1 rounded-full shrink-0" style={{ background: m.role === 'streamer' ? R : G }} />
                      <span className="font-orbitron text-[9px] font-bold shrink-0" style={{ color: m.role === 'streamer' ? R : `${G}88` }}>{m.username}</span>
                      <span className="font-space text-xs truncate flex-1" style={{ color: '#e8e8e8aa' }}>{m.content}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-orbitron text-[9px] tracking-[0.25em] uppercase mb-3" style={{ color: '#e8e8e833' }}>
                  UTILISATEURS BANNIS ({bannedUsers.length})
                </p>
                {bannedUsers.length === 0
                  ? <p className="font-space text-xs" style={{ color: '#e8e8e822' }}>{t('streamerDash.noBanned')}</p>
                  : (
                    <div className="flex flex-col gap-1.5">
                      {bannedUsers.map((b: {userId: string; username: string; bannedAt: number}) => (
                        <div key={b.userId} className="flex items-center justify-between px-3 py-2" style={{ background: `${R}06`, border: `1px solid ${R}18`, clipPath: CLIP(6) }}>
                          <div>
                            <span className="font-orbitron text-xs font-bold" style={{ color: `${R}88` }}>{b.username}</span>
                            <span className="font-mono text-[9px] ml-3" style={{ color: '#e8e8e822' }}>{new Date(b.bannedAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <button onClick={() => unbanUser(b.userId)}
                            className="font-orbitron text-[9px] tracking-[0.1em] uppercase px-3 py-1.5 transition-all"
                            style={{ border: `1px solid ${G}33`, color: `${G}66`, background: 'none', cursor: 'pointer', clipPath: CLIP(5) }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = G; (e.currentTarget as HTMLButtonElement).style.borderColor = G; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = `${G}66`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${G}33`; }}>
                            DÉBANNIR
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════ STATS TAB ════════════ */}
        {tab === 'stats' && (
          <div className="p-6 max-w-5xl mx-auto">
            <SectionHeader label="STATISTIQUES" color={G} />

            {/* Session courante */}
            <div className="mb-6 p-5" style={{ background: `${R}04`, border: `1px solid ${R}18`, clipPath: CLIP(10) }}>
              <p className="font-orbitron text-[9px] tracking-[0.3em] uppercase mb-4" style={{ color: `${R}66` }}>SESSION COURANTE</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="STATUT" value={status.isLive ? 'LIVE' : 'OFFLINE'} color={status.isLive ? R : '#e8e8e822'} />
                <StatCard label="AUDITEURS" value={status.isLive ? String(status.viewers) : '—'} color={G} />
                <StatCard label="PEAK" value={status.isLive ? String(status.peakViewers) : '—'} color={G} />
                <StatCard label="DURÉE" value={status.isLive ? liveDuration : '00:00:00'} color={R} />
              </div>
            </div>

            {/* Viewer chart */}
            {viewerHistory.length > 1 && (
              <div className="mb-6 p-5" style={{ background: '#060606', border: `1px solid ${G}12`, clipPath: CLIP(10) }}>
                <p className="font-orbitron text-[9px] tracking-[0.25em] uppercase mb-4" style={{ color: `${G}44` }}>COURBE D'AUDIENCE</p>
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={viewerHistory}>
                    <defs>
                      <linearGradient id="vg2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={G} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={G} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="t" tick={{ fill: '#e8e8e822', fontSize: 9, fontFamily: 'Orbitron' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#e8e8e822', fontSize: 9 }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip contentStyle={{ background: '#0a0a0a', border: `1px solid ${G}33`, borderRadius: 0, fontFamily: 'Orbitron, sans-serif', fontSize: '10px', color: G }} />
                    <Area type="monotone" dataKey="v" name="Auditeurs" stroke={G} strokeWidth={2} fill="url(#vg2)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Totaux historiques (depuis API) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5" style={{ background: '#060606', border: `1px solid ${G}12`, clipPath: CLIP(10) }}>
                <p className="font-orbitron text-[9px] tracking-[0.3em] uppercase mb-4" style={{ color: `${G}55` }}>TOTAUX GLOBAUX</p>
                {[
                  { icon: '⏱', label: 'Heures diffusées', value: formatDuration(totalHours) },
                  { icon: '👁', label: 'Auditeurs cumulés', value: String(totalViewers) },
                  { icon: '⚡', label: 'Peak absolu', value: String(peakAbsolute) },
                  { icon: '🎛️', label: 'Streams réalisés', value: String(history.length) },
                  { icon: '💬', label: 'Messages chat', value: String(messages.length) },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: `1px solid ${G}08` }}>
                    <span className="font-space text-sm" style={{ color: '#e8e8e8cc' }}>{s.icon} {s.label}</span>
                    <span className="font-orbitron font-bold text-sm" style={{ color: G }}>{s.value}</span>
                  </div>
                ))}
              </div>

              <div className="p-5" style={{ background: '#060606', border: `1px solid ${G}12`, clipPath: CLIP(10) }}>
                <p className="font-orbitron text-[9px] tracking-[0.3em] uppercase mb-4" style={{ color: `${G}55` }}>HISTORIQUE STREAMS</p>
                {history.length === 0
                  ? <p className="font-space text-xs" style={{ color: '#e8e8e822' }}>Aucun stream encore réalisé.</p>
                  : history.slice(0, 6).map(s => (
                    <div key={s.id} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${G}06` }}>
                      <div>
                        <p className="font-orbitron text-xs font-bold" style={{ color: '#e8e8e8' }}>{s.title}</p>
                        <p className="font-mono text-[9px] mt-0.5" style={{ color: '#e8e8e833' }}>
                          {new Date(s.startedAt).toLocaleDateString('fr-FR')} — {formatDuration(s.duration)}
                        </p>
                      </div>
                      <span className="font-orbitron font-bold text-sm" style={{ color: G }}>{s.peakViewers} 👁</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* ════════════ ARCHIVE TAB ════════════ */}
        {tab === 'archive' && (
          <div className="p-6 max-w-4xl mx-auto">
            <SectionHeader label="ARCHIVES STREAMS" color={R} />

            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="font-orbitron text-5xl" style={{ color: `${R}22` }}>◎</div>
                <p className="font-orbitron text-xs tracking-[0.3em] uppercase" style={{ color: '#e8e8e822' }}>AUCUN STREAM ARCHIVÉ</p>
                <p className="font-space text-sm" style={{ color: '#e8e8e833' }}>Lance ton premier live depuis l'onglet STUDIO</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map(a => (
                  <ArchiveStreamItem key={a.id} stream={a} formatDuration={formatDuration} />
                ))}
              </div>
            )}

            <div className="mt-6 p-4" style={{ background: `${R}03`, border: `1px solid ${R}12`, clipPath: CLIP(8) }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-orbitron text-xs font-bold" style={{ color: '#e8e8e8' }}>{history.length} streams archivés</p>
                  <p className="font-space text-xs mt-0.5" style={{ color: '#e8e8e844' }}>Stockage en mémoire serveur — redémarre = reset</p>
                </div>
                <p className="font-orbitron font-black text-xl" style={{ color: R }}>{history.length} <span className="text-sm font-normal" style={{ color: '#e8e8e844' }}>sessions</span></p>
              </div>
            </div>
          </div>
        )}
        {/* ════════════ SCHEDULE TAB ════════════ */}
        {tab === 'schedule' && (
          <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <SectionHeader label="PLANNING / CALENDRIER" color={G} />
              <button onClick={() => setSchedForm(p => ({ ...p, open: !p.open, editId: undefined }))}
                className="font-orbitron font-bold text-[10px] tracking-[0.2em] uppercase px-5 py-2.5 transition-all"
                style={{ background: schedForm.open ? 'transparent' : G, color: schedForm.open ? G : '#050505', border: `1px solid ${G}`, cursor: 'pointer', clipPath: CLIP(8), boxShadow: schedForm.open ? 'none' : `0 0 16px ${G}44` }}>
                {schedForm.open ? '✕ ANNULER' : '+ AJOUTER UN SHOW'}
              </button>
            </div>

            {/* Add/Edit form */}
            {schedForm.open && (
              <div className="mb-6 p-5" style={{ background: `${G}04`, border: `1px solid ${G}22`, clipPath: CLIP(10) }}>
                <p className="font-orbitron text-[9px] tracking-[0.3em] uppercase mb-4" style={{ color: `${G}66` }}>
                  {schedForm.editId ? 'MODIFIER LE SHOW' : 'NOUVEAU SHOW'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="font-orbitron text-[8px] tracking-[0.2em] uppercase block mb-1.5" style={{ color: `${G}55` }}>TITRE *</label>
                    <input value={schedForm.title || ''} onChange={e => setSchedForm(p => ({ ...p, title: e.target.value }))} placeholder="DARK FREQUENCY #49"
                      style={{ background: '#060606', border: `1px solid ${G}22`, color: '#e8e8e8', padding: '9px 12px', width: '100%', fontFamily: 'Space Grotesk', fontSize: '13px', outline: 'none', clipPath: CLIP(5) }}
                      onFocus={e => (e.currentTarget.style.borderColor = `${G}66`)} onBlur={e => (e.currentTarget.style.borderColor = `${G}22`)} />
                  </div>
                  <div>
                    <label className="font-orbitron text-[8px] tracking-[0.2em] uppercase block mb-1.5" style={{ color: `${G}55` }}>NOM DJ</label>
                    <input value={schedForm.djName || ''} onChange={e => setSchedForm(p => ({ ...p, djName: e.target.value }))} placeholder={user?.username}
                      style={{ background: '#060606', border: `1px solid ${G}22`, color: '#e8e8e8', padding: '9px 12px', width: '100%', fontFamily: 'Space Grotesk', fontSize: '13px', outline: 'none', clipPath: CLIP(5) }}
                      onFocus={e => (e.currentTarget.style.borderColor = `${G}66`)} onBlur={e => (e.currentTarget.style.borderColor = `${G}22`)} />
                  </div>
                  <div>
                    <label className="font-orbitron text-[8px] tracking-[0.2em] uppercase block mb-1.5" style={{ color: `${G}55` }}>DATE *</label>
                    <input type="date" value={schedForm.date || ''} onChange={e => setSchedForm(p => ({ ...p, date: e.target.value }))}
                      style={{ background: '#060606', border: `1px solid ${G}22`, color: '#e8e8e8', padding: '9px 12px', width: '100%', fontFamily: 'Space Grotesk', fontSize: '13px', outline: 'none', clipPath: CLIP(5), colorScheme: 'dark' }}
                      onFocus={e => (e.currentTarget.style.borderColor = `${G}66`)} onBlur={e => (e.currentTarget.style.borderColor = `${G}22`)} />
                  </div>
                  <div>
                    <label className="font-orbitron text-[8px] tracking-[0.2em] uppercase block mb-1.5" style={{ color: `${G}55` }}>HEURE DE DÉBUT *</label>
                    <input type="time" value={schedForm.startTime || ''} onChange={e => setSchedForm(p => ({ ...p, startTime: e.target.value }))}
                      style={{ background: '#060606', border: `1px solid ${G}22`, color: '#e8e8e8', padding: '9px 12px', width: '100%', fontFamily: 'Space Grotesk', fontSize: '13px', outline: 'none', clipPath: CLIP(5), colorScheme: 'dark' }}
                      onFocus={e => (e.currentTarget.style.borderColor = `${G}66`)} onBlur={e => (e.currentTarget.style.borderColor = `${G}22`)} />
                  </div>
                  <div>
                    <label className="font-orbitron text-[8px] tracking-[0.2em] uppercase block mb-1.5" style={{ color: `${G}55` }}>DURÉE (min)</label>
                    <input type="number" value={schedForm.duration || 120} onChange={e => setSchedForm(p => ({ ...p, duration: Number(e.target.value) }))} min={15} max={720}
                      style={{ background: '#060606', border: `1px solid ${G}22`, color: '#e8e8e8', padding: '9px 12px', width: '100%', fontFamily: 'Space Grotesk', fontSize: '13px', outline: 'none', clipPath: CLIP(5) }}
                      onFocus={e => (e.currentTarget.style.borderColor = `${G}66`)} onBlur={e => (e.currentTarget.style.borderColor = `${G}22`)} />
                  </div>
                  <div>
                    <label className="font-orbitron text-[8px] tracking-[0.2em] uppercase block mb-1.5" style={{ color: `${G}55` }}>GENRE</label>
                    <select value={schedForm.genre || GENRES[0]} onChange={e => setSchedForm(p => ({ ...p, genre: e.target.value }))}
                      style={{ background: '#060606', border: `1px solid ${G}22`, color: '#e8e8e8', padding: '9px 12px', width: '100%', fontFamily: 'Space Grotesk', fontSize: '13px', outline: 'none', clipPath: CLIP(5), cursor: 'pointer' }}>
                      {GENRES.map(g => <option key={g} value={g} style={{ background: '#0a0a0a' }}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-orbitron text-[8px] tracking-[0.2em] uppercase block mb-1.5" style={{ color: `${G}55` }}>COULEUR</label>
                    <div className="flex gap-2">
                      {(['green', 'red'] as const).map(c => (
                        <button key={c} onClick={() => setSchedForm(p => ({ ...p, color: c }))}
                          className="flex-1 py-2 font-orbitron text-[9px] tracking-[0.1em] uppercase transition-all"
                          style={{ background: schedForm.color === c ? (c === 'green' ? `${G}22` : `${R}22`) : 'transparent', border: `1px solid ${c === 'green' ? (schedForm.color === c ? G : `${G}22`) : (schedForm.color === c ? R : `${R}22`)}`, color: c === 'green' ? G : R, cursor: 'pointer', clipPath: CLIP(5) }}>
                          {c === 'green' ? '● VERT' : '● ROUGE'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="font-orbitron text-[8px] tracking-[0.2em] uppercase block mb-1.5" style={{ color: `${G}55` }}>RÉCURRENCE</label>
                    <select value={schedForm.recurring ?? 'null'} onChange={e => setSchedForm(p => ({ ...p, recurring: e.target.value === 'null' ? null : e.target.value as 'weekly' | 'monthly' }))}
                      style={{ background: '#060606', border: `1px solid ${G}22`, color: '#e8e8e8', padding: '9px 12px', width: '100%', fontFamily: 'Space Grotesk', fontSize: '13px', outline: 'none', clipPath: CLIP(5), cursor: 'pointer' }}>
                      <option value="null" style={{ background: '#0a0a0a' }}>Aucune</option>
                      <option value="weekly" style={{ background: '#0a0a0a' }}>Hebdomadaire</option>
                      <option value="monthly" style={{ background: '#0a0a0a' }}>Mensuelle</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="font-orbitron text-[8px] tracking-[0.2em] uppercase block mb-1.5" style={{ color: `${G}55` }}>DESCRIPTION</label>
                  <textarea value={schedForm.description || ''} onChange={e => setSchedForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Set techno industriel, 100% vinyl..."
                    style={{ background: '#060606', border: `1px solid ${G}22`, color: '#e8e8e8', padding: '9px 12px', width: '100%', fontFamily: 'Space Grotesk', fontSize: '13px', outline: 'none', clipPath: CLIP(5), resize: 'vertical' }}
                    onFocus={e => (e.currentTarget.style.borderColor = `${G}55`)} onBlur={e => (e.currentTarget.style.borderColor = `${G}22`)} />
                </div>
                <button onClick={submitSched} disabled={!schedForm.title?.trim()}
                  className="font-orbitron font-bold text-[10px] tracking-[0.2em] uppercase px-8 py-3 transition-all"
                  style={{ background: schedForm.title?.trim() ? G : `${G}33`, color: '#050505', border: 'none', cursor: schedForm.title?.trim() ? 'pointer' : 'default', clipPath: CLIP(8) }}>
                  ✓ {schedForm.editId ? 'ENREGISTRER' : 'CRÉER LE SHOW'}
                </button>
              </div>
            )}

            {/* Events list */}
            {scheduleEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span style={{ fontSize: '3rem', opacity: 0.15 }}>📅</span>
                <p className="font-orbitron text-xs tracking-[0.3em] uppercase" style={{ color: '#e8e8e822' }}>AUCUN SHOW PLANIFIÉ</p>
                <p className="font-space text-sm" style={{ color: '#e8e8e833' }}>Ajoutez votre premier show avec le bouton ci-dessus</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {scheduleEvents.map(ev => {
                  const live = isLiveNow(ev);
                  const c = ev.color === 'green' ? G : R;
                  const dur = `${Math.floor(ev.duration / 60)}h${ev.duration % 60 > 0 ? String(ev.duration % 60).padStart(2, '0') + 'm' : ''}`;
                  return (
                    <div key={ev.id} className="flex items-center gap-4 px-5 py-4 transition-all duration-200"
                      style={{ background: live ? `${c}08` : '#070707', border: `1px solid ${live ? c : `${c}18`}`, clipPath: CLIP(10), boxShadow: live ? `0 0 20px ${c}15` : 'none' }}>
                      <div className="shrink-0 text-center min-w-[60px]">
                        {live ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ background: c, animation: 'live-dot 1s ease-in-out infinite', boxShadow: `0 0 6px ${c}` }} />
                            <span className="font-orbitron text-[9px] font-bold" style={{ color: c }}>LIVE</span>
                          </div>
                        ) : (
                          <>
                            <p className="font-orbitron font-bold text-sm" style={{ color: `${c}88` }}>{ev.startTime}</p>
                            <p className="font-mono text-[9px]" style={{ color: '#e8e8e822' }}>{new Date(ev.date + 'T00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                          </>
                        )}
                      </div>
                      <div className="w-px self-stretch" style={{ background: `${c}18` }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-orbitron font-black text-sm" style={{ color: '#e8e8e8' }}>{ev.title}</p>
                        <p className="font-space text-xs mt-0.5" style={{ color: `${c}77` }}>{ev.djName} — {ev.genre}</p>
                        {ev.description && <p className="font-space text-xs mt-0.5 truncate" style={{ color: '#e8e8e833' }}>{ev.description}</p>}
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className="font-orbitron font-bold text-sm" style={{ color: c }}>{dur}</span>
                        {ev.recurring && <span className="font-orbitron text-[8px] tracking-[0.1em] px-1.5 py-0.5" style={{ background: `${c}12`, color: `${c}66`, border: `1px solid ${c}22` }}>{ev.recurring === 'weekly' ? '↻ HEBDO' : '↻ MENSUEL'}</span>}
                      </div>
                      <div className="shrink-0 flex gap-2">
                        <button onClick={() => setSchedForm({ ...ev, open: true, editId: ev.id })}
                          style={{ background: 'none', border: `1px solid ${G}22`, color: `${G}55`, cursor: 'pointer', padding: '4px 10px', fontFamily: 'Orbitron', fontSize: '9px', clipPath: CLIP(4) }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = G; (e.currentTarget as HTMLButtonElement).style.borderColor = G; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = `${G}55`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${G}22`; }}>✎</button>
                        <button onClick={() => { if (confirm('Supprimer ce show ?')) deleteEvent(ev.id); }}
                          style={{ background: 'none', border: `1px solid ${R}22`, color: `${R}55`, cursor: 'pointer', padding: '4px 10px', fontFamily: 'Orbitron', fontSize: '9px', clipPath: CLIP(4) }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = R; (e.currentTarget as HTMLButtonElement).style.borderColor = R; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = `${R}55`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${R}22`; }}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════ PROFILE TAB ════════════ */}
        {tab === 'profile' && (
          <div className="p-6 max-w-2xl mx-auto">
            <SectionHeader label="PROFIL STREAMER" color={G} />

            {/* Avatar preview */}
            <div className="flex items-center gap-5 mb-6 p-5" style={{ background: `${G}04`, border: `1px solid ${G}14`, clipPath: CLIP(10) }}>
              <div className="relative shrink-0">
                {profForm.avatar ? (
                  <img src={profForm.avatar} alt="avatar" style={{ width: '72px', height: '72px', objectFit: 'cover', border: `2px solid ${G}44`, clipPath: CLIP(8) }} />
                ) : (
                  <div style={{ width: '72px', height: '72px', background: `${G}08`, border: `2px solid ${G}22`, clipPath: CLIP(8), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>👤</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-orbitron font-black text-lg" style={{ color: '#e8e8e8' }}>{profForm.username || user?.username}</p>
                <p className="font-space text-xs mt-1 truncate" style={{ color: '#e8e8e855' }}>{profForm.bio || 'Aucune bio — remplissez ci-dessous'}</p>
                <p className="font-mono-space text-[9px] mt-1 tracking-[0.2em]" style={{ color: `${R}66` }}>STREAMER — DARKVOLT</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Username + Bio */}
              {[
                { label: 'PSEUDO / NOM DE SCÈNE', key: 'username', type: 'text', ph: 'DJ DarkVolt' },
                { label: 'BIO', key: 'bio', type: 'textarea', ph: 'Fréquence underground...' },
              ].map(f => (
                <div key={f.key}>
                  <label className="font-orbitron text-[8px] tracking-[0.2em] uppercase block mb-1.5" style={{ color: `${G}55` }}>{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea rows={3} value={(profForm as unknown as Record<string, string>)[f.key] || ''} onChange={e => setProfForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph}
                      style={{ background: '#060606', border: `1px solid ${G}18`, color: '#e8e8e8', padding: '10px 14px', width: '100%', fontFamily: 'Space Grotesk', fontSize: '13px', outline: 'none', resize: 'vertical' }}
                      onFocus={e => (e.currentTarget.style.borderColor = `${G}55`)} onBlur={e => (e.currentTarget.style.borderColor = `${G}18`)} />
                  ) : (
                    <input type="text" value={(profForm as unknown as Record<string, string>)[f.key] || ''} onChange={e => setProfForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph}
                      style={{ background: '#060606', border: `1px solid ${G}18`, color: '#e8e8e8', padding: '10px 14px', width: '100%', fontFamily: 'Space Grotesk', fontSize: '13px', outline: 'none', clipPath: CLIP(6) }}
                      onFocus={e => (e.currentTarget.style.borderColor = `${G}55`)} onBlur={e => (e.currentTarget.style.borderColor = `${G}18`)} />
                  )}
                </div>
              ))}

              {/* Avatar Upload */}
              <div>
                <label className="font-orbitron text-[8px] tracking-[0.2em] uppercase block mb-1.5" style={{ color: `${G}55` }}>AVATAR</label>
                <AvatarUpload 
                  currentAvatar={profForm.avatar} 
                  onAvatarChange={(avatarData) => setProfForm(p => ({ ...p, avatar: avatarData }))} 
                />
              </div>

              {/* Genres */}
              <div>
                <label className="font-orbitron text-[8px] tracking-[0.2em] uppercase block mb-2" style={{ color: `${G}55` }}>GENRES (max 5)</label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(g => {
                    const sel = profForm.genres?.includes(g);
                    return (
                      <button key={g} onClick={() => setProfForm(p => ({ ...p, genres: sel ? p.genres.filter(x => x !== g) : p.genres.length < 5 ? [...p.genres, g] : p.genres }))}
                        className="font-orbitron text-[8px] tracking-[0.1em] uppercase px-3 py-1.5 transition-all"
                        style={{ background: sel ? `${G}18` : 'transparent', border: `1px solid ${sel ? G : `${G}18`}`, color: sel ? G : '#e8e8e833', cursor: 'pointer', clipPath: CLIP(4) }}>
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Social links */}
              <div>
                <label className="font-orbitron text-[8px] tracking-[0.2em] uppercase block mb-2" style={{ color: `${G}55` }}>RÉSEAUX SOCIAUX</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SOCIALS.map(s => (
                    <div key={s} className="flex items-center gap-2" style={{ background: '#060606', border: `1px solid ${G}12`, padding: '8px 12px', clipPath: CLIP(5) }}>
                      <span className="font-orbitron text-[8px] tracking-[0.1em] uppercase shrink-0" style={{ color: `${G}44`, minWidth: '72px' }}>{s}</span>
                      <input value={(profForm as unknown as Record<string, string>)[s] || ''} onChange={e => setProfForm(p => ({ ...p, [s]: e.target.value }))} placeholder={`${s}.com/darkvolt`}
                        style={{ background: 'transparent', border: 'none', color: '#e8e8e8', fontFamily: 'Space Grotesk', fontSize: '12px', outline: 'none', flex: 1, minWidth: 0 }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Save button */}
              <button onClick={() => saveProfile(profForm)}
                disabled={profileSaving}
                className="font-orbitron font-black text-sm tracking-[0.25em] uppercase py-4 transition-all duration-300 mt-2"
                style={{ background: profileSaved ? `${G}22` : G, color: profileSaved ? G : '#050505', border: profileSaved ? `1px solid ${G}` : 'none', cursor: 'pointer', clipPath: CLIP(10), boxShadow: profileSaved ? 'none' : `0 0 20px ${G}44` }}>
                {profileSaving ? '…' : profileSaved ? '✓ PROFIL SAUVEGARDÉ' : '↑ SAUVEGARDER LE PROFIL'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
