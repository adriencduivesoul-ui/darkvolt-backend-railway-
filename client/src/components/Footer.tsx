/* ============================================================
   DARKVOLT — FOOTER
   Design: Dark minimal footer with neon accents
   Features: Logo, links, social, copyright
   ============================================================ */

import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  const platformLinks = [
    { label: t('footer.liveStream'), href: '/live' },
    { label: t('footer.archives'), href: '/archives' },
  ];
  const communityLinks = [
    { label: t('footer.discord'), href: 'https://discord.com/invite/yr25MqEN' },
    { label: t('footer.artists'), href: '/artistes' },
    { label: '🎧 RECRUTEMENT DJ', href: '/recrutement-dj' },
    { label: t('footer.submitMix'), href: '/soumettre-un-mix' },
  ];
  const legalLinks = [
    { label: t('footer.mentions'), href: '/mentions-legales' },
    { label: t('footer.cgu'), href: '/cgu' },
    { label: t('footer.privacy'), href: '/confidentialite' },
    { label: t('footer.contact'), href: '/contact' },
  ];
  const sections = [
    { title: t('footer.platform'), items: platformLinks },
    { title: t('footer.community'), items: communityLinks },
    { title: t('footer.legal'), items: legalLinks },
  ];

  const socials = [
    { name: 'DISCORD',   icon: '💬', href: 'https://discord.com/invite/yr25MqEN' },
    { name: 'INSTAGRAM', icon: '📸', href: 'https://www.instagram.com/darkvoltwebradio/' },
    { name: 'FACEBOOK',  icon: '📘', href: 'https://www.facebook.com/profile.php?id=61576726258105' },
  ];

  return (
    <footer
      id="contact"
      className="relative overflow-hidden"
      style={{ background: '#050505', borderTop: '1px solid rgba(57,255,20,0.08)' }}
    >
      {/* Top section */}
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <img
              src="/img/DarkVolt.png"
              alt="DarkVolt"
              style={{
                width: '200px',
                filter: 'drop-shadow(0 0 10px #39FF1444)',
              }}
            />
            <p
              className="font-space text-sm leading-relaxed max-w-xs"
              style={{ color: '#e8e8e844' }}
            >
              {t('footer.description')}
            </p>
            {/* Social links */}
            <div className="flex flex-wrap gap-3">
              {socials.map(social => (
                <a
                  key={social.name}
                  href={social.href}
                  target={social.href.startsWith('http') ? '_blank' : undefined}
                  rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="font-mono-space text-xs tracking-widest px-3 py-2 transition-all duration-300"
                  style={{
                    background: '#0a0a0a',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#e8e8e844',
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = '#39FF1444';
                    (e.currentTarget as HTMLAnchorElement).style.color = '#39FF14';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.08)';
                    (e.currentTarget as HTMLAnchorElement).style.color = '#e8e8e844';
                  }}
                >
                  {social.icon} {social.name}
                </a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          {sections.map(({ title, items }) => (
            <div key={title} className="flex flex-col gap-4">
              <h4
                className="font-orbitron font-bold text-xs tracking-[0.3em] uppercase"
                style={{ color: '#39FF1488' }}
              >
                {title}
              </h4>
              <ul className="flex flex-col gap-2">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="font-space text-sm transition-all duration-200"
                      style={{ color: '#e8e8e833' }}
                      onClick={e => {
                        if (href.startsWith('/')) {
                          e.preventDefault();
                          navigate(href);
                        }
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLAnchorElement).style.color = '#e8e8e8';
                        (e.currentTarget as HTMLAnchorElement).style.paddingLeft = '8px';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLAnchorElement).style.color = '#e8e8e833';
                        (e.currentTarget as HTMLAnchorElement).style.paddingLeft = '0';
                      }}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Signature Néo Création ─────────────────────────────────────── */}
      <div
        className="relative flex items-center justify-center py-6"
        style={{ borderTop: '1px solid rgba(57,255,20,0.06)' }}
      >
        {/* Rayons gauche */}
        <div className="absolute left-0 right-1/2 mr-40 pointer-events-none" style={{ height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(57,255,20,0.18) 60%, rgba(57,255,20,0.35) 100%)' }} />
        {/* Rayons droite */}
        <div className="absolute left-1/2 right-0 ml-40 pointer-events-none" style={{ height: '1px', background: 'linear-gradient(270deg, transparent 0%, rgba(57,255,20,0.18) 60%, rgba(57,255,20,0.35) 100%)' }} />

        <a
          href="https://www.néo-création.fr"
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex flex-col items-center gap-1.5 px-10 py-4 transition-all duration-500"
          style={{
            background: 'linear-gradient(160deg, rgba(57,255,20,0.03) 0%, rgba(5,5,5,1) 40%, rgba(255,26,26,0.03) 100%)',
            border: '1px solid rgba(57,255,20,0.15)',
            clipPath: 'polygon(14px 0%, 100% 0%, calc(100% - 14px) 100%, 0% 100%)',
            textDecoration: 'none',
            boxShadow: '0 0 40px rgba(57,255,20,0.04), inset 0 0 30px rgba(57,255,20,0.02)',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.borderColor = 'rgba(57,255,20,0.45)';
            el.style.boxShadow = '0 0 50px rgba(57,255,20,0.12), 0 0 80px rgba(255,26,26,0.06), inset 0 0 30px rgba(57,255,20,0.04)';
            el.style.background = 'linear-gradient(160deg, rgba(57,255,20,0.06) 0%, rgba(5,5,5,1) 40%, rgba(255,26,26,0.06) 100%)';
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.borderColor = 'rgba(57,255,20,0.15)';
            el.style.boxShadow = '0 0 40px rgba(57,255,20,0.04), inset 0 0 30px rgba(57,255,20,0.02)';
            el.style.background = 'linear-gradient(160deg, rgba(57,255,20,0.03) 0%, rgba(5,5,5,1) 40%, rgba(255,26,26,0.03) 100%)';
          }}
        >
          {/* Label */}
          <span
            className="font-mono-space uppercase tracking-[0.5em]"
            style={{ fontSize: '9px', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.5em' }}
          >
            {t('footer.designedBy')}
          </span>

          {/* Nom agence — gradient vert → rouge */}
          <span
            className="font-orbitron font-black tracking-[0.15em] uppercase"
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.35rem)',
              background: 'linear-gradient(90deg, #39FF14 0%, #b8ff80 45%, #FF6B35 75%, #FF1A1A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 12px rgba(57,255,20,0.5)) drop-shadow(0 0 24px rgba(255,26,26,0.25))',
            }}
          >
            NÉO CRÉATION
          </span>

          {/* URL */}
          <span
            className="font-mono-space tracking-[0.3em]"
            style={{ fontSize: '9px', color: 'rgba(57,255,20,0.4)' }}
          >
            www.néo-création.fr ↗
          </span>
        </a>
      </div>

      {/* Bottom bar */}
      <div
        className="border-t"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p
            className="font-mono-space text-xs tracking-widest"
            style={{ color: '#e8e8e822' }}
          >
            {t('footer.copyright')}
          </p>
          <div className="flex items-center gap-3">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#39FF14', animation: 'live-dot 2s ease-in-out infinite', boxShadow: '0 0 4px #39FF14' }}
            />
            <span className="font-mono-space text-xs" style={{ color: '#39FF1444' }}>
              {t('footer.signalActive')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
