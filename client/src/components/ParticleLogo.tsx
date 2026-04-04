/* ============================================================
   DARKVOLT — PARTICLE LOGO
   Dissolves the DarkVolt logo into interactive particles.
   Mouse proximity scatters nearby particles.
   ============================================================ */

import { useEffect, useRef } from 'react';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  s: number; c: string;
  sx: number; sy: number;
}

export default function ParticleLogo({ glitch }: { glitch?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let arr: Particle[] = [];
    let animId = 0;
    let updateTimer: ReturnType<typeof setTimeout>;
    let w = 0, h = 0;
    const PS = 3;

    function tick() {
      for (let i = 0; i < arr.length; i++) {
        const p = arr[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx = (p.sx - p.x) / 10;
        p.vy = (p.sy - p.y) / 10;
      }
      updateTimer = setTimeout(tick, 1000 / 30);
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      for (let i = 0; i < arr.length; i++) {
        const p = arr[i];
        ctx!.fillStyle = p.c;
        ctx!.fillRect(p.x, p.y, p.s, p.s);
      }
      animId = requestAnimationFrame(draw);
    }

    function onMouse(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const sx = w / rect.width;
      const sy = h / rect.height;
      const mx = (e.clientX - rect.left) * sx;
      const my = (e.clientY - rect.top) * sy;
      for (let i = 0; i < arr.length; i++) {
        const dx = mx - arr[i].x;
        const dy = my - arr[i].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 80) {
          const r = Math.atan2(dy, dx);
          arr[i].vx = -d * Math.cos(r);
          arr[i].vy = -d * Math.sin(r);
        }
      }
    }

    function applyDisplaySize() {
      if (!w) return;
      const maxW = Math.min(760, window.innerWidth * 0.92);
      canvas!.style.width = `${maxW}px`;
      canvas!.style.height = `${(maxW / w) * h}px`;
    }

    const img = new Image();
    img.src = '/img/DarkVolt.png';
    img.onload = () => {
      w = canvas!.width = img.naturalWidth;
      h = canvas!.height = img.naturalHeight;
      applyDisplaySize();

      ctx!.drawImage(img, 0, 0);
      const idata = ctx!.getImageData(0, 0, w, h);
      const data = idata.data;
      ctx!.clearRect(0, 0, w, h);

      arr = [];
      for (let py = 0; py < h; py += PS) {
        for (let px = 0; px < w; px += PS) {
          const o = (px + py * idata.width) * 4;
          if (data[o + 3] > 210) {
            arr.push({
              x: Math.random() * w,
              y: Math.random() * h,
              vx: 0, vy: 0,
              s: PS,
              c: `rgba(${data[o]},${data[o + 1]},${data[o + 2]},${(data[o + 3] / 255).toFixed(2)})`,
              sx: px, sy: py,
            });
          }
        }
      }

      window.addEventListener('mousemove', onMouse);
      tick();
      draw();
    };

    window.addEventListener('resize', applyDisplaySize);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(updateTimer);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', applyDisplaySize);
    };
  }, []);

  return (
    <div className="relative" style={{ display: 'inline-block', lineHeight: 0 }}>
      {glitch && (
        <>
          <img
            src="/img/DarkVolt.png"
            alt=""
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{ transform: 'translate(-5px, 0)', filter: 'hue-rotate(90deg)', opacity: 0.45, mixBlendMode: 'screen' }}
          />
          <img
            src="/img/DarkVolt.png"
            alt=""
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{ transform: 'translate(5px, 0)', filter: 'hue-rotate(-90deg)', opacity: 0.45, mixBlendMode: 'screen' }}
          />
        </>
      )}
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
