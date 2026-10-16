import * as THREE from 'three';

/* Drifting star-field behind the hero; pauses while off screen or in a background tab */
export class HeroParticles {
  constructor({ canvas, color, size = 0.015, opacity = 0.7, count = 4000, pixelRatio = 1 }) {
    this.canvas = canvas;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer = renderer;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    this.camera.position.z = 5;

    this.count = count;
    const positions = new Float32Array(count * 3);
    this.speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 18;
      this.speeds[i] = 0.0002 + Math.random() * 0.0006;
    }
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.material = new THREE.PointsMaterial({
      color: new THREE.Color(color), size, transparent: true, opacity, sizeAttenuation: true,
    });
    this.particles = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particles);

    this.mouseX = 0;
    this.mouseY = 0;
    this.onScreen = true;
    this.running = false;

    this.onMouse = (e) => {
      this.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    this.onResize = () => {
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };
    this.resume = () => { if (!this.running && this.onScreen && !document.hidden) this.animate(); };
    this.io = new IntersectionObserver(([entry]) => { this.onScreen = entry.isIntersecting; this.resume(); });

    window.addEventListener('mousemove', this.onMouse);
    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.resume);
    this.io.observe(canvas);
    this.animate();
  }

  animate = () => {
    if (!this.onScreen || document.hidden) { this.running = false; return; }
    this.running = true;
    const pos = this.geometry.attributes.position.array;
    for (let i = 0; i < this.count; i++) {
      pos[i * 3 + 1] -= this.speeds[i];
      if (pos[i * 3 + 1] < -9) pos[i * 3 + 1] = 9;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.particles.rotation.y += 0.0003;
    this.particles.rotation.x += 0.0001;
    this.camera.position.x += (this.mouseX * 0.5 - this.camera.position.x) * 0.02;
    this.camera.position.y += (this.mouseY * 0.5 - this.camera.position.y) * 0.02;
    this.camera.lookAt(this.scene.position);
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.animate);
  };

  dispose() {
    cancelAnimationFrame(this.raf);
    this.running = false;
    this.onScreen = false;
    this.io.disconnect();
    document.removeEventListener('visibilitychange', this.resume);
    window.removeEventListener('mousemove', this.onMouse);
    window.removeEventListener('resize', this.onResize);
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }
}
