import { memo, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { gsap, prefersReducedMotion } from '../lib/gsap';
import ScrollRevealText from '../components/reveal/ScrollRevealText';
import BlurReveal from '../components/reveal/BlurReveal';
import LineDivider from '../components/reveal/LineDivider';
import FadeUp from '../components/reveal/FadeUp';
import RollText from '../components/reveal/RollText';
import CountUp from '../components/reveal/CountUp';
import SectionLabel from '../components/reveal/SectionLabel';

const stats = [
  { value: '5+', label: 'Projects Built' },
  { value: '10+', label: 'Tech Stacks' },
  { value: '∞', label: 'Cups of Coffee' },
];

const links = [
  { label: 'GitHub', href: 'https://github.com/Ayush-Gupta-0212' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ayush-gupta-5a646b289' },
  { label: 'Resume', href: 'https://drive.google.com/file/d/1t2lAIj8f-tA10wilV_R4o7EIoYW6DqoL/view?usp=sharing' },
];

/*
 * The statement is split into lines/chars by GSAP, so it must never re-render
 * with different children. Highlight colour comes from a CSS variable instead
 * of props, and the trailing slot is where the hero monogram lands on scroll.
 */
const Statement = memo(() => (
  <>
    <span className="statement-indent" aria-hidden="true" />
    Hey, I&apos;m Ayush — a <span className="hl">full-stack developer</span> and{' '}
    <span className="hl">creative coder</span> building things that live on the internet. I craft
    immersive web experiences that blend aesthetic finesse with{' '}
    <span className="hl">technical precision.</span>
    <span data-monogram-dock className="monogram-dock" aria-hidden="true" />
  </>
));
Statement.displayName = 'Statement';

const mono = "'Space Mono', monospace";

/* Portrait that wipes up out of a clip mask, then tilts toward the cursor */
const PhotoCard = ({ theme, mode, isMobile }) => {
  const wrapRef = useRef(null);
  const tiltRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: wrapRef.current, start: 'top 85%', toggleActions: 'play none none reverse' },
      });
      tl.fromTo(tiltRef.current, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' })
        .fromTo(imgRef.current, { scale: 1.35 }, { scale: 1, duration: 1.6, ease: 'expo.out' }, 0.15);
    }, wrapRef);
    return () => ctx.revert();
  }, []);

  const onMove = (e) => {
    if (isMobile) return;
    const el = tiltRef.current;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 12;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -12;
    el.style.transform = `perspective(900px) rotateY(${x}deg) rotateX(${y}deg) scale(1.02)`;
  };
  const onLeave = () => { if (tiltRef.current) tiltRef.current.style.transform = ''; };

  return (
    <div ref={wrapRef} style={{ position: 'relative', maxWidth: isMobile ? 360 : 'none' }}>
      <div style={{
        position: 'absolute', inset: -50, zIndex: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 50% 40%, ${theme.accent}1f, transparent 65%)`, filter: 'blur(30px)',
      }} />
      <div
        ref={tiltRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ position: 'relative', zIndex: 1, overflow: 'hidden', transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)', cursor: 'none' }}
      >
        <img
          ref={imgRef}
          src="/ayush-portrait.jpg"
          alt="Ayush Gupta"
          style={{
            width: '100%', display: 'block', aspectRatio: '4/5',
            objectFit: 'cover', objectPosition: 'center top',
            filter: 'contrast(1.06) brightness(0.95) saturate(0.9)',
          }}
        />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', pointerEvents: 'none',
          background: mode === 'light'
            ? `linear-gradient(to top, ${theme.bg}88 0%, transparent 100%)`
            : `linear-gradient(to top, ${theme.bg} 0%, ${theme.bg}aa 35%, transparent 100%)`,
        }} />
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${theme.bg}0a 2px, ${theme.bg}0a 4px)`,
        }} />
        <div style={{
          position: 'absolute', left: '1rem', bottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontFamily: mono, fontSize: '0.6rem', letterSpacing: '0.14em', color: theme.text,
        }}>
          <span className="pulse-dot" />
          OPEN TO OPPORTUNITIES
        </div>
      </div>
    </div>
  );
};

