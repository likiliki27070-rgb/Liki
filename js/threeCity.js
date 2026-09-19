// 3D Digital Twin City Simulator using Three.js (Supports White & Dark theme)

class TrafficCity3D {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = options;
    this.theme = options.theme || 'white'; // default to white
    this.activeLayers = {
      density: true,
      queues: true,
      emergency: true,
      flow: false,
      timers: true
    };

    this.selectedIntersection = null;
    this.cameraPreset = 'overview';
    this.targetCameraPos = null;
    this.targetLookAt = new THREE.Vector3(0, 0, 0);
    this.currentLookAt = new THREE.Vector3(0, 0, 0);

    this.init();
  }

  init() {
    if (!this.container) return;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.applyThemeColors(this.theme);

    // 2. Camera
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 500;
    this.camera = new THREE.PerspectiveCamera(42, width / height, 1, 1000);
    this.setCameraPreset('overview', false);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lights & Dynamic Visual Assets
    this.timeOfDay = 'day'; // 'day' | 'dusk' | 'night'
    this.treeCanopies = [];
    this.streetLights = [];
    this.groundLightPools = [];
    this.antennaLights = [];
    this.texArrowLeft = this.generateArrowTexture('left');
    this.texArrowStraight = this.generateArrowTexture('straight');
    this.texArrowRight = this.generateArrowTexture('right');
    this.setupLighting();

    // 5. Environment & City Geometry
    this.buildCity();
    this.buildRoads();
    this.buildGroundZones();
    this.buildTrees();
    this.buildStreetLights();
    this.buildSignals();
    this.buildIncidents();
    this.buildHolographicLayers();
    this.buildOptimizationBanner();

    // 6. Vehicle Assets & Corner Railway Viaduct
    this.initVehicleAssets();
    this.buildRailway();

    // 7. Vehicle Meshes & Paramedic Ambulance
    this.vehicleMeshes = new Map();
    this.ambulanceMesh = null;
    this.buildAmbulance();

    // 7. Mouse / Raycasting interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.setupInteractions();

    // 8. Resize Listener
    window.addEventListener('resize', () => this.onResize());

    // 9. Render Loop
    this.lastTime = performance.now();
    this.animate();
  }

  generateWindowTexture(type = 'office') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0b121e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (type === 'residential') {
      // Individual punched window pattern for residential apartments
      const cols = 12;
      const rows = 20;
      const padX = 14;
      const padY = 10;
      const w = (canvas.width - (cols + 1) * padX) / cols;
      const h = (canvas.height - (rows + 1) * padY) / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = padX + c * (w + padX);
          const y = padY + r * (h + padY);
          const rand = Math.random();
          if (rand > 0.40) {
            ctx.fillStyle = rand > 0.70 ? '#fed7aa' : '#f59e0b';
          } else {
            ctx.fillStyle = '#111827';
          }
          ctx.fillRect(x, y, w, h);
        }
      }
    } else if (type === 'tech') {
      // High-tech cyan matrix panels
      const cols = 18;
      const rows = 28;
      const padX = 6;
      const padY = 4;
      const w = (canvas.width - (cols + 1) * padX) / cols;
      const h = (canvas.height - (rows + 1) * padY) / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = padX + c * (w + padX);
          const y = padY + r * (h + padY);
          const rand = Math.random();
          if (rand > 0.35) {
            ctx.fillStyle = rand > 0.65 ? '#38bdf8' : '#0284c7';
          } else {
            ctx.fillStyle = '#0f172a';
          }
          ctx.fillRect(x, y, w, h);
        }
      }
    } else if (type === 'hospital') {
      // Clean horizontal medical ribbons
      const rows = 16;
      const h = 18;
      const padY = 14;
      for (let r = 0; r < rows; r++) {
        const y = r * (h + padY) + 8;
        ctx.fillStyle = (r % 3 === 0) ? '#a7f3d0' : '#e0f2fe';
        ctx.fillRect(16, y, canvas.width - 32, h);
      }
    } else {
      // Office curtain wall ribbons with vertical mullions
      const cols = 16;
      const rows = 24;
      const padX = 8;
      const padY = 6;
      const w = (canvas.width - (cols + 1) * padX) / cols;
      const h = (canvas.height - (rows + 1) * padY) / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = padX + c * (w + padX);
          const y = padY + r * (h + padY);
          const rand = Math.random();
          if (rand > 0.42) {
            ctx.fillStyle = rand > 0.70 ? '#fde68a' : '#e2e8f0';
          } else {
            ctx.fillStyle = '#0f172a';
          }
          ctx.fillRect(x, y, w, h);
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 4);
    return tex;
  }

  generateArrowTexture(type = 'straight') {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);

    ctx.strokeStyle = '#f8fafc';
    ctx.fillStyle = '#f8fafc';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (type === 'left') {
      // Left curved turn arrow
      ctx.beginPath();
      ctx.moveTo(76, 112);
      ctx.lineTo(76, 68);
      ctx.quadraticCurveTo(76, 38, 42, 38);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(50, 18);
      ctx.lineTo(22, 38);
      ctx.lineTo(50, 58);
      ctx.closePath();
      ctx.fill();
    } else if (type === 'right') {
      // Right curved turn arrow
      ctx.beginPath();
      ctx.moveTo(52, 112);
      ctx.lineTo(52, 68);
      ctx.quadraticCurveTo(52, 38, 86, 38);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(78, 18);
      ctx.lineTo(106, 38);
      ctx.lineTo(78, 58);
      ctx.closePath();
      ctx.fill();
    } else {
      // Straight lane arrow
      ctx.beginPath();
      ctx.moveTo(64, 112);
      ctx.lineTo(64, 38);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(38, 46);
      ctx.lineTo(64, 18);
      ctx.lineTo(90, 46);
      ctx.closePath();
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  applyThemeColors(theme) {
    this.theme = theme;
    if (theme === 'white') {
      this.scene.background = new THREE.Color(0xf8fafc);
      this.scene.fog = new THREE.FogExp2(0xf8fafc, 0.0025);
    } else {
      this.scene.background = new THREE.Color(0x070b16);
      this.scene.fog = new THREE.FogExp2(0x070b16, 0.005);
    }
  }

  setTheme(theme) {
    this.applyThemeColors(theme);
    const isWhite = theme === 'white';

    if (this.groundMesh) {
      this.groundMesh.material.color.setHex(isWhite ? 0xf8fafc : 0x090e1a);
    }

    if (this.gridHelper) {
      this.scene.remove(this.gridHelper);
      this.gridHelper = new THREE.GridHelper(
        240,
        60,
        isWhite ? 0xcbd5e1 : 0x1e293b,
        isWhite ? 0xe2e8f0 : 0x0f172a
      );
      this.gridHelper.position.y = 0.05;
      this.scene.add(this.gridHelper);
    }

    if (this.ambientLight) {
      this.ambientLight.color.setHex(isWhite ? 0xffffff : 0x334155);
      this.ambientLight.intensity = isWhite ? 1.4 : 1.5;
    }

    if (this.dirLight) {
      this.dirLight.color.setHex(isWhite ? 0xffffff : 0x94a3b8);
      this.dirLight.intensity = isWhite ? 1.2 : 1.0;
    }

    // Update building materials for dynamic night illumination
    if (this.buildingMaterials) {
      this.buildingMaterials.forEach(mat => {
        if (mat.emissive) {
          mat.emissiveIntensity = isWhite ? 0.04 : 0.85;
        }
      });
    }

    // Update street lamp pools
    if (this.streetLamps) {
      this.streetLamps.forEach(lamp => {
        lamp.intensity = isWhite ? 0.3 : 1.4;
      });
    }
  }

  setupLighting() {
    const isWhite = this.theme === 'white';
    this.ambientLight = new THREE.AmbientLight(isWhite ? 0xffffff : 0x334155, isWhite ? 1.4 : 1.5);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(isWhite ? 0xffffff : 0x94a3b8, isWhite ? 1.2 : 1.0);
    this.dirLight.position.set(50, 80, 40);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 220;
    this.dirLight.shadow.camera.left = -70;
    this.dirLight.shadow.camera.right = 70;
    this.dirLight.shadow.camera.top = 70;
    this.dirLight.shadow.camera.bottom = -70;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    this.purpleAccent = new THREE.PointLight(isWhite ? 0x0284c7 : 0x8b5cf6, isWhite ? 0.8 : 1.6, 90);
    this.purpleAccent.position.set(0, 18, 0);
    this.scene.add(this.purpleAccent);

    // Warm street lamps array for nighttime intersection illumination
    this.streetLamps = [];
    const intersections = (window.TRAFFIC_DATA && window.TRAFFIC_DATA.intersections) || [];
    intersections.forEach(node => {
      const lamp = new THREE.PointLight(0xffedd5, isWhite ? 0.3 : 1.4, 30);
      lamp.position.set(node.x, 6.0, node.z);
      this.scene.add(lamp);
      this.streetLamps.push(lamp);
    });
  }

  buildCity() {
    const isWhite = this.theme === 'white';
    this.texOffice = this.generateWindowTexture('office');
    this.texResidential = this.generateWindowTexture('residential');
    this.texTech = this.generateWindowTexture('tech');
    this.texHospital = this.generateWindowTexture('hospital');
    this.windowTex = this.texOffice;

    // Ground Plane (Expanded Footprint)
    const groundGeo = new THREE.PlaneGeometry(260, 220);
    const groundMat = new THREE.MeshStandardMaterial({
      color: isWhite ? 0xf8fafc : 0x090e1a,
      roughness: 0.9,
      metalness: 0.1
    });
    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    // Ground Grid Wireframe
    this.gridHelper = new THREE.GridHelper(
      240,
      60,
      isWhite ? 0xcbd5e1 : 0x1e293b,
      isWhite ? 0xe2e8f0 : 0x0f172a
    );
    this.gridHelper.position.y = 0.05;
    this.scene.add(this.gridHelper);

    // Architectural PBR Materials
    const matLimestone = new THREE.MeshStandardMaterial({
      color: isWhite ? 0xf1f5f9 : 0x334155,
      roughness: 0.75,
      metalness: 0.15
    });

    const matBronzeGlass = new THREE.MeshStandardMaterial({
      color: isWhite ? 0xf8fafc : 0x1c1917,
      roughness: 0.18,
      metalness: 0.85,
      emissiveMap: this.texOffice,
      emissive: new THREE.Color(0xf59e0b),
      emissiveIntensity: isWhite ? 0.04 : 0.85
    });

    const matCyanGlass = new THREE.MeshStandardMaterial({
      color: isWhite ? 0xf0f9ff : 0x0c1e36,
      roughness: 0.12,
      metalness: 0.88,
      emissiveMap: this.texTech,
      emissive: new THREE.Color(0x38bdf8),
      emissiveIntensity: isWhite ? 0.04 : 0.85,
      transparent: true,
      opacity: 0.94
    });

    const matResidential = new THREE.MeshStandardMaterial({
      color: isWhite ? 0xfafaf9 : 0x292524,
      roughness: 0.65,
      metalness: 0.20,
      emissiveMap: this.texResidential,
      emissive: new THREE.Color(0xfde68a),
      emissiveIntensity: isWhite ? 0.04 : 0.80
    });

    const matHospital = new THREE.MeshStandardMaterial({
      color: isWhite ? 0xffffff : 0x1e293b,
      roughness: 0.45,
      metalness: 0.20,
      emissiveMap: this.texHospital,
      emissive: new THREE.Color(0xa7f3d0),
      emissiveIntensity: isWhite ? 0.04 : 0.75
    });

    const matRetail = new THREE.MeshStandardMaterial({
      color: isWhite ? 0xf1f5f9 : 0x1e293b,
      roughness: 0.35,
      metalness: 0.60,
      emissiveMap: this.texOffice,
      emissive: new THREE.Color(0xfde68a),
      emissiveIntensity: isWhite ? 0.04 : 0.85
    });

    const matCivic = new THREE.MeshStandardMaterial({
      color: isWhite ? 0xe2e8f0 : 0x475569,
      roughness: 0.85,
      metalness: 0.15
    });

    const matTowerGlass = new THREE.MeshStandardMaterial({
      color: isWhite ? 0xe0f2fe : 0x0369a1,
      roughness: 0.10,
      metalness: 0.88,
      emissiveMap: this.texTech,
      emissive: new THREE.Color(0x38bdf8),
      emissiveIntensity: isWhite ? 0.08 : 0.85,
      transparent: true,
      opacity: 0.92
    });

    const matTowerArmor = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.28,
      metalness: 0.85
    });

    const matTowerAccent = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: new THREE.Color(0x0284c7),
      emissiveIntensity: 1.6,
      roughness: 0.2
    });

    const matDeckFloor = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.4
    });

    this.matTowerGlass = matTowerGlass;
    this.matTowerArmor = matTowerArmor;
    this.matTowerAccent = matTowerAccent;
    this.matDeckFloor = matDeckFloor;

    this.matMech = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.65, metalness: 0.45 });
    this.matParapet = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8, metalness: 0.2 });
    this.matSolar = new THREE.MeshStandardMaterial({ color: 0x172554, roughness: 0.2, metalness: 0.8 });
    this.matBalcony = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.5, metalness: 0.5 });
    this.matAntenna = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.85 });

    this.buildingMaterials = [matLimestone, matBronzeGlass, matCyanGlass, matHospital, matResidential, matRetail, matCivic, matTowerGlass];

    // 22 Distinct Urban Building Blocks mapped to 8 Architectural Typologies
    const buildingBlocks = [
      // Northwest quadrant
      { x: -50, z: -35, w: 16, h: 26, d: 14, type: 4 }, // Retail Streetfront
      { x: -50, z: -10, w: 14, h: 36, d: 14, type: 1 }, // Corporate Office Complex
      { x: -16, z: -35, w: 14, h: 22, d: 12, type: 2 }, // Residential High-Rise
      { x: -68, z: -25, w: 14, h: 32, d: 16, type: 0 }, // Commercial Skyscraper
      // Northeast quadrant
      { x: 16, z: -35, w: 14, h: 24, d: 12, type: 5 }, // Institutional / Civic Hall
      { x: 50, z: -35, w: 14, h: 32, d: 14, type: 6 }, // Tech Innovation Hub
      { x: 50, z: -10, w: 16, h: 42, d: 16, type: 1 }, // Corporate Office Tower
      { x: 68, z: -25, w: 14, h: 38, d: 16, type: 0 }, // Commercial Skyscraper
      // North Innovation Hub extension (around I7)
      { x: -28, z: -56, w: 18, h: 36, d: 14, type: 6 }, // Tech Hub North
      { x: 28, z: -56, w: 18, h: 42, d: 14, type: 1 }, // Corporate North
      { x: 0, z: -64, w: 22, h: 50, d: 16, type: 0 }, // North Central Skyscraper
      // Southwest quadrant
      { x: -50, z: 12, w: 14, h: 20, d: 14, type: 4 }, // Retail Shops Southwest
      { x: -50, z: 35, w: 16, h: 24, d: 14, type: 2 }, // Residential Apartments
      { x: -16, z: 35, w: 14, h: 18, d: 12, type: 5 }, // Civic Pavilion
      { x: -68, z: 20, w: 14, h: 30, d: 16, type: 2 }, // Residential Tower
      // Southeast quadrant (Medical Center & Tech blocks)
      { x: 16, z: 35, w: 14, h: 22, d: 12, type: 2 }, // Residential High-Rise
      { x: 50, z: 12, w: 16, h: 30, d: 14, type: 6 }, // Tech Labs Southeast
      { x: 50, z: 35, w: 18, h: 38, d: 16, type: 3 }, // Medical Center Hospital Tower
      { x: 68, z: 20, w: 14, h: 36, d: 16, type: 0 }, // Commercial Tower East
      // South Grand Central Terminal extension (around I8)
      { x: -28, z: 56, w: 18, h: 34, d: 14, type: 1 }, // Corporate South
      { x: 28, z: 56, w: 18, h: 40, d: 14, type: 6 }, // Tech South
      { x: 0, z: 64, w: 22, h: 86, d: 18, type: 7 } // Avengers Tower-Style Landmark
    ];

    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: isWhite ? 0xe2e8f0 : 0x1e293b,
      roughness: 0.9
    });

    buildingBlocks.forEach(b => {
      // 1. Sidewalk Pedestal
      const sideGeo = new THREE.BoxGeometry(b.w + 2.6, 0.35, b.d + 2.6);
      const sideMesh = new THREE.Mesh(sideGeo, sidewalkMat);
      sideMesh.position.set(b.x, 0.17, b.z);
      sideMesh.receiveShadow = true;
      this.scene.add(sideMesh);

      // 2. Dispatch to 8 Specialized Architectural Typologies
      if (b.type === 0) {
        this.buildCommercialSkyscraper(b, matCyanGlass, matLimestone);
      } else if (b.type === 1) {
        this.buildCorporateComplex(b, matBronzeGlass, matLimestone);
      } else if (b.type === 2) {
        this.buildResidentialTower(b, matResidential, matLimestone);
      } else if (b.type === 3) {
        this.buildHospitalTower(b, matHospital, matLimestone);
      } else if (b.type === 4) {
        this.buildRetailStreetfront(b, matRetail, matLimestone);
      } else if (b.type === 5) {
        this.buildCivicHall(b, matCivic, matLimestone);
      } else if (b.type === 6) {
        this.buildTechHub(b, matCyanGlass, matLimestone);
      } else {
        this.buildAvengersTower(b, matTowerGlass, matTowerArmor, matTowerAccent, matDeckFloor);
      }
    });
  }

  addRooftopEquipment(b, roofY, options = {}) {
    const pMat = this.matParapet;
    const pThick = 0.35;
    const pHeight = 0.8;

    // Perimeter Parapet Walls
    [-b.d / 2 + pThick / 2, b.d / 2 - pThick / 2].forEach(pz => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(b.w, pHeight, pThick), pMat);
      wall.position.set(b.x, roofY + pHeight / 2, b.z + pz);
      this.scene.add(wall);
    });
    [-b.w / 2 + pThick / 2, b.w / 2 - pThick / 2].forEach(px => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(pThick, pHeight, Math.max(0.5, b.d - pThick * 2)), pMat);
      wall.position.set(b.x + px, roofY + pHeight / 2, b.z);
      this.scene.add(wall);
    });

    // Elevator Penthouse
    if (options.penthouse) {
      const ph = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.32, 3.2, b.d * 0.32), this.matMech);
      ph.position.set(b.x - b.w * 0.15, roofY + 1.6, b.z - b.d * 0.15);
      ph.castShadow = true;
      ph.receiveShadow = true;
      this.scene.add(ph);
    }

    // HVAC Chillers
    if (options.hvac) {
      const hvac = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.4, 2.2), this.matMech);
      hvac.position.set(b.x + b.w * 0.2, roofY + 0.7, b.z + b.d * 0.15);
      hvac.castShadow = true;
      this.scene.add(hvac);

      [-0.9, 0.9].forEach(fx => {
        const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.18, 12), this.matParapet);
        fan.position.set(b.x + b.w * 0.2 + fx, roofY + 1.45, b.z + b.d * 0.15);
        this.scene.add(fan);
      });
    }

    // Industrial Cylindrical Cooling Tower
    if (options.coolingTower) {
      const ct = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 2.4, 12), this.matMech);
      ct.position.set(b.x + b.w * 0.18, roofY + 1.8, b.z);
      ct.castShadow = true;
      this.scene.add(ct);

      [-0.8, 0.8].forEach(lx => {
        [-0.8, 0.8].forEach(lz => {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 0.15), this.matParapet);
          leg.position.set(b.x + b.w * 0.18 + lx, roofY + 0.4, b.z + lz);
          this.scene.add(leg);
        });
      });
    }

    // Solar Panel Arrays
    if (options.solar) {
      for (let row = -1; row <= 1; row++) {
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(b.w * 0.55, 1.4), this.matSolar);
        panel.rotation.x = -Math.PI / 6;
        panel.position.set(b.x, roofY + 0.8, b.z + row * 2.2);
        this.scene.add(panel);
      }
    }

    // Communications Antenna Mast with Red Obstruction Light
    if (options.antenna) {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 8.5, 8), this.matAntenna);
      mast.position.set(b.x + b.w * 0.15, roofY + 4.25, b.z - b.d * 0.15);
      this.scene.add(mast);

      const redLed = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      redLed.position.set(b.x + b.w * 0.15, roofY + 8.5, b.z - b.d * 0.15);
      this.scene.add(redLed);

      const light = new THREE.PointLight(0xef4444, 2.0, 18);
      light.position.set(b.x + b.w * 0.15, roofY + 8.6, b.z - b.d * 0.15);
      this.scene.add(light);
      this.antennaLights.push(light);
    }
  }

  buildCommercialSkyscraper(b, glassMat, stoneMat) {
    // 1. Base Podium with Ground Lobby
    const podH = b.h * 0.26;
    const pod = new THREE.Mesh(new THREE.BoxGeometry(b.w, podH, b.d), stoneMat);
    pod.position.set(b.x, 0.35 + podH / 2, b.z);
    pod.castShadow = true;
    pod.receiveShadow = true;
    this.scene.add(pod);

    // Ground entrance glass lobby
    const lobby = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.55, 3.2, 1.4), glassMat);
    lobby.position.set(b.x, 0.35 + 1.6, b.z + b.d / 2 + 0.5);
    this.scene.add(lobby);

    // Cantilevered entrance canopy
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.6, 0.2, 2.6), this.matMech);
    canopy.position.set(b.x, 3.5, b.z + b.d / 2 + 1.2);
    canopy.castShadow = true;
    this.scene.add(canopy);

    // 2. Stepped Tower Setback
    const towH = b.h * 0.74;
    const towW = b.w * 0.82;
    const towD = b.d * 0.82;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(towW, towH, towD), glassMat);
    tower.position.set(b.x, 0.35 + podH + towH / 2, b.z);
    tower.castShadow = true;
    tower.receiveShadow = true;
    this.scene.add(tower);

    // 3. Rooftop Equipment
    this.addRooftopEquipment({ x: b.x, z: b.z, w: towW, d: towD }, 0.35 + b.h, {
      penthouse: true,
      hvac: true,
      antenna: true
    });
  }

  buildCorporateComplex(b, bronzeMat, stoneMat) {
    // Main Tower Volume
    const mainD = b.d * 0.65;
    const main = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, mainD), bronzeMat);
    main.position.set(b.x, 0.35 + b.h / 2, b.z - b.d * 0.15);
    main.castShadow = true;
    main.receiveShadow = true;
    this.scene.add(main);

    // Attached Secondary Wing
    const wingH = b.h * 0.65;
    const wingW = b.w * 0.75;
    const wingD = b.d * 0.35;
    const wing = new THREE.Mesh(new THREE.BoxGeometry(wingW, wingH, wingD), stoneMat);
    wing.position.set(b.x, 0.35 + wingH / 2, b.z + b.d * 0.32);
    wing.castShadow = true;
    wing.receiveShadow = true;
    this.scene.add(wing);

    // Recessed Entrance Colonnade
    const col = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.5, 3.4, 1.4), stoneMat);
    col.position.set(b.x, 0.35 + 1.7, b.z + b.d * 0.32 + wingD / 2);
    this.scene.add(col);

    // Rooftop Equipment on Main Tower
    this.addRooftopEquipment({ x: b.x, z: b.z - b.d * 0.15, w: b.w, d: mainD }, 0.35 + b.h, {
      penthouse: true,
      coolingTower: true,
      hvac: true
    });
  }

  buildResidentialTower(b, resMat, stoneMat) {
    // Main Body
    const tower = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), resMat);
    tower.position.set(b.x, 0.35 + b.h / 2, b.z);
    tower.castShadow = true;
    tower.receiveShadow = true;
    this.scene.add(tower);

    // Cantilevered Balconies on Alternating Floors
    [6, 12, 18, 24].forEach(by => {
      if (by < b.h - 4) {
        const balc = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.6, 0.25, 1.4), this.matBalcony);
        balc.position.set(b.x, 0.35 + by, b.z + b.d / 2 + 0.7);
        balc.castShadow = true;
        this.scene.add(balc);
      }
    });

    // Ground entrance portico
    const portico = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.45, 0.2, 2.2), this.matMech);
    portico.position.set(b.x, 3.4, b.z + b.d / 2 + 1.0);
    this.scene.add(portico);

    // Rooftop Equipment (Solar arrays & penthouse)
    this.addRooftopEquipment(b, 0.35 + b.h, {
      penthouse: true,
      solar: true
    });
  }

  buildHospitalTower(b, hospMat, stoneMat) {
    // Main Hospital Structure
    const tower = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), hospMat);
    tower.position.set(b.x, 0.35 + b.h / 2, b.z);
    tower.castShadow = true;
    tower.receiveShadow = true;
    this.scene.add(tower);

    // Emergency Drop-off Canopy (High clearance for ambulances)
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.7, 0.3, 4.0), stoneMat);
    canopy.position.set(b.x, 4.2, b.z - b.d / 2 - 1.8);
    canopy.castShadow = true;
    this.scene.add(canopy);

    // Red Cross Emblem on Facade
    const crossMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const cross1 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.3, 0.25), crossMat);
    cross1.position.set(b.x - b.w / 2 - 0.12, 0.35 + b.h * 0.8, b.z);
    cross1.rotation.y = -Math.PI / 2;
    this.scene.add(cross1);

    const cross2 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 4.2, 0.25), crossMat);
    cross2.position.set(b.x - b.w / 2 - 0.12, 0.35 + b.h * 0.8, b.z);
    cross2.rotation.y = -Math.PI / 2;
    this.scene.add(cross2);

    // Rooftop Emergency Helipad Platform
    const pad = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.45, 9.0), this.matParapet);
    pad.position.set(b.x, 0.35 + b.h + 0.22, b.z);
    pad.receiveShadow = true;
    this.scene.add(pad);

    // Helipad Yellow Circle Ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(3.0, 3.4, 24),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(b.x, 0.35 + b.h + 0.46, b.z);
    this.scene.add(ring);

    // Helipad 'H' Decal
    const hBar1 = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 3.2), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    hBar1.rotation.x = -Math.PI / 2;
    hBar1.position.set(b.x - 1.1, 0.35 + b.h + 0.47, b.z);
    this.scene.add(hBar1);

    const hBar2 = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 3.2), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    hBar2.rotation.x = -Math.PI / 2;
    hBar2.position.set(b.x + 1.1, 0.35 + b.h + 0.47, b.z);
    this.scene.add(hBar2);

    const hCross = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.45), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    hCross.rotation.x = -Math.PI / 2;
    hCross.position.set(b.x, 0.35 + b.h + 0.47, b.z);
    this.scene.add(hCross);

    // 4 Perimeter Green Safety Lights
    [-4.2, 4.2].forEach(hx => {
      [-4.2, 4.2].forEach(hz => {
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
        beacon.position.set(b.x + hx, 0.35 + b.h + 0.55, b.z + hz);
        this.scene.add(beacon);
      });
    });

    this.addRooftopEquipment(b, 0.35 + b.h, { penthouse: true });
  }

  buildRetailStreetfront(b, retailMat, stoneMat) {
    const retH = b.h * 0.65;
    const ret = new THREE.Mesh(new THREE.BoxGeometry(b.w, retH, b.d), retailMat);
    ret.position.set(b.x, 0.35 + retH / 2, b.z);
    ret.castShadow = true;
    ret.receiveShadow = true;
    this.scene.add(ret);

    // Ground Floor Display Storefront Glass
    const store = new THREE.Mesh(new THREE.BoxGeometry(b.w - 0.4, 3.2, b.d + 0.2), this.matParapet);
    store.position.set(b.x, 0.35 + 1.6, b.z);
    this.scene.add(store);

    // Colorful Fabric Awning extending over sidewalk
    const awningMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.7 });
    const awning = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.85, 0.15, 1.8), awningMat);
    awning.rotation.x = 0.22;
    awning.position.set(b.x, 3.4, b.z + b.d / 2 + 0.8);
    awning.castShadow = true;
    this.scene.add(awning);

    this.addRooftopEquipment(b, 0.35 + retH, { penthouse: false, hvac: true });
  }

  buildCivicHall(b, civicMat, stoneMat) {
    const civH = b.h * 0.55;
    const civ = new THREE.Mesh(new THREE.BoxGeometry(b.w, civH, b.d), civicMat);
    civ.position.set(b.x, 0.35 + civH / 2, b.z);
    civ.castShadow = true;
    civ.receiveShadow = true;
    this.scene.add(civ);

    // Colonnade portico with 4 fluted columns
    for (let c = -1.5; c <= 1.5; c += 1.0) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, civH * 0.8, 8), stoneMat);
      col.position.set(b.x + c * (b.w * 0.22), 0.35 + (civH * 0.8) / 2, b.z + b.d / 2 + 1.0);
      col.castShadow = true;
      this.scene.add(col);
    }

    // Broad Monumental Entrance Steps
    const steps = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.8, 0.6, 2.6), stoneMat);
    steps.position.set(b.x, 0.35 + 0.3, b.z + b.d / 2 + 2.0);
    this.scene.add(steps);

    // Rooftop Flagpole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 6.5, 8), this.matAntenna);
    pole.position.set(b.x, 0.35 + civH + 3.25, b.z);
    this.scene.add(pole);

    this.addRooftopEquipment(b, 0.35 + civH, { penthouse: false });
  }

  buildTechHub(b, cyanMat, stoneMat) {
    const baseH = b.h * 0.32;
    const base = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.82, baseH, b.d * 0.82), stoneMat);
    base.position.set(b.x, 0.35 + baseH / 2, b.z);
    base.castShadow = true;
    base.receiveShadow = true;
    this.scene.add(base);

    // Dramatic Cantilevered Upper Box Volume
    const cantiH = b.h * 0.68;
    const canti = new THREE.Mesh(new THREE.BoxGeometry(b.w, cantiH, b.d), cyanMat);
    canti.position.set(b.x + 2.2, 0.35 + baseH + cantiH / 2, b.z);
    canti.castShadow = true;
    canti.receiveShadow = true;
    this.scene.add(canti);

    // Rooftop Satellite Dish Antenna
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 0.3, 0.6, 12), this.matAntenna);
    dish.rotation.z = Math.PI / 4;
    dish.position.set(b.x + 2.2, 0.35 + b.h + 1.2, b.z);
    this.scene.add(dish);

    this.addRooftopEquipment({ x: b.x + 2.2, z: b.z, w: b.w, d: b.d }, 0.35 + b.h, {
      penthouse: true,
      antenna: true
    });
  }

  buildAvengersTower(b, glassMat, armorMat, accentMat, deckMat) {
    const towerGroup = new THREE.Group();
    towerGroup.userData = { isLandmark: true, landmarkName: 'AVENGERS TOWER-STYLE HQ' };

    // --- 1. BASE PODIUM & GRAND ENTRANCE LOBBY (y = 0.35 to 14m) ---
    const podH = 14;
    const podW = b.w; // 22
    const podD = b.d; // 18
    const pod = new THREE.Mesh(new THREE.BoxGeometry(podW, podH, podD), armorMat);
    pod.position.set(b.x, 0.35 + podH / 2, b.z);
    pod.castShadow = true;
    pod.receiveShadow = true;
    pod.userData = { isLandmark: true };
    towerGroup.add(pod);

    // Double-height glass lobby atrium protruding forward
    const lobbyH = 9.5;
    const lobbyW = podW * 0.75;
    const lobbyD = 4.2;
    const lobby = new THREE.Mesh(new THREE.BoxGeometry(lobbyW, lobbyH, lobbyD), glassMat);
    lobby.position.set(b.x, 0.35 + lobbyH / 2, b.z - podD / 2 - 1.2);
    lobby.castShadow = true;
    lobby.userData = { isLandmark: true };
    towerGroup.add(lobby);

    // Cantilevered entrance canopy
    const canH = 0.4;
    const canW = lobbyW * 1.15;
    const canD = 5.6;
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(canW, canH, canD), armorMat);
    canopy.position.set(b.x, 0.35 + 5.8, b.z - podD / 2 - 2.8);
    canopy.castShadow = true;
    canopy.userData = { isLandmark: true };
    towerGroup.add(canopy);

    // Warm entrance under-canopy downlight
    const lobbyLight = new THREE.PointLight(0xfef08a, 2.2, 22);
    lobbyLight.position.set(b.x, 0.35 + 5.2, b.z - podD / 2 - 2.6);
    towerGroup.add(lobbyLight);

    // Revolving glass security entrance doors
    const door = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.4, 0.6), glassMat);
    door.position.set(b.x, 0.35 + 1.7, b.z - podD / 2 - 3.2);
    door.userData = { isLandmark: true };
    towerGroup.add(door);

    // --- 2. TIERED CENTRAL TOWER BODY (y = 14 to 54m) ---
    const midH = 40;
    const midW = podW * 0.82; // ~18
    const midD = podD * 0.82; // ~15
    const midTower = new THREE.Mesh(new THREE.BoxGeometry(midW, midH, midD), glassMat);
    midTower.position.set(b.x, 0.35 + podH + midH / 2, b.z + 0.6);
    midTower.castShadow = true;
    midTower.receiveShadow = true;
    midTower.userData = { isLandmark: true };
    towerGroup.add(midTower);

    // Vertical structural armor exoskeleton ribs on corners
    [-midW / 2, midW / 2].forEach(ex => {
      [-midD / 2, midD / 2].forEach(ez => {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.8, midH + podH, 0.8), armorMat);
        rib.position.set(b.x + ex, 0.35 + (midH + podH) / 2, b.z + 0.6 + ez);
        rib.castShadow = true;
        rib.userData = { isLandmark: true };
        towerGroup.add(rib);
      });
    });

    // Vertical architectural glowing cyan accent strip on front facade
    [-midW * 0.32, midW * 0.32].forEach(ax => {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.25, midH, 0.25), accentMat);
      strip.position.set(b.x + ax, 0.35 + podH + midH / 2, b.z + 0.6 - midD / 2 - 0.15);
      strip.userData = { isLandmark: true };
      towerGroup.add(strip);
    });

    // --- 3. ICONIC CANTILEVERED FLIGHT DECK / LANDING PLATFORM (y = 52 to 55m) ---
    // Extends dramatically northward towards city center (z = 64 -> z = 51)
    const deckY = 0.35 + podH + midH - 2; // y ~ 52.35
    const deckLen = 13.5;
    const deckW = 14;
    const deckThick = 1.2;

    // Platform base plate
    const deck = new THREE.Mesh(new THREE.BoxGeometry(deckW, deckThick, deckLen), deckMat);
    deck.position.set(b.x, deckY, b.z - 5.5);
    deck.castShadow = true;
    deck.receiveShadow = true;
    deck.userData = { isLandmark: true };
    towerGroup.add(deck);

    // Rounded aerodynamic flight deck nose
    const noseGeo = new THREE.CylinderGeometry(deckW / 2, deckW / 2, deckThick, 24, 1, false, 0, Math.PI);
    const nose = new THREE.Mesh(noseGeo, deckMat);
    nose.rotation.y = Math.PI / 2;
    nose.position.set(b.x, deckY, b.z - 5.5 - deckLen / 2);
    nose.castShadow = true;
    nose.userData = { isLandmark: true };
    towerGroup.add(nose);

    // Under-hull aerodynamic angled truss supports (from tower at y=42 to deck tip)
    [-deckW * 0.36, deckW * 0.36].forEach(tx => {
      const truss = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 14.5, 8), armorMat);
      truss.rotation.x = -Math.PI / 3.8;
      truss.position.set(b.x + tx, deckY - 4.5, b.z - 4.2);
      truss.castShadow = true;
      truss.userData = { isLandmark: true };
      towerGroup.add(truss);
    });

    // Flight deck yellow landing circle ring
    const ringGeo = new THREE.RingGeometry(3.6, 4.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(b.x, deckY + deckThick / 2 + 0.05, b.z - 8.5);
    ring.userData = { isLandmark: true };
    towerGroup.add(ring);

    // Runway approach centerline markings
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    for (let li = 0; li < 4; li++) {
      const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 1.8), lineMat);
      mark.rotation.x = -Math.PI / 2;
      mark.position.set(b.x, deckY + deckThick / 2 + 0.06, b.z - 2.5 - li * 2.8);
      mark.userData = { isLandmark: true };
      towerGroup.add(mark);
    }

    // Flight deck perimeter LED safety beacons (cyan & amber)
    this.towerDeckLights = [];
    const beaconAngles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];
    beaconAngles.forEach((ang, idx) => {
      const bx = b.x + Math.cos(ang) * 5.8;
      const bz = b.z - 8.5 + Math.sin(ang) * 5.8;
      const col = idx % 2 === 0 ? 0x00d0f5 : 0xf59e0b;
      const beaconMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), new THREE.MeshBasicMaterial({ color: col }));
      beaconMesh.position.set(bx, deckY + deckThick / 2 + 0.15, bz);
      towerGroup.add(beaconMesh);

      const bLight = new THREE.PointLight(col, 0.8, 6);
      bLight.position.set(bx, deckY + deckThick / 2 + 0.4, bz);
      towerGroup.add(bLight);
      this.towerDeckLights.push(bLight);
    });

    // --- 4. SWEEPING UPPER PROW & ARCHITECTURAL CROWN (y = 54 to 84m) ---
    const topH = 22;
    const topW = midW * 0.82; // ~14.5
    const topD = midD * 0.78; // ~11.5
    const topTower = new THREE.Mesh(new THREE.BoxGeometry(topW, topH, topD), glassMat);
    topTower.position.set(b.x, 0.35 + podH + midH + topH / 2, b.z + 1.2);
    topTower.castShadow = true;
    topTower.receiveShadow = true;
    topTower.userData = { isLandmark: true };
    towerGroup.add(topTower);

    // Iconic sweeping curved prow crown arching forward
    const prowH = 12;
    const prowW = topW * 0.95;
    const prowD = topD * 0.95;
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(prowW * 0.45, prowW * 0.52, prowH, 16, 1, false, 0, Math.PI), armorMat);
    crown.rotation.z = Math.PI / 2;
    crown.rotation.y = Math.PI / 2;
    crown.position.set(b.x, 0.35 + podH + midH + topH + prowH / 2 - 2, b.z - 1.5);
    crown.castShadow = true;
    crown.userData = { isLandmark: true };
    towerGroup.add(crown);

    // Glowing panoramic observation glass arch in crown
    const obsArch = new THREE.Mesh(new THREE.CylinderGeometry(prowW * 0.42, prowW * 0.42, prowH * 0.85, 16, 1, false, 0, Math.PI), glassMat);
    obsArch.rotation.z = Math.PI / 2;
    obsArch.rotation.y = Math.PI / 2;
    obsArch.position.set(b.x, 0.35 + podH + midH + topH + prowH / 2 - 2, b.z - 2.2);
    obsArch.userData = { isLandmark: true };
    towerGroup.add(obsArch);

    // Crown interior architectural uplight
    const crownLight = new THREE.PointLight(0x38bdf8, 2.5, 25);
    crownLight.position.set(b.x, 0.35 + podH + midH + topH + 3, b.z - 1.2);
    towerGroup.add(crownLight);
    this.towerCrownLight = crownLight;

    // --- 5. ROOFTOP HIGH-TECH STRUCTURES (y = 84 to 96m) ---
    const roofY = 0.35 + podH + midH + topH + prowH - 2; // ~86m
    // Mechanical Penthouse
    const ph = new THREE.Mesh(new THREE.BoxGeometry(8, 3.2, 7), this.matMech);
    ph.position.set(b.x, roofY + 1.6, b.z + 1.8);
    ph.castShadow = true;
    ph.userData = { isLandmark: true };
    towerGroup.add(ph);

    // Satellite Dish Transceiver
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 0.3, 0.8, 16), this.matAntenna);
    dish.rotation.z = Math.PI / 3.2;
    dish.rotation.y = -Math.PI / 4;
    dish.position.set(b.x - 3.2, roofY + 3.8, b.z + 2.4);
    dish.castShadow = true;
    dish.userData = { isLandmark: true };
    towerGroup.add(dish);

    // Radome Dome
    const radome = new THREE.Mesh(new THREE.SphereGeometry(1.3, 12, 12), this.matLimestone);
    radome.position.set(b.x + 3.2, roofY + 3.5, b.z + 2.4);
    radome.castShadow = true;
    radome.userData = { isLandmark: true };
    towerGroup.add(radome);

    // Soaring Central Communications Spire
    const spireH = 12;
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.28, spireH, 8), this.matAntenna);
    spire.position.set(b.x, roofY + 2 + spireH / 2, b.z - 0.5);
    spire.castShadow = true;
    spire.userData = { isLandmark: true };
    towerGroup.add(spire);

    // Aeronautical Pulsing Red Beacon on Spire Tip (y ~ 96m)
    const redLed = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    redLed.position.set(b.x, roofY + 2 + spireH, b.z - 0.5);
    towerGroup.add(redLed);

    const spireLight = new THREE.PointLight(0xef4444, 2.5, 28);
    spireLight.position.set(b.x, roofY + 2 + spireH + 0.1, b.z - 0.5);
    towerGroup.add(spireLight);
    this.antennaLights.push(spireLight);

    // --- 6. LANDSCAPED ENTRANCE PLAZA & VEHICLE DROP-OFF (z = 46 to 55m) ---
    // Granite Plaza Pavers (x: -24 to 24, z: 46 to 55)
    const plazaW = 48;
    const plazaD = 10;
    const plazaGeo = new THREE.BoxGeometry(plazaW, 0.35, plazaD);
    const plazaMat = new THREE.MeshStandardMaterial({
      color: this.theme === 'white' ? 0xe2e8f0 : 0x1e293b,
      roughness: 0.75,
      metalness: 0.15
    });
    const plazaMesh = new THREE.Mesh(plazaGeo, plazaMat);
    plazaMesh.position.set(b.x, 0.17, b.z - podD / 2 - 5.5);
    plazaMesh.receiveShadow = true;
    plazaMesh.userData = { isLandmark: true };
    towerGroup.add(plazaMesh);

    // Central Reflecting Pool / Water Feature
    const poolGeo = new THREE.BoxGeometry(12, 0.15, 4.5);
    const poolMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });
    const pool = new THREE.Mesh(poolGeo, poolMat);
    pool.position.set(b.x, 0.36, b.z - podD / 2 - 6.2);
    pool.receiveShadow = true;
    pool.userData = { isLandmark: true };
    towerGroup.add(pool);

    // Central Geometric Sculpture in Pool
    const sculpGeo = new THREE.OctahedronGeometry(1.2, 0);
    const sculp = new THREE.Mesh(sculpGeo, armorMat);
    sculp.position.set(b.x, 1.8, b.z - podD / 2 - 6.2);
    sculp.rotation.y = Math.PI / 4;
    sculp.castShadow = true;
    sculp.userData = { isLandmark: true };
    towerGroup.add(sculp);

    // Plaza Trees & Planter Beds (London Plane with tree grates)
    [-16, -10, 10, 16].forEach(tx => {
      // Tree well grate
      const grateGeo = new THREE.RingGeometry(0.3, 1.2, 16);
      const grateMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8, side: THREE.DoubleSide });
      const grate = new THREE.Mesh(grateGeo, grateMat);
      grate.rotation.x = -Math.PI / 2;
      grate.position.set(b.x + tx, 0.36, b.z - podD / 2 - 5.2);
      towerGroup.add(grate);

      // Tree trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 4.2, 8), this.matParapet);
      trunk.position.set(b.x + tx, 0.35 + 2.1, b.z - podD / 2 - 5.2);
      trunk.castShadow = true;
      towerGroup.add(trunk);

      // Foliage cluster
      const folMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 });
      const fol = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 1), folMat);
      fol.position.set(b.x + tx, 0.35 + 4.8, b.z - podD / 2 - 5.2);
      fol.castShadow = true;
      towerGroup.add(fol);
      this.treeCanopies.push({ mesh: fol, initialY: fol.position.y, phase: tx * 0.4 });
    });

    // Stainless Steel Safety Bollards along plaza curb
    for (let bx = -22; bx <= 22; bx += 3.5) {
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.85, 8), this.matAntenna);
      bollard.position.set(b.x + bx, 0.35 + 0.42, b.z - podD / 2 - 10.2);
      bollard.castShadow = true;
      towerGroup.add(bollard);
    }

    // 4 Modern Architectural Plaza Luminaire Light Poles
    [-18, 18].forEach(lx => {
      [-2, -8].forEach(lz => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.6, 8), armorMat);
        pole.position.set(b.x + lx, 0.35 + 2.3, b.z - podD / 2 + lz);
        pole.castShadow = true;
        towerGroup.add(pole);

        const lum = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.4), this.matParapet);
        lum.position.set(b.x + lx, 0.35 + 4.6, b.z - podD / 2 + lz);
        towerGroup.add(lum);

        const pLight = new THREE.PointLight(0xfef08a, 1.2, 14);
        pLight.position.set(b.x + lx, 0.35 + 4.5, b.z - podD / 2 + lz);
        towerGroup.add(pLight);
        this.streetLights.push(pLight);
      });
    });

    this.scene.add(towerGroup);
    this.avengersTowerGroup = towerGroup;
  }

  buildRoads() {
    this.roadMeshes = [];
    const isWhite = this.theme === 'white';
    const roadMat = new THREE.MeshStandardMaterial({
      color: isWhite ? 0x334155 : 0x141a24, // PBR deep matte asphalt
      roughness: 0.88,
      metalness: 0.12
    });

    const curbMat = new THREE.MeshStandardMaterial({
      color: isWhite ? 0xcbd5e1 : 0x334155,
      roughness: 0.85,
      metalness: 0.15
    });

    const stopBarMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.95, transparent: true });
    const arrowMatLeft = new THREE.MeshBasicMaterial({ map: this.texArrowLeft, transparent: true, opacity: 0.92 });
    const arrowMatStraight = new THREE.MeshBasicMaterial({ map: this.texArrowStraight, transparent: true, opacity: 0.92 });

    const intersections = window.TRAFFIC_DATA.intersections;
    const roads = window.TRAFFIC_DATA.roads;

    roads.forEach(road => {
      const fromNode = intersections.find(n => n.id === road.from);
      const toNode = intersections.find(n => n.id === road.to);
      if (!fromNode || !toNode) return;

      const dx = toNode.x - fromNode.x;
      const dz = toNode.z - fromNode.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);

      const roadWidth = road.lanes === 3 ? 9.5 : 7.5;
      const roadGeo = new THREE.PlaneGeometry(dist, roadWidth);
      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.rotation.z = -angle;
      roadMesh.position.set((fromNode.x + toNode.x) / 2, 0.1, (fromNode.z + toNode.z) / 2);
      roadMesh.receiveShadow = true;
      roadMesh.userData = { roadId: road.id };
      this.scene.add(roadMesh);
      this.roadMeshes.push(roadMesh);

      // 1. Raised 3D Concrete Curbs on Road Edges
      if (dist > 16) {
        [-1, 1].forEach(side => {
          const curbGeo = new THREE.BoxGeometry(dist - 12, 0.18, 0.35);
          const curbMesh = new THREE.Mesh(curbGeo, curbMat);
          curbMesh.rotation.y = -angle;
          const offsetDist = (roadWidth / 2 + 0.18) * side;
          const perpX = -Math.sin(angle) * offsetDist;
          const perpZ = Math.cos(angle) * offsetDist;
          curbMesh.position.set((fromNode.x + toNode.x) / 2 + perpX, 0.09, (fromNode.z + toNode.z) / 2 + perpZ);
          curbMesh.receiveShadow = true;
          curbMesh.castShadow = true;
          this.scene.add(curbMesh);
        });
      }

      // 2. Double Yellow Centerline
      [-0.15, 0.15].forEach(offset => {
        const lineGeo = new THREE.PlaneGeometry(Math.max(2, dist - 12), 0.18);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, opacity: 0.95, transparent: true });
        const lineMesh = new THREE.Mesh(lineGeo, lineMat);
        lineMesh.rotation.x = -Math.PI / 2;
        lineMesh.rotation.z = -angle;

        const perpX = -Math.sin(angle) * offset;
        const perpZ = Math.cos(angle) * offset;
        lineMesh.position.set((fromNode.x + toNode.x) / 2 + perpX, 0.12, (fromNode.z + toNode.z) / 2 + perpZ);
        this.scene.add(lineMesh);
      });

      // 3. White Dashed Lane Dividers
      [-1.8, 1.8].forEach(laneOffset => {
        const dashCount = Math.floor(dist / 4);
        for (let d = 0; d < dashCount; d++) {
          if (d % 2 === 0) {
            const dashGeo = new THREE.PlaneGeometry(2.0, 0.18);
            const dashMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, opacity: 0.85, transparent: true });
            const dashMesh = new THREE.Mesh(dashGeo, dashMat);
            dashMesh.rotation.x = -Math.PI / 2;
            dashMesh.rotation.z = -angle;

            const t = (d + 0.5) / dashCount;
            const px = fromNode.x + dx * t - Math.sin(angle) * laneOffset;
            const pz = fromNode.z + dz * t + Math.cos(angle) * laneOffset;
            dashMesh.position.set(px, 0.12, pz);
            this.scene.add(dashMesh);
          }
        }
      });

      // 4. Stop Bars
      if (dist > 18) {
        const stopGeo = new THREE.PlaneGeometry(roadWidth / 2 - 0.5, 0.55);
        const stopMeshTo = new THREE.Mesh(stopGeo, stopBarMat);
        stopMeshTo.rotation.x = -Math.PI / 2;
        stopMeshTo.rotation.z = -angle;
        const stopDistTo = dist / 2 - 6.2;
        const stopXTo = (fromNode.x + toNode.x) / 2 + (dx / dist) * stopDistTo - Math.sin(angle) * (roadWidth / 4);
        const stopZTo = (fromNode.z + toNode.z) / 2 + (dz / dist) * stopDistTo + Math.cos(angle) * (roadWidth / 4);
        stopMeshTo.position.set(stopXTo, 0.125, stopZTo);
        this.scene.add(stopMeshTo);

        const stopMeshFrom = new THREE.Mesh(stopGeo, stopBarMat);
        stopMeshFrom.rotation.x = -Math.PI / 2;
        stopMeshFrom.rotation.z = -angle;
        const stopDistFrom = -(dist / 2 - 6.2);
        const stopXFrom = (fromNode.x + toNode.x) / 2 + (dx / dist) * stopDistFrom + Math.sin(angle) * (roadWidth / 4);
        const stopZFrom = (fromNode.z + toNode.z) / 2 + (dz / dist) * stopDistFrom - Math.cos(angle) * (roadWidth / 4);
        stopMeshFrom.position.set(stopXFrom, 0.125, stopZFrom);
        this.scene.add(stopMeshFrom);

        // 5. Directional Lane Turn Arrows
        const arrowGeo = new THREE.PlaneGeometry(1.5, 2.6);
        const arrowLeft = new THREE.Mesh(arrowGeo, arrowMatLeft);
        arrowLeft.rotation.x = -Math.PI / 2;
        arrowLeft.rotation.z = -angle;
        const arrowDist = dist / 2 - 11.5;
        const arrowX1 = (fromNode.x + toNode.x) / 2 + (dx / dist) * arrowDist - Math.sin(angle) * 1.8;
        const arrowZ1 = (fromNode.z + toNode.z) / 2 + (dz / dist) * arrowDist + Math.cos(angle) * 1.8;
        arrowLeft.position.set(arrowX1, 0.122, arrowZ1);
        this.scene.add(arrowLeft);

        const arrowStraight = new THREE.Mesh(arrowGeo, arrowMatStraight);
        arrowStraight.rotation.x = -Math.PI / 2;
        arrowStraight.rotation.z = -angle;
        const arrowX2 = (fromNode.x + toNode.x) / 2 + (dx / dist) * arrowDist - Math.sin(angle) * 3.6;
        const arrowZ2 = (fromNode.z + toNode.z) / 2 + (dz / dist) * arrowDist + Math.cos(angle) * 3.6;
        arrowStraight.position.set(arrowX2, 0.122, arrowZ2);
        this.scene.add(arrowStraight);
      }
    });

    // Intersection Aprons, Crosswalks, Ramps & Bollards
    intersections.forEach(node => {
      const apronGeo = new THREE.PlaneGeometry(12, 12);
      const apronMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 });
      const apron = new THREE.Mesh(apronGeo, apronMat);
      apron.rotation.x = -Math.PI / 2;
      apron.position.set(node.x, 0.11, node.z);
      apron.userData = { intersectionId: node.id };
      this.scene.add(apron);

      // Zebra Crosswalk strips on 4 sides of the intersection
      const zebraMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, opacity: 0.88, transparent: true });
      const sides = [
        { dx: 0, dz: -6.2, rot: 0 },
        { dx: 0, dz: 6.2, rot: 0 },
        { dx: -6.2, dz: 0, rot: Math.PI / 2 },
        { dx: 6.2, dz: 0, rot: Math.PI / 2 }
      ];

      sides.forEach(s => {
        for (let i = -3; i <= 3; i++) {
          const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 2.2), zebraMat);
          stripe.rotation.x = -Math.PI / 2;
          stripe.rotation.z = s.rot;
          if (s.rot === 0) {
            stripe.position.set(node.x + i * 1.4, 0.12, node.z + s.dz);
          } else {
            stripe.position.set(node.x + s.dx, 0.12, node.z + i * 1.4);
          }
          this.scene.add(stripe);
        }
      });

      // Pedestrian Corner Curb Ramps & Stainless Steel Bollards
      const cornerOffsets = [
        [-6.5, -6.5], [6.5, -6.5],
        [-6.5, 6.5], [6.5, 6.5]
      ];
      cornerOffsets.forEach(([cx, cz]) => {
        // Tactile Yellow Ramp Warning Pad
        const rampGeo = new THREE.PlaneGeometry(1.6, 1.6);
        const rampMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, opacity: 0.85, transparent: true });
        const ramp = new THREE.Mesh(rampGeo, rampMat);
        ramp.rotation.x = -Math.PI / 2;
        ramp.position.set(node.x + cx, 0.125, node.z + cz);
        this.scene.add(ramp);

        // Stainless Steel Protective Bollards
        const bollardGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 10);
        const bollardMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.85 });
        const bollard = new THREE.Mesh(bollardGeo, bollardMat);
        bollard.position.set(node.x + cx * 0.9, 0.45, node.z + cz * 0.9);
        bollard.castShadow = true;
        this.scene.add(bollard);
      });

      // Clickable Hitbox Cylinder
      const hitGeo = new THREE.CylinderGeometry(6, 6, 8, 16);
      const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      const hitbox = new THREE.Mesh(hitGeo, hitMat);
      hitbox.position.set(node.x, 4, node.z);
      hitbox.userData = { intersectionId: node.id, isHitbox: true };
      this.scene.add(hitbox);
    });

    // Modern Passenger Transit Bus Shelters
    const shelterMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
    const glassShelterMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6, roughness: 0.1 });
    const shelterCoords = [
      { x: -36, z: -14, rot: 0 },
      { x: 36, z: 14, rot: Math.PI }
    ];
    shelterCoords.forEach(s => {
      const shelter = new THREE.Group();
      shelter.position.set(s.x, 0, s.z);
      shelter.rotation.y = s.rot;

      // Canopy Glass Roof
      const roof = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.1, 2.0), glassShelterMat);
      roof.position.set(0, 2.5, 0);
      shelter.add(roof);

      // Support Posts
      [-1.9, 1.9].forEach(px => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.5, 8), shelterMat);
        post.position.set(px, 1.25, -0.9);
        shelter.add(post);
      });

      // Waiting Bench
      const bench = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.1, 0.45), shelterMat);
      bench.position.set(0, 0.45, -0.6);
      shelter.add(bench);

      this.scene.add(shelter);
    });
  }

  buildSignals() {
    this.signalPoles = new Map();
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.75, roughness: 0.25 });
    const housingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x090e17, roughness: 0.5 });

    window.TRAFFIC_DATA.intersections.forEach(node => {
      const group = new THREE.Group();
      group.position.set(node.x + 4.8, 0, node.z + 4.8);

      // Main Vertical Mast
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 6.2, 12), poleMat);
      pole.position.y = 3.1;
      pole.castShadow = true;
      group.add(pole);

      // Cantilevered Mast Arm Extending Over Lanes
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 4.2, 8), poleMat);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(-2.0, 5.8, 0);
      group.add(arm);

      // Primary Overhead Signal Head Housing
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.9, 0.6), housingMat);
      head.position.set(-3.2, 5.2, 0);
      head.castShadow = true;
      group.add(head);

      // Red, Yellow, Green bulbs
      const bulbGeo = new THREE.SphereGeometry(0.22, 12, 12);
      const redMat = new THREE.MeshStandardMaterial({ color: 0x220505, emissive: 0xff0000, emissiveIntensity: 0.1 });
      const yellowMat = new THREE.MeshStandardMaterial({ color: 0x221a05, emissive: 0xf59e0b, emissiveIntensity: 0.1 });
      const greenMat = new THREE.MeshStandardMaterial({ color: 0x052210, emissive: 0x10b981, emissiveIntensity: 1.8 });

      const redBulb = new THREE.Mesh(bulbGeo, redMat);
      redBulb.position.set(-3.2, 5.8, 0.32);
      group.add(redBulb);

      const yellowBulb = new THREE.Mesh(bulbGeo, yellowMat);
      yellowBulb.position.set(-3.2, 5.2, 0.32);
      group.add(yellowBulb);

      const greenBulb = new THREE.Mesh(bulbGeo, greenMat);
      greenBulb.position.set(-3.2, 4.6, 0.32);
      group.add(greenBulb);

      // Anti-Glare Visor Hoods over bulbs
      [5.8, 5.2, 4.6].forEach(vy => {
        const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.25, 8, 1, true, 0, Math.PI), visorMat);
        visor.rotation.x = Math.PI / 2;
        visor.position.set(-3.2, vy + 0.15, 0.35);
        group.add(visor);
      });

      // Pedestrian Signal Box on vertical post (Walk / Don't Walk)
      const pedBox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 0.35), housingMat);
      pedBox.position.set(0, 2.5, -0.2);
      group.add(pedBox);

      const pedIcon = new THREE.Mesh(
        new THREE.PlaneGeometry(0.25, 0.5),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      pedIcon.position.set(0, 2.5, -0.38);
      pedIcon.rotation.y = Math.PI;
      group.add(pedIcon);

      // Dynamic light source
      const bulbLight = new THREE.PointLight(0x10b981, 1.4, 14);
      bulbLight.position.set(-3.2, 5.0, 0.8);
      group.add(bulbLight);

      this.scene.add(group);
      this.signalPoles.set(node.id, {
        group,
        redBulb,
        yellowBulb,
        greenBulb,
        bulbLight
      });
    });
  }

  buildIncidents() {
    // 3D Accident Zone at I4
    this.accidentGroup = new THREE.Group();
    this.accidentGroup.position.set(32, 0.1, 0);
    this.accidentGroup.visible = false;

    // Caution Hazard Cones
    const coneGeo = new THREE.ConeGeometry(0.6, 1.4, 8);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 0.6 });
    [-2, 0, 2].forEach(ox => {
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(ox, 0.7, 2.5);
      this.accidentGroup.add(cone);
    });

    // Strobe Alert Light
    this.accidentStrobe = new THREE.PointLight(0xf97316, 2.5, 18);
    this.accidentStrobe.position.set(0, 3, 2.5);
    this.accidentGroup.add(this.accidentStrobe);

    this.scene.add(this.accidentGroup);

    // 3D Road Barricades (for Road Closure R_2_4)
    this.closureGroup = new THREE.Group();
    this.closureGroup.position.set(32, 0, -11);
    this.closureGroup.visible = false;

    const barGeo = new THREE.BoxGeometry(6, 1.2, 0.3);
    const barMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.8 });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.y = 0.6;
    this.closureGroup.add(bar);
    this.scene.add(this.closureGroup);
  }

  buildGroundZones() {
    this.groundZonesGroup = new THREE.Group();

    // 1. Sidewalks (Concrete pavers running alongside road network)
    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: this.theme === 'white' ? 0xe2e8f0 : 0x334155,
      roughness: 0.85,
      metalness: 0.1
    });
    const curbMat = new THREE.MeshStandardMaterial({
      color: this.theme === 'white' ? 0xcbd5e1 : 0x1e293b,
      roughness: 0.9,
      metalness: 0.2
    });

    // 2. Rich Dark Soil Beds around tree groves and medians (#452c1e)
    const soilMat = new THREE.MeshStandardMaterial({
      color: 0x452c1e,
      roughness: 0.95,
      metalness: 0.05
    });

    // 3. Urban Parks / Lawn Zones (#2e7d32)
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x2e7d32,
      roughness: 0.88,
      metalness: 0.05
    });

    // Urban Park 1: North-West Eco Plaza (around x: -58, z: -45)
    const park1 = new THREE.Mesh(new THREE.BoxGeometry(36, 0.2, 32), grassMat);
    park1.position.set(-58, 0.1, -45);
    park1.receiveShadow = true;
    this.groundZonesGroup.add(park1);

    // Urban Park 2: South-East Central Green (around x: 58, z: 45)
    const park2 = new THREE.Mesh(new THREE.BoxGeometry(38, 0.2, 34), grassMat);
    park2.position.set(58, 0.1, 45);
    park2.receiveShadow = true;
    this.groundZonesGroup.add(park2);

    // Urban Park 3: North-East Waterfront Lawn (around x: 48, z: -45)
    const park3 = new THREE.Mesh(new THREE.BoxGeometry(28, 0.2, 28), grassMat);
    park3.position.set(48, 0.1, -45);
    park3.receiveShadow = true;
    this.groundZonesGroup.add(park3);

    // Urban Park 4: South-West Civic Park (around x: -52, z: 45)
    const park4 = new THREE.Mesh(new THREE.BoxGeometry(32, 0.2, 32), grassMat);
    park4.position.set(-52, 0.1, 45);
    park4.receiveShadow = true;
    this.groundZonesGroup.add(park4);

    // Curbs & Sidewalks around the central grid blocks
    const blockCenters = [
      [-16, -11], [16, -11],
      [-16, 11], [16, 11],
      [-48, -11], [-48, 11],
      [48, -11], [48, 11]
    ];

    blockCenters.forEach(([bx, bz]) => {
      // Concrete sidewalk border
      const sw = new THREE.Mesh(new THREE.BoxGeometry(26, 0.14, 16), sidewalkMat);
      sw.position.set(bx, 0.08, bz);
      sw.receiveShadow = true;
      this.groundZonesGroup.add(sw);

      // Raised curb outline
      const curb = new THREE.Mesh(new THREE.BoxGeometry(26.6, 0.18, 16.6), curbMat);
      curb.position.set(bx, 0.06, bz);
      this.groundZonesGroup.add(curb);

      // Organic soil bed in the center
      const soil = new THREE.Mesh(new THREE.BoxGeometry(18, 0.16, 8), soilMat);
      soil.position.set(bx, 0.09, bz);
      soil.receiveShadow = true;
      this.groundZonesGroup.add(soil);
    });

    // Avenue Medians with soil along major boulevards
    const medianCoords = [
      { x: 0, z: -22, w: 2, l: 30 },
      { x: 0, z: 0, w: 2, l: 30 },
      { x: 0, z: 22, w: 2, l: 30 },
      { x: -32, z: -11, w: 16, l: 1.8 },
      { x: 32, z: 11, w: 16, l: 1.8 }
    ];
    medianCoords.forEach(m => {
      const medSoil = new THREE.Mesh(new THREE.BoxGeometry(m.w, 0.16, m.l), soilMat);
      medSoil.position.set(m.x, 0.09, m.z);
      this.groundZonesGroup.add(medSoil);
    });

    this.scene.add(this.groundZonesGroup);
  }

  buildTrees() {
    this.treesGroup = new THREE.Group();
    this.treeCanopies = [];

    // Shared Trunk Material & Canopy Materials
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.95 });
    const grateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, metalness: 0.7 });
    const grateSoilMat = new THREE.MeshStandardMaterial({ color: 0x452c1e, roughness: 0.95 });
    const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });

    const leafMatStreet = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.75 });
    const leafMatShade = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });
    const leafMatPine = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.85 });
    const leafMatOrna = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.75 });

    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 2.6, 8);
    const branchGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.2, 6);

    // Tree generator helper supporting 4 species
    const addTree = (x, z, type = 'street', scale = 1.0) => {
      const tree = new THREE.Group();
      tree.position.set(x, 0, z);

      // 1. Trunk
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.3 * scale;
      trunk.scale.set(scale, scale, scale);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      tree.add(trunk);

      let canopy = new THREE.Group();

      if (type === 'pine') {
        // Coniferous Pine: 4 graduated conical tiers
        [
          { r: 1.5, h: 2.0, y: 2.2 },
          { r: 1.2, h: 1.8, y: 3.1 },
          { r: 0.9, h: 1.5, y: 3.9 },
          { r: 0.5, h: 1.2, y: 4.6 }
        ].forEach(layer => {
          const cone = new THREE.Mesh(new THREE.ConeGeometry(layer.r * scale, layer.h * scale, 8), leafMatPine);
          cone.position.y = layer.y * scale;
          cone.castShadow = true;
          canopy.add(cone);
        });
      } else if (type === 'shade') {
        // Broad Canopy Oak: 4 overlapping organic masses
        [
          { x: 0, y: 3.2, z: 0, r: 1.8, sx: 1.4, sy: 0.8, sz: 1.4 },
          { x: -0.6, y: 3.0, z: 0.5, r: 1.4, sx: 1.2, sy: 0.75, sz: 1.1 },
          { x: 0.7, y: 3.1, z: -0.4, r: 1.3, sx: 1.1, sy: 0.75, sz: 1.2 },
          { x: 0.2, y: 3.7, z: 0.3, r: 1.2, sx: 1.0, sy: 0.8, sz: 1.0 }
        ].forEach(blob => {
          const sphere = new THREE.Mesh(new THREE.DodecahedronGeometry(blob.r * scale, 1), leafMatShade);
          sphere.scale.set(blob.sx, blob.sy, blob.sz);
          sphere.position.set(blob.x * scale, blob.y * scale, blob.z * scale);
          sphere.castShadow = true;
          canopy.add(sphere);
        });
      } else if (type === 'ornamental') {
        // Ornamental Flowering Tree
        const ball = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4 * scale, 1), leafMatOrna);
        ball.position.y = 2.8 * scale;
        ball.castShadow = true;
        canopy.add(ball);
      } else {
        // London Plane Street Tree: Branching fork + 3 clustered foliage spheres + sidewalk well
        const b1 = new THREE.Mesh(branchGeo, trunkMat);
        b1.position.set(-0.25 * scale, 2.3 * scale, 0);
        b1.rotation.z = 0.35;
        tree.add(b1);

        const b2 = new THREE.Mesh(branchGeo, trunkMat);
        b2.position.set(0.25 * scale, 2.3 * scale, 0);
        b2.rotation.z = -0.35;
        tree.add(b2);

        [
          { x: 0, y: 3.2, z: 0, r: 1.35 },
          { x: -0.5, y: 2.8, z: 0.3, r: 1.1 },
          { x: 0.5, y: 2.9, z: -0.3, r: 1.05 }
        ].forEach(cl => {
          const sphere = new THREE.Mesh(new THREE.DodecahedronGeometry(cl.r * scale, 1), leafMatStreet);
          sphere.position.set(cl.x * scale, cl.y * scale, cl.z * scale);
          sphere.castShadow = true;
          canopy.add(sphere);
        });

        // Cast-iron Sidewalk Tree Well with Organic Soil
        const grateBorder = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 1.8), grateMat);
        grateBorder.position.y = 0.04;
        tree.add(grateBorder);

        const grateSoil = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.09, 1.5), grateSoilMat);
        grateSoil.position.y = 0.05;
        tree.add(grateSoil);
      }

      tree.add(canopy);
      this.treesGroup.add(tree);

      this.treeCanopies.push({
        mesh: canopy,
        baseRotX: canopy.rotation.x,
        baseRotZ: canopy.rotation.z,
        phase: Math.random() * Math.PI * 2
      });
    };

    // 1. Boulevard Street Trees along E-W avenues (z: -22, z: 0, z: 22)
    [-80, -68, -56, -44, -20, -8, 8, 20, 44, 56, 68, 80].forEach(x => {
      addTree(x, -26.5, 'street', 0.95);
      addTree(x, -17.5, 'street', 0.9);
      addTree(x, -4.5, 'street', 1.0);
      addTree(x, 4.5, 'street', 1.0);
      addTree(x, 17.5, 'street', 0.9);
      addTree(x, 26.5, 'street', 0.95);
    });

    // 2. Trees along N-S avenues (x: -32, x: 0, x: 32)
    [-70, -58, -46, -34, -10, 10, 34, 46, 58, 70].forEach(z => {
      if (Math.abs(z - (-22)) > 6 && Math.abs(z) > 6 && Math.abs(z - 22) > 6) {
        addTree(-36.5, z, 'shade', 1.05);
        addTree(-27.5, z, 'street', 0.9);
        addTree(27.5, z, 'street', 0.9);
        addTree(36.5, z, 'shade', 1.05);
      }
    });

    // 3. Dense clusters in Park 1 (North-West)
    for (let i = 0; i < 28; i++) {
      const px = -58 + (Math.sin(i * 1.7) * 14);
      const pz = -45 + (Math.cos(i * 2.3) * 12);
      const type = (i % 4 === 0) ? 'ornamental' : (i % 3 === 0) ? 'pine' : (i % 2 === 0) ? 'shade' : 'street';
      addTree(px, pz, type, 0.85 + (i % 5) * 0.12);
    }

    // 4. Dense clusters in Park 2 (South-East)
    for (let i = 0; i < 30; i++) {
      const px = 58 + (Math.sin(i * 1.9) * 15);
      const pz = 45 + (Math.cos(i * 2.1) * 13);
      const type = (i % 4 === 0) ? 'ornamental' : (i % 3 === 0) ? 'shade' : (i % 2 === 0) ? 'pine' : 'street';
      addTree(px, pz, type, 0.9 + (i % 4) * 0.1);
    }

    // 5. Clusters in Park 3 & Park 4
    for (let i = 0; i < 20; i++) {
      const px3 = 48 + (Math.sin(i * 1.5) * 10);
      const pz3 = -45 + (Math.cos(i * 2.7) * 10);
      addTree(px3, pz3, i % 2 === 0 ? 'pine' : 'ornamental', 0.95);

      const px4 = -52 + (Math.sin(i * 2.2) * 12);
      const pz4 = 45 + (Math.cos(i * 1.8) * 12);
      addTree(px4, pz4, i % 2 === 0 ? 'shade' : 'street', 1.0);
    }

    // 6. Manicured Boxwood Hedges along Sidewalks
    const hedgeSegments = [
      { x: -16, z: -25, w: 10, l: 0.8 },
      { x: 16, z: -25, w: 10, l: 0.8 },
      { x: -16, z: 25, w: 10, l: 0.8 },
      { x: 16, z: 25, w: 10, l: 0.8 },
      { x: -48, z: -25, w: 12, l: 0.8 },
      { x: 48, z: -25, w: 12, l: 0.8 },
      { x: -48, z: 25, w: 12, l: 0.8 },
      { x: 48, z: 25, w: 12, l: 0.8 }
    ];
    hedgeSegments.forEach(h => {
      const hedge = new THREE.Mesh(new THREE.BoxGeometry(h.w, 0.6, h.l), hedgeMat);
      hedge.position.set(h.x, 0.3, h.z);
      hedge.castShadow = true;
      hedge.receiveShadow = true;
      this.treesGroup.add(hedge);
    });

    this.scene.add(this.treesGroup);
  }

  buildStreetLights() {
    this.streetLightsGroup = new THREE.Group();
    this.streetLights = [];
    this.groundLightPools = [];

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 });
    const lampHeadMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfef08a,
      emissiveIntensity: 1.8
    });
    this.lampHeadMat = lampHeadMat;

    // Ground light pool circle geometry
    const poolGeo = new THREE.CircleGeometry(4.2, 16);
    poolGeo.rotateX(-Math.PI / 2);

    const poolMat = new THREE.MeshBasicMaterial({
      color: 0xfef3c7,
      transparent: true,
      opacity: 0.4,
      depthWrite: false
    });
    this.streetLightPoolMat = poolMat;

    const addLight = (x, z, rotY = 0) => {
      const pole = new THREE.Group();
      pole.position.set(x, 0, z);
      pole.rotation.y = rotY;

      // Vertical post (height: 6.2)
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 6.2, 8), poleMat);
      post.position.y = 3.1;
      pole.add(post);

      // Curved mast arm extending out 2.2m
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.2, 8), poleMat);
      arm.rotation.z = Math.PI / 3;
      arm.position.set(0.9, 6.1, 0);
      pole.add(arm);

      // Luminaire head
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.22), lampHeadMat);
      head.position.set(1.8, 6.4, 0);
      pole.add(head);

      // Nocturnal PointLight source
      const light = new THREE.PointLight(0xfef08a, 1.6, 22);
      light.position.set(1.8, 6.2, 0);
      pole.add(light);
      this.streetLights.push(light);

      // Ground Illumination Pool (on asphalt under fixture)
      const pool = new THREE.Mesh(poolGeo, poolMat);
      pool.position.set(1.8, 0.07, 0);
      pole.add(pool);
      this.groundLightPools.push(pool);

      this.streetLightsGroup.add(pole);
    };

    // Avenue 1 (z: -22)
    [-72, -52, -32, -12, 12, 32, 52, 72].forEach(x => {
      addLight(x, -25.2, 0);
      addLight(x, -18.8, Math.PI);
    });

    // Avenue 2 (z: 0)
    [-72, -52, -32, -12, 12, 32, 52, 72].forEach(x => {
      addLight(x, -3.2, 0);
      addLight(x, 3.2, Math.PI);
    });

    // Avenue 3 (z: 22)
    [-72, -52, -32, -12, 12, 32, 52, 72].forEach(x => {
      addLight(x, 18.8, 0);
      addLight(x, 25.2, Math.PI);
    });

    // Cross Boulevards (x: -32, x: 0, x: 32)
    [-60, -42, -11, 11, 42, 60].forEach(z => {
      addLight(-35.2, z, Math.PI / 2);
      addLight(-28.8, z, -Math.PI / 2);
      addLight(28.8, z, Math.PI / 2);
      addLight(35.2, z, -Math.PI / 2);
    });

    this.scene.add(this.streetLightsGroup);
  }

  buildOptimizationBanner() {
    this.optCanvas = document.createElement('canvas');
    this.optCanvas.width = 1024;
    this.optCanvas.height = 256;
    this.optTex = new THREE.CanvasTexture(this.optCanvas);

    const bannerGeo = new THREE.PlaneGeometry(28, 7);
    const bannerMat = new THREE.MeshBasicMaterial({
      map: this.optTex,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide
    });

    this.optimizationBanner = new THREE.Mesh(bannerGeo, bannerMat);
    this.optimizationBanner.position.set(0, 36, 0);

    // Glowing Neon Cyan Border
    const borderGeo = new THREE.EdgesGeometry(bannerGeo);
    const borderMat = new THREE.LineBasicMaterial({ color: 0x00d0f5, linewidth: 2 });
    this.optimizationBannerBorder = new THREE.LineSegments(borderGeo, borderMat);
    this.optimizationBanner.add(this.optimizationBannerBorder);

    this.scene.add(this.optimizationBanner);
    this.updateOptimizationBannerText('QUANTUM AUTO-PILOT · ACTIVE', 'All 6 Hubs Monitored | QAOA 127-Qubit Co-Processor | Cooldown: Ready');
  }

  updateOptimizationBannerText(title, subtitle) {
    if (!this.optCanvas) return;
    const ctx = this.optCanvas.getContext('2d');
    const W = this.optCanvas.width;
    const H = this.optCanvas.height;

    ctx.clearRect(0, 0, W, H);

    // Glass backdrop
    ctx.fillStyle = 'rgba(10, 18, 36, 0.88)';
    ctx.fillRect(0, 0, W, H);

    // Tech border
    ctx.strokeStyle = '#00d0f5';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, W - 12, H - 12);

    // Neon corner accents
    ctx.fillStyle = '#10b981';
    ctx.fillRect(10, 10, 24, 6);
    ctx.fillRect(10, 10, 6, 24);
    ctx.fillRect(W - 34, 10, 24, 6);
    ctx.fillRect(W - 16, 10, 6, 24);

    // Title
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 36px "JetBrains Mono", monospace';
    ctx.fillText(title || 'QUANTUM AUTO-PILOT · ACTIVE', 36, 68);

    // Subtitle
    ctx.fillStyle = '#94a3b8';
    ctx.font = '22px "Inter", sans-serif';
    ctx.fillText(subtitle || 'Real-Time QUBO / QAOA Autonomous Dispatch Engine', 36, 118);

    // Metric Badges
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.fillRect(36, 146, 220, 48);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillText('DELAY: -34.8%', 52, 178);

    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.fillRect(280, 146, 260, 48);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('QPU LATENCY: 42ms', 296, 178);

    ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
    ctx.fillRect(560, 146, 280, 48);
    ctx.fillStyle = '#a78bfa';
    ctx.fillText('COOLDOWN: 30s SAFE', 576, 178);

    if (this.optTex) this.optTex.needsUpdate = true;
  }

  setTimeOfDay(mode) {
    this.timeOfDay = mode || 'dusk';
    const isWhite = this.theme === 'white';

    if (mode === 'day') {
      this.scene.background = new THREE.Color(isWhite ? 0xf1f5f9 : 0x1a2333);
      if (this.scene.fog) {
        this.scene.fog.color = new THREE.Color(isWhite ? 0xf1f5f9 : 0x1a2333);
        this.scene.fog.density = 0.003;
      }
      if (this.ambientLight) {
        this.ambientLight.color.setHex(0xffffff);
        this.ambientLight.intensity = 1.6;
      }
      if (this.dirLight) {
        this.dirLight.color.setHex(0xfffbeb);
        this.dirLight.intensity = 1.6;
        this.dirLight.position.set(60, 100, 40);
      }
      if (this.streetLights) {
        this.streetLights.forEach(l => l.intensity = 0.1);
      }
      if (this.groundLightPools) {
        this.groundLightPools.forEach(p => { p.material.opacity = 0.0; });
      }
      if (this.lampHeadMat) {
        this.lampHeadMat.emissiveIntensity = 0.2;
      }
      if (this.buildingMaterials) {
        this.buildingMaterials.forEach(m => { if (m.emissive) m.emissiveIntensity = 0.15; });
      }
      if (this.matTowerGlass) this.matTowerGlass.emissiveIntensity = 0.08;
      if (this.matTowerAccent) this.matTowerAccent.emissiveIntensity = 0.4;
      if (this.towerCrownLight) this.towerCrownLight.intensity = 0.2;
      if (this.towerDeckLights) this.towerDeckLights.forEach(l => l.intensity = 0.0);
    } else if (mode === 'night') {
      this.scene.background = new THREE.Color(0x070b16);
      if (this.scene.fog) {
        this.scene.fog.color = new THREE.Color(0x070b16);
        this.scene.fog.density = 0.005;
      }
      if (this.ambientLight) {
        this.ambientLight.color.setHex(0x1e293b);
        this.ambientLight.intensity = 0.6;
      }
      if (this.dirLight) {
        this.dirLight.color.setHex(0x38bdf8);
        this.dirLight.intensity = 0.4;
        this.dirLight.position.set(30, 70, 40);
      }
      if (this.streetLights) {
        this.streetLights.forEach(l => l.intensity = 2.0);
      }
      if (this.groundLightPools) {
        this.groundLightPools.forEach(p => { p.material.opacity = 0.55; });
      }
      if (this.lampHeadMat) {
        this.lampHeadMat.emissiveIntensity = 2.0;
      }
      if (this.buildingMaterials) {
        this.buildingMaterials.forEach(m => { if (m.emissive) m.emissiveIntensity = 0.9; });
      }
      if (this.matTowerGlass) this.matTowerGlass.emissiveIntensity = 0.95;
      if (this.matTowerAccent) this.matTowerAccent.emissiveIntensity = 1.8;
      if (this.towerCrownLight) this.towerCrownLight.intensity = 2.8;
      if (this.towerDeckLights) this.towerDeckLights.forEach(l => l.intensity = 1.0);
    } else {
      // Dusk
      this.scene.background = new THREE.Color(0x0f172a);
      if (this.scene.fog) {
        this.scene.fog.color = new THREE.Color(0x0f172a);
        this.scene.fog.density = 0.004;
      }
      if (this.ambientLight) {
        this.ambientLight.color.setHex(0xf97316);
        this.ambientLight.intensity = 1.0;
      }
      if (this.dirLight) {
        this.dirLight.color.setHex(0xfb923c);
        this.dirLight.intensity = 1.1;
        this.dirLight.position.set(80, 40, 20);
      }
      if (this.streetLights) {
        this.streetLights.forEach(l => l.intensity = 1.4);
      }
      if (this.groundLightPools) {
        this.groundLightPools.forEach(p => { p.material.opacity = 0.35; });
      }
      if (this.lampHeadMat) {
        this.lampHeadMat.emissiveIntensity = 1.4;
      }
      if (this.buildingMaterials) {
        this.buildingMaterials.forEach(m => { if (m.emissive) m.emissiveIntensity = 0.6; });
      }
      if (this.matTowerGlass) this.matTowerGlass.emissiveIntensity = 0.65;
      if (this.matTowerAccent) this.matTowerAccent.emissiveIntensity = 1.2;
      if (this.towerCrownLight) this.towerCrownLight.intensity = 1.6;
      if (this.towerDeckLights) this.towerDeckLights.forEach(l => l.intensity = 0.7);
    }
  }

  initVehicleAssets() {
    // Shared Geometries for maximum 60 FPS performance
    this.carWheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.28, 14);
    this.carRimGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.29, 10);
    this.busWheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.38, 16);
    this.busRimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.39, 10);
    this.bikeWheelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.08, 12);
    this.bicycleWheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.04, 12);
    this.vanBodyGeo = new THREE.BoxGeometry(2.1, 1.8, 4.8);

    // Shared Materials
    this.tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9, metalness: 0.1 });
    this.rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.25 });
    this.darkGlassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.15, metalness: 0.85, transparent: true, opacity: 0.88 });
    this.headlightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.8 });
    this.taillightMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.8 });
    this.chromeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.95, roughness: 0.1 });
    this.taxiSignMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 1.6 });
    this.busLedMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.8 });
    this.riderMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    this.helmetMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.2 });
  }

  createCarModel(color, variant = 'sedan', isTaxi = false) {
    const car = new THREE.Group();

    // Body Paint Material
    const paintMat = new THREE.MeshStandardMaterial({
      color: isTaxi ? 0xfacc15 : color,
      metalness: 0.55,
      roughness: 0.25
    });

    const isSUV = variant === 'suv';
    const isHatch = variant === 'hatchback';

    // Lower Chassis with variant sizing
    const chassisW = isSUV ? 2.0 : isHatch ? 1.8 : 1.85;
    const chassisH = isSUV ? 0.65 : isHatch ? 0.48 : 0.52;
    const chassisL = isSUV ? 4.1 : isHatch ? 3.4 : 3.8;
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(chassisW, chassisH, chassisL), paintMat);
    chassis.position.y = isSUV ? 0.52 : 0.45;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    car.add(chassis);

    // Cabin Greenhouse
    const cabinW = isSUV ? 1.68 : isHatch ? 1.45 : 1.5;
    const cabinH = isSUV ? 0.65 : isHatch ? 0.48 : 0.5;
    const cabinL = isSUV ? 2.4 : isHatch ? 1.7 : 2.0;
    const cabinZ = isSUV ? -0.2 : isHatch ? -0.35 : -0.15;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(cabinW, cabinH, cabinL), this.darkGlassMat);
    cabin.position.set(0, isSUV ? 1.05 : 0.92, cabinZ);
    cabin.castShadow = true;
    car.add(cabin);

    // Roof Panel
    const roof = new THREE.Mesh(new THREE.BoxGeometry(cabinW - 0.04, 0.08, cabinL - 0.15), paintMat);
    roof.position.set(0, isSUV ? 1.38 : 1.18, cabinZ);
    car.add(roof);

    // Roof Rails for SUV
    if (isSUV) {
      [-0.75, 0.75].forEach(rx => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 2.1), this.chromeMat);
        rail.position.set(rx, 1.44, cabinZ);
        car.add(rail);
      });
    }

    // 4 Wheels (with rims)
    const wheelY = isSUV ? 0.4 : 0.35;
    const wheelZOffset = isSUV ? 1.25 : isHatch ? 1.0 : 1.15;
    const wheelXOffset = isSUV ? 1.02 : 0.94;
    const wheelPositions = [
      [-wheelXOffset, wheelY, wheelZOffset],
      [wheelXOffset, wheelY, wheelZOffset],
      [-wheelXOffset, wheelY, -wheelZOffset],
      [wheelXOffset, wheelY, -wheelZOffset]
    ];
    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(this.carWheelGeo, this.tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = true;
      car.add(wheel);

      const rim = new THREE.Mesh(this.carRimGeo, this.rimMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(wx, wy, wz);
      car.add(rim);
    });

    // Dual Front Headlights
    const frontZ = chassisL / 2 + 0.02;
    [-0.65, 0.65].forEach(hx => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.06), this.headlightMat);
      hl.position.set(hx, isSUV ? 0.62 : 0.5, frontZ);
      car.add(hl);
    });

    // Dual Rear Taillights
    const rearZ = -(chassisL / 2 + 0.02);
    const taillights = [];
    [-0.65, 0.65].forEach(tx => {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.06), this.taillightMat);
      tl.position.set(tx, isSUV ? 0.62 : 0.5, rearZ);
      car.add(tl);
      taillights.push(tl);
    });
    car.userData.taillights = taillights;

    // Taxi roof sign & livery
    if (isTaxi) {
      const sign = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.22, 0.32), this.taxiSignMat);
      sign.position.set(0, 1.32, -0.15);
      car.add(sign);

      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(1.88, 0.12, 3.6),
        new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 })
      );
      stripe.position.set(0, 0.46, 0);
      car.add(stripe);
    }

    return car;
  }

  createMotorcycleModel(color) {
    const moto = new THREE.Group();
    const paintMat = new THREE.MeshStandardMaterial({ color: color || 0xef4444, metalness: 0.7, roughness: 0.2 });

    // Streamlined body frame & fuel tank
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 1.8), paintMat);
    frame.position.y = 0.48;
    frame.castShadow = true;
    moto.add(frame);

    // Front Fork
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6), this.chromeMat);
    fork.rotation.x = -0.3;
    fork.position.set(0, 0.5, 0.7);
    moto.add(fork);

    // Handlebars
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.06, 0.06), this.chromeMat);
    handle.position.set(0, 0.85, 0.6);
    moto.add(handle);

    // 2 Wheels (Front & Rear)
    [0.75, -0.75].forEach(wz => {
      const wheel = new THREE.Mesh(this.bikeWheelGeo, this.tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(0, 0.3, wz);
      wheel.castShadow = true;
      moto.add(wheel);
    });

    // Headlight & Taillight
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.05), this.headlightMat);
    hl.position.set(0, 0.7, 0.92);
    moto.add(hl);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.05), this.taillightMat);
    tl.position.set(0, 0.55, -0.92);
    moto.add(tl);
    moto.userData.taillight = tl;

    // 3D Rider Silhouette with Helmet
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.3), this.riderMat);
    torso.position.set(0, 0.95, -0.1);
    torso.rotation.x = 0.2;
    moto.add(torso);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), this.helmetMat);
    helmet.position.set(0, 1.35, 0.05);
    moto.add(helmet);

    moto.userData.isTwoWheeler = true;
    return moto;
  }

  createScooterModel(color) {
    const scooter = new THREE.Group();
    const paintMat = new THREE.MeshStandardMaterial({ color: color || 0x06b6d4, metalness: 0.5, roughness: 0.3 });

    // Step-through floorboard
    const floor = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.9), paintMat);
    floor.position.set(0, 0.25, 0.1);
    scooter.add(floor);

    // Front Fairing / Apron
    const frontShield = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.65, 0.12), paintMat);
    frontShield.position.set(0, 0.6, 0.6);
    frontShield.rotation.x = -0.15;
    scooter.add(frontShield);

    // Rear engine cover & Seat
    const rearSeat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.95), paintMat);
    rearSeat.position.set(0, 0.5, -0.45);
    scooter.add(rearSeat);

    // Delivery Top Box at the back
    const topBox = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.3, 0.35), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    topBox.position.set(0, 0.8, -0.85);
    scooter.add(topBox);

    // 2 Wheels
    [0.65, -0.65].forEach(wz => {
      const wheel = new THREE.Mesh(this.bikeWheelGeo, this.tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(0, 0.26, wz);
      wheel.castShadow = true;
      scooter.add(wheel);
    });

    // Headlight & Taillight
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.05), this.headlightMat);
    hl.position.set(0, 0.85, 0.62);
    scooter.add(hl);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.05), this.taillightMat);
    tl.position.set(0, 0.52, -0.98);
    scooter.add(tl);
    scooter.userData.taillight = tl;

    // Upright Rider with Helmet
    const rider = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.52, 0.28), this.riderMat);
    rider.position.set(0, 0.98, -0.3);
    scooter.add(rider);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 8), this.helmetMat);
    helmet.position.set(0, 1.38, -0.28);
    scooter.add(helmet);

    scooter.userData.isTwoWheeler = true;
    return scooter;
  }

  createBicycleModel(color) {
    const bike = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: color || 0x10b981, metalness: 0.8, roughness: 0.2 });

    // Diamond Tube Frame
    const topTube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 6), frameMat);
    topTube.rotation.x = Math.PI / 2;
    topTube.position.set(0, 0.65, 0);
    bike.add(topTube);

    const downTube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 6), frameMat);
    downTube.rotation.x = -0.7;
    downTube.position.set(0, 0.45, 0.15);
    bike.add(downTube);

    // 2 Spoked Wheels
    [0.6, -0.6].forEach(wz => {
      const wheel = new THREE.Mesh(this.bicycleWheelGeo, this.tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(0, 0.28, wz);
      bike.add(wheel);
    });

    // Handlebars
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.04), this.chromeMat);
    handle.position.set(0, 0.78, 0.45);
    bike.add(handle);

    // Headlight & Reflector
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), this.headlightMat);
    hl.position.set(0, 0.74, 0.5);
    bike.add(hl);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), this.taillightMat);
    tl.position.set(0, 0.6, -0.5);
    bike.add(tl);
    bike.userData.taillight = tl;

    // Cyclist
    const cyclist = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.48, 0.25), this.riderMat);
    cyclist.position.set(0, 0.92, -0.1);
    cyclist.rotation.x = 0.25;
    bike.add(cyclist);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), this.helmetMat);
    helmet.position.set(0, 1.28, 0.02);
    bike.add(helmet);

    bike.userData.isTwoWheeler = true;
    return bike;
  }

  createVanModel(color) {
    const van = new THREE.Group();
    const paintMat = new THREE.MeshStandardMaterial({
      color: color || 0x64748b,
      metalness: 0.5,
      roughness: 0.3
    });

    // Main Box Body
    const body = new THREE.Mesh(this.vanBodyGeo, paintMat);
    body.position.y = 1.15;
    body.castShadow = true;
    body.receiveShadow = true;
    van.add(body);

    // Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.65, 0.1), this.darkGlassMat);
    windshield.position.set(0, 1.35, 2.38);
    windshield.rotation.x = -0.15;
    van.add(windshield);

    // 4 Wheels
    [
      [-1.0, 0.38, 1.4], [1.0, 0.38, 1.4],
      [-1.0, 0.38, -1.4], [1.0, 0.38, -1.4]
    ].forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(this.carWheelGeo, this.tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      van.add(wheel);

      const rim = new THREE.Mesh(this.carRimGeo, this.rimMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(wx, wy, wz);
      van.add(rim);
    });

    // Headlights & Taillights
    [-0.75, 0.75].forEach(hx => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.06), this.headlightMat);
      hl.position.set(hx, 0.65, 2.42);
      van.add(hl);
    });

    const taillights = [];
    [-0.75, 0.75].forEach(tx => {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.45, 0.06), this.taillightMat);
      tl.position.set(tx, 0.85, -2.42);
      van.add(tl);
      taillights.push(tl);
    });
    van.userData.taillights = taillights;

    return van;
  }

  createBusModel(color) {
    const bus = new THREE.Group();

    const busPaintMat = new THREE.MeshStandardMaterial({
      color: color || 0x0284c7,
      metalness: 0.45,
      roughness: 0.35
    });

    // Main Extended Transit Coach Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.1, 7.8), busPaintMat);
    body.position.y = 1.45;
    body.castShadow = true;
    body.receiveShadow = true;
    bus.add(body);

    // Wrap-around Panoramic Window Band
    const windowBand = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.85, 6.8), this.darkGlassMat);
    windowBand.position.set(0, 1.6, -0.1);
    bus.add(windowBand);

    // Front Windshield
    const frontWindshield = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.95, 0.1), this.darkGlassMat);
    frontWindshield.position.set(0, 1.55, 3.86);
    frontWindshield.rotation.x = -0.12;
    bus.add(frontWindshield);

    // Front Destination LED Display ("METRO TRANSIT")
    const destScreen = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.3, 0.08), this.busLedMat);
    destScreen.position.set(0, 2.15, 3.87);
    bus.add(destScreen);

    // Rooftop HVAC Air Intake Units
    [-1.6, 1.6].forEach(pz => {
      const hvac = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.3, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 })
      );
      hvac.position.set(0, 2.6, pz);
      bus.add(hvac);
    });

    // 6 Heavy Wheels with dual rear axles
    const busAxles = [
      [-1.18, 0.48, 2.4], [1.18, 0.48, 2.4],
      [-1.18, 0.48, -1.8], [1.18, 0.48, -1.8],
      [-1.18, 0.48, -2.9], [1.18, 0.48, -2.9]
    ];
    busAxles.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(this.busWheelGeo, this.tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = true;
      bus.add(wheel);

      const rim = new THREE.Mesh(this.busRimGeo, this.rimMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(wx, wy, wz);
      bus.add(rim);
    });

    // Headlights
    [-0.8, 0.8].forEach(hx => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.06), this.headlightMat);
      hl.position.set(hx, 0.65, 3.91);
      bus.add(hl);
    });

    // Rear Taillights
    [-0.8, 0.8].forEach(tx => {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.06), this.taillightMat);
      tl.position.set(tx, 0.9, -3.91);
      bus.add(tl);
    });

    return bus;
  }

  createTruckModel(color) {
    const truck = new THREE.Group();

    const cabPaintMat = new THREE.MeshStandardMaterial({
      color: color || 0xd97706,
      metalness: 0.6,
      roughness: 0.3
    });

    // Tractor Cab
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.2, 2.5), cabPaintMat);
    cab.position.set(0, 1.45, 2.4);
    cab.castShadow = true;
    truck.add(cab);

    // Cab Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.9, 0.1), this.darkGlassMat);
    windshield.position.set(0, 1.8, 3.66);
    truck.add(windshield);

    // Front Chrome Grille & Bumper
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.85, 0.15), this.chromeMat);
    grille.position.set(0, 0.85, 3.68);
    truck.add(grille);

    // Twin Chrome Vertical Exhaust Stacks
    [-1.05, 1.05].forEach(ex => {
      const stack = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8),
        this.chromeMat
      );
      stack.position.set(ex, 2.2, 1.05);
      truck.add(stack);
    });

    // Heavy Fifth-Wheel Chassis Rail Bed
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.4, 7.4),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.4 })
    );
    frame.position.set(0, 0.5, 0);
    truck.add(frame);

    // Logistics Cargo Shipping Container
    const containerMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.4
    });
    const container = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.5, 5.4), containerMat);
    container.position.set(0, 1.9, -1.4);
    container.castShadow = true;
    truck.add(container);

    // Corrugated Container Roof Strip
    const roofStrip = new THREE.Mesh(
      new THREE.BoxGeometry(2.44, 0.08, 5.3),
      new THREE.MeshStandardMaterial({ color: 0x475569 })
    );
    roofStrip.position.set(0, 3.16, -1.4);
    truck.add(roofStrip);

    // 6 Wheels: 2 front steer wheels + 4 rear container wheels
    const truckAxles = [
      [-1.18, 0.48, 2.4], [1.18, 0.48, 2.4],
      [-1.18, 0.48, -1.8], [1.18, 0.48, -1.8],
      [-1.18, 0.48, -3.2], [1.18, 0.48, -3.2]
    ];
    truckAxles.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(this.busWheelGeo, this.tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = true;
      truck.add(wheel);

      const rim = new THREE.Mesh(this.busRimGeo, this.rimMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(wx, wy, wz);
      truck.add(rim);
    });

    // Front Headlights
    [-0.8, 0.8].forEach(hx => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.16, 0.06), this.headlightMat);
      hl.position.set(hx, 0.65, 3.68);
      truck.add(hl);
    });

    // Rear Taillights
    [-0.8, 0.8].forEach(tx => {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.06), this.taillightMat);
      tl.position.set(tx, 0.7, -4.12);
      truck.add(tl);
    });

    return truck;
  }

  buildAmbulance() {
    this.ambulanceMesh = new THREE.Group();

    const whitePaint = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.3 });
    const redMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    // Driver Cab
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 2.0), whitePaint);
    cab.position.set(0, 1.25, 1.5);
    cab.castShadow = true;
    this.ambulanceMesh.add(cab);

    // Cab Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 0.1), this.darkGlassMat);
    windshield.position.set(0, 1.5, 2.51);
    this.ambulanceMesh.add(windshield);

    // Paramedic Medical Box Body
    const box = new THREE.Mesh(new THREE.BoxGeometry(2.35, 2.2, 3.8), whitePaint);
    box.position.set(0, 1.45, -1.3);
    box.castShadow = true;
    this.ambulanceMesh.add(box);

    // Side Red Emergency Reflective Stripes
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.37, 0.38, 3.78), redMat);
    stripe.position.set(0, 1.3, -1.3);
    this.ambulanceMesh.add(stripe);

    // Medical Red Cross Decals on both sides
    [-1.2, 1.2].forEach(cx => {
      const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.9, 0.3), redMat);
      c1.position.set(cx, 1.9, -1.3);
      this.ambulanceMesh.add(c1);

      const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.9), redMat);
      c2.position.set(cx, 1.9, -1.3);
      this.ambulanceMesh.add(c2);
    });

    // 4 Wheels
    [
      [-1.0, 0.4, 1.4], [1.0, 0.4, 1.4],
      [-1.0, 0.4, -1.6], [1.0, 0.4, -1.6]
    ].forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(this.carWheelGeo, this.tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      this.ambulanceMesh.add(wheel);

      const rim = new THREE.Mesh(this.carRimGeo, this.rimMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(wx, wy, wz);
      this.ambulanceMesh.add(rim);
    });

    // Dual Headlights
    [-0.7, 0.7].forEach(hx => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.05), this.headlightMat);
      hl.position.set(hx, 0.65, 2.52);
      this.ambulanceMesh.add(hl);
    });

    // Dual Roof Emergency Lightbars
    const barBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.3), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    barBase.position.set(0, 2.22, 1.4);
    this.ambulanceMesh.add(barBase);

    // Flashing Strobe Beacons (Red & Blue)
    this.beaconRed = new THREE.PointLight(0xff0000, 2.5, 18);
    this.beaconRed.position.set(-0.6, 2.4, 1.4);
    this.ambulanceMesh.add(this.beaconRed);

    const redLens = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.25), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    redLens.position.set(-0.6, 2.3, 1.4);
    this.ambulanceMesh.add(redLens);

    this.beaconBlue = new THREE.PointLight(0x0088ff, 2.5, 18);
    this.beaconBlue.position.set(0.6, 2.4, 1.4);
    this.ambulanceMesh.add(this.beaconBlue);

    const blueLens = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.25), new THREE.MeshBasicMaterial({ color: 0x0088ff }));
    blueLens.position.set(0.6, 2.3, 1.4);
    this.ambulanceMesh.add(blueLens);

    this.ambulanceMesh.position.set(-32, 0.1, -22);
    this.ambulanceMesh.visible = false;
    this.scene.add(this.ambulanceMesh);
  }

  buildHolographicLayers() {
    // Holographic Emergency Route Ribbon (I1 -> I3 -> I4 -> I6)
    const points = [
      new THREE.Vector3(-32, 0.3, -22),
      new THREE.Vector3(-32, 0.3, 0),
      new THREE.Vector3(32, 0.3, 0),
      new THREE.Vector3(32, 0.3, 22)
    ];
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.7, 8, false);
    this.emergencyRibbonMat = new THREE.MeshBasicMaterial({
      color: 0x059669,
      transparent: true,
      opacity: 0.0,
      wireframe: true
    });
    this.emergencyRibbon = new THREE.Mesh(tubeGeo, this.emergencyRibbonMat);
    this.scene.add(this.emergencyRibbon);

    // Density Heatmap Overlays
    this.densityRibbons = [];
    const intersections = window.TRAFFIC_DATA.intersections;
    window.TRAFFIC_DATA.roads.forEach(road => {
      const fromNode = intersections.find(n => n.id === road.from);
      const toNode = intersections.find(n => n.id === road.to);
      if (!fromNode || !toNode) return;

      const dx = toNode.x - fromNode.x;
      const dz = toNode.z - fromNode.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);

      const ribGeo = new THREE.PlaneGeometry(dist - 4, 3);
      const ribMat = new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.35,
        depthWrite: false
      });
      const ribMesh = new THREE.Mesh(ribGeo, ribMat);
      ribMesh.rotation.x = -Math.PI / 2;
      ribMesh.rotation.z = -angle;
      ribMesh.position.set((fromNode.x + toNode.x) / 2, 0.18, (fromNode.z + toNode.z) / 2);
      this.scene.add(ribMesh);
      this.densityRibbons.push({ mesh: ribMesh, roadId: road.id });
    });
  }

  buildRailway() {
    this.railGroup = new THREE.Group();

    // 1. Elevated Rail Path around North Edge and North-East Corner to South-East (Expanded City)
    const railPoints = [
      new THREE.Vector3(-90, 5.2, -62),
      new THREE.Vector3(-45, 5.2, -62),
      new THREE.Vector3(15, 5.2, -62),
      new THREE.Vector3(55, 5.2, -62),
      new THREE.Vector3(72, 5.2, -50),
      new THREE.Vector3(82, 5.2, -30),
      new THREE.Vector3(85, 5.2, -5),
      new THREE.Vector3(85, 5.2, 25),
      new THREE.Vector3(85, 5.2, 55),
      new THREE.Vector3(85, 5.2, 85)
    ];
    this.railCurve = new THREE.CatmullRomCurve3(railPoints);

    // 2. Viaduct Concrete Deck & Rails along the curve
    const segments = 120;
    const pathPoints = this.railCurve.getPoints(segments);

    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.8,
      metalness: 0.15
    });
    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.6,
      metalness: 0.2
    });
    const steelRailMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.15
    });
    const sleeperMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.9
    });

    for (let i = 0; i < segments; i++) {
      const p1 = pathPoints[i];
      const p2 = pathPoints[i + 1];
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const dir = new THREE.Vector3().subVectors(p2, p1);
      const len = dir.length();
      const angleY = Math.atan2(dir.x, dir.z);

      // Deck block
      const deck = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.6, len + 0.1), concreteMat);
      deck.position.set(mid.x, mid.y - 0.3, mid.z);
      deck.rotation.y = angleY;
      deck.receiveShadow = true;
      this.railGroup.add(deck);

      // Left & Right Safety Barriers
      [-2.2, 2.2].forEach(bx => {
        const barrier = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, len + 0.1), barrierMat);
        const bGroup = new THREE.Group();
        bGroup.position.set(mid.x, mid.y, mid.z);
        bGroup.rotation.y = angleY;
        barrier.position.set(bx, 0.35, 0);
        bGroup.add(barrier);
        this.railGroup.add(bGroup);
      });

      // Dual Steel Rails (spacing: -0.9, +0.9)
      [-0.9, 0.9].forEach(rx => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, len + 0.1), steelRailMat);
        const rGroup = new THREE.Group();
        rGroup.position.set(mid.x, mid.y + 0.08, mid.z);
        rGroup.rotation.y = angleY;
        rail.position.set(rx, 0, 0);
        rGroup.add(rail);
        this.railGroup.add(rGroup);
      });

      // Sleepers (Cross-ties)
      if (i % 2 === 0) {
        const sleeper = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 0.3), sleeperMat);
        const sGroup = new THREE.Group();
        sGroup.position.set(mid.x, mid.y + 0.02, mid.z);
        sGroup.rotation.y = angleY;
        sGroup.add(sleeper);
        this.railGroup.add(sGroup);
      }
    }

    // 3. Sturdy Concrete Support Piers (Pillars from y=0 to y=5.0)
    const pierGeo = new THREE.CylinderGeometry(0.7, 0.9, 5.0, 12);
    const pierIndices = [0, 15, 32, 48, 62, 75, 90, 105, 120];
    pierIndices.forEach(idx => {
      if (idx < pathPoints.length) {
        const pt = pathPoints[idx];
        const pier = new THREE.Mesh(pierGeo, concreteMat);
        pier.position.set(pt.x, 2.5, pt.z);
        pier.castShadow = true;
        pier.receiveShadow = true;
        this.railGroup.add(pier);

        // Pier head collar
        const collar = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.4, 2.0), concreteMat);
        collar.position.set(pt.x, 4.8, pt.z);
        this.railGroup.add(collar);
      }
    });

    // 4. Overhead Catenary Electrification Gantries
    const gantryIndices = [10, 38, 65, 95];
    gantryIndices.forEach(idx => {
      if (idx < pathPoints.length - 1) {
        const pt = pathPoints[idx];
        const ptNext = pathPoints[idx + 1];
        const dir = new THREE.Vector3().subVectors(ptNext, pt).normalize();
        const angleY = Math.atan2(dir.x, dir.z);

        const gantry = new THREE.Group();
        gantry.position.set(pt.x, pt.y, pt.z);
        gantry.rotation.y = angleY;

        [-2.3, 2.3].forEach(mx => {
          const mast = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 })
          );
          mast.position.set(mx, 1.6, 0);
          gantry.add(mast);
        });

        const beam = new THREE.Mesh(
          new THREE.BoxGeometry(4.8, 0.12, 0.15),
          new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 })
        );
        beam.position.set(0, 3.1, 0);
        gantry.add(beam);

        const drop = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        drop.position.set(0, 2.85, 0);
        gantry.add(drop);

        this.railGroup.add(gantry);
      }
    });

    // 5. Elevated Metro Station
    this.buildMetroStation(this.railGroup);

    // 6. 3-Car Animated High-Speed Metro Train
    this.buildMetroTrain();

    this.scene.add(this.railGroup);
  }

  buildMetroStation(parentGroup) {
    const stationGroup = new THREE.Group();
    stationGroup.position.set(85, 5.2, 10);

    // Station Platform Island (beside the track)
    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.4, 22),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 })
    );
    platform.position.set(-3.8, 0.1, 0);
    platform.receiveShadow = true;
    stationGroup.add(platform);

    // Tactile warning yellow edge strip
    const warningStrip = new THREE.Mesh(
      new THREE.PlaneGeometry(0.25, 21.8),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    warningStrip.rotation.x = -Math.PI / 2;
    warningStrip.position.set(-2.1, 0.32, 0);
    stationGroup.add(warningStrip);

    // Modern Glass Canopy Roof
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 0.1, 24),
      new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.65,
        roughness: 0.1,
        metalness: 0.8
      })
    );
    canopy.position.set(-3.8, 3.8, 0);
    stationGroup.add(canopy);

    // Steel Pillars
    [-8, 0, 8].forEach(pz => {
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 3.6, 8),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
      );
      col.position.set(-5.2, 1.9, pz);
      stationGroup.add(col);
    });

    // Glowing Station Sign
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.6, 8),
      new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0284c7,
        emissiveIntensity: 1.4
      })
    );
    signBoard.position.set(-2.0, 2.9, 0);
    stationGroup.add(signBoard);

    // Platform Lighting
    const platLight = new THREE.PointLight(0x38bdf8, 1.5, 18);
    platLight.position.set(-3.8, 3.0, 0);
    stationGroup.add(platLight);

    // Escalator / Elevator Access Tower to street level
    const tower = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 5.2, 4.0),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        transparent: true,
        opacity: 0.75,
        metalness: 0.9
      })
    );
    tower.position.set(-4.0, -2.5, 9);
    stationGroup.add(tower);

    parentGroup.add(stationGroup);
  }

  buildMetroTrain() {
    this.metroTrain = new THREE.Group();
    this.trainCars = [];
    this.trainProgress = 0.15;

    const leadPaint = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.7, roughness: 0.2 });
    const blueStripe = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const interiorLit = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfde047,
      emissiveIntensity: 1.2
    });

    for (let c = 0; c < 3; c++) {
      const carGroup = new THREE.Group();
      const isLead = (c === 0);
      const isTail = (c === 2);

      // Body
      const carBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, 6.2), leadPaint);
      carBody.position.y = 1.35;
      carBody.castShadow = true;
      carGroup.add(carBody);

      // Aerodynamic tapered nose
      if (isLead || isTail) {
        const noseGeo = new THREE.ConeGeometry(1.25, 1.8, 16);
        const nose = new THREE.Mesh(noseGeo, leadPaint);
        nose.rotation.x = isLead ? Math.PI / 2 : -Math.PI / 2;
        nose.position.set(0, 1.25, isLead ? 3.9 : -3.9);
        carGroup.add(nose);
      }

      // Transit cyan accent stripe
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.25, 6.0), blueStripe);
      stripe.position.set(0, 0.75, 0);
      carGroup.add(stripe);

      // Illuminated passenger windows
      [-1.22, 1.22].forEach(wx => {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6, 5.0), interiorLit);
        win.position.set(wx, 1.5, 0);
        carGroup.add(win);
      });

      // Front Headlights & Volumetric Light Beam
      if (isLead) {
        const frontHeadlight = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.1), this.headlightMat);
        frontHeadlight.position.set(0, 1.1, 4.4);
        carGroup.add(frontHeadlight);

        this.trainSpotlight = new THREE.SpotLight(0xffffff, 3.5, 35, Math.PI / 6, 0.3);
        this.trainSpotlight.position.set(0, 1.2, 4.5);
        this.trainSpotlightTarget = new THREE.Object3D();
        this.trainSpotlightTarget.position.set(0, 0.5, 18);
        carGroup.add(this.trainSpotlightTarget);
        this.trainSpotlight.target = this.trainSpotlightTarget;
        carGroup.add(this.trainSpotlight);
      }

      // Rear Taillights
      if (isTail) {
        const rearLight = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.1), this.taillightMat);
        rearLight.position.set(0, 1.1, -4.4);
        carGroup.add(rearLight);
      }

      // Roof Pantograph
      if (isLead || isTail) {
        const panto = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6),
          new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 })
        );
        panto.position.set(0, 2.7, isLead ? -1.5 : 1.5);
        carGroup.add(panto);

        const headBar = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 0.08, 0.15),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8 })
        );
        headBar.position.set(0, 3.15, isLead ? -1.5 : 1.5);
        carGroup.add(headBar);
      }

      this.metroTrain.add(carGroup);
      this.trainCars.push(carGroup);
    }

    this.scene.add(this.metroTrain);
  }

  updateTrain(dt) {
    if (!this.railCurve || !this.trainCars || this.trainCars.length === 0) return;

    // Advance train progress along track curve smoothly
    const speed = 0.035;
    this.trainProgress = (this.trainProgress + dt * speed) % 1.0;

    const carSpacing = 0.046;

    this.trainCars.forEach((car, index) => {
      let t = (this.trainProgress + (1 - index) * carSpacing) % 1.0;
      if (t < 0) t += 1.0;

      const pos = this.railCurve.getPointAt(t);
      const tangent = this.railCurve.getTangentAt(t).normalize();

      car.position.set(pos.x, pos.y, pos.z);
      const angleY = Math.atan2(tangent.x, tangent.z);
      car.rotation.y = angleY;
    });
  }

  setCameraPreset(preset, animate = true) {
    this.cameraPreset = preset;
    const presets = {
      overview: { pos: new THREE.Vector3(0, 125, 105), look: new THREE.Vector3(0, 0, 0) },
      network: { pos: new THREE.Vector3(0, 145, 30), look: new THREE.Vector3(0, 0, 0) },
      focus_I4: { pos: new THREE.Vector3(45, 32, 30), look: new THREE.Vector3(32, 2, 0) },
      emergency: { pos: new THREE.Vector3(-15, 55, 45), look: new THREE.Vector3(0, 0, 0) },
      optimizer: { pos: new THREE.Vector3(-35, 75, 75), look: new THREE.Vector3(0, 5, 0) },
      railway: { pos: new THREE.Vector3(98, 32, 0), look: new THREE.Vector3(82, 6, 12) },
      avengers_tower: { pos: new THREE.Vector3(24, 34, 98), look: new THREE.Vector3(0, 52, 64) }
    };

    const target = presets[preset] || presets.overview;
    if (!animate) {
      this.camera.position.copy(target.pos);
      this.currentLookAt.copy(target.look);
      this.camera.lookAt(this.currentLookAt);
      this.targetCameraPos = null;
    } else {
      this.targetCameraPos = target.pos.clone();
      this.targetLookAt = target.look.clone();
    }
  }

  setLandmarkCameraStep(step) {
    this.landmarkStep = step;
    if (step === 'entrance') {
      this.targetCameraPos = new THREE.Vector3(0, 4.5, 36);
      this.targetLookAt = new THREE.Vector3(0, 8, 62);
    } else if (step === 'skyline') {
      this.targetCameraPos = new THREE.Vector3(-60, 95, 25);
      this.targetLookAt = new THREE.Vector3(0, 48, 64);
    } else {
      // 'exterior'
      this.targetCameraPos = new THREE.Vector3(24, 34, 98);
      this.targetLookAt = new THREE.Vector3(0, 52, 64);
    }
  }

  triggerLandmarkCameraSequence() {
    this.setLandmarkCameraStep('exterior');
    if (window.soundEngine) window.soundEngine.playWhoosh();
  }

  focusOnIntersection(id) {
    const node = window.TRAFFIC_DATA.intersections.find(n => n.id === id);
    if (!node) return;
    this.targetCameraPos = new THREE.Vector3(node.x + 18, 22, node.z + 24);
    this.targetLookAt = new THREE.Vector3(node.x, 2, node.z);
    this.selectedIntersection = id;
    this.updateHolographicCctv(node);
  }

  updateHolographicCctv(node) {
    if (!this.cctvHoloGroup) {
      this.cctvHoloGroup = new THREE.Group();
      this.scene.add(this.cctvHoloGroup);

      // Holographic Canvas Texture
      this.cctvCanvas = document.createElement('canvas');
      this.cctvCanvas.width = 512;
      this.cctvCanvas.height = 256;
      this.cctvTex = new THREE.CanvasTexture(this.cctvCanvas);

      // Holographic Screen Quad
      const screenGeo = new THREE.PlaneGeometry(8, 4);
      const screenMat = new THREE.MeshBasicMaterial({
        map: this.cctvTex,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide
      });
      this.holoScreen = new THREE.Mesh(screenGeo, screenMat);
      this.cctvHoloGroup.add(this.holoScreen);

      // Glowing Cyan Border Frame
      const frameGeo = new THREE.EdgesGeometry(screenGeo);
      const frameMat = new THREE.LineBasicMaterial({ color: 0x00d0f5, linewidth: 2 });
      this.holoFrame = new THREE.LineSegments(frameGeo, frameMat);
      this.cctvHoloGroup.add(this.holoFrame);

      // Vertical Laser Tether Line down to node
      const tetherGeo = new THREE.CylinderGeometry(0.06, 0.06, 14, 8);
      const tetherMat = new THREE.MeshBasicMaterial({ color: 0x00d0f5, transparent: true, opacity: 0.6 });
      this.holoTether = new THREE.Mesh(tetherGeo, tetherMat);
      this.holoTether.position.y = -8;
      this.cctvHoloGroup.add(this.holoTether);
    }

    if (!node) {
      this.cctvHoloGroup.visible = false;
      return;
    }

    this.cctvHoloGroup.visible = true;
    this.cctvHoloGroup.position.set(node.x, 15, node.z);

    // Draw dynamic HUD onto canvas
    const ctx = this.cctvCanvas.getContext('2d');
    const W = this.cctvCanvas.width;
    const H = this.cctvCanvas.height;

    ctx.fillStyle = 'rgba(7, 11, 22, 0.9)';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#00d0f5';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, W - 8, H - 8);

    // Top banner
    ctx.fillStyle = '#00d0f5';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText(`CAM-PROJECTION · ${node.id}`, 20, 36);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px "Inter", sans-serif';
    ctx.fillText(node.name, 20, 76);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px "Inter", sans-serif';
    ctx.fillText(node.district, 20, 108);

    // Signal state & queue
    const phaseColor = node.phase.includes('GREEN') ? '#10b981' : node.phase.includes('YELLOW') ? '#f59e0b' : '#ef4444';
    ctx.fillStyle = phaseColor;
    ctx.beginPath();
    ctx.arc(30, 156, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText(`PHASE: ${node.phase} (${node.phaseTimer}s)`, 52, 162);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText(`QUEUE: ${node.queueLength} veh | DENSITY: ${node.density}%`, 20, 210);

    this.cctvTex.needsUpdate = true;
  }

  setupInteractions() {
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    this.container.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    this.container.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - prevMousePos.x;
        const deltaY = e.clientY - prevMousePos.y;
        prevMousePos = { x: e.clientX, y: e.clientY };

        // Orbit camera around currentLookAt
        const offset = this.camera.position.clone().sub(this.currentLookAt);
        const radius = offset.length();
        let theta = Math.atan2(offset.x, offset.z);
        let phi = Math.acos(Math.max(0.1, Math.min(1.5, offset.y / radius)));

        theta -= deltaX * 0.008;
        phi = Math.max(0.2, Math.min(Math.PI / 2.2, phi - deltaY * 0.008));

        offset.x = radius * Math.sin(phi) * Math.sin(theta);
        offset.y = radius * Math.cos(phi);
        offset.z = radius * Math.sin(phi) * Math.cos(theta);

        this.camera.position.copy(this.currentLookAt).add(offset);
        this.camera.lookAt(this.currentLookAt);
        this.targetCameraPos = null;
      }
    });

    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.06;
      const offset = this.camera.position.clone().sub(this.currentLookAt);
      const newLen = Math.max(25, Math.min(160, offset.length() + zoomFactor));
      offset.setLength(newLen);
      this.camera.position.copy(this.currentLookAt).add(offset);
      this.targetCameraPos = null;
    }, { passive: false });

    this.container.addEventListener('click', (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);

      for (let hit of intersects) {
        if (hit.object.userData && hit.object.userData.isLandmark) {
          this.triggerLandmarkCameraSequence();
          if (this.options.onSelectLandmark) {
            this.options.onSelectLandmark();
          }
          if (window.soundEngine) window.soundEngine.playClick();
          break;
        }
        if (hit.object.userData && hit.object.userData.intersectionId) {
          const id = hit.object.userData.intersectionId;
          this.focusOnIntersection(id);
          if (this.options.onSelectIntersection) {
            this.options.onSelectIntersection(id);
          }
          if (window.soundEngine) window.soundEngine.playClick();
          break;
        }
      }
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

  updateFromSimulation(engine) {
    // 1. Update Traffic Signal Lights
    engine.intersections.forEach(inter => {
      const pole = this.signalPoles.get(inter.id);
      if (!pole) return;

      const phase = inter.phase;
      const isRed = phase.includes('RED') || (inter.isEmergencyCorridor && phase !== 'GREEN_NS');
      const isYellow = phase.includes('YELLOW');
      const isGreen = phase.includes('GREEN');

      pole.redBulb.material.emissiveIntensity = isRed ? 2.5 : 0.1;
      pole.yellowBulb.material.emissiveIntensity = isYellow ? 2.5 : 0.1;
      pole.greenBulb.material.emissiveIntensity = isGreen ? 2.5 : 0.1;

      if (isGreen) {
        pole.bulbLight.color.setHex(0x10b981);
        pole.bulbLight.intensity = 1.6;
      } else if (isYellow) {
        pole.bulbLight.color.setHex(0xf59e0b);
        pole.bulbLight.intensity = 1.4;
      } else {
        pole.bulbLight.color.setHex(0xef4444);
        pole.bulbLight.intensity = 1.2;
      }

      // Update holographic CCTV HUD if this node is selected
      if (this.selectedIntersection === inter.id) {
        this.updateHolographicCctv(inter);
      }
    });

    // 2. Update Vehicles in 3D with Smooth Easing
    const activeVehicleIds = new Set();

    engine.vehicles.forEach(v => {
      activeVehicleIds.add(v.id);
      let mesh = this.vehicleMeshes.get(v.id);

      if (!mesh) {
        if (v.type === 'bus') {
          mesh = this.createBusModel(v.color);
        } else if (v.type === 'truck') {
          mesh = this.createTruckModel(v.color);
        } else if (v.type === 'van') {
          mesh = this.createVanModel(v.color);
        } else if (v.type === 'motorcycle') {
          mesh = this.createMotorcycleModel(v.color);
        } else if (v.type === 'scooter') {
          mesh = this.createScooterModel(v.color);
        } else if (v.type === 'bicycle') {
          mesh = this.createBicycleModel(v.color);
        } else if (v.type === 'suv') {
          mesh = this.createCarModel(v.color, 'suv', false);
        } else if (v.type === 'hatchback') {
          mesh = this.createCarModel(v.color, 'hatchback', false);
        } else if (v.type === 'taxi') {
          mesh = this.createCarModel(v.color, 'sedan', true);
        } else {
          mesh = this.createCarModel(v.color, 'sedan', false);
        }
        mesh.userData = {
          vehicleId: v.id,
          type: v.type,
          isTwoWheeler: ['motorcycle', 'scooter', 'bicycle'].includes(v.type)
        };
        this.scene.add(mesh);
        this.vehicleMeshes.set(v.id, mesh);
      }

      // 1. If actively navigating an intersection Bezier turning arc:
      if (v.isTurning && v.worldX !== null && v.worldZ !== null && v.worldAngle !== null) {
        mesh.position.lerp(new THREE.Vector3(v.worldX, 0.1, v.worldZ), 0.45);
        mesh.rotation.y = -v.worldAngle + Math.PI / 2;

        // Realistic banking for two-wheelers during intersection cornering
        if (mesh.userData.isTwoWheeler) {
          const bank = Math.sin((v.turnT || 0.5) * Math.PI) * (v.turnDir * 0.14);
          mesh.rotation.z = bank;
        }

        const isBraking = v.braking || (v.currentSpeed < 0.15);
        if (mesh.userData.taillights) {
          mesh.userData.taillights.forEach(tl => {
            tl.material.emissiveIntensity = isBraking ? 3.5 : 1.2;
          });
        } else if (mesh.userData.taillight) {
          mesh.userData.taillight.material.emissiveIntensity = isBraking ? 3.5 : 1.2;
        }
      } else {
        // 2. Standard straight road lane tracking
        const fromNode = engine.intersections.find(n => n.id === v.from);
        const toNode = engine.intersections.find(n => n.id === v.to);
        if (fromNode && toNode) {
          const dx = toNode.x - fromNode.x;
          const dz = toNode.z - fromNode.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          const angle = Math.atan2(dz, dx);

          const laneOffset = v.lane === 1 ? -1.8 : 1.8;
          const perpX = -Math.sin(angle) * laneOffset;
          const perpZ = Math.cos(angle) * laneOffset;

          const posX = fromNode.x + dx * v.progress + perpX;
          const posZ = fromNode.z + dz * v.progress + perpZ;

          // Smooth positional lerp to eliminate frame stutter
          mesh.position.lerp(new THREE.Vector3(posX, 0.1, posZ), 0.35);
          mesh.rotation.y = -angle + Math.PI / 2;

          // Subtle natural bike sway
          if (mesh.userData.isTwoWheeler) {
            const bank = Math.sin(v.progress * Math.PI * 4) * 0.04;
            mesh.rotation.z = bank;
          }

          // Dynamic brake lights
          const isBraking = v.braking || (v.currentSpeed < 0.15);
          if (mesh.userData.taillights) {
            mesh.userData.taillights.forEach(tl => {
              tl.material.emissiveIntensity = isBraking ? 3.5 : 1.2;
            });
          } else if (mesh.userData.taillight) {
            mesh.userData.taillight.material.emissiveIntensity = isBraking ? 3.5 : 1.2;
          }
        }
      }
    });

    // Remove deleted vehicles
    for (let [id, mesh] of this.vehicleMeshes.entries()) {
      if (!activeVehicleIds.has(id)) {
        this.scene.remove(mesh);
        this.vehicleMeshes.delete(id);
      }
    }

    // 3. Update Ambulance
    if (engine.isEmergencyActive && engine.ambulance.active) {
      this.ambulanceMesh.visible = true;
      this.ambulanceMesh.position.lerp(new THREE.Vector3(engine.ambulance.x, 0.1, engine.ambulance.z), 0.4);

      // Strobe beacon alternate flashing
      const time = performance.now() * 0.01;
      this.beaconRed.intensity = Math.sin(time) > 0 ? 3.2 : 0.2;
      this.beaconBlue.intensity = Math.sin(time) <= 0 ? 3.2 : 0.2;

      this.emergencyRibbonMat.opacity = this.activeLayers.emergency ? (0.6 + Math.sin(time * 0.5) * 0.3) : 0;
    } else {
      this.ambulanceMesh.visible = false;
      this.emergencyRibbonMat.opacity = 0;
    }

    // 4. Update Incidents
    this.accidentGroup.visible = !!(engine.activeIncident && engine.activeIncident.type === 'accident');
    if (this.accidentGroup.visible) {
      this.accidentStrobe.intensity = Math.sin(performance.now() * 0.012) > 0 ? 3.5 : 0.4;
    }

    this.closureGroup.visible = engine.closedRoads.has('R_2_4');

    // 5. Update Holographic Density Ribbons
    this.densityRibbons.forEach(rib => {
      const road = engine.roads.find(r => r.id === rib.roadId);
      if (road && this.activeLayers.density) {
        rib.mesh.visible = true;
        if (road.congestion === 'critical' || road.closed) {
          rib.mesh.material.color.setHex(0xef4444);
          rib.mesh.material.opacity = 0.55;
        } else if (road.congestion === 'high') {
          rib.mesh.material.color.setHex(0xf59e0b);
          rib.mesh.material.opacity = 0.45;
        } else {
          rib.mesh.material.color.setHex(0x0284c7);
          rib.mesh.material.opacity = 0.25;
        }
      } else {
        rib.mesh.visible = false;
      }
    });

    // 6. Update Floating Holographic Optimization Banner
    if (this.optimizationBanner) {
      this.optimizationBanner.visible = !!engine.autoOptimizeEnabled;
      if (engine.autoOptimizerStatus === 'OPTIMIZING') {
        this.updateOptimizationBannerText(
          '⚡ QUANTUM OPTIMIZER · DISPATCHING QUBO',
          'Evaluating 16-State Traffic Tensor | IBM Eagle QPU Solver'
        );
      } else if (engine.autoOptimizerStatus === 'COOLDOWN') {
        this.updateOptimizationBannerText(
          '🤖 QUANTUM AUTO-PILOT · ACTIVE',
          `Cooldown Lockout: ${Math.ceil(engine.optimizationCooldownTimer)}s Remaining | 6 Hubs Monitored`
        );
      } else {
        this.updateOptimizationBannerText(
          '🤖 QUANTUM AUTO-PILOT · ENGAGED',
          'Autonomous Network Surveillance | Real-Time QAOA Timing Synthesis'
        );
      }
    }
  }

  animate() {
    if (this.isDisposed) return;
    this.animFrameId = requestAnimationFrame(() => this.animate());

    const now = performance.now();
    const dt = Math.min(0.1, (now - (this.lastTime || now)) * 0.001);
    this.lastTime = now;

    // Smooth Camera Transition
    if (this.targetCameraPos) {
      this.camera.position.lerp(this.targetCameraPos, 0.05);
      this.currentLookAt.lerp(this.targetLookAt, 0.05);
      this.camera.lookAt(this.currentLookAt);

      if (this.camera.position.distanceTo(this.targetCameraPos) < 0.2) {
        this.targetCameraPos = null;
      }
    }

    // Update 3D Metro Train along the corner railway viaduct
    this.updateTrain(dt);

    // Tree Canopy Natural Wind Sway
    if (this.treeCanopies && this.treeCanopies.length > 0) {
      this.treeCanopies.forEach(tc => {
        tc.mesh.rotation.z = tc.baseRotZ + Math.sin(now * 0.0018 + tc.phase) * 0.032;
        tc.mesh.rotation.x = tc.baseRotX + Math.cos(now * 0.0014 + tc.phase) * 0.024;
      });
    }

    // Blinking Aeronautical Obstruction Beacons on Rooftop Antennas
    if (this.antennaLights && this.antennaLights.length > 0) {
      const isNightOrDusk = (this.timeOfDay === 'night' || this.timeOfDay === 'dusk');
      const beaconOn = (Math.floor(now * 0.002) % 2 === 0);
      this.antennaLights.forEach(light => {
        light.intensity = isNightOrDusk ? (beaconOn ? 2.5 : 0.05) : 0.0;
      });
    }

    // Optimization Banner Floating Hover
    if (this.optimizationBanner && this.optimizationBanner.visible) {
      this.optimizationBanner.position.y = 36 + Math.sin(now * 0.0022) * 0.7;
      this.optimizationBanner.lookAt(this.camera.position);
    }

    // Subtle floating animation for holographic CCTV screen
    if (this.cctvHoloGroup && this.cctvHoloGroup.visible) {
      this.cctvHoloGroup.position.y = 15 + Math.sin(now * 0.003) * 0.4;
      this.holoScreen.lookAt(this.camera.position);
      this.holoFrame.lookAt(this.camera.position);
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.isDisposed = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }

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

    // Clean up cached procedural textures and dynamic light arrays
    if (this.texOffice) this.texOffice.dispose();
    if (this.texResidential) this.texResidential.dispose();
    if (this.texTech) this.texTech.dispose();
    if (this.texHospital) this.texHospital.dispose();
    if (this.texArrowLeft) this.texArrowLeft.dispose();
    if (this.texArrowStraight) this.texArrowStraight.dispose();
    if (this.texArrowRight) this.texArrowRight.dispose();
    this.antennaLights = [];
    this.towerDeckLights = [];
    this.treeCanopies = [];
    this.streetLights = [];
    this.groundLightPools = [];
    if (this.matTowerGlass) this.matTowerGlass.dispose();
    if (this.matTowerArmor) this.matTowerArmor.dispose();
    if (this.matTowerAccent) this.matTowerAccent.dispose();
    if (this.matDeckFloor) this.matDeckFloor.dispose();
  }
}

window.TrafficCity3D = TrafficCity3D;
