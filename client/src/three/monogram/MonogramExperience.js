import * as THREE from 'three';
import { buildMonogramShards, buildCursorBlock, COMPOSITION_OFFSET_X, MONOGRAM_SIZE } from './shards';
import { getQuality, pixelRatio } from '../../lib/device';

/* ─────────────────────────────────────────────────────────────
 * Hero monogram: an extruded chrome "AG_" that can be dragged,
 * shatters when held, and is fed by three electric lines that
 * spark when the pointer touches them.
 * ───────────────────────────────────────────────────────────── */

const CHARGE_TIME = 0.6;
const LINE_SAMPLES = 140;
const MAX_SPREAD = 1.6;
const IDENTITY_Q = new THREE.Quaternion();

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt));
const hexToRgb = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgba = ([r, g, b], a) => `rgba(${r},${g},${b},${a})`;
const mix = (c1, c2, t) => c1.map((v, i) => Math.round(v + (c2[i] - v) * t));

export const MONOGRAM_PALETTES = {
  dark: {
    accent: '#c8ff00',
    metal: '#9aa0a8',
    envBase: '#060708',
    envKey: '#ffffff',
    envCool: '#c9d1dc',
    line: [96, 104, 116],
    lineAlpha: 0.5,
    pulseHead: [255, 255, 255],
    sparkHot: [255, 255, 235],
    additiveGlow: true,
    glowStrength: 1,
  },
  light: {
    accent: '#e06820',
    metal: '#7a6a5e',
    envBase: '#140d08',
    envKey: '#fff4e8',
    envCool: '#ffb27a',
    line: [200, 166, 136],
    lineAlpha: 0.8,
    pulseHead: [150, 50, 0],
    sparkHot: [255, 190, 110],
    additiveGlow: false,
    glowStrength: 0.45,
  },
};

/* Vertical falloff used for the big front softbox in the environment */
const makeSoftboxTexture = () => {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.45, '#6a6a6a');
  grad.addColorStop(1, '#000000');
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

