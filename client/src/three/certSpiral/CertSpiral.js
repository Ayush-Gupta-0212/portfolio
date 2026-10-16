import * as THREE from 'three';
import { getQuality, pixelRatio } from '../../lib/device';
import { PHASE } from './phase';

export { PHASE };

/* ─────────────────────────────────────────────────────────────
 * Certificates spiral (after Trionn's "Design in motion"):
 * certificates ride a two-turn helix as bent ribbons while the
 * section is pinned, then fly in and land on the DOM grid.
 * ───────────────────────────────────────────────────────────── */

const R = 12;
const ANGLE = Math.PI * 2 * 2;           // two turns
const PITCH = 28 / ANGLE;               // rise per radian
const ARC_PER_RAD = Math.sqrt(R * R + PITCH * PITCH);
const ARC = ANGLE * ARC_PER_RAD;
const SAG_AT = Math.PI * 2;
const RIBBON_H = 4.1;
const GAP = 0.5;
const SEG = 116;
const RAIL_PTS = 600;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt));

/* Helix centre line, with a gentle sag half way up */
const helixAt = (theta, out) => {
  const u = (theta - SAG_AT) / 2;
  return out.set(R * Math.cos(theta), -16 + theta * PITCH - 2.5 * Math.exp(-u * u), R * Math.sin(theta));
};

/* Direction across the ribbon: perpendicular to the path, tilted upright */
const acrossAt = (theta, out) => {
  const u = (theta - SAG_AT) / 2;
  const tx = -R * Math.sin(theta);
  const ty = PITCH + 2.5 * u * Math.exp(-u * u);
  const tz = R * Math.cos(theta);
  const tl = Math.hypot(tx, ty, tz) || 1;
  const gx = tx / tl, gy = ty / tl, gz = tz / tl;
  const c = Math.cos(theta), s = Math.sin(theta);
  out.set(gy * s, gz * c - gx * s, -gy * c).normalize();
  out.y += 0.6;
  return out.normalize();
};

const ribbonVertex = /* glsl */`
  varying vec2 vUv;
  varying float vDepth;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const ribbonFragment = /* glsl */`
  uniform sampler2D map;
  uniform vec3 uFog;
  uniform float uHover;
  varying vec2 vUv;
  varying float vDepth;
  void main() {
    vec2 uv = vUv;
    if (gl_FrontFacing) uv.x = 1.0 - uv.x;
    vec4 col = texture2D(map, uv);
    // thin dark frame so the strip reads as a card edge
    float edge = smoothstep(0.0, 0.012, uv.y) * smoothstep(1.0, 0.988, uv.y);
    col.rgb *= mix(0.55, 1.0, edge);
    col.rgb += uHover * 0.06;
    float fog = smoothstep(13.0, 36.0, vDepth) * 0.78;
    gl_FragColor = vec4(mix(col.rgb, uFog, fog), 1.0);
    #include <colorspace_fragment>
  }
`;

const cardVertex = /* glsl */`
  uniform float uWave;
  uniform float uWaveT;
  uniform vec2 uWaveDir;
  uniform float uWidth;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    float n = clamp(dot(uv - 0.5, uWaveDir) + 0.5, 0.0, 1.0);
    p.z += uWave * n * sin(n * 3.14159 * 0.9 - 2.0 * uWaveT) * uWidth * 0.14;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const cardFragment = /* glsl */`
  uniform sampler2D map;
  uniform vec2 uSize;
  uniform float uRadius;
  uniform float uImageAspect;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec2 px = (vUv - 0.5) * uSize;
    vec2 q = abs(px) - uSize * 0.5 + uRadius;
    float d = min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - uRadius;
    float a = 1.0 - smoothstep(-0.5, 0.5, d);
    if (a <= 0.0) discard;
    // object-fit: cover, matching the DOM image underneath
    vec2 uv = vUv;
    float planeAspect = uSize.x / uSize.y;
    if (planeAspect > uImageAspect) uv.y = (uv.y - 0.5) * (uImageAspect / planeAspect) + 0.5;
    else uv.x = (uv.x - 0.5) * (planeAspect / uImageAspect) + 0.5;
    vec4 col = texture2D(map, uv);
    gl_FragColor = vec4(col.rgb, a * uOpacity);
    #include <colorspace_fragment>
  }
`;

