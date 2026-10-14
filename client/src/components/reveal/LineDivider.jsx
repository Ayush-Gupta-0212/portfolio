import { useEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../lib/gsap';

/* A hairline that draws across with scroll, with a "+" marker that spins in */
const LineDivider = ({ color, markColor, markAt = 0.66, style }) => {
  const rootRef = useRef(null);
  const lineRef = useRef(null);
  const markRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(lineRef.current, { scaleX: 0 }, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: rootRef.current, start: 'top 92%', end: 'top 55%', scrub: 0.6 },
      });
      gsap.fromTo(markRef.current, { rotate: -180, scale: 0 }, {
        rotate: 0,
        scale: 1,
        duration: 1,
        ease: 'back.out(1.8)',
        scrollTrigger: { trigger: rootRef.current, start: 'top 75%', toggleActions: 'play none none reverse' },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} style={{ position: 'relative', height: 13, ...style }}>
      <div
        ref={lineRef}
        style={{ position: 'absolute', left: 0, right: 0, top: 6, height: 1, background: color, transformOrigin: '0% 50%' }}
      />
      <svg
        ref={markRef}
        width="13" height="13" viewBox="0 0 13 13"
        style={{ position: 'absolute', top: 0, left: `calc(${markAt * 100}% - 6.5px)` }}
      >
        <line x1="6.5" y1="0" x2="6.5" y2="13" stroke={markColor} />
        <line x1="0" y1="6.5" x2="13" y2="6.5" stroke={markColor} />
      </svg>
    </div>
  );
};

export default LineDivider;
