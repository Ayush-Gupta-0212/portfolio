import { useEffect, useRef, useState } from 'react';

// Touch devices keep their native interaction — no custom cursor
const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

const CustomCursor = () => {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [hovering, setHovering] = useState(false);
  const [mode, setMode] = useState(null);

  // 3D scenes drive contextual cursor states (hold / charging / drag / view)
  useEffect(() => {
    const onMode = (e) => setMode(e.detail);
    window.addEventListener('cursor-mode', onMode);
    return () => window.removeEventListener('cursor-mode', onMode);
  }, []);

  useEffect(() => {
    if (isTouchDevice) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = mouseX + 'px';
      dot.style.top = mouseY + 'px';
    };

    const animate = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';
      requestAnimationFrame(animate);
    };

    const onEnter = () => setHovering(true);
    const onLeave = () => setHovering(false);

    const interactables = document.querySelectorAll('a, button, [data-cursor]');
    interactables.forEach(el => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    window.addEventListener('mousemove', onMove);
    animate();

    const observer = new MutationObserver(() => {
      const els = document.querySelectorAll('a, button, [data-cursor]');
      els.forEach(el => {
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      observer.disconnect();
    };
  }, []);

  if (isTouchDevice) return null;

  const label = { hold: 'HOLD', charging: 'HOLD', blasted: 'RELEASE', drag: '‹ DRAG ›', view: 'VIEW ↗' }[mode];

  return (
    <>
      <div ref={dotRef} className={`cursor-dot ${hovering ? 'hovering' : ''} ${mode ? 'has-mode' : ''}`} />
      <div ref={ringRef} className={`cursor-ring ${hovering ? 'hovering' : ''} ${mode ? `mode mode-${mode}` : ''}`}>
        <span className="cursor-label">{label}</span>
      </div>
    </>
  );
};

export default CustomCursor;
