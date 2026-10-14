import { useEffect, useRef } from 'react';
import { gsap, SplitText, prefersReducedMotion } from '../../lib/gsap';

/* Words (or chars) resolve out of a blur in random order as they scroll into view */
const BlurReveal = ({
  as = 'p',
  children,
  by = 'words',
  stagger = 0.05,
  start = 'top 88%',
  delay = 0,
  style,
  className,
}) => {
  const Tag = as;
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;

    let anim;
    const split = SplitText.create(el, {
      type: by === 'chars' ? 'words,chars' : 'words',
      autoSplit: true,
      onSplit(self) {
        anim?.scrollTrigger?.kill();
        anim?.kill();
        const targets = by === 'chars' ? self.chars : self.words;
        anim = gsap.fromTo(targets, { autoAlpha: 0, filter: 'blur(10px)', yPercent: 20 }, {
          autoAlpha: 1,
          filter: 'blur(0px)',
          yPercent: 0,
          duration: 0.9,
          delay,
          ease: 'power2.out',
          stagger: { each: stagger, from: 'random' },
          scrollTrigger: { trigger: el, start, toggleActions: 'play none none reverse' },
        });
      },
    });

    return () => {
      anim?.scrollTrigger?.kill();
      anim?.kill();
      split.revert();
    };
  }, [by, stagger, start, delay]);

  return <Tag ref={ref} className={className} style={style}>{children}</Tag>;
};

export default BlurReveal;
