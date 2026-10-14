import { useEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../lib/gsap';

/* Children slide up and fade in (staggered) when they scroll into view */
const FadeUp = ({ as = 'div', children, y = 28, stagger = 0.08, delay = 0, start = 'top 90%', style, className }) => {
  const Tag = as;
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(el.children, { autoAlpha: 0, y }, {
        autoAlpha: 1,
        y: 0,
        duration: 1,
        delay,
        stagger,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start, toggleActions: 'play none none reverse' },
      });
    }, ref);
    return () => ctx.revert();
  }, [y, stagger, delay, start]);

  return <Tag ref={ref} className={className} style={style}>{children}</Tag>;
};

export default FadeUp;
