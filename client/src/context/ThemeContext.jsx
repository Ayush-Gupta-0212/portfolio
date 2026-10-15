import { useEffect, useState } from 'react';
import { themes } from './themes';
import { ThemeContext } from './theme';

const STORAGE_KEY = 'portfolio-theme';

// Storage can throw (private mode, blocked site data) — fall back to dark
const readMode = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  } catch {
    return 'dark';
  }
};

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(readMode);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* not persisted */ }
  }, [mode]);

  const toggle = () => setMode(m => (m === 'dark' ? 'light' : 'dark'));
  const theme = themes[mode];

  return (
    <ThemeContext.Provider value={{ mode, theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};
