/* ============================================================
   DARKVOLT — CUSTOM CURSOR
   Design: SVG pointing finger — neon green/red palette
   ============================================================ */

import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const mainRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const isHoveringRef = useRef(false);
  const isClickingRef = useRef(false);
  const pos = useRef({ x: -200, y: -200 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      isHoveringRef.current = !!(e.target as HTMLElement).closest('a, button, [role="button"]');
    };
    const onDown = () => { isClickingRef.current = true; };
    const onUp   = () => { isClickingRef.current = false; };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup',   onUp);

    const loop = () => {
      const sc = isClickingRef.current ? 0.80 : 1;
      const c  = isHoveringRef.current ? '#FF1A1A' : '#39FF14';

      if (mainRef.current) {
        mainRef.current.style.transform = `translate(${pos.current.x - 1}px, ${pos.current.y - 1}px) scale(${sc})`;
        mainRef.current.style.filter    = `drop-shadow(0 0 4px ${c}) drop-shadow(0 0 12px ${c}66)`;
      }
      if (pathRef.current) {
        pathRef.current.setAttribute('stroke', c);
      }

      animRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup',   onUp);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  if (typeof window !== 'undefined' && window.innerWidth < 768) return null;

  return (
    <div
      ref={mainRef}
      className="fixed top-0 left-0 pointer-events-none z-[99999]"
      style={{ transformOrigin: '1px 1px' }}
    >
      <svg width="22" height="26" viewBox="0 0 22 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          ref={pathRef}
          d="M1 1 L1 20 L5.5 15.5 L9 22 L11.5 21 L8 14 L14 14 Z"
          fill="#FF1A1A"
          stroke="#39FF14"
          strokeWidth="1.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
