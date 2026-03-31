import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { getDiscordOAuthUrl } from '../utils/discord';

const G = '#39FF14';
const R = '#FF1A1A';

type Tab = 'login' | 'register' | 'guest';

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { login, register, loginAsGuest, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (isAuthenticated) { navigate('/dashboard'); return; }
    setTimeout(() => setVisible(true), 80);
  }, [isAuthenticated]);

  const [discordLoading, setDiscordLoading] = useState(false);
  const [discordError, setDiscordError] = useState('');

  const handleDiscordLogin = async () => {
    setDiscordLoading(true);
    setDiscordError('');
    try {
      const url = await getDiscordOAuthUrl();
      window.location.href = url;
    } catch (err) {
      setDiscordError(err instanceof Error ? err.message : 'Erreur Discord');
      setDiscordLoading(false);
    }
  };

  // Login state
  const [lEmail, setLEmail] = useState('');
  const [lPass, setLPass] = useState('');
  const [lError, setLError] = useState('');
  const [lLoading, setLLoading] = useState(false);

  // Register state
  const [rName, setRName] = useState('');
  const [rEmail, setREmail] = useState('');
  const [rPass, setRPass] = useState('');
  const [rRole, setRRole] = useState<'user' | 'streamer'>('user');
  const [rError, setRError] = useState('');
  const [rLoading, setRLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLLoading(true); setLError('');
    try {
      const res = await login(lEmail, lPass);
      if (res.success) navigate('/dashboard');
      else { setLError(res.error || 'Erreur'); }
    } catch (error) {
      setLError('Erreur de connexion');
    } finally {
      setLLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRLoading(true); setRError('');
    try {
      const res = await register(rName, rEmail, rPass, rRole);
      if (res.success) navigate('/dashboard');
      else { setRError(res.error || 'Erreur'); }
    } catch (error) {
      setRError('Erreur d\'inscription');
    } finally {
      setRLoading(false);
    }
  };

  const handleGuest = () => {
    loginAsGuest();
    navigate('/dashboard');
  };

  const CLIP_SM  = `polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))`;
  const CLIP_MD  = `polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))`;
  const CLIP_LG  = `polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px))`;

  const inputStyle: React.CSSProperties = {
    background: '#060606',
    border: `1px solid rgba(57,255,20,0.18)`,
    color: '#e8e8e8',
    padding: '13px 16px',
    width: '100%',
    fontFamily: 'Space Grotesk, sans-serif',
    fontSize: '14px',
    outline: 'none',
    clipPath: CLIP_SM,
    cursor: 'none',
    transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'login',    label: t('auth.tabLogin') },
    { key: 'register', label: t('auth.tabRegister') },
    { key: 'guest',    label: t('auth.tabGuest') },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: '#050505', cursor: 'none' }}>

      {/* ══ LEFT PANEL — Branding ══ */}
      <div
        className="hidden lg:flex flex-col items-center justify-center w-1/2 relative overflow-hidden"
        style={{ borderRight: '1px solid rgba(57,255,20,0.07)' }}
      >
        {/* Scan lines */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(57,255,20,0.012) 3px, rgba(57,255,20,0.012) 4px)',
        }} />
        {/* Vertical accent lines */}
        {[10, 13, 16].map((p, i) => (
          <div key={i} className="absolute inset-y-0 pointer-events-none" style={{
            left: `${p}%`, width: '1px',
            background: `linear-gradient(180deg, transparent, rgba(57,255,20,${0.07 - i * 0.02}), transparent)`,
          }} />
        ))}
        {[84, 87, 90].map((p, i) => (
          <div key={i} className="absolute inset-y-0 pointer-events-none" style={{
            left: `${p}%`, width: '1px',
            background: `linear-gradient(180deg, transparent, rgba(255,26,26,${0.05 - i * 0.015}), transparent)`,
          }} />
        ))}
        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(57,255,20,0.04) 0%, transparent 70%)',
        }} />
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
          height: '40%',
          background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(255,26,26,0.05) 0%, transparent 70%)',
        }} />

        <div
          className="relative flex flex-col items-center gap-8 text-center px-14"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.2s' }}
        >
          {/* Tag */}
          <div className="flex items-center gap-3">
            <div className="h-px w-8" style={{ background: `linear-gradient(90deg, transparent, rgba(57,255,20,0.5))` }} />
            <span className="font-orbitron text-[9px] tracking-[0.4em] uppercase" style={{ color: 'rgba(57,255,20,0.45)' }}>
              WEB RADIO
            </span>
            <div className="h-px w-8" style={{ background: `linear-gradient(90deg, rgba(57,255,20,0.5), transparent)` }} />
          </div>

          <img
            src="/img/DarkVolt.png"
            alt="DarkVolt"
            style={{ width: '260px', filter: 'drop-shadow(0 0 28px rgba(57,255,20,0.6)) drop-shadow(0 0 60px rgba(255,26,26,0.2))' }}
          />

          {/* Divider */}
          <div className="w-full" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(57,255,20,0.2), transparent)' }} />

          <div className="flex flex-col gap-2">
            <p className="font-orbitron text-[10px] tracking-[0.45em] uppercase" style={{ color: 'rgba(57,255,20,0.5)' }}>
              {t('auth.tagline')}
            </p>
            <p className="font-space text-sm leading-relaxed text-center mx-auto max-w-[260px]" style={{ color: '#e8e8e840' }}>
              {t('auth.description')}
            </p>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6">
            {[{ v: '24/7', l: 'DIFFUSION' }, { v: 'FREE', l: 'ACCÈS' }, { v: 'LIVE', l: 'SESSIONS' }].map(({ v, l }) => (
              <div key={l} className="flex flex-col items-center gap-1">
                <span className="font-orbitron font-black text-lg" style={{ color: G, textShadow: `0 0 16px ${G}55` }}>{v}</span>
                <span className="font-orbitron text-[8px] tracking-[0.3em] uppercase" style={{ color: '#e8e8e826' }}>{l}</span>
              </div>
            ))}
          </div>

          {/* Live badge */}
          <div
            className="flex items-center gap-3 px-5 py-2.5"
            style={{ clipPath: CLIP_SM, border: '1px solid rgba(255,26,26,0.22)', background: 'rgba(255,26,26,0.04)' }}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: R, animation: 'live-dot 1.5s ease-in-out infinite', boxShadow: `0 0 6px ${R}` }} />
            <span className="font-orbitron text-[10px] tracking-[0.3em] uppercase" style={{ color: 'rgba(255,26,26,0.6)' }}>{t('auth.signalActive')}</span>
          </div>
        </div>
      </div>

      {/* ══ RIGHT PANEL — Form ══ */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Scan lines */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(57,255,20,0.008) 3px, rgba(57,255,20,0.008) 4px)',
        }} />

        {/* Back link */}
        <a
          href="/"
          className="absolute top-6 left-6 font-orbitron text-[10px] tracking-[0.25em] uppercase flex items-center gap-2 transition-all duration-200"
          style={{ color: '#e8e8e828', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = G)}
          onMouseLeave={e => (e.currentTarget.style.color = '#e8e8e828')}
        >
          {t('auth.back')}
        </a>

        {/* Mobile logo */}
        <div className="lg:hidden mb-8" style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.8s ease' }}>
          <img src="/img/DarkVolt.png" alt="DarkVolt" style={{ width: '150px', filter: `drop-shadow(0 0 16px ${G}88)` }} />
        </div>

        <div
          className="w-full max-w-sm"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s' }}
        >
          {/* Header tag */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-6" style={{ background: `linear-gradient(90deg, ${G}55, transparent)` }} />
            <span className="font-orbitron text-[9px] tracking-[0.4em] uppercase" style={{ color: `${G}55` }}>
              ACCÈS SYSTÈME
            </span>
          </div>

          {/* Tagline */}
          <p className="font-space text-sm leading-relaxed text-center mb-6" style={{ color: '#e8e8e840' }}>
            {t('auth.description')}
          </p>

          {/* ── Tab selector ── */}
          <div className="flex gap-1.5 mb-7">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className="flex-1 font-orbitron text-[10px] tracking-[0.18em] uppercase py-3 transition-all duration-300"
                style={{
                  clipPath: CLIP_SM,
                  background: tab === tb.key ? G : 'rgba(57,255,20,0.06)',
                  border: `1px solid ${tab === tb.key ? G : 'rgba(57,255,20,0.18)'}`,
                  color: tab === tb.key ? '#050505' : `${G}55`,
                  fontWeight: tab === tb.key ? '700' : '400',
                  boxShadow: tab === tb.key ? `0 0 18px ${G}44` : 'none',
                  cursor: 'none',
                }}
              >
                {tb.label}
              </button>
            ))}
          </div>

          {/* ══ LOGIN FORM ══ */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="font-orbitron text-[10px] tracking-[0.25em] uppercase block mb-2" style={{ color: `${G}55` }}>
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  value={lEmail}
                  onChange={e => setLEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = `${G}77`; e.currentTarget.style.boxShadow = `0 0 14px rgba(57,255,20,0.14)`; }}
                  onBlur={e =>  { e.currentTarget.style.borderColor = 'rgba(57,255,20,0.18)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label className="font-orbitron text-[10px] tracking-[0.25em] uppercase block mb-2" style={{ color: `${G}55` }}>
                  {t('auth.password')}
                </label>
                <input
                  type="password"
                  value={lPass}
                  onChange={e => setLPass(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = `${G}77`; e.currentTarget.style.boxShadow = `0 0 14px rgba(57,255,20,0.14)`; }}
                  onBlur={e =>  { e.currentTarget.style.borderColor = 'rgba(57,255,20,0.18)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              {lError && <p className="font-space text-xs flex items-center gap-2" style={{ color: R }}>⚠ {lError}</p>}

              <button
                type="submit"
                disabled={lLoading}
                className="font-orbitron font-bold text-xs tracking-[0.25em] uppercase py-4 mt-1 transition-all duration-300"
                style={{
                  clipPath: CLIP_MD,
                  background: lLoading ? `${G}44` : G,
                  color: '#050505',
                  border: 'none',
                  boxShadow: lLoading ? 'none' : `0 0 24px ${G}55`,
                  cursor: 'none',
                }}
              >
                {lLoading ? t('auth.loggingIn') : t('auth.loginBtn')}
              </button>

              {/* Séparateur */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <span className="font-orbitron text-[9px] tracking-[0.25em] uppercase" style={{ color: '#e8e8e828' }}>{t('auth.orSeparator')}</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>

              {/* Discord */}
              {discordError && <p className="font-space text-xs" style={{ color: R }}>⚠ {discordError}</p>}
              <button
                type="button"
                onClick={handleDiscordLogin}
                disabled={discordLoading}
                className="font-orbitron font-bold text-[10px] tracking-[0.2em] uppercase py-4 flex items-center justify-center gap-3 transition-all duration-300"
                style={{
                  clipPath: CLIP_MD,
                  background: 'transparent',
                  border: `1px solid ${discordLoading ? 'rgba(57,255,20,0.15)' : 'rgba(57,255,20,0.35)'}`,
                  color: discordLoading ? `${G}33` : `${G}77`,
                  cursor: 'none',
                }}
                onMouseEnter={e => { if (!discordLoading) { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = G; b.style.color = G; b.style.boxShadow = `0 0 16px ${G}22`; }}}
                onMouseLeave={e => { if (!discordLoading) { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(57,255,20,0.35)'; b.style.color = `${G}77`; b.style.boxShadow = 'none'; }}}
              >
                <svg width="18" height="14" viewBox="0 0 20 15" fill="currentColor" style={{ opacity: discordLoading ? 0.3 : 0.7, flexShrink: 0 }}>
                  <path d="M16.93 1.24A16.37 16.37 0 0 0 12.86 0c-.19.33-.4.78-.55 1.13a15.18 15.18 0 0 0-4.61 0C7.55.78 7.33.33 7.14 0A16.4 16.4 0 0 0 3.07 1.25C.44 5.28-.27 9.21.08 13.08a16.56 16.56 0 0 0 5.06 2.58c.41-.56.77-1.15 1.08-1.77a10.7 10.7 0 0 1-1.7-.82c.14-.1.28-.21.41-.32a11.83 11.83 0 0 0 10.14 0c.13.11.27.22.41.32-.54.32-1.12.6-1.71.82.31.62.67 1.21 1.08 1.77a16.5 16.5 0 0 0 5.07-2.58c.42-4.43-.72-8.32-3.09-11.84ZM6.68 10.7c-1 0-1.82-.93-1.82-2.07s.8-2.08 1.82-2.08 1.84.93 1.82 2.08c0 1.14-.8 2.07-1.82 2.07Zm6.64 0c-1 0-1.82-.93-1.82-2.07s.8-2.08 1.82-2.08 1.83.93 1.82 2.08c0 1.14-.8 2.07-1.82 2.07Z"/>
                </svg>
                {discordLoading ? t('auth.discordRedirecting') : t('auth.discordContinue')}
              </button>

              <p className="font-space text-xs text-center" style={{ color: '#e8e8e828' }}>
                {t('auth.noAccount')}{' '}
                <button type="button" onClick={() => setTab('register')} style={{ color: `${G}77`, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {t('auth.signUp')}
                </button>
              </p>
            </form>
          )}

          {/* ══ REGISTER FORM ══ */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div>
                <label className="font-orbitron text-[10px] tracking-[0.25em] uppercase block mb-2" style={{ color: `${G}55` }}>{t('auth.username')}</label>
                <input type="text" value={rName} onChange={e => setRName(e.target.value)} placeholder="DarkAgent_42" required style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = `${G}77`; e.currentTarget.style.boxShadow = `0 0 14px rgba(57,255,20,0.14)`; }}
                  onBlur={e =>  { e.currentTarget.style.borderColor = 'rgba(57,255,20,0.18)'; e.currentTarget.style.boxShadow = 'none'; }} />
              </div>
              <div>
                <label className="font-orbitron text-[10px] tracking-[0.25em] uppercase block mb-2" style={{ color: `${G}55` }}>{t('auth.email')}</label>
                <input type="email" value={rEmail} onChange={e => setREmail(e.target.value)} placeholder="votre@email.com" required style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = `${G}77`; e.currentTarget.style.boxShadow = `0 0 14px rgba(57,255,20,0.14)`; }}
                  onBlur={e =>  { e.currentTarget.style.borderColor = 'rgba(57,255,20,0.18)'; e.currentTarget.style.boxShadow = 'none'; }} />
              </div>
              <div>
                <label className="font-orbitron text-[10px] tracking-[0.25em] uppercase block mb-2" style={{ color: `${G}55` }}>{t('auth.password')}</label>
                <input type="password" value={rPass} onChange={e => setRPass(e.target.value)} placeholder="min 6 caractères" required style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = `${G}77`; e.currentTarget.style.boxShadow = `0 0 14px rgba(57,255,20,0.14)`; }}
                  onBlur={e =>  { e.currentTarget.style.borderColor = 'rgba(57,255,20,0.18)'; e.currentTarget.style.boxShadow = 'none'; }} />
              </div>

              {/* Role selector */}
              <div>
                <label className="font-orbitron text-[10px] tracking-[0.25em] uppercase block mb-2" style={{ color: `${G}55` }}>{t('auth.profile')}</label>
                <div className="flex gap-2">
                  {(['user', 'streamer'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRRole(r)}
                      className="flex-1 font-orbitron text-[10px] tracking-[0.15em] uppercase py-3 transition-all duration-200"
                      style={{
                        clipPath: CLIP_SM,
                        background: rRole === r ? `${G}18` : '#060606',
                        border: `1px solid ${rRole === r ? G : 'rgba(57,255,20,0.15)'}`,
                        color: rRole === r ? G : '#e8e8e828',
                        boxShadow: rRole === r ? `0 0 12px ${G}33` : 'none',
                        cursor: 'none',
                      }}
                    >
                      {r === 'user' ? t('auth.userRole') : t('auth.streamerRole')}
                    </button>
                  ))}
                </div>
              </div>

              {rError && <p className="font-space text-xs" style={{ color: R }}>⚠ {rError}</p>}

              <button
                type="submit"
                disabled={rLoading}
                className="font-orbitron font-bold text-xs tracking-[0.25em] uppercase py-4 mt-1 transition-all duration-300"
                style={{
                  clipPath: CLIP_MD,
                  background: rLoading ? `${G}44` : G,
                  color: '#050505',
                  border: 'none',
                  boxShadow: rLoading ? 'none' : `0 0 24px ${G}55`,
                  cursor: 'none',
                }}
              >
                {rLoading ? t('auth.registering') : t('auth.registerBtn')}
              </button>
            </form>
          )}

          {/* ══ GUEST ══ */}
          {tab === 'guest' && (
            <div className="flex flex-col items-center gap-5 text-center py-2">
              {/* Icon badge */}
              <div
                className="flex items-center justify-center w-14 h-14"
                style={{ clipPath: CLIP_MD, background: 'rgba(57,255,20,0.06)', border: `1px solid rgba(57,255,20,0.2)` }}
              >
                <span style={{ fontSize: '1.6rem' }}>👁️</span>
              </div>

              <div>
                <h3 className="font-orbitron font-black text-sm tracking-[0.2em] uppercase mb-2" style={{ color: '#e8e8e8' }}>
                  {t('auth.guestTitle')}
                </h3>
                <p className="font-space text-sm leading-relaxed" style={{ color: '#e8e8e844' }}>
                  {t('auth.guestDesc')}
                </p>
              </div>

              {/* Features list */}
              <div
                className="flex flex-col gap-2.5 w-full text-left p-4"
                style={{ clipPath: CLIP_SM, background: 'rgba(57,255,20,0.04)', border: '1px solid rgba(57,255,20,0.1)' }}
              >
                {(t('auth.guestFeatures', { returnObjects: true }) as string[]).map((label, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: i < 2 ? G : '#e8e8e822' }} />
                    <p className="font-space text-xs" style={{ color: i < 2 ? `${G}88` : '#e8e8e830' }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleGuest}
                className="w-full font-orbitron font-bold text-xs tracking-[0.25em] uppercase py-4 transition-all duration-300"
                style={{
                  clipPath: CLIP_MD,
                  background: 'transparent',
                  border: `1px solid rgba(57,255,20,0.35)`,
                  color: `${G}77`,
                  cursor: 'none',
                }}
                onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = G; b.style.color = G; b.style.boxShadow = `0 0 18px ${G}33`; }}
                onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(57,255,20,0.35)'; b.style.color = `${G}77`; b.style.boxShadow = 'none'; }}
              >
                {t('auth.enterAsGuest')}
              </button>

              <p className="font-space text-[11px]" style={{ color: '#e8e8e820' }}>
                {t('auth.guestSession')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
