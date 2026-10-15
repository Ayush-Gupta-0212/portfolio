import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap';
import { setLenis } from '../lib/scroll';

export const useSmoothScroll = () => {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined; // keep native scrolling for reduced motion

    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    // Drive Lenis from GSAP's ticker so ScrollTrigger animations stay in lock-step
    lenis.on('scroll', ScrollTrigger.update);
    setLenis(lenis);
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      setLenis(null);
      lenis.destroy();
    };
  }, []);
};
