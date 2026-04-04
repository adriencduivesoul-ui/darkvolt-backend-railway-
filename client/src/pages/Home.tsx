/* ============================================================
   DARKVOLT — HOME PAGE
   Design: Electric Underground — Rave Culture Cyberpunk
   Assembles: Preloader → Nav → Hero → Player → Bento → Shows → Manifesto → Footer
   ============================================================ */

import { useEffect, useState } from 'react';
import BentoGrid from '@/components/BentoGrid';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import LivePlayer from '@/components/LivePlayer';
import ManifestoSection from '@/components/ManifestoSection';
import Navigation from '@/components/Navigation';
import Preloader from '@/components/Preloader';
import ShowsSection from '@/components/ShowsSection';
import ScrollReveal from '@/components/ScrollReveal';
import BackToTop from '@/components/BackToTop';

export default function Home() {
  const [preloaderDone, setPreloaderDone] = useState(false);

  // Skip preloader when navigating back from a secondary page
  useEffect(() => {
    if (sessionStorage.getItem('scrollTo')) {
      setPreloaderDone(true);
    }
  }, []);

  // Scroll to target section after home is rendered
  useEffect(() => {
    if (!preloaderDone) return;
    const target = sessionStorage.getItem('scrollTo');
    if (!target) return;
    sessionStorage.removeItem('scrollTo');
    const id = setTimeout(() => {
      document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
    }, 350);
    return () => clearTimeout(id);
  }, [preloaderDone]);

  return (
    <>
      {/* Preloader — shown first */}
      {!preloaderDone && (
        <Preloader onComplete={() => setPreloaderDone(true)} />
      )}

      {/* Main site — revealed after preloader */}
      <div
        style={{
          opacity: preloaderDone ? 1 : 0,
          transform: preloaderDone ? 'none' : 'translateY(14px)',
          transition: 'opacity 0.75s cubic-bezier(0.22,1,0.36,1), transform 0.75s cubic-bezier(0.22,1,0.36,1)',
          background: '#050505',
          minHeight: '100vh',
        }}
      >
        <Navigation />
        <HeroSection />
        <ScrollReveal threshold={0.08}>
          <LivePlayer />
        </ScrollReveal>
        <ScrollReveal threshold={0.06} delay={0.05}>
          <BentoGrid />
        </ScrollReveal>
        <ScrollReveal threshold={0.06}>
          <ShowsSection />
        </ScrollReveal>
        <ScrollReveal threshold={0.08} delay={0.05}>
          <ManifestoSection />
        </ScrollReveal>
        <ScrollReveal threshold={0.05}>
          <Footer />
        </ScrollReveal>
      </div>
      <BackToTop />
    </>
  );
}
