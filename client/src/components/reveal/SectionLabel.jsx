import BlurReveal from './BlurReveal';

/* "01 —— ABOUT" style section label that blurs in letter by letter */
const SectionLabel = ({ number, label, theme, style }) => (
  <BlurReveal
    as="div"
    by="chars"
    stagger={0.04}
    style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.15em', color: theme.muted,
      ...style,
    }}
  >
    {number} <span style={{ display: 'inline-block', width: '3rem', height: 1, background: theme.border }} /> {label}
  </BlurReveal>
);

export default SectionLabel;
