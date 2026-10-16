import { useEffect, useRef } from 'react';
import { useTheme } from '../context/theme';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap';
import { PHASE } from '../three/certSpiral/phase';
import { loadCertSpiral } from '../three/loaders';
import RollText from '../components/reveal/RollText';
import { useContent } from '../content/context';


const mono = "'Space Mono', monospace";


const CertCard = ({ cert, theme, isMobile, mediaRef }) => (
  <a className="cert-card" href={cert.link} target="_blank" rel="noopener noreferrer" style={{ '--card-border': theme.border }}>
    <div ref={mediaRef} className="cert-media">
      <img src={cert.image} alt={cert.title} decoding="async" draggable="false" />
    </div>
    <div className="cert-text">
      <span style={{ display: 'block', fontFamily: mono, fontSize: isMobile ? '0.48rem' : '0.56rem', letterSpacing: '0.14em', color: theme.accentInk, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
        {cert.issuer}
      </span>
      <h3 className="cert-title" style={{ fontSize: isMobile ? '0.72rem' : '0.86rem', color: theme.text }}>{cert.title}</h3>
      <div className="cert-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontFamily: mono, fontSize: isMobile ? '0.5rem' : '0.56rem', letterSpacing: '0.1em' }}>
        <span style={{ color: theme.muted }}>{cert.date}</span>
        <span style={{ color: theme.accentInk }}><RollText text="VERIFY ↗" /></span>
      </div>
    </div>
  </a>
);

const Certificates = () => {
  const { theme, mode } = useTheme();
  const { certificates } = useContent().content;
  // the spiral is rebuilt only when the set of certificates/images changes
  const certKey = certificates.map((c) => `${c._id}|${c.image}`).join(',');
  const certsRef = useRef(certificates);
  useEffect(() => { certsRef.current = certificates; }, [certificates]);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const topWordRef = useRef(null);
  const bottomWordRef = useRef(null);
  const hintRef = useRef(null);
  const headRef = useRef(null);
  const lineRefs = useRef([]);
  const mediaRefs = useRef([]);
  const textRefs = useRef([]);
  const spiralRef = useRef(null);
  const reduced = prefersReducedMotion();

  // declared before the scene effect so a freshly created scene gets the current theme
  const paletteRef = useRef(null);
  useEffect(() => {
    paletteRef.current = { bg: theme.bg, rail: mode === 'dark' ? '#3d3d3d' : '#dcc6b0' };
    spiralRef.current?.setPalette(paletteRef.current);
  }, [theme.bg, mode]);

  useEffect(() => {
    if (reduced) return undefined;
    const stage = stageRef.current;
    const topWord = topWordRef.current;
    const bottomWord = bottomWordRef.current;
    let tl;

    const ctx = gsap.context(() => {
      tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: () => `+=${window.innerHeight * (isMobile ? 3.2 : 4.6)}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => { stage.dataset.live = self.progress >= PHASE.swapEnd ? '1' : '0'; },
        },
      });

      // giant words cross the screen in opposite directions while the spiral turns
      // (top word sits at the left edge, bottom word at the right edge)
      tl.fromTo(topWord, { x: () => -topWord.offsetWidth }, { x: () => window.innerWidth, duration: PHASE.spiralEnd }, 0)
        .fromTo(bottomWord, { x: () => bottomWord.offsetWidth }, { x: () => -window.innerWidth, duration: PHASE.spiralEnd }, 0)
        .to([topWord, bottomWord], { autoAlpha: 0, duration: 0.04 }, PHASE.spiralEnd - 0.04)
        .to(hintRef.current, { autoAlpha: 0, duration: 0.05 }, 0.05)
        // grid phase: heading, rules, card copy, then the real images take over from WebGL
        .fromTo(headRef.current.children, { autoAlpha: 0, yPercent: 50, filter: 'blur(12px)' },
          { autoAlpha: 1, yPercent: 0, filter: 'blur(0px)', duration: 0.1, stagger: 0.02 }, PHASE.gridStart + 0.06)
        .fromTo(lineRefs.current, { scaleX: 0 }, { scaleX: 1, duration: 0.22, stagger: 0.04 }, PHASE.gridStart + 0.1)
        .fromTo(textRefs.current.filter(Boolean), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.08, stagger: 0.015 }, PHASE.gridEnd - 0.08)
        .fromTo(mediaRefs.current.filter(Boolean), { opacity: 0 }, { opacity: 1, duration: PHASE.swapEnd - PHASE.swapStart }, PHASE.swapStart)
        .set({}, {}, 1); // timeline spans exactly 0 → 1
    }, stage);

    // The WebGL spiral is its own chunk; the scroll timeline above works without it
    let spiral = null;
    let cancelled = false;
    let inView = false;
    loadCertSpiral()
      .then(({ CertSpiral }) => {
        if (cancelled) return;
        spiral = new CertSpiral({
          canvas: canvasRef.current,
          stage,
          certs: certsRef.current,
          palette: paletteRef.current,
          isMobile,
          getProgress: () => tl.progress(),
          getTargets: () => mediaRefs.current.map((el) => el?.getBoundingClientRect()),
          onOpen: (i) => {
            const link = certsRef.current[i]?.link;
            if (link) window.open(link, '_blank', 'noopener,noreferrer');
          },
        });
        spiral.setInView(inView);
        spiralRef.current = spiral;
      })
      .catch((err) => console.warn('Certificate spiral disabled:', err));

    // only render while the section (incl. its pin spacing) is near the viewport
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      spiral?.setInView(inView);
    }, { rootMargin: '200px 0px' });
    io.observe(sectionRef.current);

    // late-loading images above (projects) shift the pin start; keep triggers fresh
    let t;
    const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => ScrollTrigger.refresh(), 200); });
    ro.observe(document.body);

    return () => {
      cancelled = true;
      clearTimeout(t);
      ro.disconnect();
      io.disconnect();
      spiral?.dispose();
      spiralRef.current = null;
      ctx.revert();
    };
  }, [isMobile, reduced, certKey]);

  const wordStyle = {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: isMobile ? 'clamp(4rem, 22vw, 7rem)' : 'clamp(6rem, 15vw, 15rem)',
    letterSpacing: '-0.05em',
    lineHeight: 0.85,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    willChange: 'transform',
  };

  return (
    <section id="certificates" ref={sectionRef} style={{ position: 'relative', minHeight: 0 }}>
      <div ref={stageRef} className="cert-stage" data-live={reduced ? '1' : undefined} style={{ position: 'relative', height: reduced ? 'auto' : '100vh', minHeight: '100vh', overflow: 'hidden' }}>
        {!reduced && (
          <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
        )}

        {/* top bar */}
        <div style={{
          position: 'absolute', top: isMobile ? '4.6rem' : '5.5rem', left: isMobile ? '1.5rem' : '2rem', right: isMobile ? '1.5rem' : '2rem',
          zIndex: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none',
          fontFamily: mono, fontSize: '0.68rem', letterSpacing: '0.15em', color: theme.muted,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            04 <span style={{ width: '3rem', height: 1, background: theme.border }} /> CERTIFICATES
          </span>
          <span>{String(certificates.length).padStart(2, '0')} VERIFIED</span>
        </div>

        {/* sweeping words — no z-index, so their blend mode reaches the canvas */}
        {!reduced && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isMobile ? '1.2rem' : '1.6rem', pointerEvents: 'none' }}>
            <div ref={topWordRef} style={{ ...wordStyle, alignSelf: 'flex-start', color: mode === 'dark' ? '#f2f2f2' : theme.text, mixBlendMode: mode === 'dark' ? 'difference' : 'normal' }}>
              Always
            </div>
            <div ref={bottomWordRef} style={{ ...wordStyle, alignSelf: 'flex-end', color: 'transparent', WebkitTextStroke: `2px ${theme.accent}` }}>
              Learning.
            </div>
          </div>
        )}

        {/* final grid — the WebGL cards land exactly on these images */}
        <div className="cert-grid-wrap" style={{
          position: reduced ? 'relative' : 'absolute', inset: 0, zIndex: 3,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: isMobile ? '7rem 1.5rem 2rem' : '7rem 2rem 3rem', maxWidth: '1400px', margin: '0 auto',
        }}>
          <div ref={headRef} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', marginBottom: isMobile ? '1rem' : '1.6rem' }}>
            <h2 style={{ fontSize: isMobile ? '2rem' : 'clamp(2.4rem, 4.6vw, 4rem)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: theme.text }}>
              Credentials<span style={{ color: theme.accent }}>.</span>
            </h2>
            <span style={{ fontFamily: mono, fontSize: isMobile ? '0.55rem' : '0.62rem', letterSpacing: '0.14em', color: theme.muted, textAlign: 'right' }}>
              CLICK ANY CARD TO VERIFY ↗
            </span>
          </div>
          <div ref={(el) => { lineRefs.current[0] = el; }} className="cert-rule" style={{ background: theme.border }} />
          <div className="cert-grid" style={{ gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : `repeat(${Math.max(1, certificates.length)}, minmax(0, 1fr))`, gap: isMobile ? '0.9rem 0.75rem' : '1.25rem', padding: isMobile ? '1rem 0' : '1.6rem 0' }}>
            {certificates.map((cert, i) => (
              <div key={cert._id ?? i} ref={(el) => { textRefs.current[i] = el?.querySelector('.cert-text'); }} className="cert-cell">
                <CertCard cert={cert} theme={theme} isMobile={isMobile} mediaRef={(el) => { mediaRefs.current[i] = el; }} />
              </div>
            ))}
          </div>
          <div ref={(el) => { lineRefs.current[1] = el; }} className="cert-rule" style={{ background: theme.border }} />
        </div>

        {!reduced && (
          <div ref={hintRef} style={{
            position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 4, pointerEvents: 'none',
            fontFamily: mono, fontSize: '0.56rem', letterSpacing: '0.2em', color: theme.muted, whiteSpace: 'nowrap',
          }}>
            SCROLL TO SPIN ↓
          </div>
        )}
      </div>
    </section>
  );
};

export default Certificates;