const About = () => {
  const { theme, mode } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const statementStyle = {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 500,
    fontSize: isMobile ? 'clamp(1.7rem, 8vw, 2.4rem)' : 'clamp(2.2rem, 4.3vw, 4.4rem)',
    lineHeight: 1.1,
    letterSpacing: '-0.035em',
    color: theme.text,
  };

  return (
    <section
      id="about"
      style={{
        position: 'relative', zIndex: 3,
        padding: isMobile ? '6rem 1.5rem 5rem' : '10rem 2rem 8rem',
        maxWidth: '1400px', margin: '0 auto',
      }}
    >
      {/* Statement — revealed line by line, filled as you scroll */}
      <div style={{ position: 'relative' }}>
        <div style={isMobile ? { marginBottom: '2rem' } : { position: 'absolute', left: 0, top: '0.9rem' }}>
          <SectionLabel number="01" label="ABOUT" theme={theme} />
        </div>
        <ScrollRevealText as="h2" style={statementStyle}>
          <Statement />
        </ScrollRevealText>
      </div>

      <LineDivider
        color={theme.border}
        markColor={theme.textSub}
        markAt={isMobile ? 0.5 : 0.6667}
        style={{ margin: isMobile ? '3.5rem 0 3rem' : '7rem 0 5rem' }}
      />

      {/* Portrait · philosophy · bio + links */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(12, minmax(0, 1fr))',
        gap: isMobile ? '2.5rem' : '1.5rem',
        alignItems: 'start',
      }}>
        <div style={{ gridColumn: isMobile ? 'auto' : '1 / span 4' }}>
          <PhotoCard theme={theme} mode={mode} isMobile={isMobile} />
        </div>

        <div style={{ gridColumn: isMobile ? 'auto' : '6 / span 3' }}>
          <BlurReveal as="span" by="chars" style={{ display: 'block', fontFamily: mono, fontSize: '0.62rem', letterSpacing: '0.2em', color: theme.accent, marginBottom: '1.2rem' }}>
            ✦ PHILOSOPHY
          </BlurReveal>
          <BlurReveal as="p" style={{ fontSize: isMobile ? '1.2rem' : '1.4rem', lineHeight: 1.35, fontWeight: 500, letterSpacing: '-0.02em', color: theme.text }}>
            The best software is both functional and beautiful — and I refuse to compromise on either.
          </BlurReveal>
        </div>

        <FadeUp style={{ gridColumn: isMobile ? 'auto' : '9 / span 4' }}>
          <p style={{ color: theme.textSub, lineHeight: 1.85, fontSize: '1rem', marginBottom: '2.2rem', maxWidth: 420 }}>
            Currently pursuing my degree while simultaneously building production-grade applications — from scalable
            backends and clean APIs to fast, polished frontends.
          </p>
          <div style={{ display: 'flex', gap: '1.75rem', flexWrap: 'wrap' }}>
            {links.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="roll-link"
                style={{ fontFamily: mono, fontSize: '0.75rem', letterSpacing: '0.12em', color: theme.accent, textDecoration: 'none' }}
              >
                <RollText text={`${label.toUpperCase()} ↗`} />
              </a>
            ))}
          </div>
        </FadeUp>
      </div>

      {/* Stats */}
      <FadeUp
        stagger={0.12}
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          borderTop: `1px solid ${theme.border}`, marginTop: isMobile ? '3.5rem' : '6rem',
        }}
      >
        {stats.map(({ value, label }, i) => (
          <div
            key={label}
            className="about-stat"
            style={{
              padding: isMobile ? '1.2rem 0.75rem' : '1.8rem 1.5rem 1.5rem',
              borderRight: i < stats.length - 1 ? `1px solid ${theme.border}` : 'none',
              position: 'relative',
            }}
          >
            <CountUp
              value={value}
              style={{
                fontSize: isMobile ? 'clamp(1.5rem, 6vw, 2rem)' : 'clamp(2rem, 3.4vw, 3rem)',
                fontWeight: 700, color: theme.accent, letterSpacing: '-0.05em', lineHeight: 1, marginBottom: '0.6rem',
              }}
            />
            <div style={{ color: theme.muted, fontSize: isMobile ? '0.56rem' : '0.64rem', letterSpacing: '0.1em', fontFamily: mono, textTransform: 'uppercase' }}>
              {label}
            </div>
          </div>
        ))}
      </FadeUp>
    </section>
  );
};

export default About;
