import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { getProjects } from '../api';
import { useTheme } from '../context/ThemeContext';
import { useMediaQuery } from '../hooks/useMediaQuery';

const FALLBACK_PROJECTS = [
  { _id: '1', title: 'Vice City — Smart City Web Platform', description: 'A full-stack smart city dashboard delivering real-time traffic alerts, live weather insights, local events, and nearby attractions — all unified with a Gemini-powered AI assistant for instant city queries.', tags: ['React', 'Node.js', 'MongoDB', 'Gemini AI', 'Maps API'], github: 'https://github.com/Ayush-Gupta-0212/Software-for-Smart-City', live: 'https://smart-city-frontend.onrender.com', featured: true, year: 2026, image: '/vice-city.png' },
  { _id: '2', title: 'AgriPower — Agricultural Energy Management', description: 'A web platform built to simplify electric power distribution for modern farms. Helps farmers track and manage energy consumption efficiently, with an integrated AI chatbot for real-time support and guidance.', tags: ['PHP', 'Tailwind CSS', 'AI Assistant Chatbot'], github: 'https://github.com/Ayush-Gupta-0212/AgriPower', live: 'https://agripower-qani.onrender.com/', featured: true, year: 2025, image: '/agripower.png' },
  { _id: '3', title: 'CineVerse — Movie Recommendation System', description: 'A full-stack recommendation engine using KNN collaborative filtering and OpenRouter LLMs to deliver personalised movie suggestions. Includes secure JWT authentication, advanced search, and a favorites management system.', tags: ['React', 'Python', 'FastAPI', 'KNN', 'LLM (OpenRouter)'], github: 'https://github.com/Ayush-Gupta-0212/CineVerse', live: 'https://github.com/Ayush-Gupta-0212/CineVerse', featured: true, year: 2025, image: '/cineverse.png' },
];

const ProjectCard = ({ project, index, theme, isMobile }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', overflow: 'hidden', cursor: 'none',
        border: `1px solid ${theme.border}`,
        background: theme.bgAlt,
      }}
    >
      {/* Featured accent line */}
      {project.featured && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px', zIndex: 3,
          background: `linear-gradient(90deg, ${theme.accent}, #00ff88)`,
        }} />
      )}

      {/* Full image — natural aspect ratio */}
      <motion.div
        animate={{ scale: hovered ? 1.03 : 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ lineHeight: 0 }}
      >
        <img
          src={project.image}
          alt={project.title}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </motion.div>

      {/* Title strip */}
      <div style={{
        padding: isMobile ? '0.9rem 1.1rem' : '1rem 1.4rem',
        borderTop: `1px solid ${theme.border}`,
      }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.58rem', color: theme.muted, letterSpacing: '0.12em', display: 'block', marginBottom: '0.3rem' }}>
          {project.year}
        </span>
        <h3 style={{
          fontSize: isMobile ? '0.95rem' : '1rem',
          fontWeight: 700, letterSpacing: '-0.02em', color: theme.text, lineHeight: 1.3,
        }}>
          {project.title}
        </h3>
      </div>

      {/* Hover overlay — slides up over the whole card */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: hovered ? '0%' : '100%' }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute', inset: 0, zIndex: 4,
          background: `${theme.bg}f0`,
          backdropFilter: 'blur(6px)',
          padding: isMobile ? '1.25rem' : '1.75rem',
          display: 'flex', flexDirection: 'column',
          borderTop: `2px solid ${theme.accent}`,
        }}
      >
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: theme.muted, letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
          {project.year}
        </span>
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: 700, letterSpacing: '-0.02em', color: theme.text,
          marginBottom: '0.85rem', lineHeight: 1.3,
        }}>
          {project.title}
        </h3>
        <p style={{
          color: theme.muted, lineHeight: 1.75,
          fontSize: isMobile ? '0.82rem' : '0.87rem',
          flex: 1, overflow: 'hidden',
        }}>
          {project.description}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '1rem', marginBottom: '1rem' }}>
          {project.tags.map(tag => (
            <span key={tag} style={{
              padding: '0.2rem 0.6rem',
              background: theme.accentDim, color: theme.accent,
              fontFamily: "'Space Mono', monospace", fontSize: '0.58rem',
              letterSpacing: '0.07em', border: `1px solid ${theme.accentBorder}`,
            }}>
              {tag}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '1.25rem' }}>
          {project.github && (
            <a href={project.github} target="_blank" rel="noreferrer"
              style={{ color: theme.accent, fontSize: '0.72rem', fontFamily: "'Space Mono', monospace", textDecoration: 'none', letterSpacing: '0.1em' }}
            >GITHUB ↗</a>
          )}
          {project.live && (
            <a href={project.live} target="_blank" rel="noreferrer"
              style={{ color: theme.accent, fontSize: '0.72rem', fontFamily: "'Space Mono', monospace", textDecoration: 'none', letterSpacing: '0.1em' }}
            >LIVE ↗</a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const Projects = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [projects, setProjects] = useState(FALLBACK_PROJECTS);

  useEffect(() => {
    getProjects().then(res => { if (res.data?.length) setProjects(res.data); }).catch(() => {});
  }, []);

  return (
    <section id="projects" ref={ref} style={{
      minHeight: '100vh',
      padding: isMobile ? '5rem 1.5rem' : '8rem 2rem',
      maxWidth: '1400px', margin: '0 auto', transition: 'color 0.5s ease',
    }}>
      <motion.div
        initial={{ opacity: 0, x: -30 }} animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6 }}
        style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}
      >
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: theme.muted, letterSpacing: '0.15em' }}>03</span>
        <span style={{ width: '3rem', height: '1px', background: theme.border }} />
        <span style={{ color: theme.muted, fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', letterSpacing: '0.15em' }}>PROJECTS</span>
      </motion.div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem', flexWrap: 'wrap', gap: '1rem' }}>
        <motion.h2
          initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, letterSpacing: '-0.03em', color: theme.text }}
        >
          Selected Work
        </motion.h2>
        <motion.span
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
          style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: theme.border }}
        >
          {projects.length} projects
        </motion.span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '1.5rem',
      }}>
        {projects.map((project, i) => (
          <ProjectCard key={project._id} project={project} index={i} theme={theme} isMobile={isMobile} />
        ))}
      </div>
    </section>
  );
};

export default Projects;
