import * as THREE from 'three';
import { TessellateModifier } from 'three/examples/jsm/modifiers/TessellateModifier.js';

/*
 * "AG" monogram drawn on a 212 x 120 grid (SVG-style, y pointing down).
 * Angular, chamfered letterforms so the extruded faces catch hard reflections.
 */
const GRID = { cx: 106, cy: 60, unit: 100 };

const GLYPHS = [
  {
    // A — flat-topped apex, crossbar at the lower third
    outer: [[0, 120], [38, 0], [62, 0], [100, 120], [74, 120], [66.4, 96], [33.6, 96], [26, 120]],
    holes: [[[40.6, 74], [50, 44.2], [59.4, 74]]],
  },
  {
    // G — octagonal bowl with an inner spur
    outer: [
      [212, 0], [142, 0], [112, 30], [112, 90], [142, 120], [182, 120], [212, 90], [212, 52],
      [160, 52], [160, 74], [188, 74], [188, 80], [172, 96], [152, 96], [136, 80], [136, 40],
      [152, 24], [212, 24],
    ],
    holes: [],
  },
];

// Terminal cursor block that sits on the baseline after the G
const CURSOR = { x0: 224, x1: 258, y0: 106, y1: 120 };

const toVec = ([x, y]) => new THREE.Vector2((x - GRID.cx) / GRID.unit, -(y - GRID.cy) / GRID.unit);

/* Small deterministic PRNG so the shatter pattern is identical on every load */
const mulberry32 = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* Scatter target spread over the viewport, biased away from the dead centre */
export const scatterPoint = (rand) => {
  const ang = rand() * Math.PI * 2;
  const rad = 0.25 + Math.sqrt(rand()) * 0.75;
  return new THREE.Vector3(Math.cos(ang) * rad * 0.5, Math.sin(ang) * rad * 0.5, rand() * 2 - 1);
};

export const EXTRUDE = {
  depth: 0.34,
  bevelEnabled: true,
  bevelThickness: 0.02,
  bevelSize: 0.014,
  bevelSegments: 2,
  curveSegments: 1,
};

const buildGlyphGeometry = (glyph) => {
  const shape = new THREE.Shape(glyph.outer.map(toVec));
  glyph.holes.forEach((h) => shape.holes.push(new THREE.Path(h.map(toVec))));
  const geo = new THREE.ExtrudeGeometry(shape, EXTRUDE);
  geo.translate(0, 0, -EXTRUDE.depth / 2);
  return geo;
};

/* Pick Voronoi seeds that fall inside the glyph's bounding box */
const seedsFor = (geo, count, rand) => {
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox;
  const seeds = [];
  for (let i = 0; i < count; i++) {
    seeds.push(new THREE.Vector2(
      min.x + (max.x - min.x) * (0.08 + 0.84 * rand()),
      min.y + (max.y - min.y) * (0.08 + 0.84 * rand()),
    ));
  }
  return seeds;
};

/**
 * Builds the monogram as a list of "shards": each shard is a separate mesh
 * centred on its own centroid, with an explode direction, spin axis and delay.
 * Also returns the un-shattered edge outline for the idle glow.
 */
