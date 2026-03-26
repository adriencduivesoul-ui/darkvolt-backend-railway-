/* ============================================================
   DARKVOLT — PRELOADER v2
   Design: Dark Signal Boot — Underground Frequency Acquisition
   CSS-first, zero canvas, fully performant
   ============================================================ */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PreloaderProps {
  onComplete: () => void;
}

type Phase = 'loading' | 'ready' | 'entering';

const SEG = 36;

export default function Preloader({ onComplete }: PreloaderProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('loading');
  const [progress, setProgress] = useState(0);
  const [visibleLines, setVisibleLines] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  const bootLines = useMemo(() => [
    t('preloader.boot1'), t('preloader.boot2'), t('preloader.boot3'),
    t('preloader.boot4'), t('preloader.boot5'), t('preloader.boot6'),
  ], [t]);

  useEffect(() => {
    let p = 0;
    const tick = setInterval(() => {
      p += Math.random() * 5 + 2;
      if (p >= 100) {
        p = 100;
        clearInterval(tick);
        setProgress(100);
        setVisibleLines(bootLines.length);
        setTimeout(() => { setGlitch(true); setTimeout(() => setGlitch(false), 320); }, 100);
        setTimeout(() => setPhase('ready'), 620);
        return;
      }
      setProgress(p);
      setVisibleLines(Math.floor((p / 100) * bootLines.length));
    }, 75);
    return () => clearInterval(tick);
  }, [bootLines.length]);

  const handleEnter = () => {
    setPhase('entering');
    setTimeout(onComplete, 900);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden select-none"
      style={{
        background: '#030303',
        opacity: phase === 'entering' ? 0 : 1,
        transition: phase === 'entering' ? 'opacity 0.85s ease-in-out' : 'none',
        pointerEvents: phase === 'entering' ? 'none' : 'auto',
      }}
    >

      {/* ── Grid ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(57,255,20,0.025) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(57,255,20,0.025) 1px, transparent 1px)`,
        backgroundSize: '64px 64px',
        zIndex: 1,
      }} />

      {/* ── CRT scanlines ────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)',
        zIndex: 2,
      }} />

      {/* ── Moving scan beam ─────────────────────────────────── */}
      <div className="absolute left-0 right-0 h-[2px] pointer-events-none" style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(57,255,20,0.55) 30%, rgba(57,255,20,0.9) 50%, rgba(57,255,20,0.55) 70%, transparent 100%)',
        boxShadow: '0 0 18px rgba(57,255,20,0.5)',
        animation: 'pl-scanbeam 3.5s ease-in-out infinite',
        zIndex: 3,
      }} />

      {/* ── Radial vignette ──────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 75% 65% at 50% 50%, transparent 0%, rgba(3,3,3,0.75) 100%)',
        zIndex: 4,
      }} />


      {/* ── Main content ─────────────────────────────────────── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{
          zIndex: 30,
          opacity: phase === 'entering' ? 0 : 1,
          transform: phase === 'entering' ? 'scale(1.06) translateY(-10px)' : 'none',
          transition: phase === 'entering'
            ? 'opacity 0.35s ease-in, transform 0.45s ease-in'
            : 'none',
          pointerEvents: phase === 'entering' ? 'none' : 'auto',
        }}
      >
        {/* Corner brackets */}
        {(['tl','tr','bl','br'] as const).map(pos => (
          <div key={pos} className="absolute pointer-events-none" style={{
            top:    pos.startsWith('t') ? 20 : undefined,
            bottom: pos.startsWith('b') ? 20 : undefined,
            left:   pos.endsWith('l')   ? 20 : undefined,
            right:  pos.endsWith('r')   ? 20 : undefined,
            width: 36, height: 36,
            borderTop:    pos.startsWith('t') ? '1.5px solid rgba(57,255,20,0.5)' : undefined,
            borderBottom: pos.startsWith('b') ? '1.5px solid rgba(57,255,20,0.5)' : undefined,
            borderLeft:   pos.endsWith('l')   ? '1.5px solid rgba(57,255,20,0.5)' : undefined,
            borderRight:  pos.endsWith('r')   ? '1.5px solid rgba(57,255,20,0.5)' : undefined,
            zIndex: 31,
          }} />
        ))}

        {/* Top coordinate strip */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 font-mono-space text-[11px] tracking-widest pointer-events-none" style={{ color: 'rgba(57,255,20,0.28)', zIndex: 31, whiteSpace: 'nowrap' }}>
          {t('preloader.coords')}
        </div>

        {/* Bottom freq strip */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 font-mono-space text-[11px] tracking-widest pointer-events-none" style={{ color: 'rgba(57,255,20,0.18)', zIndex: 31, whiteSpace: 'nowrap' }}>
          {t('preloader.freq')}
        </div>

        {/* ── Logo zone ──────────────────────────────────────── */}
        <div className="relative flex flex-col items-center">

          {/* ── Soft ambient glow (breathing) ────────────────── */}
          <div className="absolute pointer-events-none" style={{
            width: 480, height: 280,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(ellipse, rgba(57,255,20,0.07) 0%, transparent 65%)',
            filter: 'blur(28px)',
            animation: 'pl-glow-breathe 4s ease-in-out infinite',
            zIndex: 28,
          }} />

          {/* Logo */}
          <div className="relative" style={{ animation: 'pl-float 5s ease-in-out infinite', marginBottom: '28px' }}>
            {glitch && <>
              <img src="/img/DarkVolt.png" alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" style={{
                transform: 'translate(-10px, 3px) scaleX(1.02)',
                filter: 'hue-rotate(100deg) saturate(8) brightness(2)',
                opacity: 0.45, mixBlendMode: 'screen',
                clipPath: 'inset(15% 0 52% 0)',
              }} />
              <img src="/img/DarkVolt.png" alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" style={{
                transform: 'translate(10px, -4px) scaleX(0.99)',
                filter: 'hue-rotate(-100deg) saturate(8) brightness(2)',
                opacity: 0.45, mixBlendMode: 'screen',
                clipPath: 'inset(55% 0 8% 0)',
              }} />
            </>}
            <img
              src="/img/DarkVolt.png"
              alt="DarkVolt"
              style={{
                width: 'min(440px, 82vw)',
                filter: 'drop-shadow(0 0 28px rgba(57,255,20,0.75)) drop-shadow(0 0 55px rgba(57,255,20,0.25))',
                display: 'block',
              }}
            />
          </div>

          {/* Phase label */}
          <div className="font-orbitron text-[11px] tracking-[0.4em] uppercase mb-8" style={{
            color: phase === 'ready' ? '#39FF14' : 'rgba(57,255,20,0.4)',
            textShadow: phase === 'ready' ? '0 0 14px #39FF14, 0 0 28px rgba(57,255,20,0.4)' : 'none',
            transition: 'all 0.5s ease',
            letterSpacing: '0.4em',
          }}>
            {phase === 'ready' ? t('preloader.acquired') : t('preloader.scanning')}
          </div>
        </div>

        {/* ── Loading section ──────────────────────────────── */}
        {phase === 'loading' && (
          <div className="w-full max-w-sm px-6 flex flex-col gap-4">
            <div className="flex flex-col gap-[6px] mb-1" style={{ minHeight: '92px' }}>
              {bootLines.slice(0, visibleLines).map((line, i) => (
                <div key={i} className="font-mono-space text-[11px] flex gap-2" style={{
                  color: i === visibleLines - 1 ? '#39FF14' : 'rgba(57,255,20,0.32)',
                  animation: 'pl-line-in 0.22s ease',
                }}>
                  {line}
                  {i === visibleLines - 1 && (
                    <span style={{ animation: 'pl-blink 0.85s step-end infinite' }}>█</span>
                  )}
                </div>
              ))}
            </div>

            {/* Segmented bar */}
            <div className="flex gap-[2px]">
              {Array.from({ length: SEG }).map((_, i) => {
                const filled = (i / SEG) * 100 <= progress;
                const color = i < SEG * 0.72 ? '#39FF14' : i < SEG * 0.9 ? '#FF6B35' : '#FF1A1A';
                return (
                  <div key={i} style={{
                    flex: 1, height: '5px', borderRadius: '1px',
                    background: filled ? color : 'rgba(255,255,255,0.055)',
                    boxShadow: filled ? `0 0 5px ${color}88` : 'none',
                    transition: 'background 0.12s ease',
                  }} />
                );
              })}
            </div>
            <div className="flex justify-between font-mono-space text-[11px]" style={{ color: 'rgba(57,255,20,0.38)' }}>
              <span>{t('preloader.signalStrength')}</span>
              <span style={{ color: '#39FF14', textShadow: '0 0 7px #39FF14' }}>{Math.floor(progress)}%</span>
            </div>
          </div>
        )}

        {/* ── ENTER button ─────────────────────────────────── */}
        {phase === 'ready' && (
          <div className="flex flex-col items-center gap-5 mt-2" style={{ animation: 'pl-enter-appear 0.55s ease' }}>
            <button
              onClick={handleEnter}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              className="relative font-orbitron font-black text-sm tracking-[0.45em] uppercase cursor-pointer outline-none"
              style={{
                padding: '18px 68px',
                background: btnHover ? '#39FF14' : 'transparent',
                border: 'none',
                color: btnHover ? '#030303' : '#39FF14',
                textShadow: btnHover ? 'none' : '0 0 18px #39FF14',
                transition: 'background 0.2s ease, color 0.2s ease, text-shadow 0.2s ease',
              }}
            >
              <span className="absolute inset-0 pointer-events-none" style={{
                clipPath: 'polygon(14px 0%, 100% 0%, calc(100% - 14px) 100%, 0% 100%)',
                border: '1px solid #39FF14',
                boxShadow: btnHover
                  ? '0 0 40px #39FF14, 0 0 80px rgba(57,255,20,0.4), inset 0 0 20px rgba(57,255,20,0.1)'
                  : '0 0 18px rgba(57,255,20,0.3)',
                animation: btnHover ? 'none' : 'pl-btn-pulse 2s ease-in-out infinite',
                transition: 'box-shadow 0.2s ease',
              }} />
              <span className="relative">{t('preloader.enter')}</span>
            </button>

            <p className="font-mono-space text-[11px] tracking-[0.35em] uppercase" style={{
              color: 'rgba(57,255,20,0.35)',
              animation: 'pl-line-in 0.4s ease 0.25s both',
            }}>
              {t('preloader.tagline')}
            </p>
          </div>
        )}
      </div>

      {/* ── Keyframes ────────────────────────────────────────── */}
      <style>{`
        @keyframes pl-scanbeam {
          0%   { top: -4px;  opacity: 0; }
          4%   { opacity: 1; }
          96%  { opacity: 0.85; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes pl-glow-breathe {
          0%,100% { opacity: 0.7; }
          50%     { opacity: 1.0; }
        }
        @keyframes pl-float    { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes pl-blink    { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes pl-line-in  { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pl-btn-pulse {
          0%,100% { box-shadow: 0 0 18px rgba(57,255,20,0.3); }
          50%     { box-shadow: 0 0 38px rgba(57,255,20,0.65), 0 0 70px rgba(57,255,20,0.2); }
        }
        @keyframes pl-enter-appear {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}
