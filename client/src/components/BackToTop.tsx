/* ============================================================
   DARKVOLT — BACK TO TOP
   Fixed bottom-right, apparaît après 400px de scroll
   Style : néon vert, clip-path angulaire, Orbitron
   ============================================================ */

import { useEffect, useState } from 'react';

const G = '#39FF14';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <button
      onClick={scrollTop}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Retour en haut"
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        width: '52px',
        height: '52px',
        background: hovered ? G : '#0a0a0a',
        border: `1px solid ${hovered ? G : `${G}55`}`,
        clipPath: 'polygon(12px 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%, 0% 12px)',
        boxShadow: hovered
          ? `0 0 28px ${G}99, 0 0 60px ${G}33, inset 0 0 12px ${G}22`
          : `0 0 10px ${G}22`,
        cursor: 'none',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.9)',
        transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1), background 0.25s, box-shadow 0.25s, border-color 0.25s',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {/* Chevron up */}
      <svg
        width="18"
        height="12"
        viewBox="0 0 18 12"
        fill="none"
        style={{
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          transition: 'transform 0.25s ease',
        }}
      >
        <path
          d="M1 11L9 2L17 11"
          stroke={hovered ? '#050505' : G}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* Corner accents */}
      <div style={{
        position: 'absolute', top: 4, left: 4,
        width: 8, height: 8,
        borderTop: `1px solid ${hovered ? '#05050588' : `${G}44`}`,
        borderLeft: `1px solid ${hovered ? '#05050588' : `${G}44`}`,
        transition: 'border-color 0.25s',
      }} />
      <div style={{
        position: 'absolute', bottom: 4, right: 4,
        width: 8, height: 8,
        borderBottom: `1px solid ${hovered ? '#05050588' : `${G}44`}`,
        borderRight: `1px solid ${hovered ? '#05050588' : `${G}44`}`,
        transition: 'border-color 0.25s',
      }} />
    </button>
  );
}
