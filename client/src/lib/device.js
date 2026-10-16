/*
 * Rough device tier for the WebGL scenes, decided once per page load.
 * low  — software rendering, data saver, or a very small device: no hero
 *        particles, 1× pixel ratio, no antialiasing, fewer monogram shards
 * mid  — ≤4 cores or ≤4 GB memory: lighter settings
 * high — everything on
 * Append ?quality=low|mid|high to the URL to force a tier while testing.
 */
const QUALITY = {
  low: { tier: 'low', dpr: 1, antialias: false, particles: 0, shardSeeds: 5 },
  mid: { tier: 'mid', dpr: 1.5, antialias: true, particles: 0.6, shardSeeds: 7 },
  high: { tier: 'high', dpr: 1.75, antialias: true, particles: 1, shardSeeds: 9 },
};

const isSoftwareRenderer = () => {
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    if (!gl) return true;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext(); // free the probe context right away
    return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
  } catch {
    return false;
  }
};

const detectTier = () => {
  const forced = new URLSearchParams(window.location.search).get('quality');
  if (QUALITY[forced]) return forced;

  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 8; // Chromium only; assume capable elsewhere
  const saveData = navigator.connection?.saveData === true;
  if (saveData || cores <= 2 || memory <= 2 || isSoftwareRenderer()) return 'low';
  if (cores <= 4 || memory <= 4) return 'mid';
  return 'high';
};

let cached;

/* { tier, dpr, antialias, particles (count multiplier), shardSeeds } */
export const getQuality = () => {
  cached ||= QUALITY[detectTier()];
  return cached;
};

/* Pixel ratio for a renderer, never above the device's own or the mobile cap */
export const pixelRatio = (isMobile = false) =>
  Math.min(window.devicePixelRatio || 1, getQuality().dpr, isMobile ? 1.5 : Infinity);
