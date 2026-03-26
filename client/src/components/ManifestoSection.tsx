/* ============================================================
   DARKVOLT — MANIFESTO SECTION
   Design: Full-width dark text section with electric accents
   Features: Animated counter, manifesto text, CTA
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GlitchText from './GlitchText';


export default function ManifestoSection() {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const manifestoLines = [
    { text: t('manifesto.line1'), highlight: false },
    { text: t('manifesto.line2'), highlight: true },
    { text: t('manifesto.line3'), highlight: false },
  ];

  const engagements = [
    { icon: '📡', label: t('manifesto.engagements.0.label'), desc: t('manifesto.engagements.0.desc') },
    { icon: '🎛️', label: t('manifesto.engagements.1.label'), desc: t('manifesto.engagements.1.desc') },
    { icon: '📼', label: t('manifesto.engagements.2.label'), desc: t('manifesto.engagements.2.desc') },
    { icon: '🔧', label: t('manifesto.engagements.3.label'), desc: t('manifesto.engagements.3.desc') },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-32 overflow-hidden"
      style={{ background: '#060606' }}
    >
      {/* Background energy effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(57,255,20,0.03) 0%, transparent 60%)',
        }}
      />

      {/* Horizontal lines */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, #39FF1422, transparent)' }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px] pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, #FF1A1A22, transparent)' }}
      />

      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Label */}
          <div
            className="flex items-center justify-center gap-4 mb-12"
            style={{
              opacity: visible ? 1 : 0,
              transition: 'opacity 0.8s ease',
            }}
          >
            <div className="h-[1px] w-16" style={{ background: 'linear-gradient(90deg, transparent, #FF1A1A, #39FF14)' }} />
            <span className="font-mono-space text-xs tracking-[0.5em] uppercase" style={{ color: '#FF1A1A', textShadow: '0 0 8px rgba(255,26,26,0.4)' }}>
              {t('manifesto.label')}
            </span>
            <div className="h-[1px] w-16" style={{ background: 'linear-gradient(90deg, #39FF14, #FF1A1A, transparent)' }} />
          </div>

          {/* Manifesto text */}
          <div className="flex flex-col gap-4 mb-16">
            {manifestoLines.map((line, i) => (
              line.highlight ? (
                <p
                  key={i}
                  className="font-bebas text-3xl md:text-5xl lg:text-6xl leading-tight"
                  style={{
                    color: '#39FF14',
                    textShadow: '0 0 30px #39FF1466',
                    letterSpacing: '0.03em',
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(30px)',
                    transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${0.2 + i * 0.15}s`,
                  }}
                >
                  {line.text}
                </p>
              ) : (
                <div
                  key={i}
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(30px)',
                    transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${0.2 + i * 0.15}s`,
                  }}
                >
                  <GlitchText
                    speed={0.5}
                    enableShadows
                    bgColor="#060606"
                    className="font-bebas text-3xl md:text-5xl lg:text-6xl leading-tight"
                    style={{ color: '#e8e8e8', letterSpacing: '0.03em' }}
                  >
                    {line.text}
                  </GlitchText>
                </div>
              )
            ))}
          </div>

          {/* Engagements row */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-16"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s ease 0.7s',
            }}
          >
            {engagements.map((eng, i) => {
              const ec = i % 2 === 0 ? '#39FF14' : '#FF1A1A';
              const eRgb = i % 2 === 0 ? '57,255,20' : '255,26,26';
              const clip = `polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))`;
              return (
                <div
                  key={i}
                  className="group"
                  style={{
                    clipPath: clip,
                    background: `rgba(${eRgb},0.22)`,
                    padding: '1px',
                    transition: 'filter 0.35s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.filter = `drop-shadow(0 0 12px rgba(${eRgb},0.4))`}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.filter = 'none'}
                >
                  <div
                    className="relative flex flex-col gap-2 p-5 md:p-6 h-full"
                    style={{
                      clipPath: clip,
                      background: '#060606',
                      transition: 'background 0.3s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = `rgba(${eRgb},0.05)`}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = '#060606'}
                  >
                    {/* Top-left bracket */}
                    <div style={{ position:'absolute', top:8, left:8, width:14, height:14, borderTop:`1px solid ${ec}`, borderLeft:`1px solid ${ec}`, opacity:0.5, pointerEvents:'none', transition:'opacity 0.3s' }} />
                    {/* Bottom-right bracket */}
                    <div style={{ position:'absolute', bottom:20, right:8, width:14, height:14, borderBottom:`1px solid ${ec}`, borderRight:`1px solid ${ec}`, opacity:0.5, pointerEvents:'none', transition:'opacity 0.3s' }} />
                    {/* Diagonal accent */}
                    <div style={{ position:'absolute', top:0, right:0, width:0, height:0, borderStyle:'solid', borderWidth:`0 14px 14px 0`, borderColor:`transparent rgba(${eRgb},0.3) transparent transparent`, pointerEvents:'none' }} />
                    <span className="text-xl">{eng.icon}</span>
                    <span className="font-orbitron font-bold text-xs tracking-widest" style={{ color: ec }}>
                      {eng.label}
                    </span>
                    <p className="font-space text-xs leading-relaxed" style={{ color: '#e8e8e855' }}>
                      {eng.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div
            style={{
              opacity: visible ? 1 : 0,
              transition: 'opacity 0.8s ease 1s',
            }}
          >
            <a
              href="/auth"
              className="inline-block font-orbitron font-black text-sm tracking-[0.3em] uppercase px-12 py-5 transition-all duration-300"
              style={{
                background: 'transparent',
                border: '1px solid #39FF14',
                color: '#39FF14',
                boxShadow: '0 0 20px rgba(57,255,20,0.2)',
                clipPath: 'polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = '#39FF14';
                (e.currentTarget as HTMLAnchorElement).style.color = '#050505';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 40px #39FF14, 0 0 80px #39FF1444';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                (e.currentTarget as HTMLAnchorElement).style.color = '#39FF14';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 20px rgba(57,255,20,0.2)';
              }}
            >
              {t('manifesto.cta')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
