/* ============================================================
   DARKVOLT — BENTO GRID SECTION
   Design: New-generation asymmetric bento layout
   Features: Hover effects, neon borders, image cards, stats, animated elements
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import GlitchText from './GlitchText';

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glowColor?: 'green' | 'red' | 'none';
  delay?: number;
  visible?: boolean;
  clipSize?: number;
  glitch?: boolean;
}

function BentoCard({ children, className = '', style = {}, glowColor = 'none', delay = 0, visible = false, clipSize = 18, glitch = false }: BentoCardProps) {
  const [hovered, setHovered] = useState(false);

  const accent  = glowColor === 'green' ? '#39FF14' : glowColor === 'red' ? '#FF1A1A' : '#e8e8e8';
  const accentA = glowColor === 'none'  ? '0.07'   : hovered ? '0.9' : '0.28';
  const accentB = glowColor === 'none'  ? '0.04'   : hovered ? '0.55' : '0.14';
  const cut = `${clipSize}px`;
  const clip = `polygon(0 0, calc(100% - ${cut}) 0, 100% ${cut}, 100% 100%, ${cut} 100%, 0 calc(100% - ${cut}))`;

  const borderBg = glowColor === 'green'
    ? `linear-gradient(135deg, rgba(57,255,20,${accentA}) 0%, rgba(57,255,20,${accentB}) 50%, rgba(57,255,20,${accentA}) 100%)`
    : glowColor === 'red'
    ? `linear-gradient(135deg, rgba(255,26,26,${accentA}) 0%, rgba(255,26,26,${accentB}) 50%, rgba(255,26,26,${accentA}) 100%)`
    : 'rgba(255,255,255,0.07)';

  const glow = hovered && glowColor !== 'none'
    ? `drop-shadow(0 0 12px ${glowColor === 'green' ? 'rgba(57,255,20,0.35)' : 'rgba(255,26,26,0.35)'})`
    : 'none';

  return (
    <div
      className={`relative ${className}${glitch ? ' bento-img-card' : ''}`}
      style={{
        clipPath: clip,
        background: borderBg,
        padding: '1px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.97)',
        transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, background 0.35s ease, filter 0.35s ease`,
        filter: glow,
        ...style,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Inner panel */}
      <div
        className={`relative overflow-hidden h-full${glitch ? ' bento-img-inner' : ''}`}
        style={{ background: '#0a0a0a', clipPath: clip }}
      >
        {/* Corner bracket — top-left */}
        <div style={{
          position: 'absolute', top: 10, left: 10, width: 16, height: 16,
          borderTop: `1.5px solid ${accent}`, borderLeft: `1.5px solid ${accent}`,
          opacity: hovered ? 0.9 : 0.35, transition: 'opacity 0.35s, transform 0.35s',
          transform: hovered ? 'scale(1.2)' : 'scale(1)', zIndex: 20, pointerEvents: 'none',
        }} />
        {/* Corner bracket — bottom-right (above the cut corner) */}
        <div style={{
          position: 'absolute', bottom: clipSize + 6, right: 10, width: 16, height: 16,
          borderBottom: `1.5px solid ${accent}`, borderRight: `1.5px solid ${accent}`,
          opacity: hovered ? 0.9 : 0.35, transition: 'opacity 0.35s, transform 0.35s',
          transform: hovered ? 'scale(1.2)' : 'scale(1)', zIndex: 20, pointerEvents: 'none',
        }} />
        {children}
      </div>
    </div>
  );
}

