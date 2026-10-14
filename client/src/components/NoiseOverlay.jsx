import { useState } from 'react';

/*
 * Film grain. A single noise tile is generated once and jittered around by a
 * CSS steps() animation (transform only), instead of redrawing full-screen
 * noise on the CPU every frame.
 */
const TILE = 160;
let grainUrl = null;

const getGrain = () => {
  if (grainUrl) return grainUrl;
  const c = document.createElement('canvas');
  c.width = c.height = TILE;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(TILE, TILE);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  grainUrl = c.toDataURL('image/png');
  return grainUrl;
};

const NoiseOverlay = ({ opacity = 0.04 }) => {
  const [url] = useState(getGrain);
  return <div className="noise-grain" aria-hidden="true" style={{ opacity, backgroundImage: `url(${url})` }} />;
};

export default NoiseOverlay;