export const buildMonogramShards = ({ seedsPerGlyph = 9, tessellate = 0.2 } = {}) => {
  const rand = mulberry32(2026);
  const shards = [];
  const edgeGeos = [];

  const glyphGeos = GLYPHS.map(buildGlyphGeometry);
  const tess = new TessellateModifier(tessellate, 8);

  glyphGeos.forEach((rawGeo, glyphIdx) => {
    edgeGeos.push(new THREE.EdgesGeometry(rawGeo, 25));

    const geo = tess.modify(rawGeo);
    const pos = geo.attributes.position.array;
    const nor = geo.attributes.normal.array;
    const seeds = seedsFor(rawGeo, seedsPerGlyph, rand);
    rawGeo.computeBoundingBox();
    const glyphCenter = rawGeo.boundingBox.getCenter(new THREE.Vector3());

    const buckets = new Map();
    const triCount = pos.length / 9;
    const c = new THREE.Vector2();

    for (let t = 0; t < triCount; t++) {
      const o = t * 9;
      c.set((pos[o] + pos[o + 3] + pos[o + 6]) / 3, (pos[o + 1] + pos[o + 4] + pos[o + 7]) / 3);
      const nz = (nor[o + 2] + nor[o + 5] + nor[o + 8]) / 3;
      const type = nz > 0.85 ? 'front' : nz < -0.85 ? 'back' : 'wall';

      let best = 0, bestD = Infinity;
      for (let s = 0; s < seeds.length; s++) {
        const d = c.distanceToSquared(seeds[s]);
        if (d < bestD) { bestD = d; best = s; }
      }
      const key = `${type}:${best}`;
      if (!buckets.has(key)) buckets.set(key, { type, tris: [] });
      buckets.get(key).tris.push(t);
    }

    buckets.forEach(({ type, tris }) => {
      const positions = new Float32Array(tris.length * 9);
      const normals = new Float32Array(tris.length * 9);
      const centroid = new THREE.Vector3();
      tris.forEach((t, i) => {
        for (let k = 0; k < 9; k++) {
          positions[i * 9 + k] = pos[t * 9 + k];
          normals[i * 9 + k] = nor[t * 9 + k];
        }
      });
      for (let i = 0; i < positions.length; i += 3) {
        centroid.x += positions[i]; centroid.y += positions[i + 1]; centroid.z += positions[i + 2];
      }
      centroid.divideScalar(positions.length / 3);
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] -= centroid.x; positions[i + 1] -= centroid.y; positions[i + 2] -= centroid.z;
      }

      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
      g.computeBoundingSphere();

      // Explode direction: radial from the glyph + push along the face normal
      const radial = new THREE.Vector3(centroid.x - glyphCenter.x, centroid.y - glyphCenter.y, 0);
      if (radial.lengthSq() < 1e-4) radial.set(rand() - 0.5, rand() - 0.5, 0);
      radial.normalize();
      const push = type === 'front' ? new THREE.Vector3(0, 0, 1) : type === 'back' ? new THREE.Vector3(0, 0, -1) : radial.clone();
      const dir = radial.multiplyScalar(0.65)
        .add(push.multiplyScalar(0.55))
        .add(new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.5))
        .normalize()
        .multiplyScalar(0.75 + rand() * 0.75);

      shards.push({
        geometry: g,
        home: centroid,
        dir,
        spinAxis: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
        spinSpeed: (rand() - 0.5) * 2.6,
        delay: rand() * 0.22,
        // where this shard drifts to when scrolling scatters the monogram (viewport-normalised)
        scatter: scatterPoint(rand),
        float: rand() * Math.PI * 2,
        glyph: glyphIdx,
        type,
      });
    });

    rawGeo.dispose();
    geo.dispose();
  });

  return { shards, edgeGeos };
};

/* The blinking terminal cursor — a single solid block that also gets blasted */
export const buildCursorBlock = () => {
  const [a, b] = [toVec([CURSOR.x0, CURSOR.y0]), toVec([CURSOR.x1, CURSOR.y1])];
  const w = b.x - a.x, h = a.y - b.y;
  const geo = new THREE.BoxGeometry(w, h, EXTRUDE.depth * 0.7);
  return {
    geometry: geo,
    home: new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2, 0),
    scatter: new THREE.Vector3(0.36, -0.3, 0.6),
    float: 1.3,
  };
};

/* Horizontal offset that visually centres "AG_" as a composition */
export const COMPOSITION_OFFSET_X = -((CURSOR.x1 - 212) / GRID.unit) / 2;
export const MONOGRAM_SIZE = { width: (CURSOR.x1 - 0) / GRID.unit, height: 120 / GRID.unit };
