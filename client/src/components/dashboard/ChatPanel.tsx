import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatSocket, ChatMessage } from '../../hooks/useChatSocket';
import { useAuth } from '../../contexts/AuthContext';

const EMOJIS = ['🔥', '⚡', '💀', '🎛️', '🌑', '👾', '🖤', '💚', '🩸', '🔊'];

const ROLE_COLOR: Record<string, string> = {
  streamer: '#FF1A1A',
  user: '#39FF14',
  guest: '#e8e8e855',
};

const ROLE_LABEL_KEYS: Record<string, string> = {
  streamer: 'streamer',
  user: 'user',
  guest: 'chat.roleGuest',
};

function timeAgo(ts: number) {
  const d = Math.floor((Date.now() - ts) / 1000);
  if (d < 60) return `${d}s`;
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  return `${Math.floor(d / 3600)}h`;
}

interface ChatPanelProps {
  compact?: boolean;
}

function RoleLabel({ role }: { role: string }) {
  const { t } = useTranslation();
  const key = ROLE_LABEL_KEYS[role];
  return <>{key === 'chat.roleGuest' ? t('chat.roleGuest') : key.toUpperCase()}</>;
}

export default function ChatPanel({ compact = false }: ChatPanelProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { messages, pinned, guestCooldown, sendMessage, deleteMessage, pinMessage, banUser, connected } = useChatSocket();
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [sendError, setSendError] = useState('');
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages.length]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const res = sendMessage(input, replyTo?.id);
    if (res.success) {
      setInput('');
      setReplyTo(null);
      setSendError('');
    } else if (res.error) {
      setSendError(res.error);
      setTimeout(() => setSendError(''), 3000);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === 'Escape') setReplyTo(null);
  };

  const isStreamer = user?.role === 'streamer';
  const isGuest = user?.role === 'guest';

  return (
    <div className="flex flex-col h-full" style={{ background: '#080808', border: '1px solid rgba(57,255,20,0.12)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(57,255,20,0.1)' }}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#39FF14', boxShadow: '0 0 6px #39FF14', animation: 'live-dot 2s ease-in-out infinite' }} />
          <span className="font-orbitron text-xs tracking-[0.25em] uppercase" style={{ color: '#39FF1488' }}>CHAT LIVE</span>
        </div>
        <span className="font-mono-space text-xs" style={{ color: '#e8e8e822' }}>{messages.length} msgs</span>
      </div>

      {/* Pinned message */}
      {pinned && (
        <div className="px-4 py-2 shrink-0 flex items-start gap-2" style={{ background: 'rgba(255,26,26,0.06)', borderBottom: '1px solid rgba(255,26,26,0.15)' }}>
          <span className="font-mono-space text-xs shrink-0" style={{ color: '#FF1A1A88' }}>📌</span>
          <p className="font-space text-xs" style={{ color: '#e8e8e8cc' }}>
            <span style={{ color: '#FF1A1A' }}>{pinned.username}</span>: {pinned.content}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1.5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#39FF1422 transparent' }}>
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="font-orbitron text-xs tracking-widest uppercase" style={{ color: '#e8e8e818' }}>PAS ENCORE DE MESSAGES</p>
          </div>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            className="group relative"
            onMouseEnter={() => setHoveredMsg(msg.id)}
            onMouseLeave={() => setHoveredMsg(null)}
          >
            {/* Reply indicator */}
            {msg.replyToUsername && (
              <div className="flex items-center gap-1 ml-3 mb-0.5" style={{ borderLeft: '2px solid rgba(57,255,20,0.2)', paddingLeft: '8px' }}>
                <span className="font-space text-xs" style={{ color: '#e8e8e833', fontSize: '10px' }}>↩ {msg.replyToUsername}</span>
              </div>
            )}

            <div className="flex items-start gap-2 px-2 py-1.5 rounded transition-all duration-150"
              style={{ background: hoveredMsg === msg.id ? 'rgba(57,255,20,0.04)' : 'transparent' }}>
              {/* Role indicator */}
              <div className="shrink-0 mt-0.5 w-1 h-1 rounded-full mt-2" style={{ background: ROLE_COLOR[msg.role] }} />

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-orbitron text-xs font-bold" style={{ color: ROLE_COLOR[msg.role], fontSize: '10px', letterSpacing: '0.1em' }}>
                    {msg.username}
                  </span>
                  {msg.role !== 'user' && (
                    <span className="font-mono-space" style={{ color: ROLE_COLOR[msg.role], fontSize: '9px', letterSpacing: '0.1em', flexShrink: 0 }}>
                      [<RoleLabel role={msg.role} />]
                    </span>
                  )}
                  <span className="font-mono-space" style={{ color: '#e8e8e822', fontSize: '9px' }}>{timeAgo(msg.timestamp)}</span>
                </div>
                <p className="font-space text-sm break-words" style={{ color: msg.role === 'streamer' ? '#FFe8e8' : '#e8e8e8cc', lineHeight: '1.4', fontSize: compact ? '12px' : '13px' }}>
                  {msg.content}
                </p>
              </div>

              {/* Actions on hover */}
              {hoveredMsg === msg.id && (
                <div className="flex items-center gap-1 shrink-0">
                  {!isGuest && (
                    <button
                      onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                      className="font-mono-space transition-all duration-150"
                      style={{ color: '#e8e8e833', fontSize: '10px', padding: '2px 4px', background: 'none', border: 'none', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#39FF14')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#e8e8e833')}
                    >↩</button>
                  )}
                  {isStreamer && (
                    <>
                      <button
                        onClick={() => pinMessage(msg.id)}
                        style={{ color: msg.pinned ? '#FF1A1A' : '#e8e8e833', fontSize: '10px', padding: '2px 4px', background: 'none', border: 'none', cursor: 'pointer' }}
                        title="Épingler"
                      >📌</button>
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        style={{ color: '#e8e8e833', fontSize: '10px', padding: '2px 4px', background: 'none', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#FF1A1A')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#e8e8e833')}
                        title="Supprimer"
                      >✕</button>
                      {msg.userId !== user?.id && (
                        <button
                          onClick={() => { if (confirm(`Bannir ${msg.username} ?`)) banUser(msg.userId, msg.username); }}
                          style={{ color: '#e8e8e833', fontSize: '10px', padding: '2px 4px', background: 'none', border: 'none', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#FF1A1A')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#e8e8e833')}
                          title="Bannir"
                        >🚫</button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 px-3 pb-3" style={{ borderTop: '1px solid rgba(57,255,20,0.08)', paddingTop: '0.75rem' }}>
        {/* Reply indicator */}
        {replyTo && (
          <div className="flex items-center justify-between mb-2 px-3 py-1.5" style={{ background: 'rgba(57,255,20,0.06)', border: '1px solid rgba(57,255,20,0.15)' }}>
            <span className="font-space text-xs" style={{ color: '#39FF1488' }}>{t('chat.replyTo')} <strong style={{ color: '#39FF14' }}>{replyTo.username}</strong></span>
            <button onClick={() => setReplyTo(null)} style={{ color: '#e8e8e844', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>✕</button>
          </div>
        )}

        {/* Guest limit warning */}
        {isGuest && (
          <div className="mb-2 px-3 py-1.5" style={{ background: 'rgba(255,26,26,0.04)', border: '1px solid rgba(255,26,26,0.1)' }}>
            <p className="font-mono-space" style={{ color: '#FF1A1A88', fontSize: '10px', letterSpacing: '0.1em' }}>
              {t('chat.guestLimit')}{guestCooldown > 0 ? ` — ${t('chat.guestWait', { s: guestCooldown })}` : ''}
            </p>
          </div>
        )}

        {sendError && (
          <p className="font-mono-space text-xs mb-2" style={{ color: '#FF1A1A' }}>⚠ {sendError}</p>
        )}

        <form onSubmit={handleSend} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={isGuest ? t('chat.placeholderGuest') : t('chat.placeholder')}
              maxLength={300}
              style={{
                flex: 1,
                background: '#0d0d0d',
                border: '1px solid rgba(57,255,20,0.15)',
                color: '#e8e8e8',
                padding: '8px 12px',
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '13px',
                outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#39FF1466')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(57,255,20,0.15)')}
            />
            {!isGuest && (
              <button
                type="button"
                onClick={() => setShowEmojis(p => !p)}
                style={{ background: showEmojis ? 'rgba(57,255,20,0.15)' : '#0d0d0d', border: '1px solid rgba(57,255,20,0.15)', color: '#e8e8e866', padding: '8px 10px', cursor: 'pointer', fontSize: '14px' }}
              >😀</button>
            )}
            <button
              type="submit"
              disabled={!input.trim() || (isGuest && guestCooldown > 0)}
              style={{
                background: input.trim() && !(isGuest && guestCooldown > 0) ? '#39FF14' : 'rgba(57,255,20,0.12)',
                color: input.trim() && !(isGuest && guestCooldown > 0) ? '#050505' : '#39FF1433',
                border: 'none',
                padding: '8px 16px',
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '0.1em',
                cursor: input.trim() && !(isGuest && guestCooldown > 0) ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
              }}
            >
              {isGuest && guestCooldown > 0 ? `${guestCooldown}s` : '▶'}
            </button>
          </div>

          {/* Emoji picker */}
          {showEmojis && !isGuest && (
            <div className="flex flex-wrap gap-1.5 p-2" style={{ background: '#0d0d0d', border: '1px solid rgba(57,255,20,0.1)' }}>
              {EMOJIS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => { setInput(p => p + e); setShowEmojis(false); inputRef.current?.focus(); }}
                  className="text-lg transition-all duration-150 hover:scale-125"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >{e}</button>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
