import { useState } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { useTheme } from './context/theme';
import { ContentProvider } from './content/ContentProvider';
import CustomCursor from './components/CustomCursor';
import NoiseOverlay from './components/NoiseOverlay';
import Preloader from './components/Preloader';
import Navigation from './components/Navigation';
import BackToTop from './components/BackToTop';
import Hero from './sections/Hero';
import About from './sections/About';
import Skills from './sections/Skills';
import Projects from './sections/Projects';
import Certificates from './sections/Certificates';
import Contact from './sections/Contact';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import './index.css';

const PortfolioSite = () => {
  const [loaded, setLoaded] = useState(false);
  const { theme } = useTheme();
  useSmoothScroll();

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', transition: 'background 0.5s ease, color 0.5s ease', '--theme-accent': theme.accent, '--theme-accent-ink': theme.accentInk, '--theme-muted': theme.muted }}>
      <a href="#main" className="skip-link">Skip to content</a>
      <CustomCursor />
      <NoiseOverlay opacity={theme.noiseOpacity} />

      <AnimatePresence>
        {!loaded && <Preloader onComplete={() => setLoaded(true)} />}
      </AnimatePresence>

      {loaded && (
        <>
          <Navigation />
          <BackToTop />
          <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
            <Hero />
            <div style={{ height: '1px', background: theme.border, maxWidth: '1400px', margin: '0 auto' }} />
            <About />
            <div style={{ height: '1px', background: theme.border, maxWidth: '1400px', margin: '0 auto' }} />
            <Skills />
            <div style={{ height: '1px', background: theme.border, maxWidth: '1400px', margin: '0 auto' }} />
            <Projects />
            <div style={{ height: '1px', background: theme.border, maxWidth: '1400px', margin: '0 auto' }} />
            <Certificates />
            <div style={{ height: '1px', background: theme.border, maxWidth: '1400px', margin: '0 auto' }} />
            <Contact />
          </main>
        </>
      )}
    </div>
  );
};

const App = () => (
  <ThemeProvider>
    {/* Framer Motion follows the OS "reduce motion" setting, like the GSAP/WebGL parts */}
    <MotionConfig reducedMotion="user">
      <ContentProvider>
        <PortfolioSite />
      </ContentProvider>
    </MotionConfig>
  </ThemeProvider>
);

export default App;
