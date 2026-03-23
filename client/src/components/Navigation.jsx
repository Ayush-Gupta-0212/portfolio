import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useMediaQuery } from '../hooks/useMediaQuery';

const navItems = [
  { label: 'Home', href: '#hero' },
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Projects', href: '#projects' },
  { label: 'Certificates', href: '#certificates' },
  { label: 'Contact', href: '#contact' },
];

const SunIcon = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const Navigation = () => {
  const { mode, theme, toggle } = useTheme();
  const [active, setActive] = useState('Home');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (!isMobile) setMenuOpen(false);
  }, [isMobile]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
      if (menuOpen) setMenuOpen(false);
      const sections = ['hero', 'about', 'skills', 'projects', 'certificates', 'contact'];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom >= 120) {
            setActive(id.charAt(0).toUpperCase() + id.slice(1));
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [menuOpen]);

  const scrollTo = (href) => {
    const id = href.replace('#', '');
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 500,
          padding: isMobile ? '1rem 1.5rem' : '1.25rem 3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: scrolled || menuOpen ? theme.navBg : 'transparent',
          backdropFilter: scrolled || menuOpen ? 'blur(20px)' : 'none',
          borderBottom: scrolled || menuOpen ? `1px solid ${theme.border}` : 'none',
          transition: 'background 0.4s ease, border-color 0.4s ease',
        }}
      >
        {/* Logo */}
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.8rem',
          letterSpacing: '0.15em',
          color: theme.text,
        }}>
          AG<span style={{ color: theme.accent }}>.</span>DEV
        </div>

        {/* Desktop nav links */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
            {navItems.map(({ label, href }) => (
              <button
                key={label}
                onClick={() => scrollTo(href)}
                style={{
                  background: 'none', border: 'none',
                  color: active === label ? theme.accent : theme.muted,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '0.85rem',
                  letterSpacing: '0.05em',
                  cursor: 'none',
                  transition: 'color 0.3s ease',
                  position: 'relative',
                  padding: '0.25rem 0',
                }}
              >
                {active === label && (
                  <motion.span
                    layoutId="nav-dot"
                    style={{
                      position: 'absolute', bottom: '-6px', left: '50%',
                      transform: 'translateX(-50%)',
                      width: 4, height: 4, borderRadius: '50%',
                      background: theme.accent, display: 'block',
                    }}
                  />
                )}
                {label}
              </button>
            ))}

            <motion.button
              onClick={toggle}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{
                background: theme.accentDim,
                border: `1px solid ${theme.accentBorder}`,
                borderRadius: '50%',
                width: '36px', height: '36px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'none',
                transition: 'background 0.3s ease, border-color 0.3s ease',
              }}
            >
              <motion.div
                key={mode}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {mode === 'dark' ? <SunIcon color={theme.accent} /> : <MoonIcon color={theme.accent} />}
              </motion.div>
            </motion.button>
          </div>
        )}

        {/* Mobile: theme toggle + hamburger */}
        {isMobile && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <motion.button
              onClick={toggle}
              whileTap={{ scale: 0.9 }}
              style={{
                background: theme.accentDim,
                border: `1px solid ${theme.accentBorder}`,
                borderRadius: '50%',
                width: '34px', height: '34px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {mode === 'dark' ? <SunIcon color={theme.accent} /> : <MoonIcon color={theme.accent} />}
            </motion.button>

            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Toggle menu"
              style={{
                background: 'none', border: 'none',
                cursor: 'pointer', padding: '0.4rem',
                display: 'flex', flexDirection: 'column',
                gap: '5px', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <motion.span
                animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 7 : 0 }}
                transition={{ duration: 0.25 }}
                style={{ width: 22, height: 1.5, background: theme.text, display: 'block', transformOrigin: 'center', borderRadius: 2 }}
              />
              <motion.span
                animate={{ opacity: menuOpen ? 0 : 1, scaleX: menuOpen ? 0 : 1 }}
                transition={{ duration: 0.2 }}
                style={{ width: 22, height: 1.5, background: theme.text, display: 'block', borderRadius: 2 }}
              />
              <motion.span
                animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -7 : 0 }}
                transition={{ duration: 0.25 }}
                style={{ width: 22, height: 1.5, background: theme.text, display: 'block', transformOrigin: 'center', borderRadius: 2 }}
              />
            </button>
          </div>
        )}
      </motion.nav>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: '3.6rem',
              left: 0, right: 0,
              background: theme.navBg,
              backdropFilter: 'blur(20px)',
              borderBottom: `1px solid ${theme.border}`,
              zIndex: 499,
              padding: '0.5rem 1.5rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {navItems.map(({ label, href }) => (
              <button
                key={label}
                onClick={() => scrollTo(href)}
                style={{
                  background: 'none', border: 'none',
                  borderBottom: `1px solid ${theme.border}`,
                  color: active === label ? theme.accent : theme.textSub,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1rem',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  padding: '0.9rem 0',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'color 0.2s ease',
                }}
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigation;
