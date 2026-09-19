// High-Fidelity Interactive 3D Earth Globe Engine using Three.js
// Procedural textures for Continents, Specular Oceans, Night Urban Lights, Clouds & Rayleigh Atmosphere

class TrafficEarth3D {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = options;
    this.theme = options.theme || 'white';
    this.onSelectCity = options.onSelectCity || null;
    this.active = true;
    this.cityMarkers = [];
    this.selectedCityId = window.currentCityId || 'coimbatore';

    this.init();
  }

  init() {
    if (!this.container) return;

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 500;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.applyTheme(this.theme);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    this.camera.position.set(0, 40, 210);

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 3. Lighting
    this.setupLighting();

    // 4. Earth Globe Group
    this.earthGroup = new THREE.Group();
    this.scene.add(this.earthGroup);

    // 5. Earth Meshes: Base, Night Lights, Clouds, Atmosphere
    this.buildEarthGlobe();
    this.buildAtmosphere();
    this.buildClouds();
    this.buildCityBeacons();
    this.buildOrbitalSatellites();

    // 6. Interaction & Mouse Controls (Orbit-like dragging)
    this.setupControls();

    // 7. Raycasting for City Marker Clicks
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.setupMarkerInteraction();

    // 8. Resize Listener
    this.resizeHandler = () => this.onResize();
    window.addEventListener('resize', this.resizeHandler);

    // 9. Initial orientation to default city
    this.rotateToCity(this.selectedCityId, false);

    // 10. Animation Loop
    this.clock = new THREE.Clock();
    this.animate();
  }

  applyTheme(theme) {
    this.theme = theme;
    if (theme === 'white') {
      this.scene.background = new THREE.Color(0xf8fafc);
      if (this.starsMesh) this.starsMesh.visible = false;
    } else {
      this.scene.background = new THREE.Color(0x050811);
      if (this.starsMesh) this.starsMesh.visible = true;
    }
  }

  setTheme(theme) {
    this.applyTheme(theme);
    if (this.ambientLight) {
      this.ambientLight.intensity = theme === 'white' ? 1.4 : 0.8;
      this.ambientLight.color.setHex(theme === 'white' ? 0xffffff : 0x1e293b);
    }
    if (this.sunLight) {
      this.sunLight.intensity = theme === 'white' ? 1.6 : 1.3;
    }
  }

  setupLighting() {
    const isWhite = this.theme === 'white';
    this.ambientLight = new THREE.AmbientLight(isWhite ? 0xffffff : 0x1e293b, isWhite ? 1.4 : 0.8);
    this.scene.add(this.ambientLight);

    // Directional Sun Light
    this.sunLight = new THREE.DirectionalLight(0xfff7e6, isWhite ? 1.6 : 1.3);
    this.sunLight.position.set(160, 90, 140);
    this.scene.add(this.sunLight);

    // Deep space rim backlight
    this.backLight = new THREE.DirectionalLight(0x00d0f5, 0.6);
    this.backLight.position.set(-160, -80, -120);
    this.scene.add(this.backLight);
  }

  // Generate crisp procedural Earth textures
  generateEarthTextures() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 1. Deep Ocean base
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    oceanGrad.addColorStop(0, '#0f3156');
    oceanGrad.addColorStop(0.3, '#0d2847');
    oceanGrad.addColorStop(0.5, '#0a1e36');
    oceanGrad.addColorStop(0.7, '#0d2847');
    oceanGrad.addColorStop(1, '#0f3156');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Continents (Approximated high-res landmass geography)
    ctx.fillStyle = '#22553b'; // Lush continental green
    this.drawWorldLandmasses(ctx, canvas.width, canvas.height);

    const earthTexture = new THREE.CanvasTexture(canvas);
    earthTexture.wrapS = THREE.RepeatWrapping;
    earthTexture.wrapT = THREE.ClampToEdgeWrapping;

    // 3. Night lights texture (Urban illumination)
    const nightCanvas = document.createElement('canvas');
    nightCanvas.width = 2048;
    nightCanvas.height = 1024;
    const nctx = nightCanvas.getContext('2d');
    nctx.fillStyle = '#000000';
    nctx.fillRect(0, 0, nightCanvas.width, nightCanvas.height);
    this.drawNightCityClusters(nctx, nightCanvas.width, nightCanvas.height);

    const nightTexture = new THREE.CanvasTexture(nightCanvas);
    nightTexture.wrapS = THREE.RepeatWrapping;
    nightTexture.wrapT = THREE.ClampToEdgeWrapping;

    // 4. Cloud texture
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 2048;
    cloudCanvas.height = 1024;
    const cctx = cloudCanvas.getContext('2d');
    cctx.fillStyle = 'rgba(0,0,0,0)';
    cctx.fillRect(0, 0, cloudCanvas.width, cloudCanvas.height);
    this.drawProceduralClouds(cctx, cloudCanvas.width, cloudCanvas.height);

    const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
    cloudTexture.wrapS = THREE.RepeatWrapping;
    cloudTexture.wrapT = THREE.ClampToEdgeWrapping;

    return { earthTexture, nightTexture, cloudTexture };
  }

  drawWorldLandmasses(ctx, W, H) {
    const x = (lon) => ((lon + 180) / 360) * W;
    const y = (lat) => ((90 - lat) / 180) * H;

    // Helper: draw blob
    const drawBlob = (lon, lat, rx, ry, color) => {
      ctx.fillStyle = color || '#2d5a3f';
      ctx.beginPath();
      ctx.ellipse(x(lon), y(lat), (rx / 360) * W, (ry / 180) * H, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    // North America
    drawBlob(-100, 50, 45, 25, '#3b6e4e');
    drawBlob(-120, 60, 30, 18, '#477859');
    drawBlob(-85, 38, 25, 18, '#3b6e4e');
    drawBlob(-105, 32, 20, 14, '#6b6645'); // Southwest desert

    // South America
    drawBlob(-60, -10, 24, 26, '#285834');
    drawBlob(-65, -35, 15, 22, '#416348');

    // Europe
    drawBlob(15, 52, 25, 16, '#3c6e4e');
    drawBlob(-5, 55, 12, 12, '#3c6e4e'); // UK
    drawBlob(30, 60, 30, 16, '#2f5a3b');

    // Africa
    drawBlob(20, 10, 35, 32, '#7a6a43'); // Sahara / Sahel
    drawBlob(25, -15, 22, 25, '#2f5a3b'); // Central & Southern Africa

    // Asia & India
    drawBlob(90, 55, 60, 25, '#345e3f'); // Siberia / Central
    drawBlob(80, 22, 22, 18, '#3d7249'); // Indian Subcontinent
    drawBlob(105, 32, 35, 22, '#3c6f4b'); // East Asia
    drawBlob(100, 10, 20, 16, '#285434'); // SE Asia

    // Australia
    drawBlob(135, -25, 25, 18, '#7e643c');

    // Coastline highlights
    ctx.strokeStyle = '#4e8264';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  drawNightCityClusters(ctx, W, H) {
    const x = (lon) => ((lon + 180) / 360) * W;
    const y = (lat) => ((90 - lat) / 180) * H;

    const drawCityCluster = (lon, lat, radius, count, color) => {
      const cx = x(lon);
      const cy = y(lat);

      // Core glow
      const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, radius * 1.8);
      grad.addColorStop(0, color || 'rgba(255, 220, 120, 0.95)');
      grad.addColorStop(0.4, 'rgba(255, 180, 60, 0.6)');
      grad.addColorStop(1, 'rgba(255, 140, 20, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Point clusters
      ctx.fillStyle = '#fff4cc';
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius;
        const px = cx + Math.cos(ang) * dist;
        const py = cy + Math.sin(ang) * dist;
        const size = Math.random() * 2.2 + 0.8;
        ctx.fillRect(px, py, size, size);
      }
    };

    // Major global metropolitan light corridors
    drawCityCluster(76.95, 11.01, 14, 25); // Coimbatore
    drawCityCluster(77.59, 12.97, 20, 45); // Bengaluru
    drawCityCluster(80.27, 13.08, 18, 40); // Chennai
    drawCityCluster(72.87, 19.07, 22, 50); // Mumbai
    drawCityCluster(77.20, 28.61, 24, 55); // Delhi
    drawCityCluster(103.81, 1.35, 16, 35); // Singapore
    drawCityCluster(139.65, 35.67, 26, 65); // Tokyo
    drawCityCluster(-0.12, 51.50, 24, 60); // London
    drawCityCluster(-74.00, 40.71, 26, 65); // New York
    drawCityCluster(-122.41, 37.77, 20, 45); // San Francisco
    drawCityCluster(55.27, 25.20, 18, 40); // Dubai
    drawCityCluster(2.35, 48.85, 22, 50); // Paris
  }

  drawProceduralClouds(ctx, W, H) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let i = 0; i < 90; i++) {
      const cx = Math.random() * W;
      const cy = (Math.random() * 0.7 + 0.15) * H;
      const rx = Math.random() * 90 + 30;
      const ry = Math.random() * 25 + 10;
      const alpha = Math.random() * 0.35 + 0.15;

      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, rx);
      grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      grad.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.5})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, (Math.random() - 0.5) * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  buildEarthGlobe() {
    const { earthTexture, nightTexture, cloudTexture } = this.generateEarthTextures();
    this.cloudTexture = cloudTexture;

    // Earth Sphere Geometry
    const earthRadius = 60;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);

    // High fidelity material with night lights emission
    this.earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.7,
      metalness: 0.15,
      emissiveMap: nightTexture,
      emissive: new THREE.Color(0xffd700),
      emissiveIntensity: 0.85
    });

    this.earthMesh = new THREE.Mesh(earthGeo, this.earthMat);
    this.earthMesh.rotation.y = -Math.PI / 2; // Align 0 lon
    this.earthGroup.add(this.earthMesh);
  }

  buildClouds() {
    const cloudRadius = 60.8;
    const cloudGeo = new THREE.SphereGeometry(cloudRadius, 64, 64);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: this.cloudTexture,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      roughness: 1.0
    });

    this.cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    this.cloudMesh.rotation.y = -Math.PI / 2;
    this.earthGroup.add(this.cloudMesh);
  }

  buildAtmosphere() {
    // Rayleigh scattering atmospheric halo
    const atmosRadius = 61.6;
    const atmosGeo = new THREE.SphereGeometry(atmosRadius, 64, 64);

    // Fresnel atmospheric glow shader
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.72 - dot(vNormal, vec3(0, 0, 1.0)), 2.2);
          gl_FragColor = vec4(0.0, 0.75, 1.0, 1.0) * intensity * 1.35;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });

    this.atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    this.earthGroup.add(this.atmosMesh);
  }

  latLonToVector3(lat, lon, radius = 60) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  }

  buildCityBeacons() {
    this.cityMarkers = [];
    const cities = window.GLOBAL_CITIES || {};

    Object.values(cities).forEach(city => {
      const pos = this.latLonToVector3(city.lat, city.lon, 60.5);
      const isSelected = city.id === this.selectedCityId;

      // Group for this beacon
      const beaconGroup = new THREE.Group();
      beaconGroup.position.copy(pos);
      beaconGroup.lookAt(new THREE.Vector3(0, 0, 0)); // Align with surface normal
      beaconGroup.userData = { cityId: city.id, cityName: city.name, country: city.country };

      // 1. Base ring
      const ringGeo = new THREE.RingGeometry(0.8, 1.4, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0x00d0f5 : 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      beaconGroup.add(ringMesh);

      // 2. Pulsing wave ring
      const pulseGeo = new THREE.RingGeometry(1.4, 2.2, 32);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: 0x00d0f5,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5
      });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      beaconGroup.add(pulseMesh);

      // 3. Vertical laser pillar pin
      const pinGeo = new THREE.CylinderGeometry(0.2, 0.2, 6, 16);
      const pinMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0x00d0f5 : 0xa855f7,
        transparent: true,
        opacity: 0.9
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.rotation.x = Math.PI / 2;
      pinMesh.position.z = -3;
      beaconGroup.add(pinMesh);

      // 4. Glowing top beacon sphere
      const sphereGeo = new THREE.SphereGeometry(0.7, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0xffffff : 0x00d0f5
      });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.position.z = -6;
      beaconGroup.add(sphereMesh);

      this.earthGroup.add(beaconGroup);
      this.cityMarkers.push({
        cityId: city.id,
        group: beaconGroup,
        pulseMesh,
        sphereMesh,
        lat: city.lat,
        lon: city.lon
      });
    });
  }

  buildOrbitalSatellites() {
    this.satellites = [];
    const satGeo = new THREE.BoxGeometry(0.8, 0.4, 1.2);
    const satMat = new THREE.MeshBasicMaterial({ color: 0x00d0f5 });

    for (let i = 0; i < 4; i++) {
      const sat = new THREE.Mesh(satGeo, satMat);
      const angle = (i * Math.PI) / 2;
      const radius = 78 + i * 4;
      sat.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 30, Math.sin(angle) * radius);
      this.scene.add(sat);
      this.satellites.push({ mesh: sat, angle, speed: 0.003 + i * 0.001, radius });
    }
  }

  setupControls() {
    this.isDragging = false;
    this.prevMousePos = { x: 0, y: 0 };
    this.rotationVelocity = { x: 0, y: 0.001 }; // subtle idle drift

    const dom = this.renderer.domElement;

    dom.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.prevMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.prevMousePos.x;
      const dy = e.clientY - this.prevMousePos.y;

      this.rotationVelocity.y = dx * 0.004;
      this.rotationVelocity.x = dy * 0.004;

      this.earthGroup.rotation.y += this.rotationVelocity.y;
      this.earthGroup.rotation.x += this.rotationVelocity.x;

      // Clamp vertical tilt
      this.earthGroup.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.earthGroup.rotation.x));

      this.prevMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Zoom on wheel
    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomSpeed = 0.08;
      this.camera.position.z += e.deltaY * zoomSpeed;
      this.camera.position.z = Math.max(90, Math.min(320, this.camera.position.z));
    }, { passive: false });
  }

  setupMarkerInteraction() {
    const dom = this.renderer.domElement;

    dom.addEventListener('click', (e) => {
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);

      // Check click on city markers
      const markerObjects = this.cityMarkers.map(m => m.group);
      const intersects = this.raycaster.intersectObjects(markerObjects, true);

      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj.parent && !obj.userData.cityId) {
          obj = obj.parent;
        }

        if (obj.userData && obj.userData.cityId) {
          const cityId = obj.userData.cityId;
          this.selectCity(cityId);
        }
      }
    });
  }

  selectCity(cityId) {
    this.selectedCityId = cityId;
    this.rotateToCity(cityId, true);

    if (this.onSelectCity) {
      this.onSelectCity(cityId);
    }
  }

  rotateToCity(cityId, animate = true) {
    const city = (window.GLOBAL_CITIES && window.GLOBAL_CITIES[cityId]) || null;
    if (!city) return;

    // Calculate target rotation so (lat, lon) faces the camera (z-axis)
    const targetY = -((city.lon + 90) * Math.PI) / 180;
    const targetX = (city.lat * Math.PI) / 180 * 0.45;

    if (!animate) {
      this.earthGroup.rotation.y = targetY;
      this.earthGroup.rotation.x = targetX;
      return;
    }

    this.targetRotation = { y: targetY, x: targetX };
  }

  // Cinematic Earth-to-City Zoom Transition
  zoomToCity(cityId, onComplete) {
    this.rotateToCity(cityId, true);

    const startZ = this.camera.position.z;
    const targetZ = 68; // drops deep into the upper atmosphere
    const startTime = performance.now();
    const duration = 1800; // 1.8s cinematic drop

    const animateZoom = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      // Cubic ease-in-out
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      this.camera.position.z = startZ + (targetZ - startZ) * ease;

      if (progress < 1.0) {
        requestAnimationFrame(animateZoom);
      } else {
        if (onComplete) onComplete();
      }
    };

    requestAnimationFrame(animateZoom);
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 500;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    if (!this.active) return;
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    // 1. Slow Earth idle rotation when not dragging
    if (!this.isDragging && !this.targetRotation) {
      this.earthGroup.rotation.y += 0.001;
    }

    // 2. Smooth interpolate to target city rotation if commanded
    if (this.targetRotation) {
      this.earthGroup.rotation.y += (this.targetRotation.y - this.earthGroup.rotation.y) * 0.06;
      this.earthGroup.rotation.x += (this.targetRotation.x - this.earthGroup.rotation.x) * 0.06;

      if (
        Math.abs(this.targetRotation.y - this.earthGroup.rotation.y) < 0.001 &&
        Math.abs(this.targetRotation.x - this.earthGroup.rotation.x) < 0.001
      ) {
        this.targetRotation = null;
      }
    }

    // 3. Clouds dynamic slow rotation
    if (this.cloudMesh) {
      this.cloudMesh.rotation.y += 0.0004;
    }

    // 4. Pulse beacon rings
    const time = this.clock.getElapsedTime();
    this.cityMarkers.forEach((m, idx) => {
      const pulseScale = 1.0 + Math.sin(time * 3 + idx) * 0.25;
      m.pulseMesh.scale.set(pulseScale, pulseScale, 1);
      m.pulseMesh.material.opacity = 0.6 - (pulseScale - 1.0) * 0.8;
    });

    // 5. Orbit satellites
    if (this.satellites) {
      this.satellites.forEach(sat => {
        sat.angle += sat.speed;
        sat.mesh.position.x = Math.cos(sat.angle) * sat.radius;
        sat.mesh.position.z = Math.sin(sat.angle) * sat.radius;
        sat.mesh.rotation.y += 0.02;
      });
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.active = false;
    window.removeEventListener('resize', this.resizeHandler);

    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    if (this.scene) {
      this.scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    }
  }
}

window.TrafficEarth3D = TrafficEarth3D;