export class CertSpiral {
  constructor({ canvas, stage, certs, palette, getProgress, getTargets, isMobile = false, onOpen }) {
    this.canvas = canvas;
    this.stage = stage;
    this.certs = certs;
    this.palette = palette;
    this.getProgress = getProgress;
    this.getTargets = getTargets;
    this.isMobile = isMobile;
    this.onOpen = onOpen;

    this.p = 0;
    this.primed = false;
    this.time = 0;
    this.ready = false;
    this.pointer = { x: 0, y: 0, inside: false, downX: 0, downY: 0 };
    this.ndc = new THREE.Vector2();
    this.parallax = { x: 0, y: 0 };
    this.hovered = null;
    this.cursorMode = null;
    this.running = false;
    this.inView = false;
    this.disposed = false;

    this.tmpA = new THREE.Vector3();
    this.tmpB = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();

    this.init();
  }

  init() {
    const renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: getQuality().antialias, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(pixelRatio(this.isMobile));
    renderer.setClearColor(0x000000, 0);
    this.renderer = renderer;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(this.isMobile ? 58 : 52, 1, 0.1, 500);
    this.camZ = this.isMobile ? 28 : 22;
    this.camera.position.set(0, 0, this.camZ);

    const fog = new THREE.Color(this.palette.bg);
    const loader = new THREE.TextureLoader();
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    let pending = this.certs.length;
    this.textures = this.certs.map((c) => {
      const tex = loader.load(c.image, (t) => {
        t.userData.aspect = t.image.width / t.image.height;
        if (--pending === 0) this.onTexturesReady();
      });
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAniso;
      return tex;
    });

    // spiral ribbons: the certificate set twice over, like a film strip
    this.ribbons = [];
    for (let k = 0; k < 2; k++) {
      this.certs.forEach((cert, i) => {
        const geo = new THREE.PlaneGeometry(1, 1, SEG, 1);
        geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1000);
        const uv = geo.attributes.uv;
        for (let row = 0; row < 2; row++) {
          for (let c = 0; c <= SEG; c++) uv.setXY(row * (SEG + 1) + c, c / SEG, row);
        }
        const mat = new THREE.ShaderMaterial({
          uniforms: { map: { value: this.textures[i] }, uFog: { value: fog.clone() }, uHover: { value: 0 } },
          vertexShader: ribbonVertex,
          fragmentShader: ribbonFragment,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.frustumCulled = false;
        mesh.visible = false;
        mesh.userData.certIndex = i;
        this.scene.add(mesh);
        this.ribbons.push({ mesh, certIndex: i, len: RIBBON_H * 1.38, hover: 1 });
      });
    }

    // rails that run alongside the strip
    const railMat = new THREE.LineBasicMaterial({ color: this.palette.rail, transparent: true, opacity: 0.9 });
    this.railMat = railMat;
    const railGeo = (sign) => {
      const pts = [];
      const p = new THREE.Vector3(), d = new THREE.Vector3();
      const off = RIBBON_H / 2 + 0.22;
      for (let i = 0; i <= RAIL_PTS; i++) {
        const theta = (i / RAIL_PTS) * ANGLE;
        helixAt(theta, p);
        acrossAt(theta, d);
        pts.push(p.clone().addScaledVector(d, sign * off));
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      g.setDrawRange(0, 0);
      return g;
    };
    this.rails = [1, -1].map((sign) => {
      const line = new THREE.Line(railGeo(sign), railMat);
      line.frustumCulled = false;
      this.scene.add(line);
      return line;
    });

    // flat cards that land on the grid
    this.cards = this.certs.map((cert, i) => {
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          map: { value: this.textures[i] },
          uSize: { value: new THREE.Vector2(1, 1) },
          uRadius: { value: 0 },
          uImageAspect: { value: 1.4 },
          uOpacity: { value: 1 },
          uWave: { value: 0 },
          uWaveT: { value: 0 },
          uWaveDir: { value: new THREE.Vector2(0, 1) },
          uWidth: { value: 1 },
        },
        vertexShader: cardVertex,
        fragmentShader: cardFragment,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 24, 14), mat);
      mesh.visible = false;
      mesh.frustumCulled = false;
      mesh.renderOrder = 3;
      this.scene.add(mesh);
      return { mesh, wave: 0, waveT: 0 };
    });

    this.trainLen = this.ribbons.reduce((acc, r) => acc + r.len + GAP, 0);

    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onVisibility = this.onVisibility.bind(this);
    this.tick = this.tick.bind(this);

