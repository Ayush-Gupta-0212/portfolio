/* Label whose letters roll up and are replaced by a copy on hover (see .roll in index.css) */
const RollText = ({ text }) => {
  const row = (hidden) => (
    <span className="roll-row" aria-hidden={hidden || undefined}>
      {text.split('').map((ch, i) => (
        <span key={i} style={{ transitionDelay: `${i * 16}ms` }}>{ch === ' ' ? ' ' : ch}</span>
      ))}
    </span>
  );
  return (
    <span className="roll" aria-label={text}>
      {row(false)}
      {row(true)}
    </span>
  );
};

export default RollText;
