import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { getSkills } from '../api';
import { useTheme } from '../context/ThemeContext';
import { useMediaQuery } from '../hooks/useMediaQuery';

const FALLBACK_SKILLS = {
  Languages: [
    { name: 'C++', level: 75 },
    { name: 'C', level: 70 },
    { name: 'JavaScript', level: 85 },
    { name: 'Python', level: 65 },
  ],
  Frameworks: [
    { name: 'React.js', level: 82 },
    { name: 'HTML / CSS', level: 88 },
    { name: 'Tailwind CSS', level: 85 },
    { name: 'Framer Motion', level: 65 },
    { name: 'Node.js', level: 78 },
    { name: 'Express.js', level: 75 },
  ],
  'CS Fundamentals': [
    { name: 'Data Structures & Algorithms', level: 70 },
    { name: 'OOP', level: 78 },
    { name: 'Operating Systems', level: 65 },
    { name: 'Computer Networks', level: 62 },
    { name: 'DBMS', level: 68 },
  ],
  Tools: [
    { name: 'SQL Server', level: 65 },
    { name: 'MongoDB', level: 75 },
    { name: 'GitHub', level: 80 },
    { name: 'VS Code', level: 90 },
    { name: 'Notion', level: 72 },
  ],
};

const SkillBar = ({ name, level, inView, theme }) => (
  <div style={{ marginBottom: '1rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
      <span style={{ color: theme.textSub, fontSize: '0.85rem', fontFamily: "'Space Mono', monospace" }}>{name}</span>
      <span style={{ color: theme.muted, fontSize: '0.75rem', fontFamily: "'Space Mono', monospace" }}>{level}%</span>
    </div>
    <div style={{ height: '2px', background: theme.border, position: 'relative', overflow: 'hidden' }}>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: level / 100 } : { scaleX: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        style={{
          position: 'absolute', left: 0, top: 0, height: '100%', width: '100%',
          background: `linear-gradient(90deg, ${theme.accent}, #00ff88)`,
          transformOrigin: 'left',
        }}
      />
    </div>
  </div>
);

const Skills = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [grouped, setGrouped] = useState(FALLBACK_SKILLS);
  const [activeCategory, setActiveCategory] = useState('Languages');

  useEffect(() => {
    getSkills().then(res => { if (res.data?.grouped) setGrouped(res.data.grouped); }).catch(() => {});
  }, []);

  const categories = Object.keys(grouped);
  const currentSkills = grouped[activeCategory] || [];

  return (
    <section id="skills" ref={ref} style={{
      minHeight: '100vh',
      padding: isMobile ? '5rem 1.5rem' : '8rem 2rem',
      maxWidth: '1400px', margin: '0 auto', transition: 'color 0.5s ease',
    }}>
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, x: -30 }} animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6 }}
        style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '4rem' }}
      >
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: theme.muted, letterSpacing: '0.15em' }}>02</span>
        <span style={{ width: '3rem', height: '1px', background: theme.border }} />
        <span style={{ color: theme.muted, fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', letterSpacing: '0.15em' }}>SKILLS</span>
      </motion.div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? '3rem' : '6rem',
        alignItems: 'start',
      }}>
        {/* Left */}
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700,
              letterSpacing: '-0.03em', color: theme.text, marginBottom: '1rem',
            }}
          >
            What I work with
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.15 }}
            style={{ color: theme.muted, marginBottom: '3rem', lineHeight: 1.8 }}
          >
            A curated set of technologies I use to build fast, scalable, and beautiful things.
          </motion.p>

          {/* Category tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '3rem' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                background: activeCategory === cat ? theme.accent : 'transparent',
                color: activeCategory === cat ? theme.accentText : theme.muted,
                border: `1px solid ${activeCategory === cat ? theme.accent : theme.border}`,
                padding: '0.45rem 1rem',
                fontFamily: "'Space Mono', monospace", fontSize: '0.65rem',
                letterSpacing: '0.1em', cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}>
                {cat.toUpperCase()}
              </button>
            ))}
          </div>

          <div>
            {currentSkills.map(skill => (
              <SkillBar key={skill.name} name={skill.name} level={skill.level} inView={inView} theme={theme} />
            ))}
          </div>
        </div>

        {/* Right: tag cloud */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          style={{
            border: `1px solid ${theme.border}`,
            background: theme.bgAlt,
            padding: isMobile ? '1.5rem' : '3rem',
            display: 'flex', flexWrap: 'wrap',
            gap: '0.75rem', alignContent: 'flex-start',
            transition: 'background 0.5s ease, border-color 0.5s ease',
          }}
        >
          {Object.values(grouped).flat().map(skill => {
            const isActive = (grouped[activeCategory] || []).some(s => s.name === skill.name);
            return (
              <motion.span key={skill.name}
                animate={isActive ? {
                  color: theme.accent,
                  borderColor: theme.accent,
                  background: theme.accentDim,
                } : {
                  color: theme.mutedLight,
                  borderColor: theme.border,
                  background: 'transparent',
                }}
                whileHover={{
                  y: -6, scale: 1.08,
                  color: theme.accent, borderColor: theme.accent,
                  boxShadow: `0 8px 24px ${theme.accentGlow}`,
                  background: theme.accentDim,
                }}
                transition={{ type: 'spring', stiffness: 340, damping: 22 }}
                style={{
                  padding: '0.45rem 0.9rem',
                  border: `1px solid ${theme.border}`,
                  fontFamily: "'Space Mono', monospace", fontSize: '0.7rem',
                  letterSpacing: '0.05em', cursor: 'default', display: 'inline-block',
                }}
              >
                {skill.name}
              </motion.span>
            );
          })}
          <div style={{ width: '100%', marginTop: '2rem', borderTop: `1px solid ${theme.border}`, paddingTop: '1.5rem' }}>
            <p style={{ color: theme.muted, fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', lineHeight: 1.8 }}>
              Always learning. Currently deepening expertise in system design, DSA, and full-stack architecture.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Skills;
