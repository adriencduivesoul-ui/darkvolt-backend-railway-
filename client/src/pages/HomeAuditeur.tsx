import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { useStreamApi } from '../hooks/useStreamApi';
import { useStreamerProfile } from '../hooks/useStreamerProfile';
import { useChatSocket } from '../hooks/useChatSocket';
import { useAuth } from '../contexts/AuthContext';

const G = '#39FF14';
const R = '#FF1A1A';

function BentoCard({ title, dot = G, children, style = {} }: { title: string; dot?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.45)', border: `1px solid ${G}18`, borderRadius: '10px', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', ...style }}>
      <div style={{ padding: '10px 14px 8px', borderBottom: `1px solid ${G}10`, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dot, boxShadow: `0 0 6px ${dot}` }} />
        <span className="font-orbitron" style={{ fontSize: '9px', letterSpacing: '0.3em', color: G, textTransform: 'uppercase' }}>{title}</span>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  );
}

interface HomeAuditeurProps {
  onStreamerSelect?: (streamer: { id: string; username: string; title: string; genre: string; viewers: number; isLive: boolean }) => void;
}

export default function HomeAuditeur({ onStreamerSelect }: HomeAuditeurProps = {}) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { status, getLiveDuration } = useStreamApi();
  const { profile: _profile } = useStreamerProfile();
  const { messages, connected: chatConnected, sendMessage } = useChatSocket();
  const [joining, setJoining] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [, setTick] = useState(0);
  useEffect(() => {
    if (!status.isLive) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [status.isLive]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim());
    setChatInput('');
  }, [chatInput, sendMessage]);

  const handleJoin = () => {
    setJoining(true);
    onStreamerSelect?.({ id: 'current-live', username: status.streamerName, title: status.title, genre: status.genre, viewers: status.viewers, isLive: true });
    setTimeout(() => setJoining(false), 800);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#e8e8e8', display: 'flex', flexDirection: 'column' }}>
      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)' }} />

      {/* ── Main ── */}
      <div className="relative z-10" style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {status.isLive ? (
          /* ═══ STREAM EN COURS ═══ */
          <>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', flexShrink: 0 }}>
              {[
                { label: 'AUDITEURS', value: String(status.viewers || 0), dot: R },
                { label: 'DURÉE', value: getLiveDuration(), dot: G },
                { label: 'GENRE', value: status.genre || '—', dot: G },
              ].map(({ label, value, dot }) => (
                <div key={label} style={{ background: 'rgba(0,0,0,0.45)', border: `1px solid ${dot}18`, borderRadius: '8px', padding: '12px 16px', backdropFilter: 'blur(10px)' }}>
                  <p className="font-orbitron" style={{ fontSize: '8px', letterSpacing: '0.3em', color: `${dot}66`, marginBottom: '4px' }}>{label}</p>
                  <p className="font-orbitron" style={{ fontSize: '18px', fontWeight: 700, color: dot, textShadow: `0 0 12px ${dot}44` }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Main content: stream info + chat */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', gap: '12px', minHeight: 0 }}>

              {/* Stream card */}
              <BentoCard title="STREAM EN DIRECT" dot={R} style={{ minHeight: 0 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: '24px' }}>
                  {/* Live pulse */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: `${R}10`, border: `2px solid ${R}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 60px ${R}22, inset 0 0 30px ${R}08`, animation: 'live-glow 2s ease-in-out infinite' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: R, boxShadow: `0 0 20px ${R}` }} />
                    </div>
                    <div style={{ position: 'absolute', inset: '-8px', borderRadius: '50%', border: `1px solid ${R}22`, animation: 'live-ring 2s ease-in-out infinite' }} />
                  </div>

                  {/* Stream info */}
                  <div style={{ textAlign: 'center', maxWidth: '480px' }}>
                    <p className="font-orbitron" style={{ fontSize: '9px', letterSpacing: '0.3em', color: `${R}88`, marginBottom: '8px' }}>🔴 LIVE — {status.streamerName}</p>
                    <h2 className="font-orbitron" style={{ fontSize: 'clamp(16px, 3vw, 26px)', fontWeight: 900, color: '#ffffff', letterSpacing: '0.05em', marginBottom: '8px', lineHeight: 1.2 }}>{status.title || 'DARKVOLT LIVE'}</h2>
                    {status.genre && <p className="font-space" style={{ fontSize: '12px', color: `${G}88`, marginBottom: '4px' }}>{status.genre}</p>}
                  </div>

                  {/* Join button */}
                  <button onClick={handleJoin} disabled={joining} className="font-orbitron transition-all"
                    style={{ padding: '16px 48px', fontSize: '11px', letterSpacing: '0.35em', textTransform: 'uppercase', cursor: joining ? 'default' : 'pointer', borderRadius: '8px', background: joining ? `${G}22` : `${G}18`, border: `1px solid ${G}55`, color: G, boxShadow: `0 0 24px ${G}22`, opacity: joining ? 0.6 : 1 }}
                    onMouseEnter={e => { if (!joining) (e.currentTarget as HTMLButtonElement).style.background = `${G}2a`; }}
                    onMouseLeave={e => { if (!joining) (e.currentTarget as HTMLButtonElement).style.background = `${G}18`; }}>
                    {joining ? 'CONNEXION...' : '▶ REJOINDRE LE LIVE'}
                  </button>
                </div>
              </BentoCard>

              {/* Chat panel */}
              <BentoCard title="CHAT EN DIRECT" dot={chatConnected ? G : R} style={{ minHeight: 0 }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {messages.slice(-60).map((m, i) => (
                    <div key={i} style={{ padding: '4px 6px', borderRadius: '4px', background: m.role === 'streamer' ? `${G}0a` : 'transparent', borderLeft: m.role === 'streamer' ? `2px solid ${G}66` : '2px solid transparent' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px', marginBottom: '1px' }}>
                        <span className="font-orbitron" style={{ fontSize: '8px', letterSpacing: '0.1em', color: m.role === 'streamer' ? G : '#e8e8e8aa', flexShrink: 0 }}>{m.username}</span>
                        <span className="font-space" style={{ fontSize: '8px', color: '#e8e8e822', flexShrink: 0 }}>{new Date(m.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="font-space" style={{ fontSize: '11px', color: '#e8e8e8aa', lineHeight: 1.4, wordBreak: 'break-word' }}>{m.content}</p>
                    </div>
                  ))}
                  {messages.length === 0 && <p className="font-space" style={{ fontSize: '11px', color: '#e8e8e822', textAlign: 'center', marginTop: '20px' }}>Aucun message…</p>}
                  <div ref={chatEndRef} />
                </div>
                <div style={{ padding: '8px', borderTop: `1px solid ${G}10`, display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendChat(); }}
                    placeholder="Message…" className="font-space w-full bg-transparent outline-none"
                    style={{ flex: 1, fontSize: '11px', padding: '6px 10px', border: `1px solid ${G}20`, borderRadius: '6px', color: '#e8e8e8', background: `${G}03` }} />
                  <button onClick={sendChat} className="font-orbitron transition-all" style={{ padding: '6px 10px', fontSize: '10px', cursor: 'pointer', borderRadius: '6px', background: `${G}18`, border: `1px solid ${G}44`, color: G, flexShrink: 0 }}>→</button>
                </div>
              </BentoCard>
            </div>
          </>
        ) : (
          /* ═══ AUCUN STREAM ═══ */
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ maxWidth: '420px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
              <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: `${G}0a`, border: `2px solid ${G}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${G}12` }}>
                <span style={{ fontSize: '40px', opacity: 0.4 }}>🎧</span>
              </div>
              <div>
                <p className="font-orbitron" style={{ fontSize: '16px', letterSpacing: '0.3em', color: '#e8e8e844', marginBottom: '8px' }}>AUCUN STREAM ACTIF</p>
                <p className="font-space" style={{ fontSize: '12px', color: '#e8e8e822', lineHeight: 1.6 }}>Aucun DJ en live pour le moment.<br/>Revenez plus tard ou activez les notifications.</p>
              </div>
              <div style={{ height: '1px', width: '100%', background: `linear-gradient(90deg, transparent, ${G}22, transparent)` }} />
              <a href="/live" className="font-orbitron transition-all" style={{ padding: '14px 32px', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '8px', background: `${G}0d`, border: `1px solid ${G}33`, color: G, textDecoration: 'none', display: 'inline-block' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = `${G}1a`}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = `${G}0d`}>
                🎵 ÉCOUTER LA RADIO
              </a>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes live-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes live-glow { 0%,100%{box-shadow:0 0 60px ${R}22,inset 0 0 30px ${R}08} 50%{box-shadow:0 0 80px ${R}44,inset 0 0 40px ${R}14} }
        @keyframes live-ring { 0%,100%{transform:scale(1);opacity:0.3} 50%{transform:scale(1.08);opacity:0.1} }
      `}} />
    </div>
  );
}
