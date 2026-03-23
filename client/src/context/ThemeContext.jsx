import { createContext, useContext, useEffect, useState } from 'react';

export const themes = {
  dark: {
    bg:            '#0a0a0a',
    bgAlt:         '#0d0d0d',
    surface:       '#111111',
    border:        '#1a1a1a',
    borderHover:   '#333333',
    text:          '#e8e8e8',
    textSub:       '#888888',
    muted:         '#555555',
    mutedLight:    '#444444',
    accent:        '#c8ff00',
    accentText:    '#000000',
    accentDim:     'rgba(200,255,0,0.06)',
    accentBorder:  'rgba(200,255,0,0.18)',
    accentGlow:    'rgba(200,255,0,0.35)',
    navBg:         'rgba(10,10,10,0.88)',
    particleColor: '#c8ff00',
    particleSize:  0.015,
    particleOpacity: 0.7,
    particleCount: 4000,
    noiseOpacity:  0.04,
    gradientHero:  'radial-gradient(ellipse 60% 60% at 50% 60%, rgba(200,255,0,0.04) 0%, transparent 70%)',
  },
  light: {
    bg:            '#fffbf5',
    bgAlt:         '#ffffff',
    surface:       '#f5ece0',
    border:        '#f0dcc8',
    borderHover:   '#c8a080',
    text:          '#2a1a0a',
    textSub:       '#7a5a3a',
    muted:         '#9a7a5a',
    mutedLight:    '#b89a7a',
    accent:        '#e06820',
    accentText:    '#ffffff',
    accentDim:     'rgba(224,104,32,0.08)',
    accentBorder:  'rgba(224,104,32,0.2)',
    accentGlow:    'rgba(224,104,32,0.3)',
    navBg:         'rgba(255,251,245,0.94)',
    particleColor: '#e08030',
    particleSize:  0.035,
    particleOpacity: 0.9,
    particleCount: 5000,
    noiseOpacity:  0.02,
    gradientHero:  'radial-gradient(ellipse 70% 60% at 50% 60%, rgba(224,104,32,0.07) 0%, rgba(255,160,60,0.03) 40%, transparent 70%)',
  },
};

const ThemeContext = createContext({ mode: 'dark', theme: themes.dark, toggle: () => {} });

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => localStorage.getItem('portfolio-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('portfolio-theme', mode);
  }, [mode]);

  const toggle = () => setMode(m => (m === 'dark' ? 'light' : 'dark'));
  const theme = themes[mode];

  return (
    <ThemeContext.Provider value={{ mode, theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