const makeGlowTexture = () => {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.45)');
  grad.addColorStop(0.6, 'rgba(255,255,255,0.08)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

export class MonogramExperience {
  constructor({
    layer, host, overlay, hint, section, palette, getAnchor, getDock, stageSelectors = [],
    isMobile = false, reducedMotion = false, introDelay = 0.35,
  }) {
    this.layer = layer;
    this.host = host;
    this.overlay = overlay;
    this.hint = hint;
    this.section = section; // hero section: hold-to-shatter + quake live here
    this.getDock = getDock;
    this.stageSelectors = stageSelectors;
    this.palette = palette;
    this.getAnchor = getAnchor;
    this.isMobile = isMobile;
    this.reducedMotion = reducedMotion;

    this.w = 1; this.h = 1;
    this.anchor = null;
    this.anchorTarget = null;

    // interaction state
    this.pointer = { x: -9999, y: -9999, inside: false, moved: false };
    this.ndc = new THREE.Vector2();
    this.down = false; this.dragging = false; this.holding = false;
    this.downPos = { x: 0, y: 0 }; this.lastPos = { x: 0, y: 0 };
    this.holdT = 0; this.charge = 0;
    this.burst = 0; this.burstVel = 0; this.blasted = false;
    this.intro = reducedMotion ? 0 : 1;
    this.introWait = reducedMotion ? 0 : introDelay;
    this.userYaw = 0; this.userYawVel = 0; this.userPitch = 0;
    this.look = { x: 0, y: 0 };
    this.hoverAmt = 0; this.hoverLocal = new THREE.Vector3(); this.hoveredShard = null;
    this.zap = 0;
    this.blastFlash = 0;
    // scroll choreography: S = shatter as the hero leaves, R = reassemble into the dock
    this.scroll = { o: 0, S: 0, R: 0, U: 0, scatter: 0, primed: false };
    this.heroAnchor = null;
    this.dock = null;
    this.holdOrigin = null;
    this.cursorMode = null;
    this.quakeActive = false;

    // overlay state
    const lineRows = isMobile ? [0.6, 0.8, 1] : [0, 0.5, 1];
    this.lines = lineRows.map((fy, i) => ({ fy, prog: 0, seed: [1, 3, 2][i], pts: [] }));
    this.pulses = [
      { line: 0, phase: 0, speed: 0.55, len: 0.045, active: false, rest: 0.8, dir: 1 },
      { line: 1, phase: 0, speed: 0.5, len: 0.045, active: false, rest: 2.4, dir: -1 },
      { line: 2, phase: 0, speed: 0.52, len: 0.045, active: false, rest: 4.2, dir: 1 },
    ];
    this.bolts = [];
    this.sparks = [];
    this.rings = [];
    this.weldCooldown = 0;

    this.raycaster = new THREE.Raycaster();
    this.tmpV = new THREE.Vector3();
    this.tmpQ = new THREE.Quaternion();
    this.running = false;
    this.visible = true;
    this.disposed = false;
    this.last = performance.now();
    this.time = 0;

    this.init();
  }

  /* ───────────── setup ───────────── */

  init() {
    const quality = getQuality();
    const renderer = new THREE.WebGLRenderer({ antialias: quality.antialias, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(pixelRatio(this.isMobile));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
    this.host.appendChild(renderer.domElement);
    this.renderer = renderer;
    this.pmrem = new THREE.PMREMGenerator(renderer);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    this.camera.position.set(0, 0, 10);

    // lights — key, rim and two orbiting accent lights for moving glints
    this.scene.add(new THREE.AmbientLight(0x404858, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 4, 5);
    const rim = new THREE.DirectionalLight(0xcfd6e0, 1.4);
    rim.position.set(-4, 1.5, -3);
    this.scene.add(key, rim);
    this.accentLightA = new THREE.PointLight(this.palette.accent, 4, 0, 2);
    this.accentLightB = new THREE.PointLight(this.palette.accent, 3, 0, 2);
    this.coolLight = new THREE.PointLight(0xdde4ee, 5, 0, 2);
    this.coolLight.position.set(-3, 2, 3);
    this.scene.add(this.accentLightA, this.accentLightB, this.coolLight);

    this.root = new THREE.Group();
    this.inner = new THREE.Group();
    this.inner.position.x = COMPOSITION_OFFSET_X;
    this.root.add(this.inner);
    this.scene.add(this.root);

    this.baseMaterial = new THREE.MeshPhysicalMaterial({
      color: this.palette.metal,
      metalness: 1,
      roughness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.25,
      iridescence: 0.18,
      iridescenceIOR: 1.5,
      iridescenceThicknessRange: [180, 520],
      emissive: new THREE.Color(this.palette.accent),
      emissiveIntensity: 0,
      side: THREE.DoubleSide,
    });

    const { shards, edgeGeos } = buildMonogramShards({ seedsPerGlyph: Math.min(this.isMobile ? 6 : 9, getQuality().shardSeeds) });
    this.shards = shards.map((s) => {
      const mesh = new THREE.Mesh(s.geometry, this.baseMaterial.clone());
      mesh.position.copy(s.home);
      mesh.userData.shard = s;
      s.mesh = mesh;
      s.flash = 0;
      this.inner.add(mesh);
      return s;
    });

    // terminal cursor block
    const cursor = buildCursorBlock();
    this.cursorMat = new THREE.MeshStandardMaterial({
      color: 0x111111, emissive: new THREE.Color(this.palette.accent), emissiveIntensity: 1.6, roughness: 0.35, metalness: 0.2,
    });
    const cursorMesh = new THREE.Mesh(cursor.geometry, this.cursorMat);
    cursorMesh.position.copy(cursor.home);
    this.cursorShard = {
      mesh: cursorMesh, home: cursor.home, scatter: cursor.scatter, float: cursor.float,
      dir: new THREE.Vector3(0.9, -0.3, 0.6).normalize().multiplyScalar(1.3),
      spinAxis: new THREE.Vector3(0.3, 1, 0.2).normalize(), spinSpeed: 1.8, delay: 0.05, flash: 0, isCursor: true,
    };
    this.inner.add(cursorMesh);
    this.shards.push(this.cursorShard);
    this.shardMeshes = this.shards.map((s) => s.mesh);

    // idle edge glow
    this.edgeMat = new THREE.LineBasicMaterial({ color: this.palette.accent, transparent: true, opacity: 0.1, depthWrite: false });
    this.edges = edgeGeos.map((g) => {
      const l = new THREE.LineSegments(g, this.edgeMat);
      l.scale.setScalar(1.002);
      this.inner.add(l);
      return l;
    });

    // soft halo behind the monogram + small halo on the cursor
    this.glowTex = makeGlowTexture();
    this.haloMat = new THREE.SpriteMaterial({ map: this.glowTex, color: this.palette.accent, transparent: true, depthWrite: false, opacity: 0.12 });
    this.halo = new THREE.Sprite(this.haloMat);
    this.halo.position.set(0, 0, -0.6);
    this.halo.scale.set(4.6, 3.2, 1);
    this.root.add(this.halo);
    this.cursorHaloMat = new THREE.SpriteMaterial({ map: this.glowTex, color: this.palette.accent, transparent: true, depthWrite: false, opacity: 0.6 });
    this.cursorHalo = new THREE.Sprite(this.cursorHaloMat);
    this.cursorHalo.scale.set(0.9, 0.55, 1);
    cursorMesh.add(this.cursorHalo);

    this.applyPalette();

    this.ctx = this.overlay.getContext('2d');

    // listeners
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.onVisibility = this.onVisibility.bind(this);
    this.tick = this.tick.bind(this);

    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('pointerdown', this.onPointerDown);
    document.documentElement.addEventListener('mouseleave', this.onPointerLeave);
    window.addEventListener('contextmenu', this.onContextMenu);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    window.addEventListener('scroll', this.onScroll, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibility);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.layer);
    this.resizeObserver.observe(this.section);

    // the layer is fixed, so render only while the hero or a stage section is on screen
    this.stageVisible = new Map();
    this.io = new IntersectionObserver((entries) => {
      entries.forEach((e) => this.stageVisible.set(e.target, e.isIntersecting));
      this.visible = [...this.stageVisible.values()].some(Boolean);
      this.updateRunning();
    }, { threshold: 0 });
    this.io.observe(this.section);
    this.stageSelectors.forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) this.io.observe(el);
    });

    this.quakeEls = Array.from(this.section.querySelectorAll('[data-quake]'));

    this.resize();
    this.onScroll();
    this.updateRunning();
  }

  applyPalette() {
    const p = this.palette;
    const accent = new THREE.Color(p.accent);
    this.shards.forEach((s) => {
      if (s.isCursor) return;
      s.mesh.material.color.set(p.metal);
      s.mesh.material.emissive.copy(accent);
    });
    this.cursorMat.emissive.copy(accent);
    this.edgeMat.color.copy(accent);
    this.haloMat.color.copy(accent);
    this.cursorHaloMat.color.copy(accent);
    const blending = p.additiveGlow ? THREE.AdditiveBlending : THREE.NormalBlending;
    this.haloMat.blending = blending;
    this.cursorHaloMat.blending = blending;
    this.haloMat.needsUpdate = this.cursorHaloMat.needsUpdate = true;
    this.accentLightA.color.copy(accent);
    this.accentLightB.color.copy(accent);
    this.accentRgb = hexToRgb(p.accent);
    this.buildEnvironment();
  }

  setPalette(palette) {
    this.palette = palette;
    this.applyPalette();
  }

  buildEnvironment() {
    const p = this.palette;
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(p.envBase);
    const geo = new THREE.PlaneGeometry(1, 1);
    const softbox = makeSoftboxTexture();
    const mats = [];
    const add = (color, intensity, pos, scale, map = null) => {
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), map, side: THREE.DoubleSide });
      mats.push(mat);
      const m = new THREE.Mesh(geo, mat);
      m.position.set(...pos);
      m.scale.set(scale[0], scale[1], 1);
      m.lookAt(0, 0, 0);
      envScene.add(m);
    };
    add(p.envKey, 1.1, [0, 1, 9], [13, 8], softbox); // big front softbox → sheen on the faces
    add(p.envKey, 4, [0, 6, 3], [14, 0.8]);          // overhead strip
    add(p.envKey, 2.5, [-6, 1, 2], [0.6, 8]);        // left vertical strip
    add(p.envKey, 2, [2, 2.5, 7], [3.5, 0.3]);       // thin front strip → crisp face glint
    add(p.accent, 3, [6, -0.5, 1.5], [2.5, 7]);      // accent panel right
    add(p.accent, 2, [-1, -6, 2], [10, 1]);          // accent floor bounce
    add(p.accent, 2.5, [3, 4.5, -4], [6, 0.5]);      // accent rim from behind
    add(p.envCool, 0.8, [-4, -2, -6], [6, 5]);       // neutral back fill
    const rt = this.pmrem.fromScene(envScene, 0.03);
    geo.dispose();
    softbox.dispose();
    mats.forEach((m) => m.dispose());
    if (this.envRT) this.envRT.dispose();
    this.envRT = rt;
    this.scene.environment = rt.texture;
  }

  /* ───────────── sizing ───────────── */

  resize() {
    // the layer is fixed to the viewport
    this.w = Math.max(1, this.layer.clientWidth || window.innerWidth);
    this.h = Math.max(1, this.layer.clientHeight || window.innerHeight);
    this.renderer.setSize(this.w, this.h, false);
    const dpr = this.renderer.getPixelRatio();
    this.overlay.width = Math.round(this.w * dpr);
    this.overlay.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.camera.aspect = this.w / this.h;
    this.refreshAnchor(true);
  }

  /* Hero anchor in page coordinates (the hero starts at the top of the page) */
  refreshAnchor(snap = false) {
    const a = this.getAnchor?.(this.w, this.section.offsetHeight || this.h);
    if (!a) return;
    this.anchorTarget = a;
    if (snap || !this.heroAnchor) this.heroAnchor = { ...a };
  }

  applyCamera() {
    const { w, h, anchor } = this;
    // Shift the projection so the model renders head-on at the anchor point
    this.camera.setViewOffset(w, h, w / 2 - anchor.x, h / 2 - anchor.y, w, h);
    this.camera.updateProjectionMatrix();
    const visibleH = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.position.z;
    this.pxPerUnit = h / visibleH;
    const byWidth = anchor.width / (MONOGRAM_SIZE.width * this.pxPerUnit);
    const byHeight = (h * 0.42) / (MONOGRAM_SIZE.height * this.pxPerUnit);
    this.modelScale = Math.min(byWidth, byHeight);
  }

  /* ───────────── scroll choreography ─────────────
   * Like Trionn: the monogram is pinned while the hero scrolls away and
   * shatters into floating shards (S). When the About statement's dock
   * slot rises into view, the shards converge and land there (R).
   */
  updateScroll(dt) {
    const { w, h } = this;
    const sc = this.scroll;
    sc.o = window.scrollY / h;

    const smooth = (x) => x * x * (3 - 2 * x);
    const sT = smooth(clamp((sc.o - 0.06) / 0.54));
    const uT = smooth(clamp((sc.o - 0.03) / 0.35));

    const dockEl = this.getDock?.();
    let rT = 0;
    if (dockEl) {
      const r = dockEl.getBoundingClientRect();
      if (r.width > 0) {
        this.dock = { x: r.left + r.width / 2, y: r.top + r.height / 2, width: r.width };
        rT = smooth(clamp((h * 0.8 - this.dock.y) / (h * 0.32)));
      }
    }

    if (!sc.primed) {
      sc.S = sT; sc.R = rT; sc.U = uT; sc.primed = true;
    } else {
      sc.S = damp(sc.S, sT, 5, dt);
      sc.R = damp(sc.R, rT, 5, dt);
      sc.U = damp(sc.U, uT, 5, dt);
    }
    sc.scatter = sc.S * (1 - sc.R);

    // hero anchor eases toward its measured target (layout settling / resize)
    const ha = this.heroAnchor;
    const at = this.anchorTarget;
    if (ha && at) {
      ha.x = damp(ha.x, at.x, 6, dt);
      ha.y = damp(ha.y, at.y, 6, dt);
      ha.width = damp(ha.width, at.width, 6, dt);
    }
    if (!ha) return;

    // pinned hero spot → viewport centre while shattered → dock slot
    const lerp = (a, b, t) => a + (b - a) * t;
    const floatW = Math.min(ha.width, w * 0.7);
    let x = lerp(ha.x, w / 2, sc.S);
    let y = lerp(ha.y, h / 2, sc.S);
    let width = lerp(ha.width, floatW, sc.S);
    if (this.dock && sc.R > 0) {
      x = lerp(x, this.dock.x, sc.R);
      y = lerp(y, this.dock.y, sc.R);
      width = lerp(width, this.dock.width, sc.R);
    }
    this.anchor = { x, y, width };

    // dim the shards while they float behind the About copy
    const dim = sc.scatter * (this.palette.additiveGlow ? 0.4 : 0.62);
    const op = (1 - dim).toFixed(3);
    if (op !== this.lastLayerOpacity) {
      this.lastLayerOpacity = op;
      this.layer.style.opacity = op;
    }
  }

  inHero() {
    return this.scroll.o < 0.06 && this.scroll.S < 0.02;
  }

  docked() {
    return this.scroll.R > 0.97;
  }

  /* ───────────── input ───────────── */

  onPointerMove(e) {
    const p = { x: e.clientX, y: e.clientY };
    this.pointer.x = p.x; this.pointer.y = p.y;
    this.pointer.inside = true; this.pointer.moved = true;
    this.ndc.set((p.x / this.w) * 2 - 1, -(p.y / this.h) * 2 + 1);

    if (!this.down) return;
    const dx = p.x - this.lastPos.x;
    const dy = p.y - this.lastPos.y;
    this.lastPos = p;
    if (!this.dragging && Math.hypot(p.x - this.downPos.x, p.y - this.downPos.y) > 8) {
      this.dragging = true;
      this.holding = false;
    }
    if (this.dragging) {
      this.userYaw += dx * 0.011;
      this.userYawVel = dx * 0.011 * 60;
      this.userPitch = clamp(this.userPitch + dy * 0.006, -0.7, 0.7);
    }
  }

  onPointerDown(e) {
    if (e.button !== 0 || !this.running) return;
    if (e.target.closest('a, button, input, textarea, select, [data-no-blast]')) return;
    // hold anywhere in the hero, or directly on the docked monogram
    let origin = null;
    if (this.inHero() && this.section.contains(e.target)) origin = 'hero';
    else if (this.docked() && this.hoveredShard) origin = 'dock';
    if (!origin) return;
    if (e.pointerType === 'mouse') e.preventDefault(); // no text selection while charging
    const p = { x: e.clientX, y: e.clientY };
    this.holdOrigin = origin;
    this.down = true; this.holding = true; this.dragging = false;
    this.downPos = p; this.lastPos = p;
    this.holdT = 0;
  }

  onPointerUp() {
    this.down = false; this.holding = false; this.dragging = false;
  }

  onPointerLeave() {
    this.pointer.inside = false;
    if (!this.down) { this.pointer.x = -9999; this.pointer.y = -9999; }
  }

  onContextMenu(e) {
    if (this.holding || this.burst > 0.05) e.preventDefault();
  }

  onScroll() {
    // scroll-out of the hero cancels a hold in progress
    if (this.holding && this.holdOrigin === 'hero' && window.scrollY > this.h * 0.06) this.onPointerUp();
  }

  onVisibility() {
    this.updateRunning();
  }

  updateRunning() {
    const shouldRun = this.visible && !document.hidden && !this.disposed;
    if (shouldRun && !this.running) {
      this.running = true;
      this.last = performance.now();
      this.layer.style.visibility = 'visible';
      this.raf = requestAnimationFrame(this.tick);
    } else if (!shouldRun && this.running) {
      this.running = false;
      cancelAnimationFrame(this.raf);
      // never leave a stale frame over other sections
      if (!this.visible) this.layer.style.visibility = 'hidden';
      this.setCursorMode(null);
    }
  }

  setCursorMode(mode) {
    if (mode === this.cursorMode) return;
    this.cursorMode = mode;
    window.dispatchEvent(new CustomEvent('cursor-mode', { detail: mode }));
  }

  /* ───────────── main loop ───────────── */

  tick(now) {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.tick);
    const dt = clamp((now - this.last) / 1000, 0, 0.05); // rAF time can predate performance.now()
    this.last = now;
    this.time += dt;

    this.updateScroll(dt); // reads layout first, before any DOM writes this frame
    if (!this.anchor) return;
    this.applyCamera();

    this.updateState(dt);
    this.updateModel(dt);
    this.scene.updateMatrixWorld();
    this.updateHover(dt);
    this.renderer.render(this.scene, this.camera);
    this.drawOverlay(dt);
    this.updateHint();
    this.updateQuake();
  }

  updateState(dt) {
    // intro assemble
    if (this.introWait > 0) this.introWait -= dt;
    else this.intro = damp(this.intro, 0, 2.4, dt);
    if (this.intro < 0.001) this.intro = 0;

    // hold → charge → blast
    if (this.holding) this.holdT += dt;
    else this.holdT = 0;
    this.charge = this.holding ? clamp(this.holdT / CHARGE_TIME) : damp(this.charge, 0, 8, dt);

    const blasting = this.holding && this.holdT >= CHARGE_TIME;
    if (blasting && !this.blasted) this.onBlast();
    if (!this.holding) this.blasted = false;

    const target = blasting ? 1 + Math.min(0.6, (this.holdT - CHARGE_TIME) * 0.18) : 0;
    const out = target > this.burst;
    const k = out ? 120 : 34;
    const c = out ? 2 * Math.sqrt(k) * 0.95 : 2 * Math.sqrt(k) * 0.62;
    this.burstVel += ((target - this.burst) * k - this.burstVel * c) * dt;
    this.burst += this.burstVel * dt;

    this.zap = damp(this.zap, 0, 3.5, dt);
    this.blastFlash = damp(this.blastFlash, 0, 2.6, dt);

    // drag spin inertia, then settle back facing front
    if (!this.dragging) {
      this.userYaw += this.userYawVel * dt;
      this.userYawVel *= Math.exp(-2.6 * dt);
      if (Math.abs(this.userYawVel) < 0.8) {
        const home = Math.round(this.userYaw / (Math.PI * 2)) * Math.PI * 2;
        this.userYaw = damp(this.userYaw, home, 2.2, dt);
      }
      this.userPitch = damp(this.userPitch, 0, 2.2, dt);
    }

    // look-at-pointer, relative to the model
    if (this.pointer.inside && this.anchor) {
      const lx = clamp((this.pointer.x - this.anchor.x) / (this.w * 0.5), -1, 1);
      const ly = clamp((this.pointer.y - this.anchor.y) / (this.h * 0.5), -1, 1);
      this.look.x = damp(this.look.x, lx, 3, dt);
      this.look.y = damp(this.look.y, ly, 3, dt);
    } else {
      this.look.x = damp(this.look.x, 0, 1.5, dt);
      this.look.y = damp(this.look.y, 0, 1.5, dt);
    }

    if (this.weldCooldown > 0) this.weldCooldown -= dt;
  }

  onBlast() {
    this.blasted = true;
    const a = this.screenAnchor || { x: this.anchor.x, y: this.anchor.y };
    this.rings.push({ x: a.x, y: a.y, r: 10, life: 1, speed: 1500, width: 2.2 });
    this.rings.push({ x: a.x, y: a.y, r: 0, life: 1, speed: 900, width: 1, delay: 0.08 });
    this.shards.forEach((s) => { s.flash = 0.9; });
    this.blastFlash = 1;
    window.dispatchEvent(new CustomEvent('hero-blast'));
  }

  updateModel(dt) {
    const t = this.time;
    const rm = this.reducedMotion ? 0.35 : 1;
    const sway = Math.sin(t * 0.42) * 0.36 * rm + Math.sin(t * 0.17) * 0.1 * rm;
    const pitch = Math.sin(t * 0.33) * 0.08 * rm - 0.05;

    const sc = this.scroll.scatter;
    const calm = 1 - sc * 0.85;
    const root = this.root;
    root.scale.setScalar(this.modelScale * (1 + this.charge * 0.04));
    root.rotation.set(
      (pitch + this.look.y * 0.28) * calm + this.userPitch,
      (sway + this.look.x * 0.42) * calm + this.userYaw,
      Math.sin(t * 0.25) * 0.03,
    );
    // charging rumble
    const rumble = this.charge * (1 - clamp(this.burst)) * 0.03;
    root.position.set((Math.random() - 0.5) * rumble, (Math.random() - 0.5) * rumble, 0);

    // orbiting accent lights
    this.accentLightA.position.set(5 * Math.sin(t * 0.6), 2.5 * Math.cos(t * 0.4), 3 * Math.cos(t * 0.5) + 3);
    this.accentLightB.position.set(5 * Math.cos(t * 0.45), 2.5 * Math.sin(t * 0.7), 3 * Math.sin(t * 0.3) - 1.5);
    const preBlast = this.charge * (1 - clamp(this.burst));
    this.accentLightA.intensity = 4 + preBlast * 12 + this.zap * 10 + this.blastFlash * 20;

    const amt = Math.max(this.burst, this.intro);
    const drift = this.blasted ? Math.min(0.6, (this.holdT - CHARGE_TIME) * 0.15) : 0;

    // scroll scatter targets are spread over the viewport, so convert them to local units
    const viewWU = this.w / this.pxPerUnit;
    const viewHU = this.h / this.pxPerUnit;
    const invS = 1 / Math.max(1e-4, this.modelScale);
    const offX = this.inner.position.x;

    this.shards.forEach((s, i) => {
      const m = s.mesh;
      const prog = amt >= 0 ? clamp((amt - s.delay) / (1 - s.delay), 0, 2) : amt;
      const dist = MAX_SPREAD * prog + drift * prog;

      // pointer "lift": shards near the hovered point rise toward the viewer
      let lift = 0;
      if (this.hoverAmt > 0.01) {
        const d = Math.hypot(s.home.x - this.hoverLocal.x, s.home.y - this.hoverLocal.y);
        lift = Math.pow(Math.max(0, 1 - d / 0.65), 2) * 0.14 * this.hoverAmt;
      }

      const ph = t * 1.3 + i * 1.7;
      const jitter = this.charge * (1 - clamp(this.burst)) * 0.016;
      let px = s.home.x + s.dir.x * dist + Math.sin(ph * 9.1) * jitter;
      let py = s.home.y + s.dir.y * dist + Math.cos(ph * 7.3) * jitter;
      let pz = s.home.z + s.dir.z * dist + lift;
      const angle = s.spinSpeed * Math.max(0, prog) * Math.PI + s.spinSpeed * drift * 0.8 * prog;
      m.quaternion.setFromAxisAngle(s.spinAxis, angle);

      // scroll scatter: staggered drift out to a floating spot, slow tumble while there
      const k = clamp((sc - s.delay * 0.9) / (1 - s.delay * 0.9));
      const e = k * k * (3 - 2 * k);
      if (e > 0.0001) {
        const fx = Math.sin(t * 0.32 + s.float) * 0.025 * viewHU;
        const fy = Math.cos(t * 0.27 + s.float * 1.7) * 0.025 * viewHU;
        px += ((s.scatter.x * viewWU * 1.1 + fx) * invS - offX - px) * e;
        py += ((s.scatter.y * viewHU * 1.05 + fy) * invS - py) * e;
        pz += (s.scatter.z * 2.4 * invS - pz) * e;
        s.tumble = (s.tumble || 0) + dt * 0.3 * s.spinSpeed * e;
        this.tmpQ.setFromAxisAngle(s.spinAxis, s.spinSpeed * Math.PI * 1.4 + s.tumble);
        m.quaternion.premultiply(this.tmpQ.slerp(IDENTITY_Q, 1 - e));
      }
      m.position.set(px, py, pz);
      if (lift > 0) {
        this.tmpQ.setFromAxisAngle(this.tmpV.set(-(s.home.y - this.hoverLocal.y), s.home.x - this.hoverLocal.x, 0).normalize(), lift * 1.4);
        m.quaternion.premultiply(this.tmpQ);
      }

      if (!s.isCursor) {
        s.flash = damp(s.flash, 0, 4, dt);
        const mat = m.material;
        const glow = Math.max(s.flash, this.zap * 0.3, preBlast * 0.35);
        mat.emissiveIntensity = glow * 0.45;
        mat.envMapIntensity = 1.25 + s.flash * 1.4;
        mat.roughness = 0.16 - s.flash * 0.1;
      }
    });

    // cursor blink
    const blink = this.reducedMotion ? 1 : (Math.sin(t * Math.PI * 1.9) > -0.15 ? 1 : 0.08);
    this.cursorBlink = damp(this.cursorBlink ?? 1, blink, 18, dt);
    this.cursorMat.emissiveIntensity = 0.25 + this.cursorBlink * 1.6 + this.charge * 1.2;
    this.cursorHaloMat.opacity = (0.15 + this.cursorBlink * 0.5) * this.palette.glowStrength;

    // edges glow while charging, vanish once shards separate
    const apart = clamp(Math.max(Math.abs(amt), sc) * 8);
    this.edgeMat.opacity = (0.1 + this.hoverAmt * 0.12 + this.charge * 0.8 + this.zap * 0.4) * (1 - apart);

    this.haloMat.opacity = (0.1 + this.hoverAmt * 0.08 + preBlast * 0.4 + this.zap * 0.25 + this.blastFlash * 0.5) * (1 - clamp(this.burst) * 0.6) * (1 - sc) * this.palette.glowStrength;
    this.halo.scale.set(4.6 + preBlast * 1.2 + this.blastFlash * 2.5, 3.2 + preBlast * 0.9 + this.blastFlash * 1.8, 1);
  }

  updateHover(dt) {
    let hit = null;
    const interactive = this.inHero() || this.docked();
    if (interactive && this.pointer.inside && !this.dragging && this.intro < 0.1) {
      this.raycaster.setFromCamera(this.ndc, this.camera);
      const hits = this.raycaster.intersectObjects(this.shardMeshes, false);
      if (hits.length) hit = hits[0];
    }
    if (hit) {
      this.inner.worldToLocal(this.hoverLocal.copy(hit.point));
      const shard = hit.object.userData.shard;
      if (shard && shard !== this.hoveredShard) shard.flash = Math.max(shard.flash, 0.85);
      this.hoveredShard = shard || null;
    } else {
      this.hoveredShard = null;
    }
    this.hoverAmt = damp(this.hoverAmt, hit && this.burst < 0.2 ? 1 : 0, 6, dt);

    const mode = this.dragging ? 'drag'
      : this.holding ? (this.holdT >= CHARGE_TIME ? 'blasted' : 'charging')
        : hit ? 'hold' : null;
    this.setCursorMode(mode);
    const charge = Math.round(this.charge * 100) / 100;
    if (charge !== this.lastChargeVar) {
      this.lastChargeVar = charge;
      document.documentElement.style.setProperty('--hold-charge', charge);
    }
  }

  updateHint() {
    if (!this.hint || !this.pxPerUnit) return;
    const halfH = (MONOGRAM_SIZE.height / 2) * this.modelScale * this.pxPerUnit;
    const gap = this.isMobile ? 14 : 38;
    this.hint.style.transform = `translate3d(${this.anchor.x}px, ${this.anchor.y + halfH + gap}px, 0)`;
    this.hint.style.opacity = String(clamp(1 - this.scroll.o * 3) * (1 - clamp(this.burst) * 0.85));
  }

  /* ───────────── overlay: lines, pulses, sparks ───────────── */

  buildLinePoints(line, A) {
    const { w, h } = this;
    const p0 = { x: 0, y: h * line.fy };
    const p2 = { x: w, y: h * line.fy };
    const cx = 2 * A.x - 0.5 * p0.x - 0.5 * p2.x;
    const cy = 2 * A.y - 0.5 * p0.y - 0.5 * p2.y;
    const len = Math.hypot(p2.x - p0.x, p2.y - p0.y) || 1;
    const t = this.time;
    const energy = 1 + this.charge * 3 + clamp(this.burst) * 5;
    const pts = line.pts;
    pts.length = 0;
    for (let i = 0; i <= LINE_SAMPLES; i++) {
      const s = i / LINE_SAMPLES;
      const u = 1 - s;
      const x = u * u * p0.x + 2 * u * s * cx + s * s * p2.x;
      const y = u * u * p0.y + 2 * u * s * cy + s * s * p2.y;
      const dxs = 2 * u * (cx - p0.x) + 2 * s * (p2.x - cx);
      const dys = 2 * u * (cy - p0.y) + 2 * s * (p2.y - cy);
      const dl = Math.hypot(dxs, dys) || 1;
      const wob = (0.75 * Math.sin(0.38 * t * energy + 2.1 * line.seed + s * Math.PI * 1.1)
        + 0.25 * Math.sin(0.19 * t * energy + 0.9 * line.seed + s * Math.PI * 1.9))
        * Math.sin(s * Math.PI) * 0.01 * len * Math.min(energy, 3);
      pts.push({ x: x - (dys / dl) * wob, y: y + (dxs / dl) * wob, t: s });
    }
  }

  drawOverlay(dt) {
    const ctx = this.ctx;
    const { w, h } = this;
    ctx.clearRect(0, 0, w, h);

    // anchor point in screen space follows the actual model
    this.tmpV.set(0, 0, 0.2).applyMatrix4(this.root.matrixWorld).project(this.camera);
    const A = { x: (this.tmpV.x * 0.5 + 0.5) * w, y: (-this.tmpV.y * 0.5 + 0.5) * h };
    this.screenAnchor = A;
    const fadeR = Math.min(w, h) * (this.isMobile ? 0.2 : 0.16);
    const p = this.palette;
    const fade = 1 - this.scroll.U;

    // lines draw in once the monogram has assembled
    this.lines.forEach((line) => {
      if (this.intro < 0.3) line.prog = Math.min(1, line.prog + dt * 0.9);
      this.buildLinePoints(line, A);
    });

    if (fade > 0) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = 1;
      this.lines.forEach((line) => {
        const pts = line.pts;
        const mid = LINE_SAMPLES / 2;
        const half = Math.round(mid * line.prog * fade);
        for (let i = mid - half; i < mid + half; i++) {
          const a = pts[i], b = pts[i + 1];
          const d = Math.hypot(a.x - A.x, a.y - A.y);
          const alpha = p.lineAlpha * fade * (1 - 0.92 * Math.max(0, 1 - d / fadeR));
          ctx.strokeStyle = rgba(p.line, alpha);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      });
      ctx.restore();
    }

    const linesReady = this.lines.every((l) => l.prog >= 0.995);
    if (linesReady && fade > 0.98) {
      this.updatePulses(dt, fade);
      this.updateWelding(dt);
    }
    this.drawBolts(dt);
    this.drawSparks(dt);
    this.drawRings(dt);
  }

  updatePulses(dt, fade) {
    const ctx = this.ctx;
    const p = this.palette;
    this.pulses.forEach((pulse, idx) => {
      if (!pulse.active) {
        if (this.reducedMotion) return;
        pulse.rest -= dt;
        if (pulse.rest <= 0) {
          pulse.active = true;
          pulse.dir = Math.random() > 0.5 ? 1 : -1;
          pulse.phase = pulse.dir === 1 ? -pulse.len : 1 + pulse.len;
          pulse.speed = 0.45 + Math.random() * 0.2;
        }
        return;
      }
      pulse.phase += pulse.dir * pulse.speed * dt;
      const arrived = pulse.dir === 1 ? pulse.phase >= 0.5 : pulse.phase <= 0.5;
      if (arrived) {
        pulse.active = false;
        pulse.rest = 1.6 + Math.random() * 2.8 + idx * 0.3;
        this.zap = Math.max(this.zap, 0.55);
        return;
      }
      // head-to-tail gradient: hot head, accent tail
      const pts = this.lines[pulse.line].pts;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.6;
      for (let i = 0; i < pts.length - 1; i++) {
        const behind = pulse.dir === 1 ? pulse.phase - pts[i].t : pts[i].t - pulse.phase;
        if (behind < 0 || behind > pulse.len * 2.2) continue;
        const r = behind / (pulse.len * 2.2);
        ctx.strokeStyle = rgba(mix(p.pulseHead, this.accentRgb, Math.min(1, r * 1.6)), (1 - r) * 0.95 * fade);
        ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[i + 1].x, pts[i + 1].y); ctx.stroke();
      }
      ctx.restore();
    });
  }

  nearestOnLine(pts, x, y) {
    let best = null, bestD = Infinity;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const vx = b.x - a.x, vy = b.y - a.y;
      const l2 = vx * vx + vy * vy || 1;
      const u = clamp(((x - a.x) * vx + (y - a.y) * vy) / l2);
      const px = a.x + u * vx, py = a.y + u * vy;
      const d = (px - x) ** 2 + (py - y) ** 2;
      if (d < bestD) { bestD = d; best = { x: px, y: py, t: a.t + (b.t - a.t) * u, d: Math.sqrt(d) }; }
    }
    return best;
  }

  updateWelding() {
    if (!this.pointer.inside || this.dragging || this.holding || !this.inHero()) return;
    const { x, y } = this.pointer;
    let touched = -1, touch = null;
    for (let i = 0; i < this.lines.length; i++) {
      const n = this.nearestOnLine(this.lines[i].pts, x, y);
      if (n && n.d < 14) { touched = i; touch = n; break; }
    }
    if (touched < 0 || this.weldCooldown > 0) return;
    this.weldCooldown = 0.045 + Math.random() * 0.06;

    // welding sparks spraying out of the contact point
    const count = 4 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.6;
      const sp = 120 + Math.random() * 360;
      this.sparks.push({ x: touch.x, y: touch.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1, decay: 1.6 + Math.random() * 2 });
    }
    // arcs jumping to the neighbouring lines
    const others = [0, 1, 2].filter((i) => i !== touched).sort(() => Math.random() - 0.5).slice(0, Math.random() > 0.5 ? 2 : 1);
    others.forEach((o) => {
      const target = this.nearestOnLine(this.lines[o].pts, x, y);
      if (target) this.bolts.push(this.makeBolt(touch, target));
    });
    // every touch also sends a surge toward the monogram
    const pulse = this.pulses[touched];
    if (!pulse.active && Math.random() > 0.6) {
      pulse.active = true;
      pulse.phase = touch.t;
      pulse.dir = touch.t < 0.5 ? 1 : -1;
      pulse.speed = 0.9;
    }
  }

  makeBolt(a, b) {
    const pts = [];
    const segs = 12;
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const amp = Math.min(len * 0.18, 34);
    const bow = (Math.random() - 0.5) * amp;
    for (let i = 0; i <= segs; i++) {
      const s = i / segs;
      const env = Math.sin(s * Math.PI);
      const off = (Math.random() - 0.5) * amp * env + bow * env;
      pts.push({ x: a.x + dx * s + nx * off, y: a.y + dy * s + ny * off });
    }
    const life = 0.06 + Math.random() * 0.09;
    return { pts, life, max: life };
  }

  drawBolts(dt) {
    if (!this.bolts.length) return;
    const ctx = this.ctx;
    const accent = this.accentRgb;
    const hot = this.palette.sparkHot;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    this.bolts = this.bolts.filter((b) => {
      b.life -= dt;
      if (b.life <= 0) return false;
      const a = (b.life / b.max) * (0.7 + Math.random() * 0.3);
      [[7, rgba(accent, 0.12 * a)], [3.5, rgba(accent, 0.35 * a)], [1.3, rgba(hot, 0.95 * a)]].forEach(([lw, col]) => {
        ctx.lineWidth = lw;
        ctx.strokeStyle = col;
        ctx.beginPath();
        ctx.moveTo(b.pts[0].x, b.pts[0].y);
        for (let i = 1; i < b.pts.length; i++) ctx.lineTo(b.pts[i].x, b.pts[i].y);
        ctx.stroke();
      });
      return true;
    });
    ctx.restore();
  }

  drawSparks(dt) {
    if (!this.sparks.length) return;
    const ctx = this.ctx;
    const accent = this.accentRgb;
    const hot = this.palette.sparkHot;
    ctx.save();
    ctx.lineCap = 'round';
    this.sparks = this.sparks.filter((s) => {
      s.life -= s.decay * dt;
      if (s.life <= 0) return false;
      s.vy += 980 * dt;
      s.vx *= Math.exp(-1.5 * dt);
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      ctx.strokeStyle = rgba(mix(accent, hot, s.life), s.life);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 0.022, s.y - s.vy * 0.022);
      ctx.stroke();
      return true;
    });
    ctx.restore();
  }

  drawRings(dt) {
    if (!this.rings.length) return;
    const ctx = this.ctx;
    ctx.save();
    this.rings = this.rings.filter((r) => {
      if (r.delay > 0) { r.delay -= dt; return true; }
      r.r += r.speed * dt;
      r.speed *= Math.exp(-1.8 * dt);
      r.life -= dt * 1.4;
      if (r.life <= 0) return false;
      ctx.strokeStyle = rgba(this.accentRgb, r.life * r.life * 0.85);
      ctx.lineWidth = r.width;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
      return true;
    });
    ctx.restore();
  }

  /* ───────────── DOM quake ───────────── */

  updateQuake() {
    if (this.reducedMotion || !this.quakeEls.length) return;
    // only a hold that started in the hero shakes the hero copy
    const fromHero = this.holdOrigin === 'hero';
    const charging = fromHero && this.holding && this.holdT < CHARGE_TIME;
    const b = clamp(this.burst);
    const floating = fromHero && b > 0.02 && (this.blasted || this.burstVel < 0);
    if (charging) {
      this.quakeActive = true;
      const a = this.charge * 3.2;
      this.quakeEls.forEach((el) => {
        el.style.transition = 'none';
        el.style.transform = `translate3d(${(Math.random() - 0.5) * a}px, ${(Math.random() - 0.5) * a}px, 0)`;
      });
    } else if (floating) {
      this.quakeActive = true;
      const t = this.time * 0.8;
      this.quakeEls.forEach((el, i) => {
        const n = i * 2.399;
        el.style.transition = 'none';
        el.style.transform = `perspective(700px) translate3d(${Math.sin(t + n) * 26 * b}px, ${Math.cos(t * 0.6 + n) * 18 * b}px, 0) rotateX(${Math.sin(t + n) * 16 * b}deg) rotateY(${Math.cos(t * 0.7 + n) * 14 * b}deg) rotateZ(${Math.sin(t * 0.5 + n * 1.3) * 5 * b}deg)`;
      });
    } else if (this.quakeActive) {
      this.quakeActive = false;
      this.quakeEls.forEach((el) => {
        el.style.transition = 'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)';
        el.style.transform = '';
      });
    }
  }

  /* ───────────── teardown ───────────── */

  dispose() {
    this.disposed = true;
    this.updateRunning();
    this.setCursorMode(null);
    document.documentElement.style.removeProperty('--hold-charge');
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerdown', this.onPointerDown);
    document.documentElement.removeEventListener('mouseleave', this.onPointerLeave);
    window.removeEventListener('contextmenu', this.onContextMenu);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    window.removeEventListener('scroll', this.onScroll);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.resizeObserver.disconnect();
    this.io.disconnect();
    this.quakeEls.forEach((el) => { el.style.transform = ''; el.style.transition = ''; });

    this.shards.forEach((s) => { s.mesh.geometry.dispose(); s.mesh.material.dispose(); });
    this.edges.forEach((l) => l.geometry.dispose());
    [this.baseMaterial, this.edgeMat, this.haloMat, this.cursorHaloMat].forEach((m) => m.dispose());
    this.glowTex.dispose();
    this.envRT?.dispose();
    this.pmrem.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
    this.ctx.clearRect(0, 0, this.w, this.h);
  }
}
