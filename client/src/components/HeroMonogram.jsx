import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MonogramExperience, MONOGRAM_PALETTES } from '../three/monogram/MonogramExperience';

/* Small "press and hold" glyph used in the hint */
const HoldIcon = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ display: 'inline-block', verticalAlign: '-2px' }}>
    <circle cx="7" cy="7" r="6" stroke={color} strokeOpacity="0.5" />
    <circle cx="7" cy="7" r="2.4" fill={color} />
  </svg>
);

/* The About statement ends with an empty slot the monogram lands in */
const getDock = () => document.querySelector('[data-monogram-dock]');

const HeroMonogram = ({ sectionRef, getAnchor, mode, theme, isMobile = false }) => {
  const layerRef = useRef(null);
  const hostRef = useRef(null);
  const overlayRef = useRef(null);
  const hintRef = useRef(null);
  const expRef = useRef(null);
  const initialMode = useRef(mode);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !hostRef.current) return undefined;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let exp;
    try {
      exp = new MonogramExperience({
        layer: layerRef.current,
        host: hostRef.current,
        overlay: overlayRef.current,
        hint: hintRef.current,
        section,
        palette: MONOGRAM_PALETTES[initialMode.current],
        getAnchor,
        getDock,
        stageSelectors: ['#about'],
        isMobile,
        reducedMotion,
      });
    } catch (err) {
      // WebGL unavailable — the hero still works without the monogram
      console.warn('Hero monogram disabled:', err);
      return undefined;
    }
    expRef.current = exp;
    // layout settles while the name animates in; re-measure a few times
    const timers = [450, 1300, 2300].map((ms) => setTimeout(() => exp.refreshAnchor(), ms));
    return () => {
      timers.forEach(clearTimeout);
      exp.dispose();
      expRef.current = null;
    };
  }, [sectionRef, getAnchor, isMobile]);

  useEffect(() => {
    expRef.current?.setPalette(MONOGRAM_PALETTES[mode]);
  }, [mode]);

  return (
    // Fixed to the viewport so the monogram can stay pinned while the hero scrolls away
    <div ref={layerRef} aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
      <div ref={hostRef} style={{ position: 'absolute', inset: 0 }} />
      <canvas ref={overlayRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      <div ref={hintRef} style={{ position: 'absolute', left: 0, top: 0, willChange: 'transform, opacity' }}>
        <motion.div
          initial={{ opacity: 0, filter: 'blur(10px)', y: 8 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ delay: 2.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{
            x: '-50%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem',
            fontFamily: "'Space Mono', monospace", whiteSpace: 'nowrap', textAlign: 'center',
          }}
        >
          <span style={{ fontSize: isMobile ? '0.55rem' : '0.62rem', letterSpacing: '0.22em', color: theme.textSub }}>
            {isMobile ? 'PRESS' : 'HOLD'} <HoldIcon color={theme.accent} /> TO SHATTER
          </span>
          <span style={{ fontSize: isMobile ? '0.5rem' : '0.56rem', letterSpacing: '0.18em', color: theme.muted }}>
            {isMobile ? 'SWIPE TO SPIN' : 'DRAG TO SPIN · DARE TO TOUCH THE LINES ⚡'}
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroMonogram;
