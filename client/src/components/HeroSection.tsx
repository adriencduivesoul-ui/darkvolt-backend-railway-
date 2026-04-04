/* ============================================================
   DARKVOLT — HERO SECTION
   Design: Fullscreen canvas particles + energy waveform
   Features: Particle system, glitch title, CTA buttons, scroll indicator
   ============================================================ */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import HeroWaveEffect from './HeroWaveEffect';
import LogoGLB from './LogoGLB';

export default function HeroSection() {
  const [, navigate] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [titleGlitch, setTitleGlitch] = useState(false);
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  const [streamIsLive, setStreamIsLive] = useState(false);
  const [streamTitle, setStreamTitle]   = useState('');
  const [streamViewers, setStreamViewers] = useState(0);

  const fetchStreamStatus = useCallback(async () => {
    try {
      const r = await fetch('/api/stream/status');
      if (r.ok) {
        const d = await r.json();
        setStreamIsLive(d.isLive);
        setStreamTitle(d.title || '');
        setStreamViewers(d.viewers || 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchStreamStatus();
    const iv = setInterval(fetchStreamStatus, 10000);
    return () => clearInterval(iv);
  }, [fetchStreamStatus]);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  // Glitch title interval
  useEffect(() => {
    const interval = setInterval(() => {
      setTitleGlitch(true);
      setTimeout(() => setTitleGlitch(false), 150);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Dark atmospheric smoke canvas — optimised (10 puffs, 30fps, half-res)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const SMOKE_FPS = 1000 / 30;
    const SCALE = 0.5; /* half-res, CSS upscale */

    const resize = () => {
      canvas.width  = Math.floor(window.innerWidth  * SCALE);
      canvas.height = Math.floor(window.innerHeight * SCALE);
    };
    resize();
    window.addEventListener('resize', resize);

    interface SmokePuff {
      x: number; y: number;
      vx: number; vy: number;
      radius: number;
      alpha: number;
      targetAlpha: number;
      life: number;
      maxLife: number;
      rChannel: number;
    }

    const createPuff = (): SmokePuff => ({
      /* coords in half-res space */
      x: Math.random() * canvas.width,
      y: canvas.height * 0.45 + Math.random() * canvas.height * 0.55,
      vx: (Math.random() - 0.5) * 0.22,
      vy: -(0.12 + Math.random() * 0.32),
      radius: 130 + Math.random() * 220,
      alpha: 0,
      targetAlpha: 0.022 + Math.random() * 0.042,
      life: 0,
      maxLife: 380 + Math.random() * 480,
      rChannel: 110 + Math.floor(Math.random() * 70),
    });

    const puffs: SmokePuff[] = Array.from({ length: 10 }, () => {
      const p = createPuff();
      p.life = Math.random() * p.maxLife;
      return p;
    });

    let lastSmoke = 0;
    const animate = (ts: number) => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = ts - lastSmoke;
      if (delta < SMOKE_FPS) return;
      lastSmoke = ts - (delta % SMOKE_FPS);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      puffs.forEach(puff => {
        puff.life++;
        puff.x += puff.vx;
        puff.y += puff.vy;

        const lr = puff.life / puff.maxLife;
        if (lr < 0.15) {
          puff.alpha = (lr / 0.15) * puff.targetAlpha;
        } else if (lr > 0.72) {
          puff.alpha = ((1 - lr) / 0.28) * puff.targetAlpha;
        } else {
          puff.alpha = puff.targetAlpha;
        }

        if (puff.life >= puff.maxLife || puff.y + puff.radius < 0) {
          Object.assign(puff, createPuff());
        }

        const grad = ctx.createRadialGradient(
          puff.x, puff.y, 0,
          puff.x, puff.y, puff.radius
        );
        grad.addColorStop(0, `rgba(${puff.rChannel}, 4, 4, ${puff.alpha})`);
        grad.addColorStop(0.42, `rgba(45, 1, 1, ${puff.alpha * 0.52})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(puff.x, puff.y, puff.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

    };
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden"
      style={{
        height: '100vh',
        minHeight: '600px',
        background: '#050505',
      }}
    >
      {/* Background image — Ken Burns smooth animation */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ opacity: 0.4 }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '-10%',
            backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663459027095/PGa3qKDyYA8FbJzpxztrVn/darkvolt-hero-bg-49YFA8uBvTLHgXnnuxKsBb.webp)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            animation: 'hero-ken-burns 20s ease-in-out infinite alternate',
            willChange: 'transform',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}
        />
      </div>

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, #050505 70%)',
        }}
      />

      {/* Smoke canvas — half-res CSS upscaled */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 2, width: '100%', height: '100%' }}
      />

      {/* Three.js audio-reactive wave effect */}
      <HeroWaveEffect />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4"
        style={{ gap: '2rem' }}
      >
        {/* Logo — 3D GLB model */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(-30px) scale(0.95)',
            transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <LogoGLB />
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
          }}
        >
          <p
            className="font-orbitron font-medium tracking-[0.5em] uppercase"
            style={{
              fontSize: 'clamp(0.7rem, 2vw, 1rem)',
              color: '#39FF14',
              textShadow: '0 0 20px #39FF14aa',
              letterSpacing: '0.5em',
            }}
          >
            {t('hero.tagline')}
          </p>
        </div>

        {/* CTA Buttons */}
        <div
          className="flex flex-wrap items-center justify-center gap-4"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s',
          }}
        >
          <a
            href="#player"
            className="group relative font-orbitron font-bold tracking-[0.2em] text-sm uppercase px-8 py-4 transition-all duration-300 overflow-hidden"
            style={{
              background: '#39FF14',
              color: '#050505',
              border: '1px solid #39FF14',
              boxShadow: '0 0 20px #39FF1488, 0 0 40px #39FF1444',
              clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 40px #39FF14, 0 0 80px #39FF1488';
              (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 20px #39FF1488, 0 0 40px #39FF1444';
              (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
            }}
          >
            {t('hero.listenLive')}
          </a>
          <a
            href="/auth"
            onClick={e => { e.preventDefault(); navigate('/auth'); }}
            className="group font-orbitron font-bold tracking-[0.2em] text-sm uppercase px-8 py-4 transition-all duration-300"
            style={{
              background: 'transparent',
              color: '#e8e8e8',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: 'inset 0 0 20px rgba(255,255,255,0.03)',
              clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = '#FF1A1A';
              (e.currentTarget as HTMLAnchorElement).style.color = '#FF1A1A';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 20px #FF1A1A44';
              (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.2)';
              (e.currentTarget as HTMLAnchorElement).style.color = '#e8e8e8';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'inset 0 0 20px rgba(255,255,255,0.03)';
              (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
            }}
          >
            {t('hero.enterPlatform')}
          </a>
        </div>

        {/* Live indicator */}
        <div
          className="flex items-center gap-3 flex-wrap justify-center"
          style={{
            opacity: visible ? 1 : 0,
            transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.7s',
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: streamIsLive ? '#FF1A1A' : '#39FF14',
              animation: 'live-dot 1.5s ease-in-out infinite',
              boxShadow: streamIsLive ? '0 0 8px #FF1A1A' : '0 0 8px #39FF14',
            }}
          />
          <span
            className="font-mono-space text-xs tracking-widest uppercase"
            style={{ color: streamIsLive ? '#FF1A1Aaa' : '#39FF1466' }}
          >
            {streamIsLive ? `LIVE — ${streamTitle || t('hero.onAir')}` : t('hero.onAir')}
          </span>
          {streamIsLive && streamViewers > 0 && (
            <span
              className="font-orbitron text-xs tracking-[0.2em]"
              style={{ color: '#39FF1466' }}
            >
              {streamViewers} {t('hero.listeners')}
            </span>
          )}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{
          opacity: visible ? 0.6 : 0,
          transition: 'opacity 1s ease 1.2s',
        }}
      >
        <span
          className="font-mono-space text-xs tracking-widest uppercase"
          style={{ color: '#39FF1466' }}
        >
          {t('hero.scroll')}
        </span>
        <div
          className="w-[1px] h-8 overflow-hidden"
          style={{ background: '#39FF1422' }}
        >
          <div
            className="w-full h-1/2"
            style={{
              background: '#39FF14',
              animation: 'scroll-indicator 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>
    </section>
  );
}
