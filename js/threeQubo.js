// 3D QUBO & QAOA Energy Landscape Surface using Three.js (White theme support)

class QuboLandscape3D {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.theme = options.theme || 'white';
    this.init();
  }

  init() {
    if (!this.container) return;

    const width = this.container.clientWidth || 500;
    const height = this.container.clientHeight || 340;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.theme === 'white' ? 0xffffff : 0x0a0f1d);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(24, 22, 26);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // Lights
    const amb = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(amb);

    const dir = new THREE.DirectionalLight(0x0284c7, 1.0);
    dir.position.set(15, 30, 20);
    this.scene.add(dir);

    // Grid Plane
    const isWhite = this.theme === 'white';
    const grid = new THREE.GridHelper(30, 20, isWhite ? 0xcbd5e1 : 0x1e293b, isWhite ? 0xe2e8f0 : 0x0f172a);
    grid.position.y = -4;
    this.scene.add(grid);

    // Build QUBO 3D Parametric Energy Surface
    this.buildSurface();
    this.buildOptimizationMarker();

    // Interaction (Mouse orbit)
    this.setupOrbit();

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  buildSurface() {
    const isWhite = this.theme === 'white';
    const size = 24;
    const segments = 36;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // QAOA 2-angle energy function: combination of sinusoidal peaks and global quadratic well
      const r = Math.sqrt(x * x + z * z);
      const y = Math.sin(x * 0.45) * Math.cos(z * 0.45) * 2.8 +
                Math.sin(r * 0.6) * 1.5 +
                (x * x + z * z) * 0.015 - 2.5;
      pos.setY(i, y);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      wireframe: true,
      emissive: 0x0284c7,
      emissiveIntensity: isWhite ? 0.2 : 0.35,
      roughness: 0.4
    });

    this.surfaceMesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.surfaceMesh);

    // Shaded semi-transparent solid underlay
    const solidMat = new THREE.MeshStandardMaterial({
      color: isWhite ? 0xf1f5f9 : 0x0f172a,
      roughness: 0.6,
      metalness: 0.2,
      transparent: true,
      opacity: isWhite ? 0.9 : 0.75
    });
    const solidMesh = new THREE.Mesh(geo, solidMat);
    this.scene.add(solidMesh);
  }

  buildOptimizationMarker() {
    // Current Optimization Point
    const markerGeo = new THREE.SphereGeometry(0.7, 16, 16);
    const markerMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xfbbf24,
      emissiveIntensity: 1.8
    });
    this.marker = new THREE.Mesh(markerGeo, markerMat);
    this.marker.position.set(7, 2.5, 6);
    this.scene.add(this.marker);

    // Marker Glow Light
    this.markerLight = new THREE.PointLight(0xf59e0b, 2.5, 12);
    this.markerLight.position.copy(this.marker.position);
    this.scene.add(this.markerLight);

    // Descent Trajectory Curve
    this.curvePoints = [
      new THREE.Vector3(7, 2.5, 6),
      new THREE.Vector3(5, 1.2, 3),
      new THREE.Vector3(3, -0.4, 0),
      new THREE.Vector3(1, -1.8, -1),
      new THREE.Vector3(0, -3.2, 0) // Global optimal minimum
    ];

    const curve = new THREE.CatmullRomCurve3(this.curvePoints);
    const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.12, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({ color: 0x059669, transparent: true, opacity: 0.9 });
    this.descentTrail = new THREE.Mesh(tubeGeo, tubeMat);
    this.scene.add(this.descentTrail);
  }

  setIterationProgress(pct) {
    const t = Math.max(0, Math.min(1, pct / 100));
    const p1 = this.curvePoints[0];
    const p2 = this.curvePoints[this.curvePoints.length - 1];

    const currX = p1.x + (p2.x - p1.x) * t;
    const currZ = p1.z + (p2.z - p1.z) * t;
    const r = Math.sqrt(currX * currX + currZ * currZ);
    const currY = Math.sin(currX * 0.45) * Math.cos(currZ * 0.45) * 2.8 +
                  Math.sin(r * 0.6) * 1.5 +
                  (currX * currX + currZ * currZ) * 0.015 - 2.5 + 0.6;

    this.marker.position.set(currX, currY, currZ);
    this.markerLight.position.copy(this.marker.position);
  }

  setupOrbit() {
    let isDragging = false;
    let prev = { x: 0, y: 0 };

    this.container.addEventListener('mousedown', (e) => {
      isDragging = true;
      prev = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    this.container.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      prev = { x: e.clientX, y: e.clientY };

      this.scene.rotation.y += dx * 0.008;
    });
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  setTheme(theme) {
    this.theme = theme;
    const isWhite = theme === 'white';
    if (this.scene) {
      this.scene.background = new THREE.Color(isWhite ? 0xffffff : 0x0a0f1d);
    }
  }

  animate() {
    this.animId = requestAnimationFrame(() => this.animate());
    if (this.scene) {
      this.scene.rotation.y += 0.0015;
    }
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  dispose() {
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

window.QuboLandscape3D = QuboLandscape3D;
