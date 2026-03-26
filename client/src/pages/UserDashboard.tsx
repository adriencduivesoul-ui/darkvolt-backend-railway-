import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import ChatPanel from '../components/dashboard/ChatPanel';
import AudioPlayer from '../components/dashboard/AudioPlayer';
import VideoPlayer from '../components/VideoPlayer';
import HomeAuditeur from './HomeAuditeur';
import { useAuth } from '../contexts/AuthContext';
import { useStreamApi } from '../hooks/useStreamApi';
import { useChatSocket } from '../hooks/useChatSocket';
import { useSchedule } from '../hooks/useSchedule';
import { useWebRTCViewer } from '../hooks/useWebRTCViewer';
import { useStreamerProfile } from '../hooks/useStreamerProfile';

const G = '#39FF14';
const R = '#FF1A1A';
const CLIP = (s = 10) => `polygon(0 0, calc(100% - ${s}px) 0, 100% ${s}px, 100% 100%, ${s}px 100%, 0 calc(100% - ${s}px))`;

type Tab = 'accueil' | 'player' | 'schedule' | 'archive' | 'profile';

interface Favorite { title: string; dj: string; genre: string; addedAt: string; }

export default function UserDashboard() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { status, history, formatDuration } = useStreamApi();
  const { events: scheduleEvents, isLiveNow } = useSchedule();
  const { profile } = useStreamerProfile();
  const { remoteStream, connected: videoConnected, hasVideo, join, leave } = useWebRTCViewer(
    user?.id || 'anon', user?.username || 'Auditeur'
  );

  const [tab, setTab] = useState<Tab>('accueil');
  const [favorites, setFavorites] = useState<Favorite[]>(() => {
    try { return JSON.parse(localStorage.getItem('darkvolt_favorites') || '[]'); } catch { return []; }
  });
  const [notifLive, setNotifLive] = useState(() => localStorage.getItem('darkvolt_notif_live') !== 'off');
  const [username, setUsername] = useState(user?.username || '');
  const [profileSaved, setProfileSaved] = useState(false);
  const [showNotifications, setShowNotifications] = useState(() => {
    const saved = localStorage.getItem('darkvolt_notifications');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [allowArchive, setAllowArchive] = useState(() => {
    const saved = localStorage.getItem('darkvolt_allow_archive');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [schedFilter, setSchedFilter] = useState<'all' | 'upcoming' | 'today'>('upcoming');

  const videoRef = useRef<HTMLVideoElement>(null);

  /* Auto-join live stream */
  useEffect(() => {
    if (status.isLive && !videoConnected) {
      join();
    } else if (!status.isLive && videoConnected) {
      leave();
    }
  }, [status.isLive, videoConnected, join, leave]);

  const addFav = (track: { title: string; dj: string; genre: string }) => {
    if (favorites.find(f => f.title === track.title)) return;
    const next = [...favorites, { ...track, addedAt: new Date().toLocaleDateString('fr-FR') }];
    setFavorites(next);
    localStorage.setItem('darkvolt_favorites', JSON.stringify(next));
  };

  const removeFav = (title: string) => {
    const next = favorites.filter(f => f.title !== title);
    setFavorites(next);
    localStorage.setItem('darkvolt_favorites', JSON.stringify(next));
  };

  const saveProfile = () => {
    if (!user) return;
    try {
      const users = JSON.parse(localStorage.getItem('darkvolt_users') || '[]');
      localStorage.setItem('darkvolt_users', JSON.stringify(users.map((u: { id: string }) => u.id === user.id ? { ...u, username } : u)));
      const session = JSON.parse(localStorage.getItem('darkvolt_session') || '{}');
      localStorage.setItem('darkvolt_session', JSON.stringify({ ...session, username }));
    } catch {}
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const filteredSchedule = () => {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    if (schedFilter === 'today') return scheduleEvents.filter(e => e.date === today);
    if (schedFilter === 'upcoming') return scheduleEvents.filter(e => new Date(e.date + 'T' + e.startTime) >= now);
    return scheduleEvents;
  };

  const NAV: { key: Tab; icon: string; label: string }[] = [
    { key: 'accueil',  icon: '🏠', label: 'ACCUEIL' },
    { key: 'player',   icon: '▶',  label: t('userDash.navPlayer') },
    { key: 'schedule', icon: '📅', label: t('userDash.navSchedule') },
    { key: 'archive',  icon: '📼', label: t('userDash.navLibrary') },
    { key: 'profile',  icon: '👤', label: t('userDash.navProfile') },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#050505', color: '#e8e8e8' }}>
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
      }} />

      {/* ── LIVE BANNER (quand on regarde un stream) ── */}
      {status.isLive && tab === 'player' && (
        <div className="relative z-50 flex items-center justify-between px-6 py-2 shrink-0"
          style={{ background: 'rgba(255,26,26,0.07)', borderBottom: `1px solid ${R}33` }}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ background: R, animation: 'live-dot 1s ease-in-out infinite', boxShadow: `0 0 8px ${R}` }} />
            <span className="font-orbitron font-bold text-xs tracking-[0.2em] uppercase" style={{ color: R }}>
              LIVE — {status.title}
            </span>
            <span className="font-space text-xs" style={{ color: `${G}88` }}>par {status.streamerName}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono-space text-xs" style={{ color: `${G}66` }}>👁 {status.viewers} auditeurs</span>
            {videoConnected && <span className="font-orbitron text-[9px] tracking-[0.1em] px-2 py-0.5" style={{ background: `${G}18`, color: G, border: `1px solid ${G}33` }}>📹 VIDEO</span>}
            <button onClick={() => {
              console.log('🚪 Quitter le stream...');
              leave(); // Déconnecter WebRTC
              setTab('accueil'); // Retour à l'accueil
            }} className="font-orbitron font-bold text-xs tracking-[0.1em] uppercase px-4 py-1.5 transition-all"
              style={{ background: G, color: '#050505', border: 'none', cursor: 'pointer', clipPath: CLIP(5), boxShadow: `0 0 12px ${G}44` }}>
              ← QUITTER
            </button>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="relative z-50 flex items-center justify-between px-6 h-14 shrink-0"
        style={{ background: 'rgba(5,5,5,0.97)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${G}12`, position: 'sticky', top: (status.isLive && tab === 'player') ? '41px' : 0 }}>
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
          <div className="text-right hidden sm:block">
            <p className="font-orbitron text-xs font-bold" style={{ color: '#e8e8e8' }}>{user?.username}</p>
            <p className="font-mono-space" style={{ color: `${G}55`, fontSize: '9px', letterSpacing: '0.2em' }}>AUDITEUR</p>
          </div>
          <button onClick={() => { logout(); navigate('/'); }}
            className="font-orbitron text-xs tracking-[0.1em] uppercase px-4 py-2 transition-all"
            style={{ border: `1px solid ${R}22`, color: `${R}44`, background: 'none', cursor: 'pointer', clipPath: CLIP(5) }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = R; (e.currentTarget as HTMLButtonElement).style.borderColor = R; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = `${R}44`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${R}22`; }}>
            {t('userDash.logout')}
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

      <div className="relative z-10 flex-1">

        {/* ════════ ACCUEIL TAB ════════ */}
        {tab === 'accueil' && (
          <HomeAuditeur 
            onStreamerSelect={(streamer) => {
              console.log('🎯 Streamer sélectionné:', streamer.username);
              console.log('🔄 Changement vers onglet player et connexion WebRTC...');
              setTab('player'); // Changer vers l'onglet player
              // Forcer la connexion WebRTC immédiatement
              if (status.isLive && !videoConnected) {
                console.log('🔄 Connexion automatique au stream...');
                join();
              }
            }}
          />
        )}

        {/* ════════ PLAYER TAB ════════ */}
        {tab === 'player' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 h-full" style={{ minHeight: 'calc(100vh - 56px)' }}>
            <div className="lg:col-span-2 flex flex-col" style={{ borderRight: `1px solid ${G}08` }}>

              {/* Live Video / Audio Player */}
              <div className="p-6" style={{ borderBottom: `1px solid ${G}08`, background: `linear-gradient(160deg, ${status.isLive ? R : G}06 0%, transparent 60%)` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-6" style={{ background: `linear-gradient(90deg, transparent, ${status.isLive ? R : G})` }} />
                  <span className="font-orbitron text-[10px] tracking-[0.4em] uppercase" style={{ color: `${status.isLive ? R : G}66` }}>
                    {status.isLive ? `● LIVE — ${status.title}` : t('userDash.streamLabel')}
                  </span>
                </div>

                {status.isLive ? (
                  /* WebRTC Video ou Audio */
                  <div>
                    {/* Audio Quality Indicator */}
                    <div className="mb-4 p-3" style={{ background: 'rgba(57,255,20,0.05)', border: '1px solid rgba(57,255,20,0.2)', clipPath: CLIP(6) }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-orbitron text-[8px] tracking-[0.2em] uppercase" style={{ color: G }}>
                          🎛️ DARKVOLT AUDIO ENGINE
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ 
                            background: hasVideo ? '#00FF88' : '#FFD700',
                            animation: 'pulse 2s ease-in-out infinite',
                            boxShadow: hasVideo ? '0 0 8px #00FF88' : '0 0 8px #FFD700'
                          }} />
                          <span className="font-mono text-[8px]" style={{ color: `${G}77` }}>
                            {hasVideo ? 'PRO QUALITY' : 'AUDIO ONLY'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[8px]">
                        <div className="flex items-center gap-1">
                          <span style={{ color: '#e8e8e866' }}>🎥</span>
                          <span style={{ color: '#e8e8e877' }}>Video: {hasVideo ? '✅ HD' : '❌ OFF'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span style={{ color: '#e8e8e866' }}>🎵</span>
                          <span style={{ color: '#e8e8e877' }}>Audio: ✅ 44.1kHz Stereo</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span style={{ color: '#e8e8e866' }}>📡</span>
                          <span style={{ color: '#e8e8e877' }}>Stream: {videoConnected ? '✅ CONNECTED' : '🔄 CONNECTING'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span style={{ color: '#e8e8e866' }}>👁</span>
                          <span style={{ color: '#e8e8e877' }}>Viewers: {status.viewers}</span>
                        </div>
                      </div>
                      
                      {remoteStream && (
                        <div className="mt-2 pt-2 border-t" style={{ borderColor: 'rgba(57,255,20,0.2)' }}>
                          <div className="flex items-center justify-between">
                            <span className="font-space text-[7px]" style={{ color: '#e8e8e855' }}>
                              🎧 DarkVolt Professional Audio Stream
                            </span>
                            <span className="font-mono text-[7px]" style={{ color: `${G}66` }}>
                              QUALITY: {hasVideo ? 'STUDIO' : 'AUDIO PRO'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {hasVideo && remoteStream ? (
                      /* WebRTC Video avec contrôles complets */
                      <VideoPlayer 
                        stream={remoteStream}
                        title={status.title}
                        viewerCount={status.viewers}
                        isLive={true}
                      />
                    ) : (
                      /* Audio Player */
                      <div>
                        <AudioPlayer />
                        {!hasVideo && (
                      <p className="font-space text-xs mt-3" style={{ color: '#e8e8e833' }}>
                        📻 Stream audio — le streamer n'a pas activé la vidéo
                      </p>
                    )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Pas de stream */
                  <div className="text-center py-12">
                    <p className="font-space text-sm" style={{ color: '#e8e8e833' }}>
                      Aucun stream en direct pour le moment
                    </p>
                  </div>
                )}
              </div>

              {/* Streamer info (when live) */}
              {status.isLive && (
                <div className="px-6 py-4 flex items-center gap-4" style={{ borderBottom: `1px solid ${G}08`, background: `${G}03` }}>
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="streamer" style={{ width: '44px', height: '44px', objectFit: 'cover', clipPath: CLIP(6), border: `1px solid ${G}33` }} />
                  ) : (
                    <div style={{ width: '44px', height: '44px', background: `${G}0a`, border: `1px solid ${G}22`, clipPath: CLIP(6), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🎧</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-orbitron font-bold text-sm" style={{ color: '#e8e8e8' }}>{status.streamerName}</p>
                    <p className="font-space text-xs mt-0.5" style={{ color: `${G}66` }}>{status.genre}</p>
                  </div>
                  <div className="flex items-center gap-4 text-right shrink-0">
                    <div>
                      <p className="font-orbitron font-black text-lg" style={{ color: G }}>{status.viewers}</p>
                      <p className="font-mono text-[9px]" style={{ color: '#e8e8e833' }}>viewers</p>
                    </div>
                    <div>
                      <p className="font-orbitron font-black text-lg" style={{ color: `${R}88` }}>{status.peakViewers}</p>
                      <p className="font-mono text-[9px]" style={{ color: '#e8e8e833' }}>peak</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent streams archive */}
              <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-6" style={{ background: `linear-gradient(90deg, transparent, ${G})` }} />
                    <span className="font-orbitron text-[10px] tracking-[0.35em] uppercase" style={{ color: `${G}66` }}>DERNIERS STREAMS</span>
                  </div>
                  <button onClick={() => setTab('archive')} className="font-orbitron text-[9px] tracking-[0.1em] uppercase transition-all"
                    style={{ color: `${G}44`, background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.color = G)}
                    onMouseLeave={e => (e.currentTarget.style.color = `${G}44`)}>
                    TOUT VOIR →
                  </button>
                </div>
                {history.length === 0 ? (
                  <p className="font-space text-xs" style={{ color: '#e8e8e822' }}>Aucun stream archivé pour l'instant.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {history.slice(0, 5).map((a, i) => (
                      <div key={a.id} className="flex items-center gap-4 px-4 py-3 transition-all duration-200"
                        style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${G}06`, clipPath: CLIP(7), cursor: 'pointer' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${G}18`; (e.currentTarget as HTMLDivElement).style.background = `${G}04`; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${G}06`; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'; }}>
                        <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ background: `${G}08`, border: `1px solid ${G}14`, clipPath: CLIP(5) }}>
                          <span className="font-orbitron text-[10px]" style={{ color: `${G}88` }}>{String(i + 1).padStart(2, '0')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-orbitron font-bold text-sm truncate" style={{ color: '#e8e8e8' }}>{a.title}</p>
                          <p className="font-space text-xs mt-0.5" style={{ color: '#e8e8e844' }}>{a.genre} — {new Date(a.startedAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-orbitron text-xs font-bold" style={{ color: G }}>{formatDuration(a.duration)}</p>
                          <p className="font-mono text-[9px]" style={{ color: '#e8e8e833' }}>{a.peakViewers} peak</p>
                        </div>
                        <button onClick={() => addFav({ title: a.title, dj: a.streamerName, genre: a.genre })}
                          style={{ background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', opacity: favorites.find(f => f.title === a.title) ? 1 : 0.25 }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = favorites.find(f => f.title === a.title) ? '1' : '0.25')}>💚</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat */}
            <div style={{ height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', position: 'sticky', top: '56px' }}>
              <ChatPanel />
            </div>
          </div>
        )}

        {/* ════════ SCHEDULE TAB ════════ */}
        {tab === 'schedule' && (
          <div className="max-w-2xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-px w-6" style={{ background: `linear-gradient(90deg, transparent, ${G})` }} />
                <span className="font-orbitron text-[10px] tracking-[0.4em] uppercase" style={{ color: G }}>PLANNING</span>
              </div>
              <div className="flex gap-1">
                {(['today', 'upcoming', 'all'] as const).map(f => (
                  <button key={f} onClick={() => setSchedFilter(f)}
                    className="font-orbitron text-[8px] tracking-[0.15em] uppercase px-3 py-1.5 transition-all"
                    style={{ background: schedFilter === f ? `${G}18` : 'transparent', border: `1px solid ${schedFilter === f ? G : `${G}18`}`, color: schedFilter === f ? G : '#e8e8e833', cursor: 'pointer', clipPath: CLIP(4) }}>
                    {f === 'today' ? "AUJOURD'HUI" : f === 'upcoming' ? 'À VENIR' : 'TOUS'}
                  </button>
                ))}
              </div>
            </div>

            {filteredSchedule().length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16" style={{ border: `1px dashed ${G}12` }}>
                <span style={{ fontSize: '2.5rem', opacity: 0.15 }}>📅</span>
                <p className="font-orbitron text-xs tracking-[0.3em] uppercase" style={{ color: '#e8e8e822' }}>AUCUN SHOW PROGRAMMÉ</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredSchedule().map(ev => {
                  const live = isLiveNow(ev);
                  const c = ev.color === 'green' ? G : R;
                  const dur = `${Math.floor(ev.duration / 60)}h${ev.duration % 60 > 0 ? String(ev.duration % 60).padStart(2, '0') + 'm' : ''}`;
                  return (
                    <div key={ev.id} className="flex items-stretch gap-0 transition-all duration-200"
                      style={{ background: live ? `${c}07` : 'rgba(255,255,255,0.02)', border: `1px solid ${live ? c : `${c}18`}`, boxShadow: live ? `0 0 20px ${c}12` : 'none' }}
                      onMouseEnter={e => { if (!live) (e.currentTarget as HTMLDivElement).style.borderColor = `${c}33`; }}
                      onMouseLeave={e => { if (!live) (e.currentTarget as HTMLDivElement).style.borderColor = `${c}18`; }}>
                      <div className="flex items-center justify-center px-5 shrink-0" style={{ borderRight: `1px solid ${c}12`, minWidth: '80px' }}>
                        {live ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ background: c, animation: 'live-dot 1.5s ease-in-out infinite', boxShadow: `0 0 6px ${c}` }} />
                            <span className="font-orbitron text-[9px] font-bold" style={{ color: c }}>LIVE</span>
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="font-orbitron font-bold text-sm" style={{ color: `${c}88` }}>{ev.startTime}</p>
                            <p className="font-mono text-[9px]" style={{ color: '#e8e8e822' }}>{new Date(ev.date + 'T00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 px-5 py-4">
                        <p className="font-orbitron font-bold text-sm" style={{ color: '#e8e8e8' }}>{ev.title}</p>
                        <p className="font-space text-xs mt-1" style={{ color: '#e8e8e855' }}>{ev.djName}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="font-orbitron text-[9px] px-2 py-0.5" style={{ color: `${c}66`, border: `1px solid ${c}18` }}>{ev.genre}</span>
                          <span className="font-mono-space text-xs" style={{ color: '#e8e8e833' }}>{dur}</span>
                        </div>
                      </div>
                      {live && (
                        <div className="flex items-center pr-5 shrink-0">
                          <button onClick={() => setTab('player')}
                            className="font-orbitron font-bold text-xs tracking-[0.1em] uppercase px-4 py-2 transition-all"
                            style={{ background: c, color: '#050505', border: 'none', cursor: 'pointer', clipPath: CLIP(6), boxShadow: `0 0 14px ${c}55` }}>
                            ▶ ÉCOUTER
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════ ARCHIVE TAB ════════ */}
        {tab === 'archive' && (
          <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-6" style={{ background: `linear-gradient(90deg, transparent, ${G})` }} />
              <span className="font-orbitron text-[10px] tracking-[0.4em] uppercase" style={{ color: G }}>ARCHIVES</span>
              <span className="font-orbitron text-[9px]" style={{ color: '#e8e8e833' }}>({history.length})</span>
            </div>

            {/* Favorites */}
            {favorites.length > 0 && (
              <div className="mb-8">
                <p className="font-orbitron text-[9px] tracking-[0.3em] uppercase mb-3" style={{ color: `${G}55` }}>💚 MES FAVORIS ({favorites.length})</p>
                <div className="flex flex-col gap-1.5 mb-4">
                  {favorites.map((f, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3" style={{ background: `${G}05`, border: `1px solid ${G}15`, clipPath: CLIP(6) }}>
                      <span style={{ fontSize: '14px' }}>💚</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-orbitron font-bold text-sm truncate" style={{ color: '#e8e8e8' }}>{f.title}</p>
                        <p className="font-space text-xs" style={{ color: '#e8e8e844' }}>{f.dj} — ajouté le {f.addedAt}</p>
                      </div>
                      <button onClick={() => removeFav(f.title)}
                        style={{ background: 'none', border: 'none', color: '#e8e8e833', cursor: 'pointer', fontSize: '12px' }}
                        onMouseEnter={e => (e.currentTarget.style.color = R)}
                        onMouseLeave={e => (e.currentTarget.style.color = '#e8e8e833')}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All archive */}
            {history.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16" style={{ border: `1px dashed ${G}10` }}>
                <span style={{ fontSize: '3rem', opacity: 0.15 }}>📼</span>
                <p className="font-orbitron text-xs tracking-[0.3em] uppercase" style={{ color: '#e8e8e822' }}>AUCUN STREAM ARCHIVÉ</p>
                <p className="font-space text-sm" style={{ color: '#e8e8e833' }}>Les streams seront archivés après la fin du live</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {history.map(a => (
                  <div key={a.id} className="flex items-center gap-4 px-5 py-4 transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${G}07`, clipPath: CLIP(10), cursor: 'pointer' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${G}22`; (e.currentTarget as HTMLDivElement).style.background = `${G}04`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${G}07`; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'; }}>
                    <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: `${G}08`, border: `1px solid ${G}15`, clipPath: CLIP(6) }}>
                      <span style={{ fontSize: '16px', color: G }}>▶</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-orbitron font-bold text-sm truncate" style={{ color: '#e8e8e8' }}>{a.title}</p>
                      <p className="font-space text-xs mt-0.5" style={{ color: '#e8e8e844' }}>
                        {a.streamerName} — {a.genre} — {new Date(a.startedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-5">
                      <div className="text-right hidden sm:block">
                        <p className="font-orbitron font-bold text-sm" style={{ color: G }}>{formatDuration(a.duration)}</p>
                        <p className="font-mono text-[9px]" style={{ color: '#e8e8e833' }}>{a.totalMessages} msgs</p>
                      </div>
                      <div className="text-right">
                        <p className="font-orbitron font-black text-base" style={{ color: G }}>{a.peakViewers}</p>
                        <p className="font-mono text-[9px]" style={{ color: '#e8e8e833' }}>peak 👁</p>
                      </div>
                      <button onClick={() => addFav({ title: a.title, dj: a.streamerName, genre: a.genre })}
                        style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', opacity: favorites.find(f => f.title === a.title) ? 1 : 0.25 }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = favorites.find(f => f.title === a.title) ? '1' : '0.25')}>💚</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════ PROFILE TAB ════════ */}
        {tab === 'profile' && (
          <div className="max-w-lg mx-auto p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-6" style={{ background: `linear-gradient(90deg, transparent, ${G})` }} />
              <span className="font-orbitron text-[10px] tracking-[0.4em] uppercase" style={{ color: G }}>MON PROFIL</span>
            </div>

            <div className="flex items-center gap-5 mb-6 p-5" style={{ background: `${G}04`, border: `1px solid ${G}14`, clipPath: CLIP(10) }}>
              <div style={{ width: '56px', height: '56px', background: `${G}0a`, border: `2px solid ${G}22`, clipPath: CLIP(7), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>👤</div>
              <div>
                <p className="font-orbitron font-black text-base" style={{ color: '#e8e8e8' }}>{user?.username}</p>
                <p className="font-space text-xs mt-0.5" style={{ color: '#e8e8e855' }}>{user?.email}</p>
                <p className="font-mono-space text-[9px] mt-1 tracking-[0.2em]" style={{ color: `${G}55` }}>
                  MEMBRE {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase() : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="font-orbitron text-[9px] tracking-[0.2em] uppercase block mb-2" style={{ color: `${G}55` }}>PSEUDO</label>
                <input value={username} onChange={e => setUsername(e.target.value)}
                  style={{ background: '#0a0a0a', border: `1px solid ${G}22`, color: '#e8e8e8', padding: '10px 14px', width: '100%', fontFamily: 'Space Grotesk', fontSize: '14px', outline: 'none', clipPath: CLIP(6) }}
                  onFocus={e => (e.currentTarget.style.borderColor = `${G}55`)}
                  onBlur={e => (e.currentTarget.style.borderColor = `${G}22`)} />
              </div>
              {[
                { label: 'EMAIL', value: user?.email || '' },
                { label: 'RÔLE', value: 'Auditeur' },
                { label: "MEMBRE DEPUIS", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '' },
              ].map(f => (
                <div key={f.label}>
                  <label className="font-orbitron text-[9px] tracking-[0.2em] uppercase block mb-2" style={{ color: `${G}33` }}>{f.label}</label>
                  <input value={f.value} disabled
                    style={{ background: '#080808', border: `1px solid ${G}08`, color: '#e8e8e833', padding: '10px 14px', width: '100%', fontFamily: 'Space Grotesk', fontSize: '14px', outline: 'none' }} />
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 mb-6 p-4" style={{ background: '#0a0a0a', border: `1px solid ${G}08`, clipPath: CLIP(8) }}>
              <p className="font-orbitron text-[9px] tracking-[0.2em] uppercase mb-1" style={{ color: `${G}44` }}>PARAMÈTRES</p>
              <div className="flex items-center justify-between">
                <span className="font-space text-sm" style={{ color: '#e8e8e8' }}>Notification live</span>
                <button onClick={() => { const n = !notifLive; setNotifLive(n); localStorage.setItem('darkvolt_notif_live', n ? 'on' : 'off'); }}
                  style={{ width: '44px', height: '24px', borderRadius: '12px', background: notifLive ? G : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ position: 'absolute', top: '3px', left: notifLive ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#050505', transition: 'left 0.2s' }} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-space text-sm" style={{ color: '#e8e8e8' }}>Autoriser l'archivage de mes streams</span>
                <button onClick={() => { const n = !allowArchive; setAllowArchive(n); localStorage.setItem('darkvolt_allow_archive', JSON.stringify(n)); }}
                  style={{ width: '44px', height: '24px', borderRadius: '12px', background: allowArchive ? G : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ position: 'absolute', top: '3px', left: allowArchive ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#050505', transition: 'left 0.2s' }} />
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={saveProfile}
                className="flex-1 font-orbitron font-bold text-xs tracking-[0.2em] uppercase py-3 transition-all"
                style={{ background: profileSaved ? `${G}18` : G, color: profileSaved ? G : '#050505', border: profileSaved ? `1px solid ${G}` : 'none', boxShadow: profileSaved ? 'none' : `0 0 16px ${G}44`, cursor: 'pointer', clipPath: CLIP(8) }}>
                {profileSaved ? '✓ SAUVEGARDÉ' : 'SAUVEGARDER'}
              </button>
              <button onClick={() => { logout(); navigate('/'); }}
                className="font-orbitron font-bold text-xs tracking-[0.2em] uppercase px-6 py-3 transition-all"
                style={{ border: `1px solid ${R}22`, color: `${R}55`, background: 'none', cursor: 'pointer', clipPath: CLIP(8) }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = R; (e.currentTarget as HTMLButtonElement).style.color = '#050505'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = `${R}55`; }}>
                DÉCONNECTER
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
