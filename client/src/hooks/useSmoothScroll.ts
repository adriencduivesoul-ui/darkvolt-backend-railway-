import { useEffect } from 'react';

/**
 * Frame-rate independent lerp smooth scroll.
 * Intercepts wheel events AND anchor-link clicks so everything routes
 * through the same lerp system.
 * @param ease  0..1 — higher = faster snap. 0.09 = premium inertia feel.
 */
export function useSmoothScroll(ease = 0.09) {
  useEffect(() => {
    let current = window.scrollY;
    let target = window.scrollY;
    let raf = 0;
    let lastTime = performance.now();
    let running = true;

    const maxScroll = () =>
      document.documentElement.scrollHeight - window.innerHeight;

    const clamp = (v: number) => Math.max(0, Math.min(v, maxScroll()));

    /* ── Wheel → accumulate target ── */
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 28;          // Firefox line mode
      if (e.deltaMode === 2) delta *= window.innerHeight; // page mode
      target = clamp(target + delta);
    };

    /* ── Anchor links → route through lerp, no native jump ── */
    const onAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const hash = anchor.getAttribute('href');
      if (!hash || hash === '#') return;
      const el = document.querySelector(hash);
      if (!el) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      target = clamp(window.scrollY + rect.top - 80); // 80 px nav offset
    };

    /* ── RAF tick: frame-rate-independent lerp ── */
    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;

      const factor = 1 - Math.pow(1 - ease, dt / 16.667);
      current += (target - current) * factor;

      if (Math.abs(target - current) < 0.25) current = target;

      window.scrollTo(0, current);
      raf = requestAnimationFrame(tick);
    };

    // Disable CSS smooth-scroll — our JS handles everything
    document.documentElement.style.scrollBehavior = 'auto';

    window.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('click', onAnchorClick);
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      document.documentElement.style.scrollBehavior = '';
      window.removeEventListener('wheel', onWheel);
      document.removeEventListener('click', onAnchorClick);
      cancelAnimationFrame(raf);
    };
  }, [ease]);
}
