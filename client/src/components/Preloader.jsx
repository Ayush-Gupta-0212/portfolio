import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── tiny hook: animated counter ─── */
const useCounter = (target, duration = 2600) => {
  const [value, setValue] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      // Exponential easing out
      const eased = 1 - Math.pow(1 - t, 4);
      setValue(Math.floor(eased * target));
      if (t < 1) requestAnimationFrame(tick);
      else { setValue(target); setDone(true); }
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return { value, done };
};

/* ─── Canvas: animated noise / radar sweep ─── */
const RadarCanvas = () => {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c.getContext('2d');
    let angle = 0;
    let id;
    const SIZE = 220;
    c.width = SIZE; c.height = SIZE;
    const cx = SIZE / 2, cy = SIZE / 2, R = SIZE * 0.42;

    const draw = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);

      // Concentric rings
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, R * (i / 3), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200,255,0,${0.06 * i})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Cross-hairs
      ctx.strokeStyle = 'rgba(200,255,0,0.07)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();

      // Sweep gradient
      const grad = ctx.createConicalGradient?.(cx, cy, angle - 1.2, angle)
        ?? (() => { const g = ctx.createLinearGradient(0, 0, SIZE, 0); return g; })();

      // Fallback sweep — draw a conic arc:
      ctx.save();
      const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      sweepGrad.addColorStop(0, 'rgba(200,255,0,0.25)');
      sweepGrad.addColorStop(1, 'rgba(200,255,0,0)');
      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, angle - 1.1, angle);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Dot at sweep tip
      const dotX = cx + Math.cos(angle) * R;
      const dotY = cy + Math.sin(angle) * R;
      const dotGrad = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 10);
      dotGrad.addColorStop(0, 'rgba(200,255,0,0.9)');
      dotGrad.addColorStop(1, 'rgba(200,255,0,0)');
      ctx.fillStyle = dotGrad;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 10, 0, Math.PI * 2);
      ctx.fill();

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(200,255,0,0.18)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      angle += 0.04;
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.9,
        pointerEvents: 'none',
      }}
    />
  );
};

/* ─── Scanlines overlay ─── */
const Scanlines = () => (
  <div
    style={{
      position: 'absolute', inset: 0,
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
      pointerEvents: 'none',
      zIndex: 1,
    }}
  />
);

