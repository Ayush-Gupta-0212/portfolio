import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider, useTheme } from './context/ThemeContext';
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
    <div style={{ background: theme.bg, minHeight: '100vh', transition: 'background 0.5s ease, color 0.5s ease' }}>
      <CustomCursor />
      <NoiseOverlay opacity={theme.noiseOpacity} />

      <AnimatePresence>
        {!loaded && <Preloader onComplete={() => setLoaded(true)} />}
      </AnimatePresence>

      {loaded && (
        <>
          <Navigation />
          <BackToTop />
          <main>
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
    <PortfolioSite />
  </ThemeProvider>
);

export default App;
