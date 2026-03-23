import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useMediaQuery } from '../hooks/useMediaQuery';

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

const About = () => {
  const ref = useRef(null);
  const imgRef = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const { theme, mode } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleMouseMove = (e) => {
    const el = imgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
    el.style.transform = `perspective(800px) rotateY(${x}deg) rotateX(${y}deg) scale(1.02)`;
  };
  const handleMouseLeave = () => {
    if (imgRef.current)
      imgRef.current.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)';
  };

  const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.11 } } };
  const item = {
    hidden: { opacity: 0, y: 36 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  };

  /* ─────────── MOBILE LAYOUT ─────────── */
  if (isMobile) {
    return (
      <section id="about" ref={ref} style={{ minHeight: '100vh', padding: '5rem 1.5rem' }}>

        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}
        >
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: theme.muted, letterSpacing: '0.15em' }}>01</span>
          <span style={{ width: '3rem', height: '1px', background: theme.border }} />
          <span style={{ color: theme.muted, fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', letterSpacing: '0.15em' }}>ABOUT</span>
        </motion.div>

        {/* Intro row: name/status left, photo right */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', marginBottom: '2rem' }}
        >
          {/* Name + status */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{
                fontFamily: "'Space Mono', monospace", fontSize: '0.9rem',
                color: theme.muted, letterSpacing: '0.15em', display: 'block', marginBottom: '0.4rem',
              }}>
                HEY, I'M
              </span>
              <h2 style={{
                fontSize: 'clamp(1.8rem, 7vw, 2.6rem)', fontWeight: 800,
                letterSpacing: '-0.04em', lineHeight: 1, color: theme.text,
              }}>
                Ayush
              </h2>
              <h2 style={{
                fontSize: 'clamp(1.8rem, 7vw, 2.6rem)', fontWeight: 800,
                letterSpacing: '-0.04em', lineHeight: 1,
                WebkitTextStroke: `2px ${theme.accent}`,
                color: 'transparent',
              }}>
                Gupta.
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <motion.div
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }}
              />
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: '#22c55e', letterSpacing: '0.1em' }}>OPEN TO WORK</span>
              <span style={{ color: theme.border, fontSize: '0.75rem' }}>·</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: theme.muted, letterSpacing: '0.1em' }}>INDIA 🇮🇳</span>
            </div>
          </div>

          {/* Photo */}
          <div style={{
            width: '110px', flexShrink: 0,
            overflow: 'hidden',
            position: 'relative',
          }}>
            <img
              src="/ayush2.png"
              alt="Ayush Gupta"
              style={{
                width: '100%', aspectRatio: '3/4',
                objectFit: 'cover', objectPosition: 'center top',
                display: 'block',
                filter: 'contrast(1.06) brightness(0.95) saturate(0.9)',
              }}
            />
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          variants={stagger} initial="hidden" animate={inView ? 'visible' : 'hidden'}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          {/* Bio */}
          <div>
            <motion.p variants={item} style={{ color: theme.textSub, lineHeight: 1.85, fontSize: '0.95rem' }}>
              I'm a full-stack developer passionate about building things that live on the internet. I specialize in crafting web experiences that blend technical precision with clean, functional code.
            </motion.p>
            <motion.p variants={item} style={{ color: theme.muted, lineHeight: 1.85, fontSize: '0.92rem', marginTop: '1rem' }}>
              Currently pursuing my degree while building production-grade applications. I believe great software is both functional and well-built — and I don't compromise on either.
            </motion.p>
          </div>

          {/* Links */}
          <motion.div variants={item} style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            {links.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'Space Mono', monospace", fontSize: '0.72rem',
                  color: theme.accent, textDecoration: 'none',
                  letterSpacing: '0.1em',
                  borderBottom: `1px solid ${theme.accentBorder}`,
                  paddingBottom: '2px',
                }}
              >
                {label} ↗
              </a>
            ))}
          </motion.div>

          {/* Stats strip */}
          <motion.div
            variants={item}
            style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              borderTop: `1px solid ${theme.border}`,
            }}
          >
            {stats.map(({ value, label }, i) => (
              <div
                key={label}
                style={{
                  padding: '1.1rem 0.75rem',
                  borderRight: i < stats.length - 1 ? `1px solid ${theme.border}` : 'none',
                }}
              >
                <div style={{
                  fontSize: 'clamp(1.4rem, 5vw, 2rem)', fontWeight: 700,
                  color: theme.accent, letterSpacing: '-0.04em',
                  fontFamily: "'Space Grotesk', sans-serif",
                  lineHeight: 1, marginBottom: '0.35rem',
                }}>
                  {value}
                </div>
                <div style={{
                  color: theme.muted, fontSize: '0.58rem',
                  letterSpacing: '0.08em', fontFamily: "'Space Mono', monospace",
                  textTransform: 'uppercase', lineHeight: 1.5,
                }}>
                  {label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

      </section>
    );
  }

  /* ─────────── DESKTOP LAYOUT ─────────── */
  return (
    <section id="about" ref={ref} style={{
      minHeight: '100vh', padding: '8rem 2rem',
      maxWidth: '1400px', margin: '0 auto',
    }}>
      {/* Section label */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6 }}
        style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '5rem' }}
      >
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: theme.muted, letterSpacing: '0.15em' }}>01</span>
        <span style={{ width: '3rem', height: '1px', background: theme.border }} />
        <span style={{ color: theme.muted, fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', letterSpacing: '0.15em' }}>ABOUT</span>
      </motion.div>

      {/* Main grid: text | photo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '5rem', alignItems: 'start' }}>

        {/* LEFT: text + stats */}
        <motion.div variants={stagger} initial="hidden" animate={inView ? 'visible' : 'hidden'}>
          <motion.div variants={item} style={{ marginBottom: '1.5rem' }}>
            <span style={{
              fontFamily: "'Space Mono', monospace", fontSize: '1.1rem',
              color: theme.muted, letterSpacing: '0.15em', display: 'block', marginBottom: '0.6rem',
            }}>
              HEY, I'M
            </span>
            <h2 style={{
              fontSize: 'clamp(2.8rem, 5vw, 4.5rem)', fontWeight: 800,
              letterSpacing: '-0.04em', lineHeight: 1, color: theme.text,
            }}>
              Ayush
            </h2>
            <h2 style={{
              fontSize: 'clamp(2.8rem, 5vw, 4.5rem)', fontWeight: 800,
              letterSpacing: '-0.04em', lineHeight: 1,
              WebkitTextStroke: `2px ${theme.accent}`,
              color: 'transparent',
            }}>
              Gupta.
            </h2>
          </motion.div>

          {[
            "I'm a full-stack developer and creative coder passionate about building things that live on the internet. I specialize in crafting immersive web experiences that blend aesthetic finesse with technical precision.",
            "Currently pursuing my degree while simultaneously building production-grade applications. I believe the best software is both functional and beautiful — and I refuse to compromise on either.",
          ].map((text, i) => (
            <motion.p key={i} variants={item} style={{
              color: i === 0 ? theme.textSub : theme.muted,
              lineHeight: 1.9, marginBottom: '1.8rem', fontSize: '1.02rem',
            }}>{text}</motion.p>
          ))}

          {/* Links */}
          <motion.div variants={item} style={{ display: 'flex', gap: '1.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
            {links.map(({ label, href }) => (
              <a
                key={label} href={href} target="_blank" rel="noopener noreferrer"
                style={{
                  fontFamily: "'Space Mono', monospace", fontSize: '0.75rem',
                  color: theme.accent, textDecoration: 'none', letterSpacing: '0.1em',
                  borderBottom: `1px solid ${theme.accentBorder}`, paddingBottom: '2px',
                  transition: 'border-color 0.3s ease, opacity 0.3s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.opacity = '0.75'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = theme.accentBorder; e.currentTarget.style.opacity = '1'; }}
              >
                {label} ↗
              </a>
            ))}
          </motion.div>

          {/* Stats strip */}
          <motion.div
            variants={item}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: `1px solid ${theme.border}`, marginTop: '0.5rem' }}
          >
            {stats.map(({ value, label }, i) => (
              <motion.div
                key={label}
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{
                  padding: '1.6rem 1.4rem 1.4rem',
                  borderRight: i < stats.length - 1 ? `1px solid ${theme.border}` : 'none',
                  position: 'relative', cursor: 'default',
                }}
              >
                <motion.div
                  initial={{ scaleX: 0 }} whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    position: 'absolute', top: -1, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg, ${theme.accent}, transparent)`,
                    transformOrigin: 'left',
                  }}
                />
                <div style={{
                  fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 700,
                  color: theme.accent, letterSpacing: '-0.05em',
                  fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1, marginBottom: '0.5rem',
                }}>
                  {value}
                </div>
                <div style={{
                  color: theme.muted, fontSize: '0.63rem',
                  letterSpacing: '0.1em', fontFamily: "'Space Mono', monospace",
                  textTransform: 'uppercase', lineHeight: 1.5,
                }}>
                  {label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT: photo */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'relative' }}
        >
          <div style={{
            position: 'absolute', inset: -60,
            background: `radial-gradient(ellipse at 50% 40%, ${theme.accent}22, transparent 65%)`,
            filter: 'blur(30px)', zIndex: 0, pointerEvents: 'none',
          }} />

          <motion.div
            initial={{ scaleY: 0, opacity: 0 }}
            animate={inView ? { scaleY: 1, opacity: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute', left: -20, top: '10%',
              width: 1, height: '80%',
              background: `linear-gradient(to bottom, transparent, ${theme.accent}80, transparent)`,
              transformOrigin: 'top', zIndex: 1,
            }}
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.7, duration: 0.8 }}
            style={{
              position: 'absolute', top: -24, right: -24,
              width: 80, height: 80,
              backgroundImage: `radial-gradient(circle, ${theme.accent}55 1px, transparent 1px)`,
              backgroundSize: '10px 10px', zIndex: 0,
            }}
          />

          <div
            ref={imgRef}
            style={{
              position: 'relative', zIndex: 1, overflow: 'hidden',
              cursor: 'none', transition: 'box-shadow 0.4s ease', transformStyle: 'preserve-3d',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 24px 60px ${theme.accent}20`; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; if (imgRef.current) imgRef.current.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)'; }}
            onMouseMove={handleMouseMove}
          >
            <img
              src="/ayush2.png"
              alt="Ayush Gupta"
              style={{
                width: '100%', display: 'block', aspectRatio: '3/4',
                objectFit: 'cover', objectPosition: 'center top',
                filter: 'contrast(1.06) brightness(0.95) saturate(0.9)',
                transition: 'filter 0.5s ease',
              }}
              onMouseEnter={e => e.target.style.filter = 'contrast(1.1) brightness(1.03) saturate(1.05)'}
              onMouseLeave={e => e.target.style.filter = 'contrast(1.06) brightness(0.95) saturate(0.9)'}
            />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
              background: mode === 'light'
                ? `linear-gradient(to top, ${theme.bg}88 0%, ${theme.bg}44 40%, transparent 100%)`
                : `linear-gradient(to top, ${theme.bg} 0%, ${theme.bg}cc 30%, ${theme.bg}55 60%, transparent 100%)`,
              pointerEvents: 'none', zIndex: 2,
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${theme.bg}08 2px, ${theme.bg}08 4px)`,
              pointerEvents: 'none', zIndex: 2,
            }} />
            <div style={{
              position: 'absolute', top: 0, right: 0, width: 80, height: 80,
              background: `linear-gradient(135deg, transparent 50%, ${theme.accent}18 100%)`,
              zIndex: 3, pointerEvents: 'none',
            }} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.9, duration: 0.6 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.2rem', justifyContent: 'center' }}
          >
            <motion.div
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }}
            />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.62rem', color: theme.muted, letterSpacing: '0.12em' }}>
              OPEN TO OPPORTUNITIES
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
