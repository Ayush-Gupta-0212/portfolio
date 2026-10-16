import { useEffect, useRef } from 'react';
import { useTheme } from '../context/theme';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap';
import SectionLabel from '../components/reveal/SectionLabel';
import LineReveal from '../components/reveal/LineReveal';
import BlurReveal from '../components/reveal/BlurReveal';
import RollText from '../components/reveal/RollText';
import { useContent } from '../content/context';


const mono = "'Space Mono', monospace";
const pad = (n) => String(n).padStart(2, '0');
const setCursor = (mode) => window.dispatchEvent(new CustomEvent('cursor-mode', { detail: mode }));
// Project images ship as WebP; older API/DB rows may still point at the original PNGs
const imageSrc = (src = '') => src.replace(/.png$/i, '.webp');

/* "Vice City — Smart City Web Platform" → big name + smaller subtitle */
const splitTitle = (title = '') => {
  const [name, ...rest] = title.split(' — ');
  return { name, sub: rest.join(' — ') };
};

/* Divider on a panel's leading edge: vertical on the desktop track, horizontal when stacked */
const PanelLine = ({ stacked, theme }) => (
  <div
    className={stacked ? 'work-line-h' : 'work-line'}
    style={stacked
      ? { position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: theme.border, transformOrigin: '0% 50%' }
      : { position: 'absolute', left: 0, top: 0, bottom: 0, width: 1, background: theme.border, transformOrigin: '50% 0%' }}
  />
);

