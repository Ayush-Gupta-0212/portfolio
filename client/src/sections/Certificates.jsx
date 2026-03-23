import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useMediaQuery } from '../hooks/useMediaQuery';

const CERTIFICATES = [
  {
    id: '1',
    title: 'The Bits and Bytes of Computer Networking',
    issuer: 'Google · Coursera',
    date: 'Sep 2024',
    link: 'https://coursera.org/share/4e4c7de8a17077c5b7739a5b60a9ff4c',
    image: '/cert-google-networking.png',
  },
  {
    id: '2',
    title: 'ChatGPT-4 Prompt Engineering: ChatGPT, Generative AI & LLM',
    issuer: 'Infosys Springboard',
    date: 'Aug 2025',
    link: 'https://verify.onwingspan.com/',
    image: '/cert-infosys-prompt.png',
  },
  {
    id: '3',
    title: 'Cloud Computing',
    issuer: 'NPTEL · IIT Kharagpur · Elite',
    date: 'Jan–Apr 2025',
    link: 'https://archive.nptel.ac.in/content/noc/NOC25/SEM1/Ecertificates/106/noc25-cs11/Course/NPTEL25CS11S143730205304237111.pdf',
    image: '/cert-nptel-cloud.png',
  },
  {
    id: '4',
    title: 'Data Structures and Algorithm',
    issuer: 'LPU · iamNEO · 72 hrs',
    date: 'Dec 2024',
    link: 'https://lpucolab438.examly.io/certificate/U2FsdGVkX1%2FFrU7t0k%2FGDI6CamFFUjuhLa6tCSJi1MY%3D',
    image: '/cert-lpu-dsa.png',
  },
  {
    id: '5',
    title: 'Object Oriented Programming',
    issuer: 'LPU · iamNEO · 72 hrs',
    date: 'Dec 2024',
    link: 'https://lpucolab438.examly.io/certificate/U2FsdGVkX19K1WhCp9UOMqDVZwHp5TWa00dRMvED0Vs%3D',
    image: '/cert-lpu-oop.png',
  },
];

const CARD_WIDTH = 300;
const CARD_GAP = 24;

/* ── Card ── */
const CertCard = ({ cert, theme, pausedRef }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={cert.link}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => { setHovered(true); pausedRef.current = true; }}
      onMouseLeave={() => { setHovered(false); pausedRef.current = false; }}
      style={{
        display: 'block', textDecoration: 'none',
        width: `${CARD_WIDTH}px`, flexShrink: 0,
        border: `1px solid ${hovered ? theme.accent : theme.border}`,
        background: theme.bgAlt,
        position: 'relative', overflow: 'hidden',
        transition: 'border-color 0.3s ease, transform 0.35s ease',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        cursor: 'none',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px', zIndex: 2,
        background: `linear-gradient(90deg, ${theme.accent}, #00ff88)`,
        opacity: hovered ? 1 : 0, transition: 'opacity 0.3s ease',
      }} />

      <div style={{ width: '100%', overflow: 'hidden', lineHeight: 0, position: 'relative' }}>
        <img
          src={cert.image} alt={cert.title}
          style={{
            width: '100%', height: 'auto', display: 'block',
            transform: hovered ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform 0.5s ease',
          }}
        />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
          background: `linear-gradient(to top, ${theme.bgAlt}, transparent)`,
          pointerEvents: 'none',
        }} />
      </div>

      <div style={{ padding: '1.1rem 1.25rem', borderTop: `1px solid ${theme.border}` }}>
        <span style={{
          fontFamily: "'Space Mono', monospace", fontSize: '0.55rem',
          color: theme.accent, letterSpacing: '0.15em',
          display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase',
        }}>{cert.issuer}</span>
        <h3 style={{
          fontSize: '0.88rem', fontWeight: 700, color: theme.text,
          letterSpacing: '-0.01em', lineHeight: 1.35, marginBottom: '0.75rem',
        }}>{cert.title}</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', color: theme.muted, letterSpacing: '0.1em' }}>
            {cert.date}
          </span>
          <span style={{
            fontFamily: "'Space Mono', monospace", fontSize: '0.58rem',
            color: theme.accent, letterSpacing: '0.08em',
            opacity: hovered ? 1 : 0.35, transition: 'opacity 0.3s ease',
          }}>VERIFY ↗</span>
        </div>
      </div>
    </a>
  );
};

