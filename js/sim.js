// Traffic Simulation Engine & Hybrid Quantum Optimizer Core

class TrafficEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.isRunning = true;
    this.simSpeed = 1.0;
    this.simSeconds = 8 * 3600 + 42 * 60; // 08:42:00 AM
    this.densitySetting = 'medium'; // low, medium, high, extreme
    this.optimizationMode = 'classical'; // 'classical' | 'hybrid'
    this.isEmergencyActive = false;
    this.ambulance = {
      active: false,
      currentSegmentIndex: 0,
      progress: 0.0,
      speed: 0.8,
      route: ['I1', 'I3', 'I4', 'I6'],
      x: -32,
      z: -22,
      eta: 7.2
    };

    this.activeIncident = null; // { type, intersectionId, message }
    this.closedRoads = new Set();

    // Deep clone initial data
    this.intersections = JSON.parse(JSON.stringify(window.TRAFFIC_DATA.intersections));
    this.roads = JSON.parse(JSON.stringify(window.TRAFFIC_DATA.roads));
    this.weights = { ...window.TRAFFIC_DATA.weights };
    this.qaoaSettings = { ...window.TRAFFIC_DATA.qaoaSettings };

    // KPI and time-series telemetry
    this.currentMetrics = { ...window.TRAFFIC_DATA.baselineMetrics };
    this.metricsHistory = {
      timestamps: [],
      classicalWait: [],
      hybridWait: [],
      queue: [],
      throughput: [],
      fuel: [],
      co2: []
    };

    // Pre-populate 12 historical points
    for (let i = 11; i >= 0; i--) {
      const timeStr = this.formatTime(this.simSeconds - i * 60);
      this.metricsHistory.timestamps.push(timeStr);
      this.metricsHistory.classicalWait.push(53 + Math.sin(i * 0.7) * 4);
      this.metricsHistory.hybridWait.push(42 + Math.cos(i * 0.6) * 3);
      this.metricsHistory.queue.push(Math.round(21 + Math.sin(i * 0.5) * 4));
      this.metricsHistory.throughput.push(Math.round(1190 + Math.cos(i * 0.4) * 50));
      this.metricsHistory.fuel.push(+(95 + Math.sin(i * 0.3) * 4).toFixed(1));
      this.metricsHistory.co2.push(+(222 + Math.cos(i * 0.3) * 8).toFixed(1));
    }

    // Optimization state
    this.optimizationStatus = 'READY'; // 'READY' | 'RUNNING' | 'OPTIMAL'
    this.optimizationStep = '';
    this.optimizationProgress = 0;
    this.optimizationIterations = 0;
    this.bestObjective = 0.452;
    this.sampledBitstrings = [];

    // Automatic Quantum Optimizer Engine
    this.autoOptimizeEnabled = true;
    this.autoOptimizerStatus = 'MONITORING'; // 'IDLE' | 'MONITORING' | 'OPTIMIZING' | 'APPLYING' | 'COMPLETE' | 'ERROR'
    this.optimizationCooldownTimer = 0; // cooldown in simulation seconds
    this.cooldownDuration = 30; // 30s cooldown between automated sweeps
    this.lastOptimizedTimestamp = '';
    this.optimizationHistory = JSON.parse(JSON.stringify(window.INITIAL_OPTIMIZATION_HISTORY || []));
    this.lastAutoTriggerReason = '';
    this.postEmergencyReoptimize = false;
    this.roadClosureOptimized = false;

    // Mixed-Traffic Vehicle collection (8 vehicle types: Sedan, Hatchback, SUV, Motorcycle, Scooter, Bicycle, Bus, Truck, Van)
    this.vehicles = [];
    this.initVehicles(68);

    this.listeners = [];
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify() {
    for (let cb of this.listeners) {
      try { cb(this); } catch(e) { console.error("Sim listener error:", e); }
    }
  }

  createVehicleInstance(id, road, lane = 1, progress = 0) {
    const fromNode = this.intersections.find(n => n.id === road.from);
    const toNode = this.intersections.find(n => n.id === road.to);
    
    // Pick type based on TRAFFIC_DISTRIBUTION
    const roll = Math.random();
    let type = 'car_sedan';
    let length = 3.8;
    let width = 1.8;
    let baseSpeed = 0.22;
    let accel = 0.15;
    let decel = 0.28;
    let color = 0x38bdf8;

    const carColors = [0x38bdf8, 0x3b82f6, 0xef4444, 0x10b981, 0x94a3b8, 0x64748b, 0x0284c7, 0xffffff, 0x1e293b];
    const motoColors = [0xef4444, 0x0284c7, 0xf59e0b, 0x10b981, 0x18181b, 0x8b5cf6];

    if (roll < 0.25) {
      type = 'car_sedan';
      color = carColors[Math.floor(Math.random() * carColors.length)];
      baseSpeed = 0.22;
      length = 3.8;
    } else if (roll < 0.43) {
      type = 'car_hatchback';
      color = carColors[Math.floor(Math.random() * carColors.length)];
      baseSpeed = 0.21;
      length = 3.3;
    } else if (roll < 0.55) {
      type = 'car_suv';
      color = carColors[Math.floor(Math.random() * carColors.length)];
      baseSpeed = 0.20;
      length = 4.2;
      width = 2.0;
    } else if (roll < 0.78) {
      type = 'motorcycle';
      color = motoColors[Math.floor(Math.random() * motoColors.length)];
      baseSpeed = 0.26;
      length = 1.9;
      width = 0.8;
      accel = 0.22;
      decel = 0.35;
    } else if (roll < 0.88) {
      type = 'scooter';
      color = [0x06b6d4, 0xf43f5e, 0x84cc16, 0xec4899, 0xfacc15][Math.floor(Math.random() * 5)];
      baseSpeed = 0.20;
      length = 1.6;
      width = 0.75;
      accel = 0.18;
    } else if (roll < 0.92) {
      type = 'bus';
      color = [0x0284c7, 0x059669, 0x4f46e5][Math.floor(Math.random() * 3)];
      baseSpeed = 0.15;
      length = 7.8;
      width = 2.3;
      accel = 0.08;
      decel = 0.18;
    } else if (roll < 0.96) {
      type = 'truck';
      color = [0x475569, 0xd97706, 0xb91c1c, 0x0284c7][Math.floor(Math.random() * 4)];
      baseSpeed = 0.16;
      length = 7.6;
      width = 2.3;
      accel = 0.09;
      decel = 0.20;
    } else if (roll < 0.98) {
      type = 'van';
      color = [0xffffff, 0xe2e8f0, 0x334155, 0x0284c7][Math.floor(Math.random() * 4)];
      baseSpeed = 0.19;
      length = 4.8;
      width = 2.1;
      accel = 0.13;
    } else {
      type = 'bicycle';
      color = [0x10b981, 0x06b6d4, 0xf59e0b, 0xef4444][Math.floor(Math.random() * 4)];
      baseSpeed = 0.10;
      length = 1.4;
      width = 0.5;
      lane = 2; // Always outer curb lane
      accel = 0.10;
      decel = 0.25;
    }

    return {
      id: id,
      roadId: road.id,
      from: fromNode.id,
      to: toNode.id,
      progress: progress,
      speed: baseSpeed + (Math.random() * 0.06 - 0.03),
      currentSpeed: baseSpeed,
      targetSpeed: baseSpeed,
      accel: accel,
      decel: decel,
      type: type,
      length: length,
      width: width,
      color: color,
      lane: lane,
      stopped: false,
      braking: false,
      waitCounter: 0,
      isTurning: false,
      turnT: 0.0,
      turnP0: null,
      turnP1: null,
      turnP2: null,
      turnDir: 0,
      worldX: null,
      worldZ: null,
      worldAngle: null
    };
  }

  initVehicles(count) {
    this.vehicles = [];
    for (let i = 0; i < count; i++) {
      const road = this.roads[Math.floor(Math.random() * this.roads.length)];
      const progress = Math.random();
      const lane = Math.random() > 0.5 ? 1 : 2;
      this.vehicles.push(this.createVehicleInstance('v_' + i, road, lane, progress));
    }
  }

  formatTime(totalSecs) {
    const hours = Math.floor(totalSecs / 3600) % 24;
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = Math.floor(totalSecs % 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12 < 10 ? '0' : ''}${h12}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs} ${ampm}`;
  }

  getSimTimeString() {
    return this.formatTime(this.simSeconds);
  }

  setSpeed(speed) {
    this.simSpeed = speed;
    if (window.soundEngine) window.soundEngine.playClick();
    this.notify();
  }

  setDensity(density) {
    this.densitySetting = density;
    const multipliers = { low: 0.65, medium: 1.0, high: 1.35, extreme: 1.7 };
    const mult = multipliers[density] || 1.0;

    this.intersections.forEach(inter => {
      inter.density = Math.min(98, Math.round(inter.density * (mult / 1.0)));
      inter.queueLength = Math.max(4, Math.round(inter.queueLength * mult));
    });

    if (density === 'high' || density === 'extreme') {
      const targetCount = density === 'extreme' ? 105 : 85;
      while (this.vehicles.length < targetCount) {
        this.addRandomVehicle();
      }
    } else if (density === 'low') {
      if (this.vehicles.length > 45) {
        this.vehicles = this.vehicles.slice(0, 45);
      }
    }

    this.updateMetrics();
    if (window.soundEngine) window.soundEngine.playClick();
    this.notify();
  }

  addRandomVehicle() {
    const road = this.roads[Math.floor(Math.random() * this.roads.length)];
    const lane = Math.random() > 0.5 ? 1 : 2;
    const v = this.createVehicleInstance('v_' + Math.random().toString(36).substr(2, 6), road, lane, 0.02);
    this.vehicles.push(v);
  }

  evaluateAutomaticOptimization(dt) {
    if (!this.autoOptimizeEnabled) {
      if (this.autoOptimizerStatus !== 'IDLE' && this.autoOptimizerStatus !== 'OPTIMIZING') {
        this.autoOptimizerStatus = 'IDLE';
      }
      return;
    }

    // If currently running an optimization cycle or holding emergency green corridor, do not interrupt
    if (this.optimizationStatus === 'RUNNING' || this.autoOptimizerStatus === 'OPTIMIZING') {
      return;
    }

    if (this.isEmergencyActive) {
      this.autoOptimizerStatus = 'MONITORING';
      return;
    }

    // Decrement cooldown timer
    if (this.optimizationCooldownTimer > 0) {
      this.optimizationCooldownTimer -= dt * this.simSpeed;
      if (this.autoOptimizerStatus === 'COMPLETE' && this.optimizationCooldownTimer < 25) {
        this.autoOptimizerStatus = 'MONITORING';
      }
    }

    // Calculate live telemetry across network
    let queueSum = 0;
    let waitSum = 0;
    let densitySum = 0;
    let maxDensity = 0;
    let maxQueue = 0;

    this.intersections.forEach(i => {
      queueSum += i.queueLength;
      waitSum += i.waitingTime;
      densitySum += i.density;
      if (i.density > maxDensity) maxDensity = i.density;
      if (i.queueLength > maxQueue) maxQueue = i.queueLength;
    });

    const nodeCount = this.intersections.length || 1;
    const avgDensity = Math.round(densitySum / nodeCount);
    const avgQueue = Math.round(queueSum / nodeCount);
    const avgWait = Math.round(waitSum / nodeCount);

    const cfg = window.AUTO_OPTIMIZER_CONFIG || { densityThreshold: 76, queueThreshold: 26, waitThreshold: 52 };

    let triggerReason = null;
    let bypassCooldown = false;

    // Check acute incidents first (bypass 30s cooldown immediately)
    if (this.activeIncident && !this.activeIncident.optimized) {
      triggerReason = `Incident Detected: ${this.activeIncident.type.toUpperCase()} at ${this.activeIncident.intersectionId}`;
      bypassCooldown = true;
      this.activeIncident.optimized = true;
    } else if (this.closedRoads.size > 0 && !this.roadClosureOptimized) {
      triggerReason = `Road Closure Detected on Arterial`;
      bypassCooldown = true;
      this.roadClosureOptimized = true;
    } else if (this.postEmergencyReoptimize) {
      triggerReason = `Post-Emergency Corridor Network Re-balancing`;
      bypassCooldown = true;
      this.postEmergencyReoptimize = false;
    } else if (maxDensity > 86) {
      triggerReason = `Critical Congestion Surge (${maxDensity}% Density)`;
    } else if (avgDensity > cfg.densityThreshold) {
      triggerReason = `High Network Density (${avgDensity}% > ${cfg.densityThreshold}%)`;
    } else if (avgQueue > cfg.queueThreshold || maxQueue > 34) {
      triggerReason = `Queue Spillback Alarm (${avgQueue} vehicles)`;
    } else if (avgWait > cfg.waitThreshold) {
      triggerReason = `Excessive Delay Detected (${avgWait}s > ${cfg.waitThreshold}s)`;
    }

    if (triggerReason && (this.optimizationCooldownTimer <= 0 || bypassCooldown)) {
      this.executeAutomaticOptimization(triggerReason);
    } else {
      if (this.autoOptimizerStatus !== 'COMPLETE') {
        this.autoOptimizerStatus = 'MONITORING';
      }
    }
  }

  executeAutomaticOptimization(triggerReason) {
    this.autoOptimizerStatus = 'OPTIMIZING';
    this.lastAutoTriggerReason = triggerReason;
    this.optimizationCooldownTimer = this.cooldownDuration;

    if (window.soundEngine) window.soundEngine.playQuantumChime();
    if (window.diagnosticsSuite) {
      window.diagnosticsSuite.addLog('INFO', 'AutoOptimizer', `Autonomous trigger: ${triggerReason}`, 'QAOA');
    }

    // Run hybrid QAOA network optimization
    this.runQuantumOptimization(
      (pct, step) => {
        this.optimizationProgress = pct;
        this.optimizationStep = step;
      },
      () => {
        // Automatic Safety Validation Before Apply
        this.autoOptimizerStatus = 'APPLYING';
        const isValid = this.validateCandidateSignalConfiguration();

        if (isValid) {
          this.applyOptimizedTimingsAutomatically();
          this.autoOptimizerStatus = 'COMPLETE';

          // Record to Optimization History ledger
          const newEntry = {
            id: 'OPT-' + Math.floor(100 + Math.random() * 900),
            timestamp: this.formatTime(this.simSeconds),
            trigger: triggerReason,
            target: 'Network-wide (I1 - I6)',
            method: 'QAOA Hybrid (p=2)',
            previousTiming: `Avg Green: 25s | Red: 40s`,
            optimizedTiming: `Avg Green: 44s | Red: 26s`,
            objective: +(this.bestObjective).toFixed(3),
            status: 'APPLIED'
          };
          this.optimizationHistory.unshift(newEntry);
          if (this.optimizationHistory.length > 25) this.optimizationHistory.pop();

          if (window.diagnosticsSuite) {
            window.diagnosticsSuite.addLog('SUCCESS', 'AutoOptimizer', `Autonomous signals deployed across network. Objective: ${newEntry.objective}`, 'SIGNAL');
          }
        } else {
          this.autoOptimizerStatus = 'ERROR';
          if (window.diagnosticsSuite) {
            window.diagnosticsSuite.addLog('WARNING', 'AutoOptimizer', 'Optimization Result Rejected — Invalid Signal Configuration constraints.', 'VALIDATION');
          }
        }
        this.notify();
      }
    );
  }

  validateCandidateSignalConfiguration() {
    // Validate bounds: 5s <= green, red <= 120s; 3s <= yellow <= 10s
    for (let inter of this.intersections) {
      const opt = inter.optimizedTiming || {};
      if (!opt.green || opt.green < 5 || opt.green > 120) return false;
      if (!opt.red || opt.red < 5 || opt.red > 120) return false;
      if (!opt.yellow || opt.yellow < 3 || opt.yellow > 10) return false;
      if (opt.green + opt.yellow + opt.red < 20) return false;
    }
    return true;
  }

  applyOptimizedTimingsAutomatically() {
    this.optimizationMode = 'hybrid';
    this.intersections.forEach(inter => {
      inter.currentTiming = { ...inter.optimizedTiming };
    });
    this.updateMetrics();
  }

  setOptimizationMode(mode) {
    this.optimizationMode = mode;
    this.intersections.forEach(inter => {
      if (mode === 'hybrid') {
        inter.currentTiming = { ...inter.optimizedTiming };
      } else {
        inter.currentTiming = { ...inter.classicalTiming };
      }
    });
    this.updateMetrics();
    if (window.soundEngine) window.soundEngine.playQuantumChime();
    this.notify();
  }

  runQuantumOptimization(onProgress, onComplete) {
    this.optimizationStatus = 'RUNNING';
    this.optimizationProgress = 0;
    this.optimizationIterations = 0;
    if (window.soundEngine) window.soundEngine.playQuantumChime();

    const steps = [
      { p: 12, label: "Ingesting live inductive loop and camera sensor telemetry..." },
      { p: 25, label: "Constructing NetworkX traffic graph G(V, E) with queue capacities..." },
      { p: 40, label: "Formulating multi-intersection QUBO matrix with phase conflict penalties..." },
      { p: 55, label: "Mapping to Ising Hamiltonian H_C = Σ h_i σ_i^z + Σ J_ij σ_i^z σ_j^z..." },
      { p: 70, label: "Simulating QAOA variational quantum circuit (p=2 layers, COBYLA)..." },
      { p: 85, label: "Evaluating ground-state energy expectation ⟨ψ(γ,β)|H_C|ψ(γ,β)⟩..." },
      { p: 95, label: "Applying classical safety constraint filter (min green, yellow clearance)..." },
      { p: 100, label: "Deploying optimal phase offsets to controllers across all 6 intersections." }
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        const step = steps[stepIdx];
        this.optimizationProgress = step.p;
        this.optimizationStep = step.label;
        this.optimizationIterations = Math.min(84, Math.round(step.p * 0.84));
        this.bestObjective = +(0.45 - (step.p / 100) * 0.263).toFixed(3);

        if (onProgress) onProgress(step.p, step.label);
        this.notify();
        stepIdx++;
      } else {
        clearInterval(interval);
        this.optimizationStatus = 'OPTIMAL';
        this.optimizationMode = 'hybrid';

        // Apply updated green timings based on density & objective weights
        this.intersections.forEach(inter => {
          const boost = Math.round((inter.density / 100) * 16);
          inter.optimizedTiming = {
            green: Math.min(52, 28 + boost),
            yellow: 5,
            red: Math.max(18, 48 - boost)
          };
          inter.currentTiming = { ...inter.optimizedTiming };
          inter.queueLength = Math.max(3, Math.round(inter.queueLength * 0.62));
          inter.density = Math.max(25, Math.round(inter.density * 0.72));
          inter.waitingTime = Math.round(inter.waitingTime * 0.75);
        });

        this.sampledBitstrings = [
          { state: "10110010", prob: 0.342, energy: -14.28 },
          { state: "10110001", prob: 0.218, energy: -13.91 },
          { state: "10010010", prob: 0.145, energy: -12.44 },
          { state: "11110010", prob: 0.098, energy: -11.02 },
          { state: "00110010", prob: 0.065, energy: -9.85 }
        ];

        this.updateMetrics();
        if (window.soundEngine) window.soundEngine.playQuantumChime();
        if (onComplete) onComplete();
        this.notify();
      }
    }, 380);
  }

  activateEmergencyCorridor() {
    this.isEmergencyActive = true;
    this.ambulance.active = true;
    this.ambulance.currentSegmentIndex = 0;
    this.ambulance.progress = 0.0;
    this.ambulance.x = -32;
    this.ambulance.z = -22;
    this.ambulance.eta = 4.8;

    // Set green wave on corridor route: I1, I3, I4, I6
    this.ambulance.route.forEach(id => {
      const inter = this.intersections.find(n => n.id === id);
      if (inter) {
        inter.isEmergencyCorridor = true;
        inter.phase = "GREEN_NS";
        inter.phaseTimer = 60; // hold green
        inter.currentTiming = { red: 15, yellow: 4, green: 65 };
      }
    });

    if (window.soundEngine) {
      window.soundEngine.playEmergencySiren();
    }
    this.updateMetrics();
    this.notify();
  }

  cancelEmergencyCorridor() {
    this.isEmergencyActive = false;
    this.ambulance.active = false;
    this.ambulance.progress = 0.0;

    this.intersections.forEach(inter => {
      inter.isEmergencyCorridor = false;
      if (this.optimizationMode === 'hybrid') {
        inter.currentTiming = { ...inter.optimizedTiming };
      } else {
        inter.currentTiming = { ...inter.classicalTiming };
      }
    });

    // Auto-rebalance: automatically re-optimize network to clear residual queue build-up
    this.postEmergencyReoptimize = true;
    this.updateMetrics();
    this.notify();
  }

  triggerAccident(intersectionId = 'I4') {
    this.activeIncident = {
      type: 'accident',
      intersectionId: intersectionId,
      message: `Accident reported at ${intersectionId} (Central Square). Eastbound lane blocked.`,
      optimized: false
    };

    const target = this.intersections.find(n => n.id === intersectionId);
    if (target) {
      target.hasIncident = true;
      target.density = 94;
      target.queueLength = 46;
      target.waitingTime = 78;
    }

    if (window.soundEngine) window.soundEngine.playWarning();
    this.updateMetrics();
    this.notify();
  }

  triggerCongestion(intersectionId = 'I3') {
    this.activeIncident = {
      type: 'congestion',
      intersectionId: intersectionId,
      message: `Sudden traffic surge detected along ${intersectionId} arterial corridor.`,
      optimized: false
    };

    const target = this.intersections.find(n => n.id === intersectionId);
    if (target) {
      target.density = 92;
      target.queueLength = 41;
      target.waitingTime = 72;
    }

    if (window.soundEngine) window.soundEngine.playWarning();
    this.updateMetrics();
    this.notify();
  }

  triggerRoadClosure(roadId = 'R_2_4') {
    this.closedRoads.add(roadId);
    const road = this.roads.find(r => r.id === roadId);
    if (road) road.closed = true;

    this.activeIncident = {
      type: 'road_closure',
      intersectionId: 'I2',
      message: `Emergency road closure active on ${roadId} (between I2 and I4). Diverting traffic.`,
      optimized: false
    };
    this.roadClosureOptimized = false;

    if (window.soundEngine) window.soundEngine.playWarning();
    this.updateMetrics();
    this.notify();
  }

  clearEvents() {
    this.activeIncident = null;
    this.closedRoads.clear();
    this.roads.forEach(r => r.closed = false);
    this.intersections.forEach(n => {
      n.hasIncident = false;
    });

    this.updateMetrics();
    if (window.soundEngine) window.soundEngine.playClick();
    this.notify();
  }

  updateWeights(newWeights) {
    this.weights = { ...this.weights, ...newWeights };
    this.updateMetrics();
    this.notify();
  }

  updateMetrics() {
    const isOpt = this.optimizationMode === 'hybrid';
    let queueSum = 0;
    let waitSum = 0;
    let densitySum = 0;

    this.intersections.forEach(i => {
      queueSum += i.queueLength;
      waitSum += i.waitingTime;
      densitySum += i.density;
    });

    const nodeCount = this.intersections.length || 1;
    const avgQueue = Math.round(queueSum / nodeCount);
    const avgWait = Math.round(waitSum / nodeCount);
    const avgDensity = Math.round(densitySum / nodeCount);

    let emergencyETA = this.isEmergencyActive ? 4.8 : (isOpt ? 4.8 : 7.2);
    if (this.activeIncident && !this.isEmergencyActive) {
      emergencyETA += 1.4;
    }

    this.currentMetrics = {
      waitingTime: avgWait,
      queueLength: avgQueue,
      trafficDensity: avgDensity,
      throughput: isOpt ? 1420 : 1180,
      fuelConsumption: isOpt ? 82.3 : 96.5,
      co2Emissions: isOpt ? 189.6 : 224.8,
      emergencyTravelTime: emergencyETA
    };
  }

  tick(dt) {
    if (!this.isRunning) return;

    const scaledDt = dt * this.simSpeed;
    this.simSeconds += scaledDt;

    // 0. Continuous Autonomous Quantum Optimizer Decision Engine
    this.evaluateAutomaticOptimization(scaledDt);

    // 1. Cycle Traffic Signal Phases
    this.intersections.forEach(inter => {
      if (inter.isEmergencyCorridor) return; // Keep green corridor locked during emergency

      inter.phaseTimer -= scaledDt;
      if (inter.phaseTimer <= 0) {
        if (inter.phase === "GREEN_NS") {
          inter.phase = "YELLOW_NS";
          inter.phaseTimer = (inter.currentTiming && inter.currentTiming.yellow) || 5;
        } else if (inter.phase === "YELLOW_NS") {
          inter.phase = "GREEN_EW";
          inter.phaseTimer = Math.max(10, ((inter.currentTiming && inter.currentTiming.red) || 40) - ((inter.currentTiming && inter.currentTiming.yellow) || 5));
        } else if (inter.phase === "GREEN_EW") {
          inter.phase = "YELLOW_EW";
          inter.phaseTimer = (inter.currentTiming && inter.currentTiming.yellow) || 5;
        } else {
          inter.phase = "GREEN_NS";
          inter.phaseTimer = (inter.currentTiming && inter.currentTiming.green) || 30;
        }
      }
    });

    // 2. Animate Ambulance Progress along corridor
    if (this.ambulance.active) {
      const segs = [
        { from: 'I1', to: 'I3' },
        { from: 'I3', to: 'I4' },
        { from: 'I4', to: 'I6' }
      ];
      this.ambulance.progress += 0.08 * scaledDt;
      if (this.ambulance.progress >= 1.0) {
        this.ambulance.progress = 0.0;
        this.ambulance.currentSegmentIndex++;
        if (this.ambulance.currentSegmentIndex >= segs.length) {
          // Arrived at Medical Center Hospital (I6)!
          this.cancelEmergencyCorridor();
          if (window.soundEngine) window.soundEngine.playQuantumChime();
        }
      }

      if (this.ambulance.active && this.ambulance.currentSegmentIndex < segs.length) {
        const seg = segs[this.ambulance.currentSegmentIndex];
        const n1 = this.intersections.find(n => n.id === seg.from);
        const n2 = this.intersections.find(n => n.id === seg.to);
        if (n1 && n2) {
          this.ambulance.x = n1.x + (n2.x - n1.x) * this.ambulance.progress;
          this.ambulance.z = n1.z + (n2.z - n1.z) * this.ambulance.progress;
        }
      }
    }

    // 3. Realistic Car-Following, Queueing, and Lane Movement
    // Group vehicles by road and lane for front-to-back sorting
    const laneGroups = new Map();
    for (let v of this.vehicles) {
      const key = `${v.roadId}_${v.lane}`;
      if (!laneGroups.has(key)) laneGroups.set(key, []);
      laneGroups.get(key).push(v);
    }

    // Sort each lane group so highest progress is first
    for (let [_, group] of laneGroups) {
      group.sort((a, b) => b.progress - a.progress);

      for (let i = 0; i < group.length; i++) {
        const v = group[i];

        // Active Bezier intersection turning trajectory
        if (v.isTurning && v.turnP0 && v.turnP1 && v.turnP2) {
          v.turnT += (v.currentSpeed || 0.18) * 0.28 * scaledDt;
          const t = Math.min(1.0, v.turnT);
          const oneMinusT = 1.0 - t;
          v.worldX = oneMinusT * oneMinusT * v.turnP0.x + 2 * oneMinusT * t * v.turnP1.x + t * t * v.turnP2.x;
          v.worldZ = oneMinusT * oneMinusT * v.turnP0.z + 2 * oneMinusT * t * v.turnP1.z + t * t * v.turnP2.z;
          const tdx = 2 * oneMinusT * (v.turnP1.x - v.turnP0.x) + 2 * t * (v.turnP2.x - v.turnP1.x);
          const tdz = 2 * oneMinusT * (v.turnP1.z - v.turnP0.z) + 2 * t * (v.turnP2.z - v.turnP1.z);
          v.worldAngle = Math.atan2(tdz, tdx);

          if (v.turnT >= 1.0) {
            v.isTurning = false;
            v.roadId = v.nextRoadId;
            v.from = v.nextFrom;
            v.to = v.nextTo;
            v.lane = v.nextLane;
            v.progress = 0.08;
            v.worldX = null;
            v.worldZ = null;
            v.worldAngle = null;
          }
          continue;
        }

        const leader = i > 0 ? group[i - 1] : null;

        if (this.closedRoads.has(v.roadId)) {
          v.targetSpeed = 0;
          v.stopped = true;
          v.braking = true;
          continue;
        }

        const toNode = this.intersections.find(n => n.id === v.to);
        const isRed = toNode && (
          (toNode.phase.includes('RED')) ||
          (toNode.phase.includes('EW') && (v.from === 'I1' || v.from === 'I3' || v.from === 'I5' || v.from === 'I7')) ||
          (toNode.phase.includes('NS') && (v.from === 'I2' || v.from === 'I4' || v.from === 'I6' || v.from === 'I8'))
        );

        // Distance to vehicle in front
        let leaderDist = leader ? (leader.progress - v.progress) : 999;
        let safeDist = (v.length / 55.0) + 0.04;

        if (leader && leaderDist < safeDist * 1.6) {
          // Following leader vehicle ahead
          if (leader.stopped || leaderDist < safeDist) {
            v.targetSpeed = 0;
            v.stopped = true;
            v.braking = true;
          } else {
            v.targetSpeed = Math.min(v.speed, leader.currentSpeed * 0.85);
            v.stopped = false;
            v.braking = v.currentSpeed > v.targetSpeed;
          }
        } else if (isRed && v.progress > 0.80) {
          // Approaching red signal stop line
          const stopTarget = 0.91;
          if (v.progress >= stopTarget) {
            v.targetSpeed = 0;
            v.stopped = true;
            v.braking = true;
            v.waitCounter += scaledDt;
          } else {
            // Gradual braking before stop line
            const distToStop = stopTarget - v.progress;
            v.targetSpeed = Math.max(0.04, v.speed * (distToStop / 0.11));
            v.stopped = false;
            v.braking = true;
          }
        } else {
          // Clear lane ahead -> accelerate smoothly towards normal cruising speed
          v.targetSpeed = v.speed;
          v.stopped = false;
          v.braking = false;
        }

        // Kinematic acceleration & braking
        const accelRate = (v.accel || 0.16) * scaledDt;
        const decelRate = (v.decel || 0.28) * scaledDt;

        if (v.currentSpeed < v.targetSpeed) {
          v.currentSpeed = Math.min(v.targetSpeed, v.currentSpeed + accelRate);
        } else if (v.currentSpeed > v.targetSpeed) {
          v.currentSpeed = Math.max(v.targetSpeed, v.currentSpeed - decelRate);
          v.braking = true;
        }

        // Integrate progress
        v.progress += v.currentSpeed * 0.18 * scaledDt;

        // Check for Bezier intersection turn initiation
        if (v.progress >= 0.92 && !isRed && !v.isTurning) {
          const fromNode = this.intersections.find(n => n.id === v.from);
          if (toNode && toNode.neighbors && toNode.neighbors.length > 0 && fromNode) {
            const viableNeighbors = toNode.neighbors.filter(nId => nId !== fromNode.id);
            const candidateTargets = viableNeighbors.length > 0 ? viableNeighbors : toNode.neighbors;
            const nextTargetId = candidateTargets[Math.floor(Math.random() * candidateTargets.length)];
            const nextTargetNode = this.intersections.find(n => n.id === nextTargetId);
            const nextRoad = this.roads.find(r =>
              (r.from === toNode.id && r.to === nextTargetId) ||
              (r.to === toNode.id && r.from === nextTargetId)
            );

            if (nextRoad && !nextRoad.closed && nextTargetNode) {
              const nextLane = v.type === 'bicycle' ? 2 : (Math.random() > 0.5 ? 1 : 2);
              const dx1 = toNode.x - fromNode.x;
              const dz1 = toNode.z - fromNode.z;
              const dist1 = Math.sqrt(dx1 * dx1 + dz1 * dz1) || 1;
              const ang1 = Math.atan2(dz1, dx1);
              const laneOffset1 = v.lane === 1 ? -1.8 : 1.8;
              const p0X = toNode.x - (dx1 / dist1) * 5.2 - Math.sin(ang1) * laneOffset1;
              const p0Z = toNode.z - (dz1 / dist1) * 5.2 + Math.cos(ang1) * laneOffset1;

              const dx2 = nextTargetNode.x - toNode.x;
              const dz2 = nextTargetNode.z - toNode.z;
              const dist2 = Math.sqrt(dx2 * dx2 + dz2 * dz2) || 1;
              const ang2 = Math.atan2(dz2, dx2);
              const laneOffset2 = nextLane === 1 ? -1.8 : 1.8;
              const p2X = toNode.x + (dx2 / dist2) * 5.2 - Math.sin(ang2) * laneOffset2;
              const p2Z = toNode.z + (dz2 / dist2) * 5.2 + Math.cos(ang2) * laneOffset2;

              const p1X = toNode.x;
              const p1Z = toNode.z;

              let turnDelta = ang2 - ang1;
              while (turnDelta > Math.PI) turnDelta -= Math.PI * 2;
              while (turnDelta < -Math.PI) turnDelta += Math.PI * 2;
              const turnDir = Math.sign(turnDelta);

              v.isTurning = true;
              v.turnT = 0.0;
              v.turnP0 = { x: p0X, z: p0Z };
              v.turnP1 = { x: p1X, z: p1Z };
              v.turnP2 = { x: p2X, z: p2Z };
              v.turnDir = turnDir;
              v.nextRoadId = nextRoad.id;
              v.nextLane = nextLane;
              v.nextFrom = toNode.id;
              v.nextTo = nextTargetNode.id;
              v.worldX = p0X;
              v.worldZ = p0Z;
              v.worldAngle = ang1;
              continue;
            }
          }
        }

        // Fallback transition if turn was not initiated
        if (v.progress >= 1.0) {
          v.progress = 0.02;
          if (toNode && toNode.neighbors && toNode.neighbors.length > 0) {
            const nextTarget = toNode.neighbors[Math.floor(Math.random() * toNode.neighbors.length)];
            const nextRoad = this.roads.find(r => 
              (r.from === toNode.id && r.to === nextTarget) || 
              (r.to === toNode.id && r.from === nextTarget)
            );
            if (nextRoad && !nextRoad.closed) {
              v.roadId = nextRoad.id;
              v.from = toNode.id;
              v.to = nextTarget;
              v.lane = v.type === 'bicycle' ? 2 : (Math.random() > 0.5 ? 1 : 2);
            }
          }
        }
      }
    }

    // Synchronize intersection queue lengths directly from stopped vehicles
    this.intersections.forEach(inter => {
      const stoppedInQueue = this.vehicles.filter(v => v.to === inter.id && v.stopped).length;
      inter.queueLength = Math.max(stoppedInQueue * 3 + 2, Math.round(inter.queueLength * 0.98));
    });

    // Append to telemetry history periodically
    if (Math.floor(this.simSeconds) % 15 === 0 && Math.random() < 0.2) {
      const timeStr = this.formatTime(this.simSeconds);
      if (this.metricsHistory.timestamps[this.metricsHistory.timestamps.length - 1] !== timeStr) {
        this.metricsHistory.timestamps.push(timeStr);
        if (this.metricsHistory.timestamps.length > 15) {
          this.metricsHistory.timestamps.shift();
          this.metricsHistory.classicalWait.shift();
          this.metricsHistory.hybridWait.shift();
          this.metricsHistory.queue.shift();
          this.metricsHistory.throughput.shift();
          this.metricsHistory.fuel.shift();
          this.metricsHistory.co2.shift();
        }

        const isOpt = this.optimizationMode === 'hybrid';
        this.metricsHistory.classicalWait.push(53 + Math.sin(this.simSeconds * 0.05) * 3);
        this.metricsHistory.hybridWait.push(isOpt ? (41 + Math.sin(this.simSeconds * 0.05) * 2) : 52);
        this.metricsHistory.queue.push(this.currentMetrics.queueLength);
        this.metricsHistory.throughput.push(this.currentMetrics.throughput);
        this.metricsHistory.fuel.push(this.currentMetrics.fuelConsumption);
        this.metricsHistory.co2.push(this.currentMetrics.co2Emissions);
      }
    }

    this.notify();
  }
}

window.trafficEngine = new TrafficEngine();