const WorkCard = ({ project, index, total, theme, stacked }) => {
  const { name, sub } = splitTitle(project.title);
  const href = project.live || project.github;
  const showLive = project.live && project.live !== project.github;

  return (
    <article
      className="work-card"
      style={{
        position: 'relative', flexShrink: 0,
        width: stacked ? '100%' : '50vw', height: stacked ? 'auto' : '100%',
        display: 'flex', alignItems: 'center',
        padding: stacked ? '2.5rem 0' : '6rem 4vw 5rem',
      }}
    >
      <PanelLine stacked={stacked} theme={theme} />
      <div className="work-inner" style={{ width: '100%', maxWidth: 620, margin: '0 auto', willChange: 'transform' }}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="work-media"
          aria-label={`Open ${name}`}
          style={{ '--card-border': theme.border }}
          onMouseEnter={() => setCursor('view')}
          onMouseLeave={() => setCursor(null)}
        >
          <div className="work-zoom">
            <img src={imageSrc(project.image)} alt={project.title} className="work-img" decoding="async" draggable="false" />
          </div>
        </a>

        <div className="work-meta" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.4rem', fontFamily: mono, fontSize: '0.62rem', letterSpacing: '0.15em', color: theme.muted }}>
          <span>{pad(index + 1)} / {pad(total)}</span>
          <span>{project.year}</span>
        </div>

        <h3 className="work-meta" style={{ marginTop: '0.6rem', fontSize: stacked ? '1.7rem' : 'clamp(1.6rem, 2.4vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05, color: theme.text }}>
          {name}
          {sub && (
            <span style={{ display: 'block', fontSize: '0.48em', fontWeight: 500, letterSpacing: '-0.01em', color: theme.textSub, marginTop: '0.5rem' }}>
              {sub}
            </span>
          )}
        </h3>

        <p className="work-meta work-desc" style={{ marginTop: '0.9rem', color: theme.muted, fontSize: '0.9rem', lineHeight: 1.7 }}>
          {project.description}
        </p>

        <div className="work-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '1.1rem' }}>
          {project.tags?.map((tag) => (
            <span key={tag} style={{ padding: '0.25rem 0.6rem', fontFamily: mono, fontSize: '0.56rem', letterSpacing: '0.08em', color: theme.accentInk, background: theme.accentDim, border: `1px solid ${theme.accentBorder}` }}>
              {tag}
            </span>
          ))}
        </div>

        <div className="work-meta" style={{ display: 'flex', gap: '1.6rem', marginTop: '1.3rem', fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.12em' }}>
          {project.github && (
            <a href={project.github} target="_blank" rel="noopener noreferrer" className="roll-link" style={{ color: theme.accentInk, textDecoration: 'none' }}>
              <RollText text="GITHUB ↗" />
            </a>
          )}
          {showLive && (
            <a href={project.live} target="_blank" rel="noopener noreferrer" className="roll-link" style={{ color: theme.accentInk, textDecoration: 'none' }}>
              <RollText text="LIVE ↗" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

const Projects = () => {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { profile, projects } = useContent().content;
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const barRef = useRef(null);
  const plusRef = useRef(null);
  const counterRef = useRef(null);
  const reduced = prefersReducedMotion();
  const stacked = isMobile || reduced;

  /*
   * Desktop (after Trionn's selected-work track): the section pins and the
   * track slides sideways. Each card rises from below as it travels in from
   * the right, its divider draws down and its copy fades in on arrival.
   */
  useEffect(() => {
    if (stacked) return undefined;
    const section = sectionRef.current;
    const track = trackRef.current;
    const parts = [...track.querySelectorAll('.work-card')].map((card) => ({
      card,
      inner: card.querySelector('.work-inner'),
      line: card.querySelector('.work-line'),
      img: card.querySelector('.work-img'),
      metas: card.querySelectorAll('.work-meta'),
    }));
    const total = projects.length;
    const played = new Set();
    let armed = false;
    let lastActive = -1;
    let tween;

    const ctx = gsap.context(() => {
      parts.forEach(({ line, metas }) => {
        gsap.set(line, { scaleY: 0 });
        gsap.set(metas, { autoAlpha: 0, y: 24 });
      });

      const update = () => {
        const vw = window.innerWidth;
        const x = gsap.getProperty(track, 'x');
        const rise = Math.min(550, window.innerHeight * 0.65);
        let active = 0;
        let best = Infinity;
        parts.forEach((p, i) => {
          const r = (p.card.offsetLeft + p.card.offsetWidth / 2 + x) / vw; // card centre across the screen
          const u = gsap.utils.clamp(0, 1, (1.2 - r) / 0.7);
          gsap.set(p.inner, { y: rise * Math.pow(1 - u, 3) });
          if (p.img) gsap.set(p.img, { xPercent: gsap.utils.clamp(-5, 5, (r - 0.5) * -9) });
          if (armed && r < 1.05 && !played.has(i)) {
            played.add(i);
            gsap.to(p.metas, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.07, ease: 'power3.out' });
            gsap.to(p.line, { scaleY: 1, duration: 1.2, ease: 'power2.out', delay: 0.1 });
          }
          const d = Math.abs(r - 0.5);
          if (i < total && d < best) { best = d; active = i; }
        });
        const prog = tween ? tween.progress() : 0;
        gsap.set(barRef.current, { scaleX: prog });
        gsap.set(plusRef.current, { rotation: 360 * prog });
        if (active !== lastActive && counterRef.current) {
          lastActive = active;
          counterRef.current.textContent = `${pad(active + 1)} / ${pad(total)}`;
        }
      };

      tween = gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: 'none',
        onUpdate: update,
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${track.scrollWidth - window.innerWidth}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: 1, // sits above the certificates pin, so measure it first
          onRefresh: update,
        },
      });

      // cards already on screen reveal as the section arrives, not on page load
      ScrollTrigger.create({
        trigger: section,
        start: 'top 55%',
        onEnter: () => { armed = true; update(); },
      });
      update();
    }, section);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [stacked, projects]);

  /* Mobile: a vertical stack whose cards reveal as they scroll in */
  useEffect(() => {
    if (!stacked || reduced) return undefined;
    const ctx = gsap.context(() => {
      sectionRef.current.querySelectorAll('.work-card').forEach((card) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none reverse' } });
        tl.fromTo(card.querySelector('.work-line-h'), { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'power2.out' }, 0);
        const media = card.querySelector('.work-media');
        if (media) tl.fromTo(media, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'expo.inOut' }, 0.05);
        tl.fromTo(card.querySelectorAll('.work-meta'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.06, ease: 'power3.out' }, 0.4);
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [stacked, reduced, projects]);

  const panel = {
    flexShrink: 0,
    width: stacked ? '100%' : '50vw',
    height: stacked ? 'auto' : '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  };

  return (
    <section
      id="projects"
      ref={sectionRef}
      style={{ position: 'relative', height: stacked ? 'auto' : '100vh', overflow: 'hidden' }}
    >
      <div
        ref={trackRef}
        style={{
          display: 'flex', flexDirection: stacked ? 'column' : 'row',
          width: stacked ? '100%' : 'max-content', height: stacked ? 'auto' : '100%',
          padding: stacked ? '5rem 1.5rem 3rem' : 0, willChange: 'transform',
        }}
      >
        {/* Intro panel */}
        <div style={{ ...panel, padding: stacked ? '0 0 1.5rem' : '6rem 5vw 5rem 4vw' }}>
          <SectionLabel number="03" label="PROJECTS" theme={theme} style={{ marginBottom: '2.5rem' }} />
          <LineReveal
            stagger={0.12}
            style={{
              fontSize: stacked ? 'clamp(3rem, 16vw, 4.6rem)' : 'clamp(3.5rem, 7.6vw, 8rem)',
              fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 0.92, color: theme.text,
            }}
          >
            Selected<br />work<span className="hl">.</span>
          </LineReveal>
          <BlurReveal key={profile.projectsIntro} style={{ marginTop: '2rem', maxWidth: 400, color: theme.muted, lineHeight: 1.8, fontSize: '0.95rem' }}>
            {profile.projectsIntro}
          </BlurReveal>
          {!stacked && (
            <div style={{ marginTop: '3rem', fontFamily: mono, fontSize: '0.62rem', letterSpacing: '0.2em', color: theme.muted }}>
              KEEP SCROLLING <span className="work-arrow" style={{ color: theme.accentInk }}>→</span>
            </div>
          )}
        </div>

        {projects.map((project, i) => (
          <WorkCard key={project._id} project={project} index={i} total={projects.length} theme={theme} stacked={stacked} />
        ))}

        {/* End panel */}
        {profile.links.github && (
        <div className="work-card" style={{ ...panel, position: 'relative', alignItems: 'center', padding: stacked ? '3rem 0 1rem' : '6rem 4vw 5rem' }}>
          <PanelLine stacked={stacked} theme={theme} />
          <div className="work-inner" style={{ textAlign: 'center', maxWidth: 440 }}>
            <h3 className="work-meta" style={{ fontSize: stacked ? '1.4rem' : 'clamp(1.5rem, 2.4vw, 2.3rem)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.2, color: theme.text }}>
              More experiments, side projects and code live on GitHub.
            </h3>
            <a
              href={profile.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="work-meta roll-link"
              style={{ display: 'inline-block', marginTop: '2rem', padding: '0.95rem 2rem', border: `1px solid ${theme.accent}`, color: theme.accentInk, textDecoration: 'none', fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.15em' }}
            >
              <RollText text="VIEW ALL ON GITHUB ↗" />
            </a>
          </div>
        </div>
        )}
      </div>

      {/* Progress HUD */}
      {!stacked && (
        <div style={{
          position: 'absolute', left: '2rem', right: '2rem', bottom: '1.75rem',
          display: 'flex', alignItems: 'center', gap: '1.5rem', pointerEvents: 'none',
          fontFamily: mono, fontSize: '0.62rem', letterSpacing: '0.15em', color: theme.muted,
        }}>
          <span ref={counterRef}>{pad(1)} / {pad(projects.length)}</span>
          <div style={{ flex: 1, height: 1, background: theme.border, position: 'relative' }}>
            <div ref={barRef} style={{ position: 'absolute', inset: 0, background: theme.accent, transformOrigin: '0% 50%', transform: 'scaleX(0)' }} />
          </div>
          <svg ref={plusRef} width="13" height="13" viewBox="0 0 13 13" style={{ overflow: 'visible' }}>
            <line x1="6.5" y1="0" x2="6.5" y2="13" stroke={theme.textSub} />
            <line x1="0" y1="6.5" x2="13" y2="6.5" stroke={theme.textSub} />
          </svg>
        </div>
      )}
    </section>
  );
};

export default Projects;
