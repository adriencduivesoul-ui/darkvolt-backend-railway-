/* ============================================================
   DARKVOLT — DISCORD OAUTH CALLBACK
   Reçoit ?code= de Discord, échange le token (PKCE), récupère
   le profil.
   - Compte existant → connexion directe → /dashboard
   - Nouveau compte  → sélection du rôle → création → /dashboard
   ============================================================ */

import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { exchangeDiscordCode, fetchDiscordProfile } from '../utils/discord';
import type { DiscordProfile } from '../utils/discord';

type Status = 'loading' | 'role-select' | 'creating' | 'error';

const CLIP = (s = 12) =>
  `polygon(0 0, calc(100% - ${s}px) 0, 100% ${s}px, 100% 100%, ${s}px 100%, 0 calc(100% - ${s}px))`;

export default function AuthDiscordCallback() {
  const [, navigate]                       = useLocation();
  const { loginWithDiscord, discordUserExists } = useAuth();
  const { t } = useTranslation();

  const [status, setStatus]     = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [profile, setProfile]   = useState<DiscordProfile | null>(null);
  const [role, setRole]         = useState<'user' | 'streamer'>('user');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code   = params.get('code');
    const error  = params.get('error');

    if (error || !code) {
      setErrorMsg(error === 'access_denied'
        ? t('discord.errorDenied')
        : t('discord.errorMissing'));
      setStatus('error');
      return;
    }

    (async () => {
      try {
        const token   = await exchangeDiscordCode(code);
        const fetched = await fetchDiscordProfile(token);

        if (discordUserExists(fetched)) {
          loginWithDiscord(fetched);
          navigate('/dashboard');
        } else {
          setProfile(fetched);
          setStatus('role-select');
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : t('discord.errorUnknown'));
        setStatus('error');
      }
    })();
  }, []);

  const handleConfirm = () => {
    if (!profile) return;
    setStatus('creating');
    loginWithDiscord(profile, role);
    navigate('/dashboard');
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 px-4"
      style={{ background: '#050505', cursor: 'none' }}
    >
      {/* Logo */}
      <img
        src="/img/DarkVolt.png"
        alt="DarkVolt"
        style={{ width: '180px', filter: 'drop-shadow(0 0 20px #39FF14aa)' }}
      />

      {/* ── Chargement ── */}
      {(status === 'loading' || status === 'creating') && (
        <div className="flex flex-col items-center gap-4">
          <div style={{
            width: '40px', height: '40px',
            border: '2px solid rgba(57,255,20,0.15)',
            borderTop: '2px solid #39FF14',
            borderRadius: '50%',
            animation: 'spin 0.9s linear infinite',
          }} />
          <p className="font-orbitron text-xs tracking-[0.4em] uppercase" style={{ color: '#39FF1888' }}>
            {status === 'creating' ? t('discord.creating') : t('discord.loading')}
          </p>
        </div>
      )}

      {/* ── Sélection du rôle (nouveau compte) ── */}
      {status === 'role-select' && profile && (
        <div
          className="flex flex-col gap-6 w-full max-w-sm"
          style={{
            opacity: 1,
            animation: 'fadeIn 0.4s ease',
          }}
        >
          {/* Avatar + pseudo Discord */}
          <div className="flex flex-col items-center gap-3">
            {profile.avatar && (
              <img
                src={`https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=64`}
                alt="avatar"
                style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid rgba(57,255,20,0.3)' }}
              />
            )}
            <p className="font-orbitron text-sm tracking-[0.2em] uppercase" style={{ color: '#e8e8e8' }}>
              {profile.global_name ?? profile.username}
            </p>
            <p className="font-space text-xs" style={{ color: '#e8e8e844' }}>{t('discord.verified')}</p>
          </div>

          {/* Titre */}
          <div className="text-center" style={{ borderTop: '1px solid rgba(57,255,20,0.1)', paddingTop: '1.5rem' }}>
            <p className="font-orbitron text-xs tracking-[0.3em] uppercase mb-1" style={{ color: '#39FF1466' }}>
              {t('discord.welcome')}
            </p>
            <p className="font-orbitron font-bold text-base tracking-[0.15em] uppercase" style={{ color: '#e8e8e8' }}>
              {t('discord.chooseProfile')}
            </p>
          </div>

          {/* Cards de rôle */}
          <div className="flex flex-col gap-3">
            {/* Auditeur */}
            <button
              type="button"
              onClick={() => setRole('user')}
              className="flex items-start gap-4 p-5 text-left transition-all duration-250"
              style={{
                background: role === 'user' ? 'rgba(57,255,20,0.07)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${role === 'user' ? '#39FF14' : 'rgba(255,255,255,0.08)'}`,
                clipPath: CLIP(10),
                boxShadow: role === 'user' ? '0 0 16px rgba(57,255,20,0.15)' : 'none',
              }}
            >
              <span style={{ fontSize: '2rem', lineHeight: 1 }}>🎧</span>
              <div>
                <p className="font-orbitron font-bold text-sm tracking-[0.15em] uppercase mb-1"
                  style={{ color: role === 'user' ? '#39FF14' : '#e8e8e8aa' }}>
                  {t('discord.listenerTitle')}
                </p>
                <p className="font-space text-xs leading-relaxed" style={{ color: '#e8e8e855' }}>
                  {t('discord.listenerDesc')}
                </p>
              </div>
              {role === 'user' && (
                <div className="ml-auto flex-shrink-0 mt-1" style={{ color: '#39FF14', fontSize: '14px' }}>✔</div>
              )}
            </button>

            {/* Streamer */}
            <button
              type="button"
              onClick={() => setRole('streamer')}
              className="flex items-start gap-4 p-5 text-left transition-all duration-250"
              style={{
                background: role === 'streamer' ? 'rgba(255,26,26,0.07)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${role === 'streamer' ? '#FF1A1A' : 'rgba(255,255,255,0.08)'}`,
                clipPath: CLIP(10),
                boxShadow: role === 'streamer' ? '0 0 16px rgba(255,26,26,0.15)' : 'none',
              }}
            >
              <span style={{ fontSize: '2rem', lineHeight: 1 }}>🎛️</span>
              <div>
                <p className="font-orbitron font-bold text-sm tracking-[0.15em] uppercase mb-1"
                  style={{ color: role === 'streamer' ? '#FF1A1A' : '#e8e8e8aa' }}>
                  {t('discord.streamerTitle')}
                </p>
                <p className="font-space text-xs leading-relaxed" style={{ color: '#e8e8e855' }}>
                  {t('discord.streamerDesc')}
                </p>
              </div>
              {role === 'streamer' && (
                <div className="ml-auto flex-shrink-0 mt-1" style={{ color: '#FF1A1A', fontSize: '14px' }}>✔</div>
              )}
            </button>
          </div>

          {/* Bouton confirmer */}
          <button
            type="button"
            onClick={handleConfirm}
            className="font-orbitron font-bold text-sm tracking-[0.2em] uppercase py-4 transition-all duration-300"
            style={{
              background: '#39FF14',
              color: '#050505',
              border: 'none',
              clipPath: CLIP(10),
              boxShadow: '0 0 20px #39FF1466',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 32px #39FF14aa'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px #39FF1466'; }}
          >
            {t('discord.createAccount')}
          </button>
        </div>
      )}

      {/* ── Erreur ── */}
      {status === 'error' && (
        <div
          className="flex flex-col items-center gap-5 p-8 max-w-sm text-center"
          style={{
            border: '1px solid rgba(255,26,26,0.3)',
            background: 'rgba(255,26,26,0.04)',
            clipPath: CLIP(),
          }}
        >
          <span style={{ fontSize: '2rem' }}>⚠️</span>
          <p className="font-orbitron text-xs tracking-[0.2em] uppercase" style={{ color: '#FF1A1A' }}>
            {t('discord.errorTitle')}
          </p>
          <p className="font-space text-sm leading-relaxed" style={{ color: '#e8e8e866' }}>
            {errorMsg}
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="font-orbitron text-xs tracking-[0.2em] uppercase px-6 py-3 transition-all duration-300"
            style={{ border: '1px solid rgba(57,255,20,0.4)', color: '#39FF1488', background: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#39FF14'; (e.currentTarget as HTMLButtonElement).style.color = '#39FF14'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(57,255,20,0.4)'; (e.currentTarget as HTMLButtonElement).style.color = '#39FF1488'; }}
          >
            {t('discord.backToLogin')}
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
