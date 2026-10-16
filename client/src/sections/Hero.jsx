import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useTheme } from '../context/theme';
import { useMediaQuery } from '../hooks/useMediaQuery';
import HeroMonogram from '../components/HeroMonogram';
import RollText from '../components/reveal/RollText';
import { scrollToTarget } from '../lib/scroll';
import { useContent } from '../content/context';
import { fullName } from '../content/store';
import { loadParticles } from '../three/loaders';
import { getQuality, pixelRatio } from '../lib/device';

const YEAR = new Date().getFullYear();

/* ── Scramble hook ── */
const useScramble = (text, trigger) => {
  const [display, setDisplay] = useState(text);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%';
  useEffect(() => {
    if (!trigger) { setDisplay(text); return; }
    let iter = 0;
    const max = text.length * 3;
    const id = setInterval(() => {
      setDisplay(text.split('').map((ch, i) => {
        if (ch === ' ') return ' ';
        if (i < iter / 3) return ch;
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(''));
      iter++;
      if (iter > max) { setDisplay(text); clearInterval(id); }
    }, 30);
    return () => clearInterval(id);
  }, [trigger, text]);
  return display;
};

/* ── Availability pill (desktop only) ── */
const AvailabilityPill = ({ theme, profile }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 1.4, duration: 0.6, ease: 'backOut' }}
    style={{
      display: 'flex', flexDirection: 'column', gap: '0.6rem',
      paddingLeft: '1.5rem',
      borderLeft: `1px solid ${theme.border}`,
    }}
  >
    {profile.available && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <motion.div
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          style={{ width: 7, height: 7, borderRadius: '50%', background: theme.success, flexShrink: 0 }}
        />
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: theme.success, letterSpacing: '0.12em' }}>{profile.availabilityLabel.toUpperCase()}</span>
      </div>
    )}
    {profile.location && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div style={{ width: 7, height: 7, flexShrink: 0 }} />
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: theme.muted, letterSpacing: '0.1em' }}>{profile.location.toUpperCase()}</span>
      </div>
    )}
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <div style={{ width: 7, height: 7, flexShrink: 0 }} />
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: theme.muted, letterSpacing: '0.1em' }}>© {YEAR}</span>
    </div>
  </motion.div>
);

/* ── Particle field (three.js loads in its own chunk, started by the preloader) ── */
const ParticlesCanvas = ({ particleColor, particleSize = 0.015, particleOpacity = 0.7, particleCount = 4000, isMobile = false }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const quality = getQuality();
    if (!canvas || !quality.particles) return undefined; // low-end devices skip the extra WebGL context
    let scene = null;
    let cancelled = false;
    loadParticles()
      .then(({ HeroParticles }) => {
        if (cancelled) return;
        scene = new HeroParticles({
          canvas,
          color: particleColor,
          size: particleSize,
          opacity: particleOpacity,
          count: Math.round(particleCount * quality.particles),
          pixelRatio: pixelRatio(isMobile),
        });
      })
      .catch((err) => console.warn('Hero particles disabled:', err));
    return () => {
      cancelled = true;
      scene?.dispose();
    };
  }, [particleColor, particleSize, particleOpacity, particleCount, isMobile]);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
};

