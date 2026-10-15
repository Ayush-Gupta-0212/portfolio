/*
 * Colour tokens. Text tokens (text, textSub, muted, accentInk, success, danger) all
 * meet WCAG AA (4.5:1) against their theme's background.
 *   dark  bg #0a0a0a: textSub 7.85:1 · muted 4.55:1 · success 8.7:1 · danger 5.9:1
 *   light bg #fffbf5: textSub 8.77:1 · muted 4.52:1 · accentInk 4.51:1 · success 4.86:1 · danger 5.67:1
 * Button labels (accentText on accent): dark 17.8:1 · light 5.5:1
 * `accent` stays the brand colour for fills, borders, glows and large type;
 * use `accentInk` when accent-coloured text is small.
 */
export const themes = {
  dark: {
    bg:            '#0a0a0a',
    bgAlt:         '#0d0d0d',
    surface:       '#111111',
    border:        '#1a1a1a',
    borderHover:   '#333333',
    text:          '#e8e8e8',
    textSub:       '#a3a3a3',
    muted:         '#797979',
    mutedLight:    '#797979',
    accent:        '#c8ff00',
    accentInk:     '#c8ff00',
    accentText:    '#000000',
    accentDim:     'rgba(200,255,0,0.06)',
    accentBorder:  'rgba(200,255,0,0.18)',
    accentGlow:    'rgba(200,255,0,0.35)',
    success:       '#22c55e',
    danger:        '#ff4466',
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
    textSub:       '#5f4329',
    muted:         '#8c6f52',
    mutedLight:    '#8c6f52',
    accent:        '#e06820',
    accentInk:     '#bc571b',
    accentText:    '#1a0f05',
    accentDim:     'rgba(224,104,32,0.08)',
    accentBorder:  'rgba(224,104,32,0.2)',
    accentGlow:    'rgba(224,104,32,0.3)',
    success:       '#15803d',
    danger:        '#c0263f',
    navBg:         'rgba(255,251,245,0.94)',
    particleColor: '#e08030',
    particleSize:  0.035,
    particleOpacity: 0.9,
    particleCount: 5000,
    noiseOpacity:  0.02,
    gradientHero:  'radial-gradient(ellipse 70% 60% at 50% 60%, rgba(224,104,32,0.07) 0%, rgba(255,160,60,0.03) 40%, transparent 70%)',
  },
};
