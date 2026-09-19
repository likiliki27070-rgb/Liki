/**
 * Q-FLOW — Quantum-Enhanced Adaptive Urban Traffic Intelligence
 * Premium Cinematic Logo Animation & 10-Scene Digital Twin Presentation Engine
 * 
 * Preserves the exact source logo (assets/qflow_logo.jpg) without distortion,
 * rendering volumetric atmosphere, metallic reflections, quantum energy nodes,
 * 3D procedural digital twin city, and seamless transitions into the command center.
 */

(function(window) {
  'use strict';

  class QFlowCinematicEngine {
    constructor(canvasId, options = {}) {
      this.canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
      if (!this.canvas) {
        console.warn('QFlowCinematicEngine: Canvas element not found', canvasId);
        return;
      }
      this.ctx = this.canvas.getContext('2d');
      this.options = Object.assign({
        theme: 'dark',
        autoPlay: true,
        loop: false,
        onSceneChange: null,
        onComplete: null,
        logoSrc: 'assets/qflow_logo.jpg'
      }, options);

      this.currentTime = 0; // in seconds
      this.isPlaying = this.options.autoPlay;
      this.animationFrameId = null;
      this.lastTimestamp = null;
      this.currentScene = 1;
      this.totalDuration = 32.0;

      // Scenes timeline (seconds start time)
      this.sceneTimes = [
        { id: 1, start: 0.0, end: 3.0, title: "Darkness & Anticipation" },
        { id: 2, start: 3.0, end: 7.0, title: "Logo Emergence" },
        { id: 3, start: 7.0, end: 11.0, title: "Quantum Energy Activation" },
        { id: 4, start: 11.0, end: 14.0, title: "Logo Transformation" },
        { id: 5, start: 14.0, end: 17.0, title: "Digital City Reveal" },
        { id: 6, start: 17.0, end: 20.0, title: "Traffic Intelligence Telemetry" },
        { id: 7, start: 20.0, end: 23.0, title: "Quantum Optimization Pipeline" },
        { id: 8, start: 23.0, end: 26.0, title: "Adaptive Green Wave Optimization" },
        { id: 9, start: 26.0, end: 29.0, title: "Emergency Green Corridor" },
        { id: 10, start: 29.0, end: 32.0, title: "Final Brand Identity & Launch" }
      ];

      // Audio trigger markers to prevent duplicate fires
      this.triggeredAudio = new Set();

      // Load Exact Source Logo
      this.logoImage = new Image();
      this.logoLoaded = false;
      this.logoImage.onload = () => {
        this.logoLoaded = true;
      };
      this.logoImage.onerror = () => {
        // Fallback to limo_logo.jpg
        this.logoImage.src = 'assets/limo_logo.jpg';
      };
      this.logoImage.src = this.options.logoSrc;

      // Init Particle Systems
      this.particles = [];
      this.initParticles(160);

      // Procedural City Grid for Scenes 5, 6, 8, 9
      this.cityNodes = [];
      this.cityRoads = [];
      this.cityVehicles = [];
      this.cityBuildings = [];
      this.initDigitalCity();

      // Setup Canvas Sizing
      this.handleResize = this.resize.bind(this);
      window.addEventListener('resize', this.handleResize);
      this.resize();

      // Start loop
      this.animate = this.render.bind(this);
      this.animationFrameId = requestAnimationFrame(this.animate);
    }

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.width = rect.width || window.innerWidth;
      this.height = rect.height || window.innerHeight;
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    initParticles(count) {
      this.particles = [];
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: (Math.random() - 0.5) * 1000,
          y: (Math.random() - 0.5) * 1000,
          z: Math.random() * 800 + 100, // 3D depth
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          vz: -Math.random() * 0.8 - 0.2,
          radius: Math.random() * 1.8 + 0.6,
          baseAlpha: Math.random() * 0.6 + 0.2,
          hue: Math.random() > 0.6 ? 190 : (Math.random() > 0.4 ? 215 : 270) // Cyan, Electric Blue, Violet
        });
      }
    }

    initDigitalCity() {
      // 8 Urban Digital Twin Intersections (I1 to I8)
      this.cityNodes = [
        { id: 'I1', label: 'I1 North Gateway', x: -280, y: -160, signal: 'green' },
        { id: 'I2', label: 'I2 North-East Hub', x: 0, y: -160, signal: 'green' },
        { id: 'I3', label: 'I3 Commercial Blvd', x: -280, y: 0, signal: 'yellow' },
        { id: 'I4', label: 'I4 Financial Plaza', x: 0, y: 0, signal: 'green' },
        { id: 'I5', label: 'I5 Eastern Terminal', x: 280, y: 0, signal: 'red' },
        { id: 'I6', label: 'I6 Hospital Hub', x: 0, y: 160, signal: 'green' },
        { id: 'I7', label: 'I7 South Arterial', x: -280, y: 160, signal: 'red' },
        { id: 'I8', label: 'I8 Metro Center', x: 280, y: 160, signal: 'green' }
      ];

      // Roads Connecting Intersections
      this.cityRoads = [
        { from: 'I1', to: 'I2' },
        { from: 'I1', to: 'I3' },
        { from: 'I2', to: 'I4' },
        { from: 'I3', to: 'I4' },
        { from: 'I4', to: 'I5' },
        { from: 'I3', to: 'I7' },
        { from: 'I4', to: 'I6' },
        { from: 'I5', to: 'I8' },
        { from: 'I7', to: 'I6' },
        { from: 'I6', to: 'I8' }
      ];

      // Procedural 3D Buildings
      this.cityBuildings = [];
      const blocks = [-380, -180, 100, 300];
      for (let bx of blocks) {
        for (let by of [-240, -80, 80, 220]) {
          this.cityBuildings.push({
            x: bx + (Math.random() - 0.5) * 40,
            y: by + (Math.random() - 0.5) * 40,
            w: 50 + Math.random() * 40,
            h: 50 + Math.random() * 40,
            height: 60 + Math.random() * 140,
            windowsHue: Math.random() > 0.5 ? 195 : 220
          });
        }
      }

      // Vehicles on roads
      this.cityVehicles = [];
      for (let i = 0; i < 48; i++) {
        const road = this.cityRoads[Math.floor(Math.random() * this.cityRoads.length)];
        this.cityVehicles.push({
          road,
          progress: Math.random(),
          speed: 0.003 + Math.random() * 0.004,
          isReverse: Math.random() > 0.5,
          color: Math.random() > 0.25 ? '#38bdf8' : (Math.random() > 0.5 ? '#f43f5e' : '#ffffff'),
          tailLength: 14 + Math.random() * 12
        });
      }
    }

    seekToTime(seconds) {
      this.currentTime = Math.max(0, Math.min(this.totalDuration, seconds));
      this.updateCurrentScene();
    }

    seekToScene(sceneNum) {
      const target = this.sceneTimes.find(s => s.id === sceneNum);
      if (target) {
        this.seekToTime(target.start + 0.05);
      }
    }

    play() {
      this.isPlaying = true;
      this.lastTimestamp = null;
    }

    pause() {
      this.isPlaying = false;
    }

    togglePlay() {
      if (this.isPlaying) this.pause();
      else this.play();
      return this.isPlaying;
    }

    updateCurrentScene() {
      const active = this.sceneTimes.find(s => this.currentTime >= s.start && this.currentTime < s.end);
      const newSceneId = active ? active.id : 10;
      if (newSceneId !== this.currentScene) {
        this.currentScene = newSceneId;
        if (typeof this.options.onSceneChange === 'function') {
          this.options.onSceneChange(this.currentScene, active);
        }
        this.triggerSceneAudio(this.currentScene);
      }
    }

    triggerSceneAudio(scene) {
      if (!window.soundEngine || window.soundEngine.isMuted) return;

      const marker = `scene_${scene}`;
      if (this.triggeredAudio.has(marker)) return;
      this.triggeredAudio.add(marker);

      try {
        switch (scene) {
          case 1:
            if (window.soundEngine.startAmbient) window.soundEngine.startAmbient();
            break;
          case 2:
            if (window.soundEngine.playCinematicRiser) window.soundEngine.playCinematicRiser();
            setTimeout(() => {
              if (window.soundEngine.playLogoImpact) window.soundEngine.playLogoImpact();
            }, 2500);
            break;
          case 3:
            if (window.soundEngine.playQuantumChime) window.soundEngine.playQuantumChime();
            break;
          case 4:
            if (window.soundEngine.playDataStream) window.soundEngine.playDataStream();
            break;
          case 6:
            if (window.soundEngine.playDataStream) window.soundEngine.playDataStream();
            break;
          case 7:
            if (window.soundEngine.playQuantumChime) window.soundEngine.playQuantumChime();
            break;
          case 8:
            if (window.soundEngine.playClick) window.soundEngine.playClick();
            break;
          case 9:
            if (window.soundEngine.playEmergencySiren) window.soundEngine.playEmergencySiren();
            if (window.soundEngine.playCorridorActivation) window.soundEngine.playCorridorActivation();
            break;
          case 10:
            if (window.soundEngine.playLogoImpact) window.soundEngine.playLogoImpact();
            break;
        }
      } catch (e) {}
    }

    render(timestamp) {
      if (!this.lastTimestamp) this.lastTimestamp = timestamp;
      const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
      this.lastTimestamp = timestamp;

      if (this.isPlaying) {
        this.currentTime += dt;
        if (this.currentTime >= this.totalDuration) {
          if (this.options.loop) {
            this.currentTime = 0;
            this.triggeredAudio.clear();
          } else {
            this.currentTime = this.totalDuration;
            this.isPlaying = false;
            if (typeof this.options.onComplete === 'function') {
              this.options.onComplete();
            }
          }
        }
        this.updateCurrentScene();
      }

      // Clear Frame with Deep Contrast Cinematic Background
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.save();
      ctx.fillStyle = '#030712'; // Deep space black-slate
      ctx.fillRect(0, 0, w, h);

      // Render Scene Dispatcher
      const t = this.currentTime;
      if (t < 3.0) {
        this.renderScene1Darkness(t / 3.0);
      } else if (t < 7.0) {
        this.renderScene2LogoEmergence((t - 3.0) / 4.0);
      } else if (t < 11.0) {
        this.renderScene3QuantumEnergy((t - 7.0) / 4.0);
      } else if (t < 14.0) {
        this.renderScene4Transformation((t - 11.0) / 3.0);
      } else if (t < 17.0) {
        this.renderScene5DigitalCityReveal((t - 14.0) / 3.0);
      } else if (t < 20.0) {
        this.renderScene6TrafficIntelligence((t - 17.0) / 3.0);
      } else if (t < 23.0) {
        this.renderScene7QuantumOptimization((t - 20.0) / 3.0);
      } else if (t < 26.0) {
        this.renderScene8AdaptiveTraffic((t - 23.0) / 3.0);
      } else if (t < 29.0) {
        this.renderScene9EmergencyCorridor((t - 26.0) / 3.0);
      } else {
        this.renderScene10FinalLogoReveal((t - 29.0) / 3.0);
      }

      ctx.restore();

      this.animationFrameId = requestAnimationFrame(this.animate);
    }

    // ----------------------------------------------------
    // SCENE 1 — DARKNESS (0 - 3s)
    // ----------------------------------------------------
    renderScene1Darkness(p) {
      const ctx = this.ctx;
      const cx = this.width / 2;
      const cy = this.height / 2;

      // Faint central ambient glow slowly rises
      const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 320);
      glow.addColorStop(0, `rgba(14, 116, 144, ${0.18 * p})`);
      glow.addColorStop(0.5, `rgba(3, 7, 18, ${0.08 * p})`);
      glow.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, this.width, this.height);

      // Atmospheric micro particles drifting slowly
      this.drawFloatingParticles(0.3 * p, 0.4);

      // Cinematic Haze
      const haze = ctx.createLinearGradient(0, this.height, 0, this.height - 180);
      haze.addColorStop(0, `rgba(8, 24, 48, ${0.35 * p})`);
      haze.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = haze;
      ctx.fillRect(0, this.height - 180, this.width, 180);
    }

    // ----------------------------------------------------
    // SCENE 2 — LOGO EMERGENCE (3 - 7s)
    // ----------------------------------------------------
    renderScene2LogoEmergence(p) {
      const ctx = this.ctx;
      const cx = this.width / 2;
      const cy = this.height / 2;

      // Atmospheric background glow expands
      const glow = ctx.createRadialGradient(cx, cy, 20, cx, cy, 420);
      glow.addColorStop(0, `rgba(2, 132, 199, ${0.22 + p * 0.15})`);
      glow.addColorStop(0.4, `rgba(59, 130, 246, ${0.12 * p})`);
      glow.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, this.width, this.height);

      // Floating dust particles
      this.drawFloatingParticles(0.5, 0.6);

      // Draw Logo Emergence
      const logoSize = Math.min(this.width, this.height) * 0.44;
      const alpha = Math.min(1, Math.max(0, (p - 0.15) * 1.3));

      // 1. Initial edge rim light illumination (metallic contour highlight)
      if (p < 0.7) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, logoSize / 2 + 6, 0, Math.PI * 2);
        ctx.lineWidth = 2.5;
        const rimAngle = p * Math.PI * 3;
        const rimGrad = ctx.createLinearGradient(
          cx + Math.cos(rimAngle) * (logoSize / 2),
          cy + Math.sin(rimAngle) * (logoSize / 2),
          cx - Math.cos(rimAngle) * (logoSize / 2),
          cy - Math.sin(rimAngle) * (logoSize / 2)
        );
        rimGrad.addColorStop(0, `rgba(56, 189, 248, ${0.9 * (1 - p)})`);
        rimGrad.addColorStop(0.5, 'rgba(217, 119, 6, 0.4)');
        rimGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
        ctx.strokeStyle = rimGrad;
        ctx.stroke();
        ctx.restore();
      }

      // 2. Render Exact Sharp Logo with specular reflection sweep
      if (alpha > 0) {
        ctx.save();
        ctx.globalAlpha = alpha;
        this.drawExactLogo(cx, cy, logoSize);

        // Volumetric specular light sheen passing across logo
        if (p > 0.35 && p < 0.95) {
          const sweepX = (cx - logoSize / 2) + ((p - 0.35) / 0.6) * logoSize * 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, logoSize / 2, 0, Math.PI * 2);
          ctx.clip();

          const sheenGrad = ctx.createLinearGradient(sweepX - 60, cy - logoSize / 2, sweepX + 60, cy + logoSize / 2);
          sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          sheenGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.38)');
          sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = sheenGrad;
          ctx.fillRect(cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize);
        }
        ctx.restore();
      }
    }

    // ----------------------------------------------------
    // SCENE 3 — QUANTUM ENERGY (7 - 11s)
    // ----------------------------------------------------
    renderScene3QuantumEnergy(p) {
      const ctx = this.ctx;
      const cx = this.width / 2;
      const cy = this.height / 2;
      const logoSize = Math.min(this.width, this.height) * 0.44;

      // Ambient radial field
      const glow = ctx.createRadialGradient(cx, cy, 30, cx, cy, 480);
      glow.addColorStop(0, 'rgba(14, 165, 233, 0.25)');
      glow.addColorStop(0.5, 'rgba(99, 102, 241, 0.12)');
      glow.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, this.width, this.height);

      // Subtle breathing scale on logo
      const breath = 1.0 + Math.sin(p * Math.PI * 2) * 0.015;
      ctx.save();
      this.drawExactLogo(cx, cy, logoSize * breath);
      ctx.restore();

      // Interconnected Quantum Energy Nodes circulating around logo rings
      const nodeCount = 14;
      const orbitR = logoSize * 0.58;
      const nodes = [];
      const time = this.currentTime;

      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2 + time * 0.45;
        const wobble = Math.sin(time * 2 + i) * 12;
        const nx = cx + Math.cos(angle) * (orbitR + wobble);
        const ny = cy + Math.sin(angle * 1.5) * (orbitR * 0.5 + wobble);
        nodes.push({ x: nx, y: ny, id: i });
      }

      // Draw quantum interconnected mesh lines
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 160) {
            const lineAlpha = (1 - d / 160) * 0.45 * Math.min(1, p * 2);
            ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw glowing quantum nodes
      for (let n of nodes) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(n.x, n.y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      this.drawFloatingParticles(0.6, 0.7);
    }

    // ----------------------------------------------------
    // SCENE 4 — LOGO TRANSFORMATION (11 - 14s)
    // ----------------------------------------------------
    renderScene4Transformation(p) {
      const ctx = this.ctx;
      const cx = this.width / 2;
      const cy = this.height / 2;
      const baseSize = Math.min(this.width, this.height) * 0.44;

      // Camera pushes forward through logo: scale zooms in from 1.0 to 3.8
      const zoom = 1.0 + Math.pow(p, 1.8) * 2.8;
      const currentSize = baseSize * zoom;
      const alpha = Math.max(0, 1 - Math.pow(p, 1.5) * 1.15);

      // Radial energy lines traveling away from logo
      const rays = 28;
      for (let i = 0; i < rays; i++) {
        const angle = (i / rays) * Math.PI * 2 + p * 0.5;
        const innerR = (baseSize * 0.4) * (1 + p * 0.8);
        const outerR = innerR + 120 + p * 380;
        const rayGrad = ctx.createLinearGradient(
          cx + Math.cos(angle) * innerR,
          cy + Math.sin(angle) * innerR,
          cx + Math.cos(angle) * outerR,
          cy + Math.sin(angle) * outerR
        );
        rayGrad.addColorStop(0, `rgba(56, 189, 248, ${0.4 * alpha})`);
        rayGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.strokeStyle = rayGrad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
        ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
        ctx.stroke();
      }

      // Draw scaling logo
      if (alpha > 0.01) {
        ctx.save();
        ctx.globalAlpha = alpha;
        this.drawExactLogo(cx, cy, currentSize);
        ctx.restore();
      }

      // Emerging wireframe city grid dissolving into view as camera pushes in
      if (p > 0.45) {
        const cityAlpha = (p - 0.45) / 0.55;
        ctx.save();
        ctx.globalAlpha = cityAlpha * 0.7;
        this.draw3DCityGrid(cx, cy, 0.4 + cityAlpha * 0.6, 0.3);
        ctx.restore();
      }
    }

    // ----------------------------------------------------
    // SCENE 5 — DIGITAL CITY REVEAL (14 - 17s)
    // ----------------------------------------------------
    renderScene5DigitalCityReveal(p) {
      const ctx = this.ctx;
      const cx = this.width / 2;
      const cy = this.height / 2;

      // Slow aerial descent: scale increases from 0.7 to 1.05
      const cameraAlt = 0.7 + p * 0.35;
      const tilt = 0.55 + p * 0.15;

      this.draw3DCityGrid(cx, cy + 40 * (1 - p), cameraAlt, tilt);

      // Ambient Horizon Vignette
      const vignette = ctx.createRadialGradient(cx, cy, this.width * 0.2, cx, cy, this.width * 0.65);
      vignette.addColorStop(0, 'rgba(3, 7, 18, 0)');
      vignette.addColorStop(1, 'rgba(3, 7, 18, 0.75)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, this.width, this.height);

      // Title overlay
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '600 13px "JetBrains Mono", monospace';
      ctx.letterSpacing = '3px';
      ctx.fillText('URBAN DIGITAL TWIN · 3D INFRASTRUCTURE MATRIX', cx, 65);
      ctx.restore();
    }

    // ----------------------------------------------------
    // SCENE 6 — TRAFFIC INTELLIGENCE (17 - 20s)
    // ----------------------------------------------------
    renderScene6TrafficIntelligence(p) {
      const cx = this.width / 2;
      const cy = this.height / 2;

      // City Grid at active monitoring perspective
      this.draw3DCityGrid(cx, cy, 1.05, 0.7);

      // Telemetry Data Packets flowing from intersections to central core
      this.drawDataFlowParticles(cx, cy);

      // Floating 3D HUD Hologram Cards over Intersections
      this.drawHolographicTelemetry(p);
    }

    // ----------------------------------------------------
    // SCENE 7 — QUANTUM OPTIMIZATION (20 - 23s)
    // ----------------------------------------------------
    renderScene7QuantumOptimization(p) {
      const ctx = this.ctx;
      const cx = this.width / 2;
      const cy = this.height / 2;

      // Subtle city backdrop dimmed
      ctx.save();
      ctx.globalAlpha = 0.22;
      this.draw3DCityGrid(cx, cy, 1.1, 0.7);
      ctx.restore();

      // Header
      ctx.textAlign = 'center';
      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.letterSpacing = '4px';
      ctx.fillText('QUANTUM COMBINATORIAL OPTIMIZATION PIPELINE', cx, 55);

      // Optimization Steps
      const steps = [
        { label: 'TRAFFIC DATA', sub: 'Sensor Feeds & Probe GPS' },
        { label: 'NETWORK MODEL', sub: '8 Nodes · 24 Phases' },
        { label: 'QUBO FORMULATION', sub: 'Q = min xᵀQx' },
        { label: 'QAOA WAVE SOLVER', sub: 'Coherent Superposition' },
        { label: 'HYBRID OPTIMIZATION', sub: 'Ground State |10110010⟩' }
      ];

      const totalSteps = steps.length;
      const startX = cx - (totalSteps - 1) * 110;
      const nodeY = cy - 20;

      // Connecting pipeline conduit line
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.beginPath();
      ctx.moveTo(startX, nodeY);
      ctx.lineTo(startX + (totalSteps - 1) * 220, nodeY);
      ctx.stroke();

      // Animated Quantum Energy Soliton moving through pipeline
      const energyProgress = (p * (totalSteps - 1)) % (totalSteps - 1);
      const energyX = startX + energyProgress * 220;
      const energyGlow = ctx.createRadialGradient(energyX, nodeY, 2, energyX, nodeY, 28);
      energyGlow.addColorStop(0, '#ffffff');
      energyGlow.addColorStop(0.3, '#38bdf8');
      energyGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = energyGlow;
      ctx.beginPath();
      ctx.arc(energyX, nodeY, 28, 0, Math.PI * 2);
      ctx.fill();

      // Draw Pipeline Nodes
      steps.forEach((st, idx) => {
        const nx = startX + idx * 220;
        const isReached = (idx <= p * totalSteps);

        // Node circle
        ctx.fillStyle = isReached ? '#0f172a' : '#030712';
        ctx.strokeStyle = isReached ? '#38bdf8' : '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(nx, nodeY, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Node Inner Glyph
        ctx.fillStyle = isReached ? '#38bdf8' : '#64748b';
        ctx.font = '700 13px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(idx + 1, nx, nodeY + 5);

        // Card Labels
        ctx.fillStyle = isReached ? '#f8fafc' : '#94a3b8';
        ctx.font = '700 11px Inter, sans-serif';
        ctx.fillText(st.label, nx, nodeY + 48);

        ctx.fillStyle = '#64748b';
        ctx.font = '400 9.5px "JetBrains Mono", monospace';
        ctx.fillText(st.sub, nx, nodeY + 64);
      });

      // Live QUBO Objective Function Telemetry Pill
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1;
      const pillW = 340;
      ctx.beginPath();
      ctx.roundRect(cx - pillW / 2, cy + 95, pillW, 36, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`QAOA ENERGY: -248.64 J | PHASE VECTOR: [γ=${(0.24 + p * 0.1).toFixed(3)}, β=0.812]`, cx, cy + 118);
    }

    // ----------------------------------------------------
    // SCENE 8 — ADAPTIVE TRAFFIC (23 - 26s)
    // ----------------------------------------------------
    renderScene8AdaptiveTraffic(p) {
      const ctx = this.ctx;
      const cx = this.width / 2;
      const cy = this.height / 2;

      // Digital city with green signal waves active and moving vehicle flow accelerated
      this.draw3DCityGrid(cx, cy, 1.05, 0.65, true);

      // Adaptive Performance Metric Deltas
      const metrics = [
        { label: 'WAITING TIME', val: '-34%', color: '#10b981' },
        { label: 'QUEUE LENGTH', val: '-41%', color: '#10b981' },
        { label: 'CONGESTION', val: '-28%', color: '#10b981' },
        { label: 'THROUGHPUT', val: '+22%', color: '#06b6d4' },
        { label: 'CO₂ EMISSIONS', val: '-19%', color: '#10b981' }
      ];

      const startX = cx - (metrics.length - 1) * 65;
      const cardY = 70;

      metrics.forEach((m, i) => {
        const mx = startX + i * 130;
        const pop = Math.min(1, Math.max(0, (p * 5 - i * 0.8)));

        ctx.save();
        ctx.globalAlpha = pop;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.strokeStyle = m.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(mx - 55, cardY, 110, 52, 12);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.fillText(m.label, mx, cardY + 20);

        ctx.fillStyle = m.color;
        ctx.font = '800 16px "JetBrains Mono", monospace';
        ctx.fillText(m.val, mx, cardY + 42);
        ctx.restore();
      });
    }

    // ----------------------------------------------------
    // SCENE 9 — EMERGENCY GREEN CORRIDOR (26 - 29s)
    // ----------------------------------------------------
    renderScene9EmergencyCorridor(p) {
      const ctx = this.ctx;
      const cx = this.width / 2;
      const cy = this.height / 2;

      // Digital city with glowing emergency corridor active
      this.draw3DCityGrid(cx, cy, 1.05, 0.65, false, true, p);

      // Emergency Alert Banner
      ctx.save();
      const bannerW = 460;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(cx - bannerW / 2, 55, bannerW, 56, 16);
      ctx.fill();
      ctx.stroke();

      // Flashing Emergency Indicator Dot
      const flash = Math.floor(this.currentTime * 6) % 2 === 0;
      ctx.fillStyle = flash ? '#ef4444' : '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - bannerW / 2 + 28, 83, 7, 0, Math.PI * 2);
      ctx.fill();

      // Banner Text
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ef4444';
      ctx.font = '800 12px "JetBrains Mono", monospace';
      ctx.fillText('EMERGENCY VEHICLE DETECTED — AMBULANCE A01', cx - bannerW / 2 + 46, 75);

      ctx.fillStyle = '#10b981';
      ctx.font = '700 10.5px "JetBrains Mono", monospace';
      ctx.fillText('EMERGENCY GREEN CORRIDOR ACTIVE: I1 → I3 → I4 → I6', cx - bannerW / 2 + 46, 96);
      ctx.restore();
    }

    // ----------------------------------------------------
    // SCENE 10 — FINAL LOGO REVEAL & LAUNCH (29 - 32s)
    // ----------------------------------------------------
    renderScene10FinalLogoReveal(p) {
      const ctx = this.ctx;
      const cx = this.width / 2;
      const cy = this.height / 2;

      // Camera pulls back upward into high altitude
      const cityAlpha = Math.max(0, 0.35 - p * 0.35);
      if (cityAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = cityAlpha;
        this.draw3DCityGrid(cx, cy, 0.65, 0.4);
        ctx.restore();
      }

      // Atmospheric radial glow
      const glow = ctx.createRadialGradient(cx, cy - 30, 20, cx, cy - 30, 480);
      glow.addColorStop(0, 'rgba(2, 132, 199, 0.28)');
      glow.addColorStop(0.4, 'rgba(59, 130, 246, 0.14)');
      glow.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, this.width, this.height);

      // Micro particles in background
      this.drawFloatingParticles(0.5, 0.5);

      // Draw Exact Sharp Q-FLOW Logo
      const logoSize = Math.min(this.width, this.height) * 0.38;
      const logoY = cy - 40;
      ctx.save();
      this.drawExactLogo(cx, logoY, logoSize);
      ctx.restore();

      // Typography Fade In
      const textAlpha = Math.min(1, p * 1.8);
      ctx.save();
      ctx.globalAlpha = textAlpha;
      ctx.textAlign = 'center';

      // Brand Title
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 32px Inter, sans-serif';
      ctx.letterSpacing = '6px';
      ctx.fillText('Q-FLOW', cx, logoY + logoSize / 2 + 38);

      // Tagline
      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 13px Inter, sans-serif';
      ctx.letterSpacing = '1.5px';
      ctx.fillText('Quantum-Enhanced Adaptive Urban Traffic Intelligence', cx, logoY + logoSize / 2 + 62);

      // Pillars
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.letterSpacing = '4px';
      ctx.fillText('ADAPT • OPTIMIZE • CONNECT', cx, logoY + logoSize / 2 + 88);
      ctx.restore();
    }

    // ----------------------------------------------------
    // HELPER: DRAW EXACT SOURCE LOGO
    // ----------------------------------------------------
    drawExactLogo(x, y, size) {
      const ctx = this.ctx;
      const half = size / 2;

      // Soft back ambient ring
      const ringGlow = ctx.createRadialGradient(x, y, half * 0.7, x, y, half * 1.25);
      ringGlow.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      ringGlow.addColorStop(0.5, 'rgba(59, 130, 246, 0.15)');
      ringGlow.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = ringGlow;
      ctx.beginPath();
      ctx.arc(x, y, half * 1.25, 0, Math.PI * 2);
      ctx.fill();

      if (this.logoLoaded && this.logoImage.complete && this.logoImage.naturalWidth > 0) {
        // Draw exact loaded high-res source image clipped cleanly to rounded circle/badge
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, half, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(this.logoImage, x - half, y - half, size, size);
        ctx.restore();

        // Rim border
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, half, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // High quality fallback vector emblem
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, half, 0, Math.PI * 2);
        ctx.fillStyle = '#071226';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = `800 ${size * 0.45}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Q', x, y);
        ctx.restore();
      }
    }

    // ----------------------------------------------------
    // HELPER: 3D DIGITAL CITY GRID
    // ----------------------------------------------------
    draw3DCityGrid(cx, cy, scale, tilt, isAdaptive = false, isEmergency = false, emergencyProgress = 0) {
      const ctx = this.ctx;
      const t = this.currentTime;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale * tilt);

      // 1. Skyscraper wireframe footprints
      for (let b of this.cityBuildings) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        ctx.strokeStyle = 'rgba(30, 58, 138, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
        ctx.fill();
        ctx.stroke();

        // Window glow dots
        ctx.fillStyle = b.windowsHue === 195 ? 'rgba(56, 189, 248, 0.35)' : 'rgba(99, 102, 241, 0.3)';
        for (let wx = -b.w / 2 + 8; wx < b.w / 2 - 6; wx += 12) {
          for (let wy = -b.h / 2 + 8; wy < b.h / 2 - 6; wy += 12) {
            if ((wx + wy) % 2 === 0) {
              ctx.fillRect(b.x + wx, b.y + wy, 2, 2);
            }
          }
        }
      }

      // 2. Arterial Road Network
      const nodeMap = {};
      this.cityNodes.forEach(n => { nodeMap[n.id] = n; });

      this.cityRoads.forEach(road => {
        const from = nodeMap[road.from];
        const to = nodeMap[road.to];
        if (!from || !to) return;

        const isCorridor = isEmergency && (
          (road.from === 'I1' && road.to === 'I3') ||
          (road.from === 'I3' && road.to === 'I4') ||
          (road.from === 'I4' && road.to === 'I6')
        );

        // Asphalt Base
        ctx.lineWidth = isCorridor ? 14 : 9;
        ctx.strokeStyle = isCorridor ? 'rgba(16, 185, 129, 0.25)' : 'rgba(15, 23, 42, 0.9)';
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();

        // Center Guide / Green wave glow
        ctx.lineWidth = isCorridor ? 4 : (isAdaptive ? 2.5 : 1.5);
        ctx.strokeStyle = isCorridor ? '#10b981' : (isAdaptive ? '#06b6d4' : 'rgba(56, 189, 248, 0.5)');
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      });

      // 3. Vehicles moving on roads
      const speedMult = isAdaptive ? 1.6 : 1.0;
      this.cityVehicles.forEach(v => {
        const from = nodeMap[v.road.from];
        const to = nodeMap[v.road.to];
        if (!from || !to) return;

        v.progress = (v.progress + v.speed * speedMult) % 1.0;
        const p = v.isReverse ? (1 - v.progress) : v.progress;
        const vx = from.x + (to.x - from.x) * p;
        const vy = from.y + (to.y - from.y) * p;

        // Vehicle Headlight streak
        ctx.fillStyle = v.color;
        ctx.beginPath();
        ctx.arc(vx, vy, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Tail light streak
        const dirX = (to.x - from.x);
        const dirY = (to.y - from.y);
        const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
        const ndx = (dirX / len) * (v.isReverse ? 1 : -1);
        const ndy = (dirY / len) * (v.isReverse ? 1 : -1);

        ctx.strokeStyle = v.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        ctx.lineTo(vx + ndx * v.tailLength, vy + ndy * v.tailLength);
        ctx.stroke();
      });

      // 4. Emergency Ambulance on Corridor in Scene 9
      if (isEmergency) {
        // Follow corridor: I1 -> I3 -> I4 -> I6
        const route = [nodeMap['I1'], nodeMap['I3'], nodeMap['I4'], nodeMap['I6']];
        const totalLegs = route.length - 1;
        const legProgress = Math.min(0.999, Math.max(0, emergencyProgress)) * totalLegs;
        const legIdx = Math.floor(legProgress);
        const legT = legProgress - legIdx;

        const p1 = route[legIdx];
        const p2 = route[legIdx + 1];
        if (p1 && p2) {
          const ambX = p1.x + (p2.x - p1.x) * legT;
          const ambY = p1.y + (p2.y - p1.y) * legT;

          // Ambulance Beacon Glow
          const ambGlow = ctx.createRadialGradient(ambX, ambY, 4, ambX, ambY, 32);
          ambGlow.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
          ambGlow.addColorStop(0.5, 'rgba(16, 185, 129, 0.5)');
          ambGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
          ctx.fillStyle = ambGlow;
          ctx.beginPath();
          ctx.arc(ambX, ambY, 32, 0, Math.PI * 2);
          ctx.fill();

          // Ambulance Vehicle Body
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(ambX - 6, ambY - 4, 12, 8, 2);
          ctx.fill();

          // Flashing lights
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(ambX - 4, ambY - 3, 3, 6);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(ambX + 1, ambY - 3, 3, 6);
        }
      }

      // 5. Intersections Nodes (I1 - I8)
      this.cityNodes.forEach(node => {
        const isCorridorNode = isEmergency && (node.id === 'I1' || node.id === 'I3' || node.id === 'I4' || node.id === 'I6');
        const sigColor = isCorridorNode ? '#10b981' : (isAdaptive ? '#10b981' : (node.signal === 'green' ? '#10b981' : (node.signal === 'yellow' ? '#f59e0b' : '#ef4444')));

        // Outer pulsing wave
        const pulse = (t * 2 + node.x) % 3;
        ctx.strokeStyle = sigColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 10 + pulse * 6, 0, Math.PI * 2);
        ctx.stroke();

        // Solid Node Disc
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = sigColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Node ID
        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 8.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.id, node.x, node.y + 3);
      });

      ctx.restore();
    }

    // ----------------------------------------------------
    // HELPER: DATA PACKET PARTICLES
    // ----------------------------------------------------
    drawDataFlowParticles(cx, cy) {
      const ctx = this.ctx;
      const t = this.currentTime;
      const count = 18;

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + t * 0.4;
        const r = 180 + Math.sin(t * 3 + i) * 60;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * (r * 0.6);

        // Stream line toward center
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(cx + Math.cos(angle) * (r * 0.3), cy + Math.sin(angle) * (r * 0.18));
        ctx.stroke();

        // Energy dot
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ----------------------------------------------------
    // HELPER: HOLOGRAPHIC TELEMETRY CARDS (Scene 6)
    // ----------------------------------------------------
    drawHolographicTelemetry(p) {
      const ctx = this.ctx;
      const cx = this.width / 2;
      const cy = this.height / 2;

      const huds = [
        { title: 'TRAFFIC DENSITY', val: '84%', sub: 'Level: High', color: '#f97316', x: cx - 220, y: cy - 110 },
        { title: 'QUEUE LENGTH', val: '42 VEH', sub: 'Node I4 Bottleneck', color: '#ef4444', x: cx + 110, y: cy - 120 },
        { title: 'SIGNAL STATUS', val: 'ADAPTIVE', sub: 'Phase Optimization Active', color: '#10b981', x: cx - 240, y: cy + 70 },
        { title: 'TRAFFIC FLOW', val: '1,850 V/H', sub: 'Corridor I1 → I4', color: '#38bdf8', x: cx + 100, y: cy + 80 }
      ];

      huds.forEach((hud, idx) => {
        const appear = Math.min(1, Math.max(0, (p * 4 - idx * 0.6)));
        ctx.save();
        ctx.globalAlpha = appear;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = hud.color;
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.roundRect(hud.x, hud.y, 160, 52, 10);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '700 9px "JetBrains Mono", monospace';
        ctx.fillText(hud.title, hud.x + 12, hud.y + 18);

        ctx.fillStyle = hud.color;
        ctx.font = '800 14px "JetBrains Mono", monospace';
        ctx.fillText(hud.val, hud.x + 12, hud.y + 36);

        ctx.fillStyle = '#64748b';
        ctx.font = '500 8.5px Inter, sans-serif';
        ctx.fillText(hud.sub, hud.x + 12, hud.y + 47);
        ctx.restore();
      });
    }

    // ----------------------------------------------------
    // HELPER: FLOATING BACKGROUND PARTICLES
    // ----------------------------------------------------
    drawFloatingParticles(alphaMult = 1.0, speedMult = 1.0) {
      const ctx = this.ctx;
      const cx = this.width / 2;
      const cy = this.height / 2;

      for (let pt of this.particles) {
        pt.x += pt.vx * speedMult;
        pt.y += pt.vy * speedMult;
        pt.z += pt.vz * speedMult;

        if (pt.z <= 10) pt.z = 800;
        if (pt.x < -this.width) pt.x = this.width;
        if (pt.x > this.width) pt.x = -this.width;
        if (pt.y < -this.height) pt.y = this.height;
        if (pt.y > this.height) pt.y = -this.height;

        const fov = 350;
        const scale = fov / (fov + pt.z);
        const sx = cx + pt.x * scale;
        const sy = cy + pt.y * scale;

        if (sx >= 0 && sx <= this.width && sy >= 0 && sy <= this.height) {
          const r = pt.radius * scale;
          const a = pt.baseAlpha * alphaMult * (1 - pt.z / 850);
          ctx.fillStyle = `hsla(${pt.hue}, 90%, 65%, ${a})`;
          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(0.5, r), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    destroy() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      window.removeEventListener('resize', this.handleResize);
    }
  }

  window.QFlowCinematicEngine = QFlowCinematicEngine;
})(window);