/* ── Main Hero ── */
const Hero = () => {
  const { theme, mode } = useTheme();
  const { profile } = useContent().content;
  const roles = useMemo(() => (profile.roles.length ? profile.roles : [' ']), [profile.roles]);
  const ticker = useMemo(() => roles.flatMap((r) => [r.toUpperCase(), '•']), [roles]);
  const name = fullName(profile);
  const sectionRef = useRef(null);
  const nameRef = useRef(null);
  const pillRef = useRef(null);
  const ctaRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  /* Where the monogram sits: centred in the empty space right of the name */
  const getDesktopAnchor = useCallback((w) => {
    const section = sectionRef.current;
    const name = nameRef.current;
    if (!section || !name) return null;
    const s = section.getBoundingClientRect();
    const n = name.getBoundingClientRect();
    const left = (pillRef.current?.getBoundingClientRect().right ?? n.right) - s.left;
    const right = w - 64;
    const avail = right - left;
    const cy = n.top - s.top + n.height / 2;
    if (avail < 260) return { x: w * 0.8, y: cy - n.height * 0.35, width: Math.max(200, w * 0.28) };
    return { x: left + avail * 0.5, y: cy - 10, width: Math.min(avail * 0.92, 680) };
  }, []);

  /* Mobile: in the open space under the CTAs, or beside the name on short screens */
  const getMobileAnchor = useCallback((w, h) => {
    const section = sectionRef.current;
    const name = nameRef.current;
    if (!section || !name) return null;
    const s = section.getBoundingClientRect();
    const ctaBottom = (ctaRef.current?.getBoundingClientRect().bottom ?? s.bottom) - s.top;
    const free = h - 60 - ctaBottom; // leave room for the hint underneath
    if (free >= 110) {
      return { x: w / 2, y: ctaBottom + free / 2 + 12, width: Math.min(w * 0.68, free * 1.8) };
    }
    const n = name.getBoundingClientRect();
    return { x: w * 0.82, y: n.top - s.top + n.height * 0.3, width: w * 0.3 };
  }, []);

  const [mountScramble, setMountScramble] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setMountScramble(true);
      setTimeout(() => setMountScramble(false), 1400);
    }, 1400);
    return () => clearTimeout(t);
  }, []);

  const ayush = useScramble(profile.firstName.toUpperCase(), mountScramble);
  const gupta = useScramble(profile.lastName.toUpperCase(), mountScramble);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spotX = useTransform(mouseX, v => `${v}px`);
  const spotY = useTransform(mouseY, v => `${v}px`);

  const handleMouseMove = useCallback((e) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }, [mouseX, mouseY]);

  const [roleIdx, setRoleIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [tickerHovered, setTickerHovered] = useState(false);

  useEffect(() => {
    const current = roles[roleIdx % roles.length];
    let timeout;
    if (!deleting && typed.length < current.length) {
      timeout = setTimeout(() => setTyped(current.slice(0, typed.length + 1)), 65);
    } else if (!deleting && typed.length === current.length) {
      timeout = setTimeout(() => setDeleting(true), 2000);
    } else if (deleting && typed.length > 0) {
      timeout = setTimeout(() => setTyped(current.slice(0, typed.length - 1)), 35);
    } else if (deleting && typed.length === 0) {
      timeout = setTimeout(() => {
        setDeleting(false);
        setRoleIdx(i => (i + 1) % roles.length);
      }, 0);
    }
    return () => clearTimeout(timeout);
  }, [typed, deleting, roleIdx, roles]);

  /* ─────────── MOBILE LAYOUT ─────────── */
  if (isMobile) {
    return (
      <section
        id="hero"
        ref={sectionRef}
        style={{ position: 'relative', minHeight: '100svh', overflow: 'hidden', display: 'flex', flexDirection: 'column', touchAction: 'pan-y', WebkitTouchCallout: 'none' }}
      >
        <ParticlesCanvas
          particleColor={theme.particleColor}
          particleSize={theme.particleSize}
          particleOpacity={0.5}
          particleCount={1000}
          isMobile
        />
        <HeroMonogram sectionRef={sectionRef} getAnchor={getMobileAnchor} mode={mode} theme={theme} isMobile />

        {/* Ticker */}
        <div style={{
          position: 'absolute', top: '3.8rem', left: 0, right: 0,
          overflow: 'hidden', zIndex: 3,
          borderTop: `1px solid ${theme.border}`,
          borderBottom: `1px solid ${theme.border}`,
        }}>
          <div className="marquee-track">
            {[...Array(6)].flatMap(() =>
              ticker
            ).map((t, i) => (
              <span key={i} style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', color: i % 2 === 1 ? theme.accentInk : theme.muted, letterSpacing: '0.15em' }}>{t}</span>
            ))}
          </div>
        </div>

        <h1 className="sr-only">{name} — {roles[0]}</h1>

        {/* Main content — top-aligned, starts below ticker */}
        <div style={{
          position: 'relative', zIndex: 3,
          padding: '7.5rem 1.5rem 5rem',
          display: 'flex', flexDirection: 'column',
          gap: '1.25rem',
          flex: 1,
        }}>

          {/* Small label */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}
          >
            <span style={{ width: '1.5rem', height: '1px', background: theme.accent, display: 'block', flexShrink: 0 }} />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', color: theme.muted, letterSpacing: '0.2em' }}>PORTFOLIO / {YEAR}</span>
          </motion.div>

          {/* Name block */}
          <div ref={nameRef} data-quake style={{ lineHeight: 0.88, alignSelf: 'flex-start' }}>
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <span aria-hidden="true" style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 'clamp(3.2rem, 20vw, 5.5rem)',
                color: theme.text,
                letterSpacing: '-0.04em',
                display: 'block',
              }}>
                {ayush}
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              <span aria-hidden="true" style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 'clamp(3.2rem, 20vw, 5.5rem)',
                color: 'transparent',
                WebkitTextStroke: `2px ${theme.accent}`,
                letterSpacing: '-0.04em',
                display: 'block',
              }}>
                {gupta}
              </span>
            </motion.div>
          </div>

          {/* Status strip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}
          >
            <motion.div
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: theme.success, flexShrink: 0 }}
            />
            {profile.available && (
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: theme.success, letterSpacing: '0.1em' }}>{profile.availabilityLabel.toUpperCase()}</span>
            )}
            {profile.available && profile.location && <span style={{ color: theme.border, fontSize: '0.7rem' }}>·</span>}
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: theme.muted, letterSpacing: '0.1em' }}>{profile.location.toUpperCase()}</span>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.7 }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: `1px solid ${theme.border}`,
              borderBottom: `1px solid ${theme.border}`,
              padding: '0.85rem 0',
            }}
          >
            {profile.heroStats.map(({ value: n, label: l }, i) => (
              <div key={`${l}-${i}`} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
                flex: 1,
                borderRight: i < profile.heroStats.length - 1 ? `1px solid ${theme.border}` : 'none',
              }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.3rem', color: theme.accent, lineHeight: 1 }}>{n}</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', color: theme.muted, letterSpacing: '0.08em' }}>{l.toUpperCase()}</span>
              </div>
            ))}
          </motion.div>

          {/* Typewriter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.85rem', color: theme.textSub }}>{typed}</span>
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{ display: 'inline-block', width: 1.5, height: '0.95rem', background: theme.accent, flexShrink: 0 }}
            />
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.7 }}
            style={{
              color: theme.muted, fontSize: '0.88rem',
              lineHeight: 1.75, fontWeight: 300,
              maxWidth: '100%',
            }}
          >
            {profile.heroIntro}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            ref={ctaRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.35, duration: 0.7 }}
            style={{ display: 'flex', gap: '0.75rem' }}
          >
            <motion.button
              onClick={() => scrollToTarget('#projects')}
              whileTap={{ scale: 0.97 }}
              style={{
                flex: 1, padding: '0.9rem 1rem',
                background: theme.accent, color: theme.accentText,
                border: 'none', fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.08em',
                cursor: 'pointer',
              }}
            >
              VIEW WORK →
            </motion.button>
            <motion.button
              onClick={() => scrollToTarget('#contact')}
              whileTap={{ scale: 0.97 }}
              style={{
                flex: 1, padding: '0.9rem 1rem',
                background: 'transparent', color: theme.textSub,
                border: `1px solid ${theme.border}`,
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 500, fontSize: '0.8rem', letterSpacing: '0.08em',
                cursor: 'pointer',
                transition: 'border-color 0.3s ease, color 0.3s ease',
              }}
            >
              CONTACT
            </motion.button>
          </motion.div>
        </div>
      </section>
    );
  }

  /* ─────────── DESKTOP LAYOUT ─────────── */
  return (
    <section
      id="hero"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      style={{ position: 'relative', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', touchAction: 'pan-y' }}
    >
      <ParticlesCanvas particleColor={theme.particleColor} particleSize={theme.particleSize} particleOpacity={theme.particleOpacity} particleCount={theme.particleCount} />
      <HeroMonogram sectionRef={sectionRef} getAnchor={getDesktopAnchor} mode={mode} theme={theme} />

      {/* Mouse spotlight */}
      <motion.div
        style={{
          position: 'absolute', left: spotX, top: spotY,
          width: 280, height: 280,
          transform: 'translate(-50%,-50%)',
          background: `radial-gradient(circle, ${theme.accentGlow} 0%, transparent 70%)`,
          pointerEvents: 'none', zIndex: 1, opacity: 0.08, mixBlendMode: 'screen',
        }}
      />

      {/* Scrolling ticker */}
      <div
        style={{ position: 'absolute', top: '3.8rem', left: 0, right: 0, overflow: 'hidden', zIndex: 3, borderTop: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, cursor: 'none' }}
        onMouseEnter={() => setTickerHovered(true)}
        onMouseLeave={() => setTickerHovered(false)}
      >
        <div className={`marquee-track${tickerHovered ? ' slow' : ''}`}>
          {[...Array(6)].flatMap(() =>
            ticker
          ).map((t, i) => (
            <span key={i} style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: i % 2 === 1 ? theme.accentInk : theme.muted, letterSpacing: '0.2em' }}>{t}</span>
          ))}
        </div>
      </div>

      <h1 className="sr-only">{name} — {roles[0]}</h1>

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 3, padding: '4rem 4rem 0', display: 'flex', flexDirection: 'column' }}>

        {/* BIG NAME ROW */}
        <div ref={nameRef} style={{ position: 'relative', alignSelf: 'flex-start' }}>
          <motion.div
            initial={{ opacity: 0, x: -80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', lineHeight: 0.85 }}
          >
            <span data-quake aria-hidden="true" style={{
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
              fontSize: 'clamp(5rem, 14vw, 12rem)', color: theme.text,
              letterSpacing: '-0.04em', transition: 'color 0.3s ease',
            }}>
              {ayush}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', alignItems: 'center', gap: '2rem', lineHeight: 0.85 }}
          >
            <span data-quake aria-hidden="true" style={{
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
              fontSize: 'clamp(5rem, 14vw, 12rem)', color: 'transparent',
              WebkitTextStroke: `2px ${theme.accent}`, letterSpacing: '-0.04em',
            }}>
              {gupta}
            </span>
            <div ref={pillRef} data-quake>
              <AvailabilityPill theme={theme} profile={profile} />
            </div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '3rem',
            borderTop: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`,
            padding: '1rem 0', margin: '1.5rem 0',
          }}
        >
          {profile.heroStats.map(({ value: n, label: l }, i) => (
            <div key={`${l}-${i}`} data-quake style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.4rem', color: theme.accent }}>{n}</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: theme.muted, letterSpacing: '0.1em' }}>{l.toUpperCase()}</span>
              {i < profile.heroStats.length - 1 && <span style={{ marginLeft: '3rem', color: theme.border }}>|</span>}
            </div>
          ))}
          <div data-quake style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem', color: theme.textSub }}>{typed}</span>
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{ display: 'inline-block', width: 2, height: '1.1rem', background: theme.accent }}
            />
          </div>
        </motion.div>

        {/* Bottom row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}
        >
          <p data-quake style={{ color: theme.muted, fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '420px', fontWeight: 300 }}>
            {profile.heroIntro}
          </p>
          <div data-quake style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <motion.button
              onClick={() => scrollToTarget('#projects')}
              whileHover={{ scale: 1.04, boxShadow: `0 8px 32px ${theme.accentGlow}` }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '0.9rem 2.2rem', background: theme.accent, color: theme.accentText,
                border: 'none', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
                fontSize: '0.85rem', letterSpacing: '0.08em', cursor: 'none',
                transition: 'background 0.5s ease',
              }}
              className="roll-link"
            >
              <RollText text="VIEW WORK →" />
            </motion.button>
            <motion.button
              onClick={() => scrollToTarget('#contact')}
              whileHover={{ scale: 1.04, borderColor: theme.accent, color: theme.accentInk }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '0.9rem 2.2rem', background: 'transparent', color: theme.textSub,
                border: `1px solid ${theme.border}`, fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 500, fontSize: '0.85rem', letterSpacing: '0.08em', cursor: 'none',
                transition: 'border-color 0.3s ease, color 0.3s ease',
              }}
              className="roll-link"
            >
              <RollText text="CONTACT" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Bottom-left label */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.8 }}
        style={{
          position: 'absolute', bottom: '2rem', left: '3rem',
          fontFamily: "'Space Mono', monospace", fontSize: '0.6rem',
          color: theme.muted, letterSpacing: '0.2em', zIndex: 3,
        }}
      >
        {name.toUpperCase()} — PORTFOLIO {YEAR}
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        style={{
          position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
          zIndex: 3,
        }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 1, height: '2.5rem', background: `linear-gradient(to bottom, ${theme.accent}, transparent)` }}
        />
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', color: theme.muted, letterSpacing: '0.2em' }}>SCROLL DOWN</span>
      </motion.div>
    </section>
  );
};

export default Hero;