    this.stage.addEventListener('pointermove', this.onPointerMove);
    this.stage.addEventListener('pointerleave', this.onPointerLeave);
    this.stage.addEventListener('pointerdown', this.onPointerDown);
    this.stage.addEventListener('click', this.onClick);
    document.addEventListener('visibilitychange', this.onVisibility);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas);
    this.resize();
  }

  onTexturesReady() {
    if (this.disposed) return;
    this.textures.forEach((t, i) => {
      this.ribbons.forEach((r) => {
        if (r.certIndex === i) r.len = RIBBON_H * (t.userData.aspect || 1.38);
      });
      this.cards[i].mesh.material.uniforms.uImageAspect.value = t.userData.aspect || 1.4;
    });
    this.trainLen = this.ribbons.reduce((acc, r) => acc + r.len + GAP, 0);
    this.ready = true;
    this.renderer.compile(this.scene, this.camera);
  }

  setPalette(palette) {
    this.palette = palette;
    this.ribbons.forEach((r) => r.mesh.material.uniforms.uFog.value.set(palette.bg));
    this.railMat.color.set(palette.rail);
  }

  setInView(v) {
    this.inView = v;
    this.updateRunning();
  }

  resize() {
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    this.w = w; this.h = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.worldPerPx = (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camZ) / h;
  }

  /* ───────────── input ───────────── */

  onPointerMove(e) {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.x = e.clientX - r.left;
    this.pointer.y = e.clientY - r.top;
    this.pointer.inside = true;
    this.ndc.set((this.pointer.x / this.w) * 2 - 1, -(this.pointer.y / this.h) * 2 + 1);
  }

  onPointerLeave() {
    this.pointer.inside = false;
    this.setCursorMode(null);
  }

  onPointerDown(e) {
    this.pointer.downX = e.clientX;
    this.pointer.downY = e.clientY;
  }

  onClick(e) {
    // a ribbon click opens that certificate's verification link (ignore drags)
    if (!this.hovered || e.target.closest('a, button')) return;
    if (Math.hypot(e.clientX - this.pointer.downX, e.clientY - this.pointer.downY) > 6) return;
    this.onOpen?.(this.hovered.certIndex);
  }

  setCursorMode(mode) {
    if (mode === this.cursorMode) return;
    this.cursorMode = mode;
    window.dispatchEvent(new CustomEvent('cursor-mode', { detail: mode }));
  }

  onVisibility() {
    this.updateRunning();
  }

  updateRunning() {
    const should = this.inView && !document.hidden && !this.disposed;
    if (should && !this.running) {
      this.running = true;
      this.primed = false; // jump straight to the current scroll state, don't ease from a stale one
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    } else if (!should && this.running) {
      this.running = false;
      cancelAnimationFrame(this.raf);
      this.renderer.clear(); // never leave a stale frame behind
      this.setCursorMode(null);
    }
  }

  /* ───────────── loop ───────────── */

  tick(now) {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.tick);
    const dt = clamp((now - this.last) / 1000, 0, 0.05);
    this.last = now;
    this.time += dt;

    const target = clamp(this.getProgress?.() ?? 0);
    if (!this.primed) { this.p = target; this.primed = true; }
    else this.p = damp(this.p, target, 7, dt);
    const p = this.p;

    const spiral = clamp(p / PHASE.spiralEnd);
    const grid = clamp((p - PHASE.gridStart) / (PHASE.gridEnd - PHASE.gridStart));

    // gentle camera drift toward the pointer, settled while the grid forms
    const settle = 1 - grid;
    const px = this.pointer.inside ? this.ndc.x : 0;
    const py = this.pointer.inside ? this.ndc.y : 0;
    this.parallax.x = damp(this.parallax.x, px * 1.2 * settle, 3, dt);
    this.parallax.y = damp(this.parallax.y, py * 0.8 * settle, 3, dt);
    this.camera.position.set(this.parallax.x, this.parallax.y, this.camZ);
    this.camera.lookAt(this.parallax.x * 0.3, this.parallax.y * 0.3, 0);

    if (this.ready) {
      this.updateSpiral(spiral, dt);
      this.updateCards(grid, p, dt);
    }
    this.renderer.render(this.scene, this.camera);
  }

  updateSpiral(spiral, dt) {
    const showing = spiral < 1;
    // the train of ribbons travels from the bottom of the helix to the top
    // start part-way up so ribbons are already on screen when the pin begins (taller phones see less helix)
    const lead = spiral * (ARC + this.trainLen) - this.trainLen + (this.isMobile ? 40 : 24);
    let offset = 0;

    // hover first, against last frame's geometry
    let hit = null;
    if (showing && this.pointer.inside && spiral > 0.001) {
      this.raycaster.setFromCamera(this.ndc, this.camera);
      const hits = this.raycaster.intersectObjects(this.ribbons.filter((r) => r.mesh.visible).map((r) => r.mesh), false);
      if (hits.length) hit = this.ribbons.find((r) => r.mesh === hits[0].object) || null;
    }
    this.hovered = hit;
    this.setCursorMode(hit ? 'view' : null);

    const p = this.tmpA, d = this.tmpB;
    for (let k = this.ribbons.length - 1; k >= 0; k--) {
      const rb = this.ribbons[k];
      const start = lead - offset - rb.len;
      offset += rb.len + GAP;
      const visible = showing && start + rb.len > -2 && start < ARC + 2;
      rb.mesh.visible = visible;
      rb.hover = damp(rb.hover, rb === hit ? 1.12 : 1, 8, dt);
      rb.mesh.material.uniforms.uHover.value = (rb.hover - 1) / 0.12;
      if (!visible) continue;

      const len = rb.len * rb.hover;
      const hgt = RIBBON_H * rb.hover;
      const s0 = start + rb.len / 2 - len / 2;
      const pos = rb.mesh.geometry.attributes.position;
      for (let c = 0; c <= SEG; c++) {
        const theta = (s0 + (c / SEG) * len) / ARC_PER_RAD;
        helixAt(theta, p);
        acrossAt(theta, d);
        for (let row = 0; row < 2; row++) {
          const off = (row === 0 ? -0.5 : 0.5) * hgt;
          pos.setXYZ(row * (SEG + 1) + c, p.x + d.x * off, p.y + d.y * off, p.z + d.z * off);
        }
      }
      pos.needsUpdate = true;
    }

    // rails lay track just ahead of the strip and trail off behind it
    const tail = lead - this.trainLen - 2;
    const head = lead + 10;
    const i0 = Math.floor(clamp(tail / ARC) * RAIL_PTS);
    const i1 = Math.ceil(clamp(head / ARC) * RAIL_PTS);
    this.rails.forEach((line) => line.geometry.setDrawRange(i0, showing ? Math.max(0, i1 - i0) : 0));
  }

  updateCards(grid, p, dt) {
    const rects = grid > 0 ? this.getTargets?.() : null;
    const swap = clamp((p - PHASE.swapStart) / (PHASE.swapEnd - PHASE.swapStart));
    const viewHalfW = (this.w / 2) * this.worldPerPx;
    const viewHalfH = (this.h / 2) * this.worldPerPx;
    const canvasRect = rects ? this.canvas.getBoundingClientRect() : null;

    this.cards.forEach((card, i) => {
      const m = card.mesh;
      const rect = rects?.[i];
      const r = clamp((grid - i * 0.07) / 0.55);
      if (!rect || r <= 0 || swap >= 1) { m.visible = false; card.wave = 0; return; }
      m.visible = true;

      const wpx = rect.width, hpx = rect.height;
      const cx = rect.left - canvasRect.left + wpx / 2;
      const cy = rect.top - canvasRect.top + hpx / 2;
      const tx = (cx - this.w / 2) * this.worldPerPx;
      const ty = -(cy - this.h / 2) * this.worldPerPx;

      // fly in from the nearest screen edge
      let dx = tx, dy = ty;
      const len = Math.hypot(dx, dy);
      if (len < viewHalfW * 0.25) { dx = 0; dy = -1; } else { dx /= len; dy /= len; }
      const sx = tx + dx * viewHalfW * 1.5;
      const sy = ty + dy * viewHalfH * 1.6;

      const n = 1 - Math.pow(1 - r, 3);
      m.position.set(sx + (tx - sx) * n, sy + (ty - sy) * n, 0);
      m.rotation.z = (1 - n) * 0.3 * (dx >= 0 ? -1 : 1);
      m.scale.set(wpx * this.worldPerPx, hpx * this.worldPerPx, 1);

      card.waveT += dt * 1.08;
      card.wave = r < 1 ? Math.min(1, card.wave + dt * 1.8) : Math.max(0, card.wave - dt * 0.72);
      const u = m.material.uniforms;
      u.uSize.value.set(wpx, hpx);
      u.uRadius.value = 6;
      u.uWave.value = card.wave;
      u.uWaveT.value = card.waveT;
      u.uWaveDir.value.set(-dx, -dy);
      u.uWidth.value = wpx * this.worldPerPx;
      u.uOpacity.value = 1;
    });
  }

  dispose() {
    this.disposed = true;
    this.updateRunning();
    this.setCursorMode(null);
    this.stage.removeEventListener('pointermove', this.onPointerMove);
    this.stage.removeEventListener('pointerleave', this.onPointerLeave);
    this.stage.removeEventListener('pointerdown', this.onPointerDown);
    this.stage.removeEventListener('click', this.onClick);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.resizeObserver.disconnect();
    this.ribbons.forEach((r) => { r.mesh.geometry.dispose(); r.mesh.material.dispose(); });
    this.cards.forEach((c) => { c.mesh.geometry.dispose(); c.mesh.material.dispose(); });
    this.rails.forEach((l) => l.geometry.dispose());
    this.railMat.dispose();
    this.textures.forEach((t) => t.dispose());
    this.renderer.dispose();
  }
}
