import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import * as THREE from 'three';
import { useTheme } from '../context/ThemeContext';
import { useMediaQuery } from '../hooks/useMediaQuery';

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
const AvailabilityPill = ({ theme }) => (
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <motion.div
        animate={{ opacity: [1, 0.2, 1] }}
        transition={{ duration: 1.6, repeat: Infinity }}
        style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }}
      />
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: '#22c55e', letterSpacing: '0.12em' }}>OPEN TO WORK</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <div style={{ width: 7, height: 7, flexShrink: 0 }} />
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: theme.muted, letterSpacing: '0.1em' }}>INDIA 🇮🇳</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <div style={{ width: 7, height: 7, flexShrink: 0 }} />
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: theme.muted, letterSpacing: '0.1em' }}>© 2026</span>
    </div>
  </motion.div>
);

/* ── Three.js canvas ── */
const ParticlesCanvas = ({ particleColor, particleSize = 0.015, particleOpacity = 0.7, particleCount = 4000 }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.z = 5;
    const count = particleCount;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 18;
      speeds[i] = 0.0002 + Math.random() * 0.0006;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const hex = particleColor.replace('#', '');
    const material = new THREE.PointsMaterial({ color: parseInt(hex, 16), size: particleSize, transparent: true, opacity: particleOpacity, sizeAttenuation: true });
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    let mouseX = 0, mouseY = 0;
    const onMouse = (e) => { mouseX = (e.clientX / window.innerWidth - 0.5) * 2; mouseY = -(e.clientY / window.innerHeight - 0.5) * 2; };
    window.addEventListener('mousemove', onMouse);
    const resize = () => { camera.aspect = canvas.clientWidth / canvas.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(canvas.clientWidth, canvas.clientHeight); };
    window.addEventListener('resize', resize);
    let animId;
    const animate = () => {
      const pos = geometry.attributes.position.array;
      for (let i = 0; i < count; i++) { pos[i * 3 + 1] -= speeds[i]; if (pos[i * 3 + 1] < -9) pos[i * 3 + 1] = 9; }
      geometry.attributes.position.needsUpdate = true;
      particles.rotation.y += 0.0003; particles.rotation.x += 0.0001;
      camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.02;
      camera.position.y += (mouseY * 0.5 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('mousemove', onMouse); window.removeEventListener('resize', resize); renderer.dispose(); geometry.dispose(); material.dispose(); };
  }, [particleColor, particleSize, particleOpacity, particleCount]);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
};