/* ─── Glitching name ─── */
const GlitchName = ({ progress }) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  const target = 'AYUSH GUPTA';
  const [display, setDisplay] = useState('           ');
  const frameRef = useRef(0);

  useEffect(() => {
    let id;
    const tick = () => {
      const revealed = Math.floor((progress / 100) * target.length);
      setDisplay(
        target.split('').map((ch, i) => {
          if (ch === ' ') return ' ';
          if (i < revealed) return ch;
          if (i === revealed) return chars[Math.floor(Math.random() * chars.length)];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('')
      );
      frameRef.current++;
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [progress]);

  return (
    <div
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: 'clamp(1.6rem, 4vw, 2.8rem)',
        letterSpacing: '0.18em',
        color: '#e8e8e8',
        textAlign: 'center',
        position: 'relative',
        zIndex: 2,
        minWidth: '16ch',
        textTransform: 'uppercase',
      }}
    >
      {display}
    </div>
  );
};

/* ─── Main Preloader ─── */
const Preloader = ({ onComplete }) => {
  const [done, setDone] = useState(false);
  const { value: count, done: countDone } = useCounter(100, 2800);

  useEffect(() => {
    if (countDone) {
      const t1 = setTimeout(() => setDone(true), 500);
      const t2 = setTimeout(() => onComplete?.(), 1300);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [countDone, onComplete]);

  // Status messages sequence
  const messages = [
    'INITIALIZING',
    'LOADING ASSETS',
    'CALIBRATING UI',
    'ALMOST THERE',
    'READY',
  ];
  const msgIndex = Math.min(Math.floor((count / 100) * messages.length), messages.length - 1);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          style={{
            position: 'fixed', inset: 0,
            background: '#000',
            zIndex: 9000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <Scanlines />

          {/* Corner brackets */}
          {[
            { top: '2rem', left: '2rem', borderTop: '1px solid', borderLeft: '1px solid' },
            { top: '2rem', right: '2rem', borderTop: '1px solid', borderRight: '1px solid' },
            { bottom: '2rem', left: '2rem', borderBottom: '1px solid', borderLeft: '1px solid' },
            { bottom: '2rem', right: '2rem', borderBottom: '1px solid', borderRight: '1px solid' },
          ].map((style, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              style={{
                position: 'absolute',
                width: '30px', height: '30px',
                borderColor: 'rgba(200,255,0,0.4)',
                ...style,
              }}
            />
          ))}

          {/* Top-left label */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              position: 'absolute',
              top: '2rem', left: '3rem',
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.65rem',
              color: '#333',
              letterSpacing: '0.15em',
            }}
          >
            AY.DEV — PORTFOLIO
          </motion.div>

          {/* Top-right: live clock */}
          <LiveTime />

          {/* Center: radar + name */}
          <div style={{ position: 'relative', width: 220, height: 220, marginBottom: '3rem' }}>
            <RadarCanvas />
          </div>

          {/* Glitch name */}
          <GlitchName progress={count} />

          {/* Title tag */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.65rem',
              color: '#c8ff00',
              letterSpacing: '0.3em',
              marginTop: '0.5rem',
              marginBottom: '3rem',
              zIndex: 2,
            }}
          >
            FULL STACK DEVELOPER
          </motion.div>

          {/* Progress bar */}
          <div
            style={{
              position: 'relative',
              width: 'min(420px, 80vw)',
              height: '1px',
              background: '#111',
              zIndex: 2,
            }}
          >
            <motion.div
              style={{
                position: 'absolute',
                left: 0, top: 0,
                height: '100%',
                width: `${count}%`,
                background: 'linear-gradient(90deg, #c8ff00, #00ff88)',
                boxShadow: '0 0 8px rgba(200,255,0,0.6)',
                transition: 'width 0.04s linear',
              }}
            />
            {/* Glowing head */}
            <div
              style={{
                position: 'absolute',
                top: '-3px',
                left: `${count}%`,
                width: 6, height: 6,
                borderRadius: '50%',
                background: '#c8ff00',
                boxShadow: '0 0 12px 4px rgba(200,255,0,0.8)',
                transform: 'translateX(-50%)',
                transition: 'left 0.04s linear',
              }}
            />
          </div>

          {/* Counter + status row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: 'min(420px, 80vw)',
              marginTop: '0.75rem',
              zIndex: 2,
            }}
          >
            <motion.span
              key={messages[msgIndex]}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.6rem',
                color: '#444',
                letterSpacing: '0.15em',
              }}
            >
              {messages[msgIndex]}
            </motion.span>

            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.85rem',
                color: '#c8ff00',
                letterSpacing: '0.1em',
                fontWeight: 700,
              }}
            >
              {String(count).padStart(3, '0')}
              <span style={{ color: '#333', fontSize: '0.6rem' }}>%</span>
            </span>
          </div>

          {/* Bottom: decorative data readouts */}
          <div
            style={{
              position: 'absolute',
              bottom: '2rem',
              left: '3rem',
              right: '3rem',
              display: 'flex',
              justifyContent: 'space-between',
              zIndex: 2,
            }}
          >
            {['REACT v18', 'THREE.JS', 'NODE.JS', 'MONGODB'].map((item, i) => (
              <motion.span
                key={item}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: count > i * 25 ? 0.35 : 0, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.55rem',
                  color: '#c8ff00',
                  letterSpacing: '0.1em',
                }}
              >
                {item}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ─── Live clock ─── */
const LiveTime = () => {
  const [time, setTime] = useState('');
  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      setTime(
        [d.getHours(), d.getMinutes(), d.getSeconds()]
          .map(n => String(n).padStart(2, '0'))
          .join(':')
      );
    };
    fmt();
    const id = setInterval(fmt, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      style={{
        position: 'absolute',
        top: '2rem', right: '3rem',
        fontFamily: "'Space Mono', monospace",
        fontSize: '0.65rem',
        color: '#333',
        letterSpacing: '0.15em',
      }}
    >
      {time}
    </motion.div>
  );
};

export default Preloader;
