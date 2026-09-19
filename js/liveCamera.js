// Live Traffic CCTV Simulation Engine with 4-Feed Matrix, HUD Overlays & Projection
// Canvas-based realistic camera feeds rendering dynamic vehicle flow, signal indicators, and incident overlays

class LiveCameraEngine {
  constructor() {
    this.cameras = [
      { id: 'CAM-01', nodeId: 'I1', name: 'Downtown West Overview', angle: 'Northbound Aerial', fps: 30, resolution: '1080p' },
      { id: 'CAM-02', nodeId: 'I3', name: 'Civic Center Arterial', angle: 'Eastbound Curbside', fps: 30, resolution: '1080p' },
      { id: 'CAM-03', nodeId: 'I4', name: 'Central Square Junction', angle: 'Wide Intersection', fps: 30, resolution: '1080p' },
      { id: 'CAM-04', nodeId: 'I6', name: 'Medical Emergency Watch', angle: 'Corridor Telephoto', fps: 30, resolution: '1080p' },
      { id: 'CAM-05', nodeId: 'I8', name: 'Avengers Tower Plaza & Transit', angle: 'Plaza South Angle', fps: 30, resolution: '1080p' }
    ];

    this.activeFeedIndex = 0;
    this.simulatedVehicles = {};
    this.initSimulatedVehicles();
  }

  initSimulatedVehicles() {
    this.cameras.forEach(cam => {
      this.simulatedVehicles[cam.id] = [];
      for (let i = 0; i < 8; i++) {
        this.simulatedVehicles[cam.id].push({
          x: Math.random() * 260,
          lane: Math.floor(Math.random() * 3),
          speed: 1.2 + Math.random() * 1.5,
          color: ['#00d0f5', '#ffffff', '#94a3b8', '#38bdf8', '#f59e0b'][Math.floor(Math.random() * 5)],
          type: Math.random() > 0.8 ? 'truck' : 'car'
        });
      }
    });
  }

