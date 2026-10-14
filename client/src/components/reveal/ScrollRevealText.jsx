import { useEffect, useRef } from 'react';
import { gsap, SplitText, prefersReducedMotion } from '../../lib/gsap';

/**
 * Trionn-style statement reveal.
 *  1. Each line rises out of its own mask, one after another, as it enters.
 *  2. Characters then fill from dim to full in reading order, scrubbed by scroll,
 *     so the copy "lights up" line by line as you read down.
 * Only opacity/transform are animated, so theme colours stay CSS-driven.
 */
const ScrollRevealText = ({
  as = 'h2',
  children,
  style,
  className,
  dim = 0.14,
  fillStart = 'top 78%',
  fillEnd = 'bottom 48%',
}) => {
  const Tag = as;
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;

    let anims = [];
    const kill = () => {
      anims.forEach((a) => { a.scrollTrigger?.kill(); a.kill(); });
      anims = [];
    };

    const split = SplitText.create(el, {
      type: 'lines,words,chars',
      mask: 'lines',
      linesClass: 'reveal-line',
      wordsClass: 'reveal-word',
      charsClass: 'reveal-char',
      autoSplit: true,
      onSplit(self) {
        kill();
        self.lines.forEach((line, i) => {
          anims.push(gsap.from(line, {
            yPercent: 125,
            rotate: 2.5,
            transformOrigin: '0% 100%',
            duration: 1.15,
            ease: 'expo.out',
            delay: (i % 4) * 0.07,
            scrollTrigger: {
              trigger: self.masks[i] || line,
              start: 'top 94%',
              toggleActions: 'play none none reverse',
            },
          }));
        });
        anims.push(gsap.fromTo(self.chars, { opacity: dim }, {
          opacity: 1,
          ease: 'none',
          stagger: 0.03,
          scrollTrigger: { trigger: el, start: fillStart, end: fillEnd, scrub: 0.6 },
        }));
      },
    });

    return () => {
      kill();
      split.revert();
    };
  }, [dim, fillStart, fillEnd]);

  return <Tag ref={ref} className={className} style={style}>{children}</Tag>;
};

export default ScrollRevealText;
