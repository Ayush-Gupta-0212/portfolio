import { useEffect, useRef } from 'react';
import { gsap, SplitText, prefersReducedMotion } from '../../lib/gsap';

/* Heading whose lines rise out of their own masks, one after another */
const LineReveal = ({ as = 'h2', children, style, className, start = 'top 88%', stagger = 0.1, delay = 0 }) => {
  const Tag = as;
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;

    let anim;
    const split = SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'lr-line',
      autoSplit: true,
      onSplit(self) {
        anim?.scrollTrigger?.kill();
        anim?.kill();
        anim = gsap.from(self.lines, {
          yPercent: 125,
          rotate: 3,
          transformOrigin: '0% 100%',
          duration: 1.2,
          delay,
          stagger,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start, toggleActions: 'play none none reverse' },
        });
      },
    });

    return () => {
      anim?.scrollTrigger?.kill();
      anim?.kill();
      split.revert();
    };
  }, [start, stagger, delay]);

  return <Tag ref={ref} className={className} style={style}>{children}</Tag>;
};

export default LineReveal;