  renderFeed(canvas, camId, nodeData, isEmergency, incident) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // 1. Dark Asphalt Background with asphalt texture noise
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, W, H);

    // Skyline silhouette in upper background (featuring Avengers Tower on CAM-05 or south views)
    if (camId === 'CAM-05' || camId === 'CAM-04') {
      // Avengers Tower silhouette
      ctx.fillStyle = '#1e293b';
      // Tower central body
      ctx.fillRect(W * 0.72, 8, 28, H * 0.35);
      // Cantilevered landing platform jutting out to the left
      ctx.fillRect(W * 0.62, 28, 24, 6);
      ctx.beginPath();
      ctx.arc(W * 0.62, 31, 3, Math.PI / 2, (3 * Math.PI) / 2);
      ctx.fill();
      // Glowing landing deck beacon
      ctx.fillStyle = '#00d0f5';
      ctx.beginPath();
      ctx.arc(W * 0.62, 30, 2, 0, Math.PI * 2);
      ctx.fill();
      // Sweeping crown
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(W * 0.72, 8);
      ctx.lineTo(W * 0.76, 2);
      ctx.lineTo(W * 0.79, 8);
      ctx.fill();
      // Spire beacon
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(W * 0.755, 0, 1.5, 3);
    }

    // 2. Road layout
    ctx.fillStyle = '#1e293b';
    // Horizontal highway
    ctx.fillRect(0, H * 0.35, W, H * 0.3);
    // Vertical cross street
    ctx.fillRect(W * 0.4, 0, W * 0.2, H);

    // 3. Lane Markings
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);

    // Horizontal dashed lines
    ctx.beginPath();
    ctx.moveTo(0, H * 0.45);
    ctx.lineTo(W, H * 0.45);
    ctx.moveTo(0, H * 0.55);
    ctx.lineTo(W, H * 0.55);
    ctx.stroke();

    // Vertical dashed lines
    ctx.beginPath();
    ctx.moveTo(W * 0.5, 0);
    ctx.lineTo(W * 0.5, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Double yellow center divider
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.5);
    ctx.lineTo(W, H * 0.5);
    ctx.stroke();

    // Zebra Crosswalks
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(W * 0.36, H * 0.36 + i * (H * 0.28 / 6), 6, 8);
      ctx.fillRect(W * 0.62, H * 0.36 + i * (H * 0.28 / 6), 6, 8);
    }

    // 4. Moving Vehicles
    const vehicles = this.simulatedVehicles[camId] || [];
    const isRed = nodeData && (nodeData.phase === 'RED' || nodeData.phase.includes('RED'));

    vehicles.forEach(v => {
      // If red light and approaching intersection center, slow down/stop
      const atStopLine = v.x > W * 0.28 && v.x < W * 0.38;
      const effectiveSpeed = (isRed && atStopLine) ? 0 : v.speed;

      v.x += effectiveSpeed;
      if (v.x > W + 20) {
        v.x = -20;
        v.lane = Math.floor(Math.random() * 3);
      }

      // Draw vehicle
      const vy = H * 0.38 + v.lane * (H * 0.08);
      ctx.fillStyle = v.color;
      const vLen = v.type === 'truck' ? 24 : 14;
      const vWid = 8;
      ctx.fillRect(v.x, vy, vLen, vWid);

      // Headlight glow
      ctx.fillStyle = 'rgba(255, 255, 200, 0.3)';
      ctx.beginPath();
      ctx.moveTo(v.x + vLen, vy);
      ctx.lineTo(v.x + vLen + 16, vy - 4);
      ctx.lineTo(v.x + vLen + 16, vy + vWid + 4);
      ctx.closePath();
      ctx.fill();
    });

    // 5. Emergency Ambulance if active
    if (isEmergency) {
      const strobeTime = Date.now() * 0.01;
      const ambX = (Date.now() * 0.08) % (W + 60) - 30;
      const ambY = H * 0.48;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ambX, ambY, 20, 10);

      // Red cross
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(ambX + 8, ambY + 2, 4, 6);
      ctx.fillRect(ambX + 6, ambY + 4, 8, 2);

      // Flashing lightbar
      ctx.fillStyle = Math.sin(strobeTime) > 0 ? '#ef4444' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(ambX + 10, ambY + 5, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. CCTV HUD Overlays
    this.renderCctvHud(ctx, W, H, camId, nodeData, isEmergency, incident);
  }

  renderCctvHud(ctx, W, H, camId, nodeData, isEmergency, incident) {
    // Vintage vignette / lens border
    const grad = ctx.createRadialGradient(W / 2, H / 2, W * 0.35, W / 2, H / 2, W * 0.65);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Crosshair corners
    ctx.strokeStyle = 'rgba(0, 208, 245, 0.4)';
    ctx.lineWidth = 1.5;
    const s = 14;
    // Top-left
    ctx.beginPath(); ctx.moveTo(12, 12 + s); ctx.lineTo(12, 12); ctx.lineTo(12 + s, 12); ctx.stroke();
    // Top-right
    ctx.beginPath(); ctx.moveTo(W - 12 - s, 12); ctx.lineTo(W - 12, 12); ctx.lineTo(W - 12, 12 + s); ctx.stroke();
    // Bottom-left
    ctx.beginPath(); ctx.moveTo(12, H - 12 - s); ctx.lineTo(12, H - 12); ctx.lineTo(12 + s, H - 12); ctx.stroke();
    // Bottom-right
    ctx.beginPath(); ctx.moveTo(W - 12 - s, H - 12); ctx.lineTo(W - 12, H - 12); ctx.lineTo(W - 12, H - 12 - s); ctx.stroke();

    // Top Bar: Camera ID & Timestamp
    ctx.fillStyle = '#00d0f5';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillText(`${camId} · [SIMULATED LIVE CCTV]`, 18, 22);

    // Flashing REC Dot
    const now = new Date();
    const isBlink = Math.floor(Date.now() / 500) % 2 === 0;
    if (isBlink) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(W - 85, 18, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`REC ${now.toTimeString().split(' ')[0]}`, W - 76, 22);

    // Signal state pill
    if (nodeData) {
      const phaseColor = nodeData.phase.includes('GREEN') ? '#10b981' : nodeData.phase.includes('YELLOW') ? '#f59e0b' : '#ef4444';
      ctx.fillStyle = phaseColor;
      ctx.beginPath();
      ctx.arc(22, H - 24, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(`SIGNAL: ${nodeData.phase} (${nodeData.phaseTimer}s) | QUEUE: ${nodeData.queueLength} veh`, 32, H - 21);
    }

    // Incident warning banner
    if (incident && incident.intersectionId === (nodeData && nodeData.id)) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.fillRect(W * 0.15, 30, W * 0.7, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⚠️ CONGESTION INCIDENT: ${incident.type.toUpperCase()}`, W / 2, 42);
      ctx.textAlign = 'left';
    }

    // Emergency tracking banner
    if (isEmergency && camId === 'CAM-04') {
      ctx.fillStyle = 'rgba(244, 63, 94, 0.9)';
      ctx.fillRect(W * 0.1, H - 42, W * 0.8, 16);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🚑 EMERGENCY CORRIDOR ACTIVE · PRIORITY LOCK', W / 2, H - 30);
      ctx.textAlign = 'left';
    }
  }
}

window.liveCameraEngine = new LiveCameraEngine();

// React Live Camera Feed Component
function LiveCameraFeedCanvas({ camId, nodeData, isEmergency, incident, height = 180, onExpand }) {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = () => {
      window.liveCameraEngine.renderFeed(canvas, camId, nodeData, isEmergency, incident);
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [camId, nodeData, isEmergency, incident]);

  return React.createElement(
    'div',
    { className: "relative rounded-xl overflow-hidden border border-slate-700/80 shadow-md bg-slate-950 group" },
    React.createElement('canvas', {
      ref: canvasRef,
      width: 340,
      height: height,
      className: "w-full h-full block cursor-pointer object-cover",
      onClick: () => onExpand && onExpand(camId)
    }),
    React.createElement('div', { className: "cctv-scanlines absolute inset-0" })
  );
}

window.LiveCameraFeedCanvas = LiveCameraFeedCanvas;