/* ── Main Hero ── */
const Hero = () => {
  const { theme } = useTheme();
  const sectionRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [mountScramble, setMountScramble] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setMountScramble(true);
      setTimeout(() => setMountScramble(false), 1400);
    }, 1400);
    return () => clearTimeout(t);
  }, []);

  const ayush = useScramble('AYUSH', mountScramble);
  const gupta = useScramble('GUPTA', mountScramble);

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

  const roles = ['Full Stack Developer', 'React & Node.js', 'REST APIs', 'MongoDB & SQL', 'Creative Coding'];
  const [roleIdx, setRoleIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [tickerHovered, setTickerHovered] = useState(false);

  useEffect(() => {
    const current = roles[roleIdx];
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
  }, [typed, deleting, roleIdx]);

  /* ─────────── MOBILE LAYOUT ─────────── */
  if (isMobile) {
    return (
      <section
        id="hero"
        ref={sectionRef}
        style={{ position: 'relative', minHeight: '100svh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        <ParticlesCanvas
          particleColor={theme.particleColor}
          particleSize={theme.particleSize}
          particleOpacity={0.5}
          particleCount={1000}
        />

        {/* Ticker */}
        <div style={{
          position: 'absolute', top: '3.8rem', left: 0, right: 0,
          overflow: 'hidden', zIndex: 3,
          borderTop: `1px solid ${theme.border}`,
          borderBottom: `1px solid ${theme.border}`,
        }}>
          <div className="marquee-track">
            {[...Array(6)].flatMap(() =>
              ['FULL STACK DEVELOPER', '•', 'REACT & NODE.JS', '•', 'REST APIs', '•', 'MONGODB & SQL', '•', 'OPEN SOURCE', '•']
            ).map((t, i) => (
              <span key={i} style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', color: i % 2 === 1 ? theme.accent : theme.muted, letterSpacing: '0.15em' }}>{t}</span>
            ))}
          </div>
        </div>

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
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', color: theme.muted, letterSpacing: '0.2em' }}>PORTFOLIO / 2026</span>
          </motion.div>

          {/* Name block */}
          <div style={{ lineHeight: 0.88 }}>
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <span style={{
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
              <span style={{
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
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }}
            />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: '#22c55e', letterSpacing: '0.1em' }}>OPEN TO WORK</span>
            <span style={{ color: theme.border, fontSize: '0.7rem' }}>·</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: theme.muted, letterSpacing: '0.1em' }}>INDIA 🇮🇳</span>
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
            {[{ n: '5+', l: 'Projects' }, { n: '10+', l: 'Stacks' }, { n: '∞', l: 'Learning' }].map(({ n, l }, i) => (
              <div key={l} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
                flex: 1,
                borderRight: i < 2 ? `1px solid ${theme.border}` : 'none',
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
            I build things for the web — scalable backends, clean APIs, and fast frontends. Focused on writing code that's functional, efficient, and actually shipped.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.35, duration: 0.7 }}
            style={{ display: 'flex', gap: '0.75rem' }}
          >
            <motion.button
              onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
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
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
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

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          style={{
            position: 'absolute', bottom: '1.5rem', left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
            zIndex: 3,
          }}
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 1, height: '1.8rem', background: `linear-gradient(to bottom, ${theme.accent}, transparent)` }}
          />
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5rem', color: theme.muted, letterSpacing: '0.2em' }}>SCROLL</span>
        </motion.div>
      </section>
    );
  }

  /* ─────────── DESKTOP LAYOUT ─────────── */
  return (
    <section
      id="hero"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      style={{ position: 'relative', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
    >
      <ParticlesCanvas particleColor={theme.particleColor} particleSize={theme.particleSize} particleOpacity={theme.particleOpacity} particleCount={theme.particleCount} />

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
            ['FULL STACK DEVELOPER', '•', 'REACT & NODE.JS', '•', 'REST APIs', '•', 'MONGODB & SQL', '•', 'CREATIVE CODING', '•']
          ).map((t, i) => (
            <span key={i} style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: i % 2 === 1 ? theme.accent : theme.muted, letterSpacing: '0.2em' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 3, padding: '4rem 4rem 0', display: 'flex', flexDirection: 'column' }}>

        {/* BIG NAME ROW */}
        <div style={{ position: 'relative' }}>
          <motion.div
            initial={{ opacity: 0, x: -80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', lineHeight: 0.85 }}
          >
            <span style={{
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
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
              fontSize: 'clamp(5rem, 14vw, 12rem)', color: 'transparent',
              WebkitTextStroke: `2px ${theme.accent}`, letterSpacing: '-0.04em',
            }}>
              {gupta}
            </span>
            <AvailabilityPill theme={theme} />
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
          {[{ n: '5+', l: 'Projects' }, { n: '10+', l: 'Tech Stacks' }, { n: '∞', l: 'Learning' }].map(({ n, l }, i) => (
            <div key={l} style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.4rem', color: theme.accent }}>{n}</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: theme.muted, letterSpacing: '0.1em' }}>{l.toUpperCase()}</span>
              {i < 2 && <span style={{ marginLeft: '3rem', color: theme.border }}>|</span>}
            </div>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
          <p style={{ color: theme.muted, fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '420px', fontWeight: 300 }}>
            I build things for the web — scalable backends, clean APIs, and fast frontends. Focused on writing code that's functional, efficient, and actually shipped.
          </p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <motion.button
              onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.04, boxShadow: `0 8px 32px ${theme.accentGlow}` }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '0.9rem 2.2rem', background: theme.accent, color: theme.accentText,
                border: 'none', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
                fontSize: '0.85rem', letterSpacing: '0.08em', cursor: 'none',
                transition: 'background 0.5s ease',
              }}
            >
              VIEW WORK →
            </motion.button>
            <motion.button
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.04, borderColor: theme.accent, color: theme.accent }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '0.9rem 2.2rem', background: 'transparent', color: theme.textSub,
                border: `1px solid ${theme.border}`, fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 500, fontSize: '0.85rem', letterSpacing: '0.08em', cursor: 'none',
                transition: 'border-color 0.3s ease, color 0.3s ease',
              }}
            >
              CONTACT
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
        AYUSH GUPTA — PORTFOLIO 2026
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
