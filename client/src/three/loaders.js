/*
 * The WebGL scenes (and three.js itself) live in their own chunks. The
 * preloader starts these downloads so they're ready when the site mounts;
 * each call returns the same promise, so modules are fetched only once.
 */
const once = (load) => {
  let promise;
  return () => {
    promise ||= load().catch((err) => {
      promise = undefined; // allow a retry after a network hiccup
      throw err;
    });
    return promise;
  };
};

export const loadMonogram = once(() => import('./monogram/MonogramExperience'));
export const loadParticles = once(() => import('./particles/HeroParticles'));
export const loadCertSpiral = once(() => import('./certSpiral/CertSpiral'));

/* What the hero needs on first paint */
export const preloadHeroScenes = () => Promise.all([loadMonogram(), loadParticles()]);
