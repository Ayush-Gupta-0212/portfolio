import { useEffect, useRef } from 'react';
import { gsap, SplitText, prefersReducedMotion } from '../../lib/gsap';

/* Oversized outlined "AG.DEV" sign-off; letters rise out of masks and light up on hover */
const Wordmark = ({ theme, isMobile }) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;

    let anim;
    const split = SplitText.create(el, {
      type: 'chars',
      charsClass: 'wm-char',
      mask: 'chars',
      autoSplit: true,
      onSplit(self) {
        anim?.scrollTrigger?.kill();
        anim?.kill();
        anim = gsap.from(self.chars, {
          yPercent: 110,
          duration: 1.4,
          ease: 'expo.out',
          stagger: 0.07,
          scrollTrigger: { trigger: el, start: 'top 96%', toggleActions: 'play none none reverse' },
        });
      },
    });

    return () => {
      anim?.scrollTrigger?.kill();
      anim?.kill();
      split.revert();
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="wordmark"
      style={{
        marginTop: isMobile ? '3rem' : '4rem',
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: isMobile ? '25vw' : 'min(24vw, 22rem)',
        letterSpacing: '-0.06em',
        lineHeight: 0.82,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        color: 'transparent',
        WebkitTextStroke: `1px ${theme.muted}`,
      }}
    >
      AG<span className="hl">.</span>DEV
    </div>
  );
};

export default Wordmark;
