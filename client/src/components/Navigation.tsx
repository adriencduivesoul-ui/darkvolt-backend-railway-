/* ============================================================
   DARKVOLT — NAVIGATION
   Design: Floating minimal nav with neon accents
   Features: Scroll-aware transparency, mobile menu, logo
   ============================================================ */

import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';

export default function Navigation() {
  const [location, navigate] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const goToSection = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (href.startsWith('/')) {
      navigate(href);
    } else if (location === '/') {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      sessionStorage.setItem('scrollTo', href);
      navigate('/');
    }
  };

  const navLinks = [
    { label: t('nav.live'), href: '#player' },
    { label: t('nav.univers'), href: '#features' },
    { label: t('nav.shows'), href: '#shows' },
    { label: 'Underground News', href: '/blog' },
    { label: t('nav.artiste'), href: '/artistes' },
    { label: t('nav.contact'), href: '/contact' },
  ];

  const hdrBg  = scrolled ? 'rgba(5,5,5,0.96)' : 'rgba(5,5,5,0.0)';
  const hdrBg2 = scrolled ? 'rgba(5,5,5,0.92)' : 'rgba(5,5,5,0.72)';

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? 'rgba(5,5,5,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(57,255,20,0.1)' : '1px solid transparent',
        boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.5)' : 'none',
        overflow: 'visible',
      }}
    >
      <div className="container relative flex items-center h-16">

        {/* ── LEFT: nav links ───────────────────────────────── */}
        <div className="hidden md:flex items-center gap-7 flex-1">
          {navLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              onClick={goToSection(link.href)}
              className="font-orbitron text-xs font-medium tracking-[0.2em] uppercase transition-all duration-300"
              style={{ color: '#e8e8e877' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.color = '#39FF14';
                (e.currentTarget as HTMLAnchorElement).style.textShadow = '0 0 10px #39FF14';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.color = '#e8e8e877';
                (e.currentTarget as HTMLAnchorElement).style.textShadow = 'none';
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* ── CENTRE: Logo badge — fused with header, overflows below ── */}
        <a
          href="#hero"
          onClick={goToSection('#hero')}
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            top: -5,
            zIndex: 70,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textDecoration: 'none',
            /* Shield shape — same bg as header, no border */
            clipPath: 'polygon(0 0, 100% 0, 100% 65%, 50% 100%, 0 65%)',
            background: scrolled ? 'rgba(5,5,5,0.95)' : 'transparent',
            backdropFilter: scrolled ? 'blur(20px)' : 'none',
            width: '148px',
            height: '108px',
            justifyContent: 'flex-start',
            paddingTop: '30px',
            transition: 'background 0.5s ease, backdrop-filter 0.5s ease',
          }}
        >
          <img
            src="/img/DarkVolt.png"
            alt="DarkVolt"
            style={{
              height: '66px',
              filter: 'drop-shadow(0 0 6px rgba(57,255,20,0.5))',
              transition: 'filter 0.3s ease',
              userSelect: 'none',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLImageElement).style.filter = 'drop-shadow(0 0 18px #39FF14)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLImageElement).style.filter = 'drop-shadow(0 0 6px rgba(57,255,20,0.5))';
            }}
          />
        </a>

        {/* ── RIGHT: Live indicator + CTA buttons ───────────── */}
        <div className="hidden md:flex items-center gap-4 flex-1 justify-end">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: '#FF1A1A', animation: 'live-dot 1.5s ease-in-out infinite', boxShadow: '0 0 6px #FF1A1A' }} />
            <span className="font-mono-space text-xs tracking-widest" style={{ color: '#FF1A1A88' }}>LIVE</span>
          </div>
          <a
            href="#player"
            onClick={goToSection('#player')}
            className="font-orbitron font-bold text-xs tracking-[0.2em] uppercase px-5 py-2.5 transition-all duration-300"
            style={{ background: 'transparent', border: '1px solid #39FF14', color: '#39FF14', boxShadow: '0 0 8px #39FF1444', clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#39FF14'; (e.currentTarget as HTMLAnchorElement).style.color = '#050505'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 20px #39FF14'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = '#39FF14'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 8px #39FF1444'; }}
          >
            {t('nav.listen')}
          </a>
          <button
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/auth')}
            className="font-orbitron font-bold text-xs tracking-[0.2em] uppercase px-5 py-2.5 transition-all duration-300"
            style={{ background: 'transparent', border: '1px solid rgba(255,26,26,0.6)', color: '#FF1A1A88', clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FF1A1A'; (e.currentTarget as HTMLButtonElement).style.color = '#050505'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px #FF1A1A'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#FF1A1A88'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
          >
            {isAuthenticated ? 'MON COMPTE' : t('nav.login')}
          </button>
          <LanguageSwitcher />
        </div>

        {/* Mobile: left — hamburger | right — hidden (logo is centered) */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 ml-auto"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {[0, 1, 2].map(i => (
            <div key={i} className="h-[2px] transition-all duration-300"
              style={{ width: i === 1 ? '20px' : '28px', background: '#39FF14', boxShadow: '0 0 6px #39FF14' }}
            />
          ))}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t"
          style={{
            background: 'rgba(5,5,5,0.98)',
            borderColor: 'rgba(57,255,20,0.1)',
          }}
        >
          <div className="container py-4 flex flex-col gap-4">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="font-orbitron text-sm tracking-[0.2em] uppercase py-2"
                style={{ color: '#e8e8e8' }}
                onClick={(e) => { goToSection(link.href)(e); setMobileOpen(false); }}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2" style={{ borderTop: '1px solid rgba(57,255,20,0.1)' }}>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
