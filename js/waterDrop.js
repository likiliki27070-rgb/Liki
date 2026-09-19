// High-Fidelity Physics-Based Water Drop & Liquid Ripple Engine
// Renders realistic falling droplet, impact splash, concentric wave refraction & caustics

class WaterDropSimulation {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.options = options;
    this.theme = options.theme || 'white';
    this.ripples = [];
    this.droplets = [];
    this.splashParticles = [];
    this.isRunning = true;
    this.autoDropTimer = 0;
    this.primaryImpactDone = false;

    this.initCanvas();
    this.spawnPrimaryDroplet();

    window.addEventListener('resize', () => this.initCanvas());

    // Interactive mouse / touch ripples
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.createRipple(x, y, 1.2);
      if (window.soundEngine && window.soundEngine.playWaterDrop) {
        window.soundEngine.playWaterDrop();
      }
    });

    this.animate();
  }

  initCanvas() {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  spawnPrimaryDroplet() {
    this.droplets.push({
      x: this.width / 2,
      y: -30,
      vy: 2,
      gravity: 0.42,
      radius: 6.5,
      targetY: this.height / 2,
      isPrimary: true,
      opacity: 1
    });
  }

  spawnSecondaryDroplet(x, y) {
    this.droplets.push({
      x: x || this.width * (0.35 + Math.random() * 0.3),
      y: -20,
      vy: 3,
      gravity: 0.38,
      radius: 4.5,
      targetY: y || this.height * (0.4 + Math.random() * 0.2),
      isPrimary: false,
      opacity: 0.9
    });
  }

  createRipple(x, y, strength = 1.0) {
    this.ripples.push({
      x,
      y,
      radius: 5,
      maxRadius: Math.max(this.width, this.height) * 0.75,
      speed: 3.8 + strength * 1.2,
      amplitude: 28 * strength,
      wavelength: 32,
      decay: 0.982,
      opacity: 0.85 * strength,
      age: 0
    });

    // Spawn splash rebound particles
    const particleCount = Math.round(8 * strength);
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.4;
      const speed = 2.5 + Math.random() * 3.5;
      this.splashParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed * 1.4 - 2.5,
        gravity: 0.28,
        radius: 2 + Math.random() * 2,
        opacity: 0.9,
        life: 0
      });
    }
  }

  update() {
    // 1. Update falling droplets
    for (let i = this.droplets.length - 1; i >= 0; i--) {
      const d = this.droplets[i];
      d.vy += d.gravity;
      d.y += d.vy;

      if (d.y >= d.targetY) {
        // Impact!
        this.createRipple(d.x, d.targetY, d.isPrimary ? 1.5 : 0.8);
        if (d.isPrimary) {
          this.primaryImpactDone = true;
          if (this.options.onPrimaryImpact) {
            this.options.onPrimaryImpact();
          }
        }

        if (window.soundEngine && window.soundEngine.playWaterDrop) {
          window.soundEngine.playWaterDrop();
        }

        this.droplets.splice(i, 1);
      }
    }

    // 2. Auto secondary drops after primary impact
    if (this.primaryImpactDone) {
      this.autoDropTimer++;
      if (this.autoDropTimer % 180 === 0 && this.ripples.length < 5) {
        this.spawnSecondaryDroplet();
      }
    }

    // 3. Update ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += r.speed;
      r.opacity *= r.decay;
      r.amplitude *= r.decay;
      r.age++;

      if (r.opacity < 0.015 || r.radius > r.maxRadius) {
        this.ripples.splice(i, 1);
      }
    }

    // 4. Update splash particles
    for (let i = this.splashParticles.length - 1; i >= 0; i--) {
      const p = this.splashParticles[i];
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.opacity -= 0.018;
      p.life++;

      if (p.opacity <= 0) {
        this.splashParticles.splice(i, 1);
      }
    }
  }

  draw() {
    const isWhite = this.theme === 'white';
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Subtle liquid gradient background
    const bgGrad = this.ctx.createRadialGradient(
      this.width / 2, this.height / 2, 50,
      this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.8
    );
    if (isWhite) {
      bgGrad.addColorStop(0, '#ffffff');
      bgGrad.addColorStop(0.6, '#f8fafc');
      bgGrad.addColorStop(1, '#f1f5f9');
    } else {
      bgGrad.addColorStop(0, '#0c1322');
      bgGrad.addColorStop(0.6, '#060913');
      bgGrad.addColorStop(1, '#020617');
    }
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Subtle background digital grid reflecting on the liquid surface
    this.drawSubmergedGrid(isWhite);

    // Draw Expanding Liquid Ripples
    for (let r of this.ripples) {
      this.drawConcentricRipples(r, isWhite);
    }

    // Draw Splash Particles
    for (let p of this.splashParticles) {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = isWhite 
        ? `rgba(2, 132, 199, ${p.opacity * 0.7})` 
        : `rgba(56, 189, 248, ${p.opacity * 0.8})`;
      this.ctx.fill();
    }

    // Draw Falling Droplets
    for (let d of this.droplets) {
      this.drawDroplet(d, isWhite);
    }
  }

  drawSubmergedGrid(isWhite) {
    this.ctx.save();
    this.ctx.strokeStyle = isWhite ? 'rgba(203, 213, 225, 0.4)' : 'rgba(30, 41, 59, 0.4)';
    this.ctx.lineWidth = 1;
    const gridSize = 48;

    for (let x = 0; x < this.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  drawDroplet(d, isWhite) {
    this.ctx.save();
    this.ctx.translate(d.x, d.y);

    // Teardrop shape
    this.ctx.beginPath();
    this.ctx.moveTo(0, -d.radius * 2.2);
    this.ctx.bezierCurveTo(
      d.radius * 1.5, -d.radius * 0.5,
      d.radius * 1.5, d.radius * 1.2,
      0, d.radius * 1.4
    );
    this.ctx.bezierCurveTo(
      -d.radius * 1.5, d.radius * 1.2,
      -d.radius * 1.5, -d.radius * 0.5,
      0, -d.radius * 2.2
    );

    const grad = this.ctx.createRadialGradient(
      -d.radius * 0.3, -d.radius * 0.5, 1,
      0, 0, d.radius * 1.5
    );
    if (isWhite) {
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.4, 'rgba(14, 165, 233, 0.7)');
      grad.addColorStop(1, 'rgba(2, 132, 199, 0.9)');
    } else {
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.3, 'rgba(56, 189, 248, 0.8)');
      grad.addColorStop(1, 'rgba(14, 165, 233, 0.6)');
    }

    this.ctx.fillStyle = grad;
    this.ctx.shadowColor = isWhite ? 'rgba(2, 132, 199, 0.4)' : 'rgba(56, 189, 248, 0.6)';
    this.ctx.shadowBlur = 12;
    this.ctx.fill();

    // Specular highlight gleam
    this.ctx.beginPath();
    this.ctx.arc(-d.radius * 0.3, -d.radius * 0.6, d.radius * 0.35, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.fill();

    this.ctx.restore();
  }

  drawConcentricRipples(r, isWhite) {
    const waveCount = 4;
    for (let w = 0; w < waveCount; w++) {
      const radius = r.radius - w * r.wavelength;
      if (radius <= 0) continue;

      const wavePhase = Math.sin(r.age * 0.08 - w * 1.2);
      const alpha = r.opacity * (1 - w / waveCount) * Math.max(0.1, (1 - radius / r.maxRadius));

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);

      // Crest highlight (bright refraction)
      this.ctx.lineWidth = Math.max(1, 3.5 - w * 0.6);
      this.ctx.strokeStyle = isWhite
        ? `rgba(2, 132, 199, ${alpha * 0.6})`
        : `rgba(56, 189, 248, ${alpha * 0.75})`;
      this.ctx.shadowColor = isWhite ? 'rgba(2, 132, 199, 0.3)' : 'rgba(56, 189, 248, 0.5)';
      this.ctx.shadowBlur = 8;
      this.ctx.stroke();

      // Outer soft caustic ring
      if (w === 0 && radius > 15) {
        this.ctx.beginPath();
        this.ctx.arc(r.x, r.y, radius + 4, 0, Math.PI * 2);
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeStyle = isWhite
          ? `rgba(99, 102, 241, ${alpha * 0.35})`
          : `rgba(168, 85, 247, ${alpha * 0.4})`;
        this.ctx.stroke();
      }

      this.ctx.restore();
    }
  }

  animate() {
    if (!this.isRunning) return;
    this.update();
    this.draw();
    requestAnimationFrame(() => this.animate());
  }

  destroy() {
    this.isRunning = false;
  }
}

window.WaterDropSimulation = WaterDropSimulation;