export default function BentoGrid() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const stats = [
    { value: '24/7', label: t('bento.stats.0.label'), color: '#39FF14' },
    { value: 'FREE', label: t('bento.stats.1.label'), color: '#FF1A1A' },
    { value: 'LIVE', label: t('bento.stats.2.label'), color: '#39FF14' },
    { value: 'FR',   label: t('bento.stats.3.label'), color: '#FF1A1A' },
  ];

  const features = [
    { icon: '⚡', title: t('bento.features.0.title'), desc: t('bento.features.0.desc') },
    { icon: '💀', title: t('bento.features.1.title'), desc: t('bento.features.1.desc') },
    { icon: '📻', title: t('bento.features.2.title'), desc: t('bento.features.2.desc') },
    { icon: '⛓️', title: t('bento.features.3.title'), desc: t('bento.features.3.desc') },
  ];

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative py-24 overflow-hidden"
      style={{ background: '#050505' }}
    >
      {/* Background texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,26,26,0.03) 0%, transparent 50%)',
        }}
      />

      <div className="container relative z-10">
        {/* Section header */}
        <div
          className="mb-12"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="h-[1px] w-12" style={{ background: 'linear-gradient(90deg, transparent, #FF1A1A, #39FF14)' }} />
            <span className="font-mono-space text-xs tracking-[0.4em] uppercase" style={{ color: '#FF1A1A', textShadow: '0 0 8px rgba(255,26,26,0.4)' }}>
              {t('bento.sectionLabel')}
            </span>
          </div>
          <GlitchText
            speed={0.6}
            enableShadows
            bgColor="#050505"
            className="font-bebas text-5xl md:text-7xl"
            style={{ color: '#e8e8e8', letterSpacing: '0.05em', lineHeight: 1 }}
          >
            {t('bento.headline')}
          </GlitchText>
        </div>

        {/* BENTO GRID */}
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: 'repeat(12, 1fr)',
            gridTemplateRows: 'auto',
          }}
        >
          {/* Card 1 — DJ Image (large) */}
          <BentoCard
            glowColor="green"
            delay={0.1}
            visible={visible}
            glitch
            style={{ gridColumn: 'span 7', gridRow: 'span 2', minHeight: '420px' }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663459027095/PGa3qKDyYA8FbJzpxztrVn/darkvolt-bento-dj-jF2KLwMAomj3ecQVbQDV2Z.webp)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
                opacity: 0.7,
              }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.3) 50%, transparent 100%)' }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ background: '#FF1A1A', animation: 'live-dot 1.5s ease-in-out infinite', boxShadow: '0 0 6px #FF1A1A' }} />
                <span className="font-mono-space text-xs tracking-widest" style={{ color: '#FF1A1A' }}>{t('bento.liveNow')}</span>
              </div>
              <h3
                className="font-bebas text-3xl md:text-4xl mb-1"
                style={{ color: '#e8e8e8', letterSpacing: '0.05em' }}
              >
                {t('bento.sessionTitle')}
              </h3>
              <p className="font-space text-sm" style={{ color: '#e8e8e866' }}>
                {t('bento.sessionDesc')}
              </p>
            </div>
          </BentoCard>

          {/* Card 2 — Stats block */}
          <BentoCard
            glowColor="red"
            delay={0.2}
            visible={visible}
            style={{ gridColumn: 'span 5', minHeight: '200px' }}
          >
            <div className="p-6 h-full flex flex-col justify-between">
              <div>
                <span className="font-mono-space text-xs tracking-widest uppercase" style={{ color: '#FF1A1A88' }}>
                  {t('bento.identity')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, i) => (
                  <div key={i} className="flex flex-col">
                    <span
                      className="font-orbitron font-black text-2xl md:text-3xl"
                      style={{
                        color: stat.color,
                        textShadow: `0 0 15px ${stat.color}88`,
                      }}
                    >
                      {stat.value}
                    </span>
                    <span className="font-mono-space text-xs tracking-widest" style={{ color: '#e8e8e844' }}>
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* Card 3 — Artistes */}
          <BentoCard
            glowColor="green"
            delay={0.3}
            visible={visible}
            glitch
            style={{ gridColumn: 'span 5', minHeight: '200px', cursor: 'pointer' }}
          >
            {/* Clickable overlay */}
            <a
              href="/artistes"
              className="absolute inset-0 z-20"
              style={{ textDecoration: 'none' }}
              onClick={e => { e.preventDefault(); navigate('/artistes'); }}
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663459027095/PGa3qKDyYA8FbJzpxztrVn/darkvolt-bento-skull-WS3sdkDYQPcNNhny5ss3Hd.webp)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.8,
              }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, rgba(10,10,10,0.6) 0%, transparent 60%)' }}
            />
            <div className="absolute top-4 left-4 z-10">
              <span
                className="font-orbitron font-black text-xs tracking-widest uppercase px-3 py-1"
                style={{
                  background: 'rgba(57,255,20,0.15)',
                  border: '1px solid #39FF1444',
                  color: '#39FF14',
                }}
              >
                ARTISTES
              </span>
            </div>
          </BentoCard>

          {/* Card 4 — Waveform */}
          <BentoCard
            glowColor="green"
            delay={0.15}
            visible={visible}
            glitch
            style={{ gridColumn: 'span 8', minHeight: '180px' }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663459027095/PGa3qKDyYA8FbJzpxztrVn/darkvolt-bento-wave-g6DasnxSNg5Cmhc6xzSCXF.webp)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.5,
              }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(90deg, #0a0a0a 0%, rgba(10,10,10,0.3) 40%, rgba(10,10,10,0.3) 60%, #0a0a0a 100%)' }}
            />
            <div className="relative z-10 p-6 md:p-8 flex flex-col justify-center h-full">
              <h3
                className="font-bebas text-3xl md:text-4xl mb-2"
                style={{ color: '#39FF14', textShadow: '0 0 20px #39FF1488', letterSpacing: '0.05em' }}
              >
                {t('bento.frequencyTitle')}
              </h3>
              <p className="font-space text-sm max-w-xs" style={{ color: '#e8e8e866' }}>
                {t('bento.frequencyDesc')}
              </p>
            </div>
          </BentoCard>

          {/* Card 5 — City */}
          <BentoCard
            glowColor="red"
            delay={0.25}
            visible={visible}
            glitch
            style={{ gridColumn: 'span 4', minHeight: '180px' }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663459027095/PGa3qKDyYA8FbJzpxztrVn/darkvolt-bento-city-8kDQScdV2F3FsHb3ERN4E7.webp)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.6,
              }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.2) 100%)' }}
            />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="font-mono-space text-xs tracking-widest uppercase" style={{ color: '#FF1A1A' }}>
                {t('bento.worldwide')}
              </p>
            </div>
          </BentoCard>

          {/* Card 6 — Features grid */}
          <BentoCard
            glowColor="none"
            delay={0.35}
            visible={visible}
            style={{ gridColumn: 'span 12', minHeight: '160px' }}
          >
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {features.map((feat, i) => {
                  const fc = i % 2 === 0 ? '#39FF14' : '#FF1A1A';
                  const fcA = i % 2 === 0 ? 'rgba(57,255,20,0.18)' : 'rgba(255,26,26,0.18)';
                  return (
                    <div
                      key={i}
                      className="relative flex flex-col gap-2 group"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
                        padding: '1rem',
                        transition: 'background 0.3s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = `rgba(${i%2===0?'57,255,20':'255,26,26'},0.05)`}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'}
                    >
                      {/* Top-left bracket */}
                      <div style={{ position:'absolute', top:7, left:7, width:12, height:12, borderTop:`1px solid ${fc}`, borderLeft:`1px solid ${fc}`, opacity:0.6 }} />
                      {/* Diagonal accent line top-right */}
                      <div style={{ position:'absolute', top:0, right:0, width:0, height:0, borderStyle:'solid', borderWidth:`0 10px 10px 0`, borderColor:`transparent ${fcA} transparent transparent` }} />
                      <span className="text-xl">{feat.icon}</span>
                      <h4 className="font-orbitron font-bold text-xs tracking-widest" style={{ color: fc }}>
                        {feat.title}
                      </h4>
                      <p className="font-space text-xs leading-relaxed" style={{ color: '#e8e8e855' }}>
                        {feat.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}