/* ── Arrow Button ── */
const ArrowBtn = ({ dir, theme, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileTap={{ scale: 0.88 }}
      style={{
        width: '42px', height: '42px', borderRadius: '50%',
        border: `1px solid ${hovered ? theme.accent : theme.border}`,
        background: hovered ? theme.accent : 'transparent',
        color: hovered ? theme.accentText : theme.muted,
        fontSize: '1.1rem', cursor: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.25s ease',
        outline: 'none', flexShrink: 0,
      }}
    >
      {dir === -1 ? '←' : '→'}
    </motion.button>
  );
};

/* ── Main Section ── */
const Certificates = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const trackRef = useRef(null);
  const posRef = useRef(0);
  const targetRef = useRef(0);
  const pausedRef = useRef(false);
  const touchStartRef = useRef(null);
  const rafRef = useRef(null);

  const totalWidth = CERTIFICATES.length * (CARD_WIDTH + CARD_GAP);
  const doubled = [...CERTIFICATES, ...CERTIFICATES];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const tick = () => {
      // Auto advance target when not paused
      if (!pausedRef.current) targetRef.current += 0.5;

      // Wrap target
      if (targetRef.current >= totalWidth) targetRef.current -= totalWidth;
      if (targetRef.current < 0) targetRef.current += totalWidth;

      // Lerp pos → target with wrap-around awareness
      let diff = targetRef.current - posRef.current;
      if (diff > totalWidth / 2) diff -= totalWidth;
      if (diff < -totalWidth / 2) diff += totalWidth;
      posRef.current += diff * 0.07;
      if (posRef.current >= totalWidth) posRef.current -= totalWidth;
      if (posRef.current < 0) posRef.current += totalWidth;

      track.style.transform = `translateX(-${posRef.current}px)`;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [totalWidth]);

  const scrollBy = (dir) => {
    targetRef.current += dir * (CARD_WIDTH + CARD_GAP);
    if (targetRef.current >= totalWidth) targetRef.current -= totalWidth;
    if (targetRef.current < 0) targetRef.current += totalWidth;
  };

  const handleTouchStart = (e) => {
    pausedRef.current = true;
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (touchStartRef.current === null) return;
    const delta = touchStartRef.current - e.touches[0].clientX;
    targetRef.current += delta;
    posRef.current += delta;
    if (targetRef.current < 0) targetRef.current += totalWidth;
    if (targetRef.current >= totalWidth) targetRef.current -= totalWidth;
    if (posRef.current < 0) posRef.current += totalWidth;
    if (posRef.current >= totalWidth) posRef.current -= totalWidth;
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    pausedRef.current = false;
  };

  return (
    <section id="certificates" ref={ref} style={{
      padding: isMobile ? '5rem 0' : '8rem 0',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: isMobile ? '0 1.5rem' : '0 2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}
        >
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: theme.muted, letterSpacing: '0.15em' }}>04</span>
          <span style={{ width: '3rem', height: '1px', background: theme.border }} />
          <span style={{ color: theme.muted, fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', letterSpacing: '0.15em' }}>CERTIFICATES</span>
        </motion.div>

        {/* Title row + arrows */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, letterSpacing: '-0.03em', color: theme.text }}
          >
            Credentials
          </motion.h2>

          {/* Arrows — desktop only, right of title */}
          {!isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.4 }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            >
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: theme.border, marginRight: '0.5rem' }}>
                {CERTIFICATES.length} certs
              </span>
              <ArrowBtn dir={-1} theme={theme} onClick={() => scrollBy(-1)} />
              <ArrowBtn dir={1} theme={theme} onClick={() => scrollBy(1)} />
            </motion.div>
          )}
        </div>
      </div>

      {/* Carousel track */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.3 }}
        style={{ position: 'relative' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Edge fades */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: '80px', zIndex: 2, pointerEvents: 'none',
          background: `linear-gradient(to right, ${theme.bg}, transparent)`,
        }} />
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: '80px', zIndex: 2, pointerEvents: 'none',
          background: `linear-gradient(to left, ${theme.bg}, transparent)`,
        }} />

        <div style={{ overflow: 'hidden', padding: '0.5rem 0 1.5rem' }}>
          <div
            ref={trackRef}
            style={{ display: 'flex', gap: `${CARD_GAP}px`, width: 'max-content', willChange: 'transform' }}
          >
            {doubled.map((cert, i) => (
              <CertCard key={`${cert.id}-${i}`} cert={cert} theme={theme} pausedRef={pausedRef} />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Certificates;
