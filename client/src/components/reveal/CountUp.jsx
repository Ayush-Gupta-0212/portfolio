import { useEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../lib/gsap';

/* "10+" counts up from 0 when it scrolls into view; non-numeric values (∞) spin in */
const CountUp = ({ value, style }) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const match = /^(\d+)(.*)$/.exec(value);
    if (!el || prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      if (match) {
        const n = { v: 0 };
        el.textContent = `0${match[2]}`;
        gsap.to(n, {
          v: Number(match[1]),
          duration: 1.6,
          ease: 'power3.out',
          onUpdate: () => { el.textContent = `${Math.round(n.v)}${match[2]}`; },
          scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' },
        });
      } else {
        gsap.from(el, {
          rotate: -270, scale: 0.4, autoAlpha: 0, duration: 1.4, ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' },
        });
      }
    });
    return () => {
      ctx.revert();
      el.textContent = value;
    };
  }, [value]);

  return <span ref={ref} style={{ display: 'inline-block', ...style }}>{value}</span>;
};

export default CountUp;
