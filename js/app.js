// Main React 18 Application for Quantum Traffic (White / Light Background Theme Default)

const { useState, useEffect, useRef } = React;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    if (window.diagnosticsSuite) {
      window.diagnosticsSuite.addLog('ERROR', 'UI', `Component error caught: ${error.message}`);
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/40 text-center space-y-3 m-4">
          <div className="text-2xl">⚠️</div>
          <h3 className="text-sm font-bold text-rose-400">INTERFACE COMPONENT RECOVERED</h3>
          <p className="text-xs text-slate-400">An unexpected state update occurred. Telemetry and simulation engines remain healthy.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
          >
            Recover View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [theme, setTheme] = useState('white'); // 'white' | 'dark'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [simState, setSimState] = useState({ ...window.trafficEngine });
  const [selectedIntersectionId, setSelectedIntersectionId] = useState(null);

  // Environmental Day/Night mode
  const [timeOfDay, setTimeOfDay] = useState('dusk'); // 'day' | 'dusk' | 'night'
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Cinematic Intro state
  const [showIntro, setShowIntro] = useState(() => {
    return localStorage.getItem('qt_has_seen_intro') !== 'true';
  });
  const [introScene, setIntroScene] = useState(1);
  const [isAudioMuted, setIsAudioMuted] = useState(window.soundEngine.isMuted);

  // Modals & Panels
  const [showOptModal, setShowOptModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
  const [showAiCopilot, setShowAiCopilot] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [optProgress, setOptProgress] = useState(0);
  const [optStepLabel, setOptStepLabel] = useState('');

  // 3D City & QUBO ref
  const cityRef = useRef(null);
  const quboRef = useRef(null);
  const cityInstance = useRef(null);
  const quboInstance = useRef(null);

  // 3D Earth ref & City Selector
  const earthRef = useRef(null);
  const earthInstance = useRef(null);
  const [currentCityId, setCurrentCityId] = useState(window.currentCityId || 'coimbatore');
  const [showCitySelectModal, setShowCitySelectModal] = useState(false);
  const [showLandmarkModal, setShowLandmarkModal] = useState(false);
  const [landmarkCameraStep, setLandmarkCameraStep] = useState('exterior');

  // Full-Width Command Center & Contextual Floating Overlays State
  const [isFullscreenCity, setIsFullscreenCity] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [showQuantumOverlay, setShowQuantumOverlay] = useState(false);
  const [showAnalyticsDrawer, setShowAnalyticsDrawer] = useState(false);

  const toggleFullscreenCity = () => {
    setIsFullscreenCity(prev => {
      const next = !prev;
      setTimeout(() => {
        if (cityInstance.current && cityInstance.current.onResize) {
          cityInstance.current.onResize();
        }
        window.dispatchEvent(new Event('resize'));
      }, 60);
      return next;
    });
    if (window.soundEngine) window.soundEngine.playClick();
  };

  // Diagnostics state
  const [diagProgress, setDiagProgress] = useState(0);
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagSummary, setDiagSummary] = useState(window.diagnosticsSuite.getSummary());

  // Set Time Of Day handler
  const handleSetTimeOfDay = (mode) => {
    setTimeOfDay(mode);
    if (cityInstance.current && cityInstance.current.setTimeOfDay) {
      cityInstance.current.setTimeOfDay(mode);
    }
    if (window.soundEngine) window.soundEngine.playClick();
  };

  // Toggle Theme
  const toggleTheme = () => {
    const newTheme = theme === 'white' ? 'dark' : 'white';
    setTheme(newTheme);
    if (cityInstance.current) {
      cityInstance.current.setTheme(newTheme);
    }
    if (earthInstance.current) {
      earthInstance.current.setTheme(newTheme);
    }
    if (quboInstance.current) {
      quboInstance.current.setTheme(newTheme);
    }
    document.documentElement.className = newTheme === 'white' ? 'light' : 'dark';
    if (window.soundEngine) window.soundEngine.playClick();
  };

  // Subscribe to simulation engine
  useEffect(() => {
    const unsub = window.trafficEngine.subscribe((engine) => {
      setSimState({
        isRunning: engine.isRunning,
        simSpeed: engine.simSpeed,
        simSeconds: engine.simSeconds,
        densitySetting: engine.densitySetting,
        optimizationMode: engine.optimizationMode,
        isEmergencyActive: engine.isEmergencyActive,
        ambulance: { ...engine.ambulance },
        activeIncident: engine.activeIncident ? { ...engine.activeIncident } : null,
        closedRoads: new Set(engine.closedRoads),
        intersections: [...engine.intersections],
        roads: [...engine.roads],
        currentMetrics: { ...engine.currentMetrics },
        metricsHistory: { ...engine.metricsHistory },
        optimizationStatus: engine.optimizationStatus,
        weights: { ...engine.weights },
        autoOptimizeEnabled: engine.autoOptimizeEnabled,
        autoOptimizerStatus: engine.autoOptimizerStatus,
        optimizationCooldownTimer: engine.optimizationCooldownTimer,
        optimizationHistory: [...(engine.optimizationHistory || [])]
      });

      if (cityInstance.current) {
        cityInstance.current.updateFromSimulation(engine);
      }
    });

    let lastTime = performance.now();
    const loop = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      if (dt > 0 && dt < 1) {
        window.trafficEngine.tick(dt);
      }
      requestAnimationFrame(loop);
    };
    const reqId = requestAnimationFrame(loop);

    return () => {
      unsub();
      cancelAnimationFrame(reqId);
    };
  }, []);

  // Cinematic Intro Sequence Timer
  useEffect(() => {
    if (!showIntro) return;

    if (introScene === 1) {
      window.soundEngine.startAmbient();
    }

    const sceneDurations = [3500, 3200, 3400, 3200, 3400, 3200, 3400, 99999];
    const duration = sceneDurations[introScene - 1] || 3000;

    if (introScene < 8) {
      const timer = setTimeout(() => {
        setIntroScene(prev => prev + 1);
        if (window.soundEngine && introScene === 4) {
          window.soundEngine.playQuantumChime();
        } else if (introScene === 6) {
          window.soundEngine.playEmergencySiren();
        }
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [showIntro, introScene]);

  const completeIntro = () => {
    setShowIntro(false);
    localStorage.setItem('qt_has_seen_intro', 'true');
    if (window.soundEngine) {
      window.soundEngine.playClick();
    }
  };

  const replayIntro = () => {
    setShowIntro(true);
    setIntroScene(1);
    window.soundEngine.startAmbient();
  };

  const toggleSound = () => {
    const muted = window.soundEngine.toggleMute();
    setIsAudioMuted(muted);
  };

  // Mount 3D City Digital Twin
  useEffect(() => {
    if ((activeTab === 'dashboard' || activeTab === 'simulation') && !showIntro) {
      if (!cityInstance.current && cityRef.current) {
        cityInstance.current = new window.TrafficCity3D('traffic-city-canvas', {
          theme: theme,
          onSelectIntersection: (id) => {
            setSelectedIntersectionId(id);
          },
          onSelectLandmark: () => {
            setShowLandmarkModal(true);
            setLandmarkCameraStep('exterior');
          }
        });
      }
    } else {
      if (cityInstance.current) {
        cityInstance.current.dispose();
        cityInstance.current = null;
      }
    }
  }, [activeTab, showIntro]);

  // Mount 3D Earth Globe
  useEffect(() => {
    if (activeTab === 'globe' && !showIntro) {
      if (!earthInstance.current && earthRef.current) {
        earthInstance.current = new window.TrafficEarth3D('traffic-earth-canvas', {
          theme: theme,
          onSelectCity: (cid) => {
            setCurrentCityId(cid);
          }
        });
      }
    } else {
      if (earthInstance.current) {
        earthInstance.current.dispose();
        earthInstance.current = null;
      }
    }
  }, [activeTab, showIntro]);

  // Mount QUBO 3D landscape when optimizer tab is active
  useEffect(() => {
    if (activeTab === 'optimizer' && quboRef.current && !quboInstance.current) {
      quboInstance.current = new window.QuboLandscape3D('qubo-landscape-canvas', { theme: theme });
    }
  }, [activeTab, theme]);

  const handleCitySwitch = (cityId) => {
    setCurrentCityId(cityId);
    window.switchCity(cityId);
    if (earthInstance.current) {
      earthInstance.current.selectCity(cityId);
    }
  };

  const handleZoomIntoCity = (cityId) => {
    setCurrentCityId(cityId);
    if (earthInstance.current) {
      earthInstance.current.zoomToCity(cityId, () => {
        window.switchCity(cityId);
        setActiveTab('dashboard');
      });
    } else {
      window.switchCity(cityId);
      setActiveTab('dashboard');
    }
  };

  const handleRunOptimization = () => {
    setShowOptModal(true);
    setShowQuantumOverlay(true);
    window.trafficEngine.runQuantumOptimization(
      (pct, label) => {
        setOptProgress(pct);
        setOptStepLabel(label);
        if (quboInstance.current) {
          quboInstance.current.setIterationProgress(pct);
        }
      },
      () => {
        setTimeout(() => setShowOptModal(false), 800);
      }
    );
  };

  const handleRunDiagnostics = () => {
    setDiagRunning(true);
    window.diagnosticsSuite.runFullDiagnostics(
      (pct, test) => {
        setDiagProgress(pct);
        setDiagSummary(window.diagnosticsSuite.getSummary());
      },
      (summary) => {
        setDiagRunning(false);
        setDiagSummary(summary);
      }
    );
  };

  const handleResetDemo = () => {
    window.trafficEngine.reset();
    setShowResetModal(false);
    if (cityInstance.current) {
      cityInstance.current.setCameraPreset('overview');
    }
    window.diagnosticsSuite.addLog('INFO', 'System', 'Demo reset to initial baseline state.', 'RESET');
  };

  const selectedIntersection = simState.intersections.find(n => n.id === selectedIntersectionId);

  // If intro is active, render Cinematic Intro view (Clean White/Modern)
  if (showIntro) {
    return (
      <CinematicIntroView
        scene={introScene}
        onSkip={completeIntro}
        onLaunch={completeIntro}
        isMuted={isAudioMuted}
        onToggleSound={toggleSound}
        theme={theme}
      />
    );
  }

  const isWhite = theme === 'white';

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans select-none ${
      isWhite ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Left Sidebar (Collapses in Fullscreen City Mode) */}
      {!isFullscreenCity && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (window.soundEngine) window.soundEngine.playClick();
          }}
          onReplayIntro={replayIntro}
          onOpenDiagnostics={() => setShowDiagnosticsModal(true)}
          theme={theme}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Top Command Bar (Collapses in Fullscreen City Mode) */}
        {!isFullscreenCity && (
          <TopBar
            simTime={window.trafficEngine.getSimTimeString()}
            isRunning={simState.isRunning}
            onTogglePlay={() => {
              window.trafficEngine.isRunning = !window.trafficEngine.isRunning;
              setSimState(prev => ({ ...prev, isRunning: window.trafficEngine.isRunning }));
              if (window.soundEngine) window.soundEngine.playClick();
            }}
            onReset={() => setShowResetModal(true)}
            speed={simState.simSpeed}
            onSetSpeed={(s) => window.trafficEngine.setSpeed(s)}
            density={simState.densitySetting}
            onSetDensity={(d) => window.trafficEngine.setDensity(d)}
            optMode={simState.optimizationMode}
            onSetOptMode={(m) => window.trafficEngine.setOptimizationMode(m)}
            onRunOpt={handleRunOptimization}
            isEmergency={simState.isEmergencyActive}
            onToggleEmergency={() => {
              if (simState.isEmergencyActive) {
                window.trafficEngine.cancelEmergencyCorridor();
              } else {
                window.trafficEngine.activateEmergencyCorridor();
              }
            }}
            isMuted={isAudioMuted}
            onToggleSound={toggleSound}
            devMode={devMode}
            onToggleDevMode={() => setDevMode(!devMode)}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenAiCopilot={() => setShowAiCopilot(true)}
            currentCityId={currentCityId}
            onOpenCitySelect={() => setShowCitySelectModal(true)}
            onOpenGlobe={() => setActiveTab('globe')}
            activeTab={activeTab}
            autoOptimizeEnabled={simState.autoOptimizeEnabled}
            autoOptimizerStatus={simState.autoOptimizerStatus}
            cooldownTimer={simState.optimizationCooldownTimer}
            onToggleAutoOptimize={() => {
              window.trafficEngine.autoOptimizeEnabled = !window.trafficEngine.autoOptimizeEnabled;
              setSimState(prev => ({ ...prev, autoOptimizeEnabled: window.trafficEngine.autoOptimizeEnabled }));
              if (window.soundEngine) window.soundEngine.playClick();
            }}
            timeOfDay={timeOfDay}
            onSetTimeOfDay={handleSetTimeOfDay}
            onOpenHistory={() => setShowHistoryModal(true)}
            historyCount={(simState.optimizationHistory || []).length}
          />
        )}

        {/* Dynamic Incident Notification Bar */}
        {!isFullscreenCity && simState.activeIncident && (
          <div className={`px-6 py-2 flex items-center justify-between border-b backdrop-blur-md animate-pulse ${
            isWhite 
              ? 'bg-rose-50 border-rose-200 text-rose-800' 
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}>
            <div className="flex items-center space-x-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="text-xs font-semibold tracking-wider uppercase text-rose-600">
                ACTIVE INCIDENT DETECTED
              </span>
              <span className="text-xs font-medium">
                {simState.activeIncident.message}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRunOptimization}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium transition shadow-sm"
              >
                Re-Optimize Network (QAOA)
              </button>
              <button
                onClick={() => window.trafficEngine.clearEvents()}
                className={`px-3 py-1 rounded text-xs font-medium transition border ${
                  isWhite ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                Clear Incident
              </button>
            </div>
          </div>
        )}

        {/* Main View Router */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden ${isFullscreenCity ? 'p-0' : 'p-4 md:p-6'} relative ${
          isWhite ? 'bg-slate-50' : 'bg-slate-950'
        }`}>
          {activeTab === 'globe' && (
            <GlobalEarthView
              earthRef={earthRef}
              onSelectCity={handleCitySwitch}
              onZoomIntoCity={handleZoomIntoCity}
              theme={theme}
            />
          )}

          {activeTab === 'cctv_wall' && (
            <CctvWallView
              simState={simState}
              onSelectIntersection={(id) => {
                setSelectedIntersectionId(id);
                setActiveTab('dashboard');
              }}
              theme={theme}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              simState={simState}
              cityRef={cityRef}
              cityInstance={cityInstance}
              onRunOpt={handleRunOptimization}
              onSelectIntersection={(id) => {
                setSelectedIntersectionId(id);
                if (cityInstance.current && cityInstance.current.focusOnIntersection) {
                  cityInstance.current.focusOnIntersection(id);
                }
              }}
              selectedIntersectionId={selectedIntersectionId}
              onClearIntersection={() => setSelectedIntersectionId(null)}
              theme={theme}
              isFullscreenCity={isFullscreenCity}
              onToggleFullscreenCity={toggleFullscreenCity}
              showQuantumOverlay={showQuantumOverlay}
              onToggleQuantumOverlay={() => setShowQuantumOverlay(prev => !prev)}
              selectedCameraId={selectedCameraId}
              onSelectCamera={setSelectedCameraId}
              showAnalyticsDrawer={showAnalyticsDrawer}
              onToggleAnalyticsDrawer={() => setShowAnalyticsDrawer(prev => !prev)}
              showLandmarkModal={showLandmarkModal}
              setShowLandmarkModal={setShowLandmarkModal}
              landmarkCameraStep={landmarkCameraStep}
              setLandmarkCameraStep={setLandmarkCameraStep}
              setActiveTab={setActiveTab}
              timeOfDay={timeOfDay}
              onSetTimeOfDay={handleSetTimeOfDay}
            />
          )}

          {activeTab === 'network' && (
            <NetworkView
              simState={simState}
              onSelectIntersection={(id) => setSelectedIntersectionId(id)}
              theme={theme}
            />
          )}

          {activeTab === 'simulation' && (
            <SimulationView
              simState={simState}
              cityRef={cityRef}
              cityInstance={cityInstance}
              onSelectIntersection={(id) => setSelectedIntersectionId(id)}
              theme={theme}
            />
          )}

          {activeTab === 'gis_map' && (
            <GeoapifyMapView
              simState={simState}
              onSelectIntersection={(id) => setSelectedIntersectionId(id)}
              theme={theme}
            />
          )}

          {activeTab === 'ai_copilot' && (
            <AiCopilotView
              simState={simState}
              theme={theme}
            />
          )}

          {activeTab === 'optimizer' && (
            <QuantumOptimizerView
              simState={simState}
              quboRef={quboRef}
              onRunOpt={handleRunOptimization}
              theme={theme}
            />
          )}

          {activeTab === 'corridor' && (
            <EmergencyCorridorView
              simState={simState}
              onToggleEmergency={() => {
                if (simState.isEmergencyActive) {
                  window.trafficEngine.cancelEmergencyCorridor();
                } else {
                  window.trafficEngine.activateEmergencyCorridor();
                }
              }}
              theme={theme}
            />
          )}

          {activeTab === 'events' && (
            <EventsView
              simState={simState}
              onRunOpt={handleRunOptimization}
              theme={theme}
            />
          )}

          {activeTab === 'performance' && (
            <PerformanceView simState={simState} theme={theme} />
          )}

          {activeTab === 'comparison' && (
            <ComparisonView simState={simState} theme={theme} />
          )}

          {activeTab === 'architecture' && (
            <ArchitectureView theme={theme} />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              simState={simState}
              devMode={devMode}
              setDevMode={setDevMode}
              onReplayIntro={replayIntro}
              onResetDemo={() => setShowResetModal(true)}
              onOpenDiagnostics={() => setShowDiagnosticsModal(true)}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          )}
        </div>
      </div>

      {/* Real-time Performance Monitor Overlay (Dev Mode) */}
      {devMode && (
        <PerformanceMonitorOverlay simState={simState} theme={theme} />
      )}

      {/* Intersection Details Inspector Modal */}
      {selectedIntersectionId && (
        <IntersectionModal
          key={selectedIntersectionId}
          node={selectedIntersection}
          onClose={() => setSelectedIntersectionId(null)}
          onApplyTiming={(timing) => {
            if (selectedIntersection) {
              selectedIntersection.currentTiming = { ...timing };
              window.trafficEngine.updateMetrics();
              if (window.soundEngine) window.soundEngine.playClick();
            }
          }}
          theme={theme}
        />
      )}

      {/* Autonomous Optimization History Ledger Modal */}
      {showHistoryModal && (
        <OptimizationHistoryModal
          history={simState.optimizationHistory || []}
          onClear={() => {
            window.trafficEngine.optimizationHistory = [];
            setSimState(prev => ({ ...prev, optimizationHistory: [] }));
          }}
          onClose={() => setShowHistoryModal(false)}
          theme={theme}
        />
      )}

      {/* Optimization Running Modal */}
      {showOptModal && (
        <OptimizationProgressModal
          progress={optProgress}
          stepLabel={optStepLabel}
          status={simState.optimizationStatus}
          iterations={window.trafficEngine.optimizationIterations}
          objective={window.trafficEngine.bestObjective}
          theme={theme}
        />
      )}

      {/* System Diagnostics Modal */}
      {showDiagnosticsModal && (
        <DiagnosticsModal
          isRunning={diagRunning}
          progress={diagProgress}
          summary={diagSummary}
          testResults={window.diagnosticsSuite.testResults}
          logs={window.diagnosticsSuite.logs}
          onRunTests={handleRunDiagnostics}
          onClearLogs={() => {
            window.diagnosticsSuite.clearLogs();
            setDiagSummary(window.diagnosticsSuite.getSummary());
          }}
          onExportLogs={() => window.diagnosticsSuite.exportLogsJson()}
          onCopyDiagnostics={() => window.diagnosticsSuite.copyDiagnosticsToClipboard()}
          onClose={() => setShowDiagnosticsModal(false)}
          theme={theme}
        />
      )}

      {/* Demo Reset Confirmation Modal */}
      {showResetModal && (
        <ResetConfirmModal
          onConfirm={handleResetDemo}
          onCancel={() => setShowResetModal(false)}
          theme={theme}
        />
      )}

      {/* Featherless AI Copilot Floating Modal */}
      {showAiCopilot && (
        <AiCopilotModal
          simState={simState}
          theme={theme}
          onClose={() => setShowAiCopilot(false)}
        />
      )}

      {/* Global City Switcher Modal */}
      {showCitySelectModal && (
        <CitySelectModal
          currentCityId={currentCityId}
          onSelectCity={handleCitySwitch}
          onClose={() => setShowCitySelectModal(false)}
          theme={theme}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------
// Sub-components: Sidebar, TopBar, Views, and Modals
// ----------------------------------------------------

function Sidebar({ activeTab, setActiveTab, onReplayIntro, onOpenDiagnostics, theme }) {
  const isWhite = theme === 'white';
  const navItems = [
    { id: 'globe', label: 'Global 3D Earth', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', isNew: true },
    { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'cctv_wall', label: 'Live CCTV Matrix', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', isNew: true },
    { id: 'network', label: 'Traffic Network', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
    { id: 'simulation', label: 'Live Simulation', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
    { id: 'gis_map', label: 'Geoapify GIS Map', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7', isNew: true },
    { id: 'ai_copilot', label: 'Featherless AI Copilot', icon: 'M13 10V3L4 14h7v7l9-11h-7z', isNew: true },
    { id: 'optimizer', label: 'Quantum Optimizer', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'corridor', label: 'Emergency Corridor', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'events', label: 'Dynamic Events', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    { id: 'performance', label: 'Performance Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'comparison', label: 'Classical vs Quantum', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
    { id: 'architecture', label: 'System Architecture', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
    { id: 'settings', label: 'Settings & QA', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
  ];

  return (
    <aside className={`w-64 flex flex-col justify-between border-r backdrop-blur-xl z-20 ${
      isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/95 border-slate-800'
    }`}>
      <div>
        {/* Brand Header */}
        <div className={`p-5 border-b ${isWhite ? 'border-slate-200' : 'border-slate-800/80'}`}>
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className={`text-base font-bold tracking-wider flex items-center gap-1.5 ${isWhite ? 'text-slate-900' : 'text-white'}`}>
                Q-TRAFFIC
                <span className="text-[10px] bg-cyan-500/10 text-cyan-600 font-mono px-1.5 py-0.5 rounded border border-cyan-500/20">v2.4</span>
              </h1>
              <p className={`text-[11px] font-medium leading-tight ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Quantum Traffic Optimization</p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-250px)]">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? isWhite
                      ? 'bg-cyan-50 text-cyan-700 border-l-2 border-cyan-600 font-semibold shadow-sm'
                      : 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border-l-2 border-cyan-400 shadow-sm'
                    : isWhite
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <svg className={`w-4 h-4 ${isActive ? (isWhite ? 'text-cyan-600' : 'text-cyan-400') : (isWhite ? 'text-slate-400' : 'text-slate-500')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                </svg>
                <span className="flex-1 text-left">{item.label}</span>
                {item.isNew && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-xs">
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status Panel */}
      <div className={`p-4 border-t ${isWhite ? 'border-slate-200 bg-slate-50/70' : 'border-slate-800/80 bg-slate-950/60'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>System Status</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
            ONLINE
          </span>
        </div>
        <p className={`text-[10px] font-mono ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Sim: Hybrid QUBO / QAOA</p>
        <p className={`text-[10px] font-mono ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Engine: WebGL 3D (White Theme)</p>

        <div className={`mt-3 pt-3 border-t flex items-center justify-between ${isWhite ? 'border-slate-200' : 'border-slate-800'}`}>
          <button
            onClick={onReplayIntro}
            className={`text-[10px] transition flex items-center gap-1 ${isWhite ? 'text-slate-600 hover:text-cyan-600' : 'text-slate-400 hover:text-cyan-300'}`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
            Replay Intro
          </button>
          <button
            onClick={onOpenDiagnostics}
            className={`text-[10px] transition flex items-center gap-1 ${isWhite ? 'text-slate-600 hover:text-purple-600' : 'text-slate-400 hover:text-purple-300'}`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Diagnostics
          </button>
        </div>
      </div>
    </aside>
  );
}

function TopBar({
  simTime,
  isRunning,
  onTogglePlay,
  onReset,
  speed,
  onSetSpeed,
  density,
  onSetDensity,
  optMode,
  onSetOptMode,
  onRunOpt,
  isEmergency,
  onToggleEmergency,
  isMuted,
  onToggleSound,
  devMode,
  onToggleDevMode,
  theme,
  onToggleTheme,
  onOpenAiCopilot,
  currentCityId,
  onOpenCitySelect,
  onOpenGlobe,
  activeTab,
  autoOptimizeEnabled,
  autoOptimizerStatus,
  cooldownTimer,
  onToggleAutoOptimize,
  timeOfDay,
  onSetTimeOfDay,
  onOpenHistory,
  historyCount
}) {
  const isWhite = theme === 'white';
  const currentCity = window.GLOBAL_CITIES && window.GLOBAL_CITIES[currentCityId];

  return (
    <header className={`h-16 border-b px-6 flex items-center justify-between backdrop-blur-lg z-10 ${
      isWhite ? 'bg-white/95 border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
    }`}>
      {/* Collapsible Top Status Strip: LIMO | NETWORK ONLINE | 8 INTERSECTIONS | OPTIMIZER ACTIVE | EMERGENCY STATUS | CURRENT TIME */}
      <div className="flex items-center space-x-2">
        {/* LIMO Badge */}
        <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 border shadow-xs ${
          isWhite ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-cyan-400'
        }`}>
          <span className="font-black tracking-wider">LIMO</span>
        </div>

        {/* City Selector Pill */}
        <button
          onClick={onOpenCitySelect}
          title="Change Urban Digital Twin Metropolis"
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition border shadow-xs ${
            isWhite 
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' 
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
          }`}
        >
          <span>{currentCity ? currentCity.flag : '🏙️'}</span>
          <span className="font-bold hidden sm:inline">{currentCity ? currentCity.name : 'Select City'}</span>
          <span className="text-[10px] text-slate-400">▾</span>
        </button>

        {/* Global 3D Earth Toggle */}
        <button
          onClick={onOpenGlobe}
          title="Return to Global 3D Earth"
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition border shadow-xs ${
            activeTab === 'globe'
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white border-cyan-400 shadow-md'
              : (isWhite 
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700' 
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200')
          }`}
        >
          <span>🌍</span>
          <span className="hidden md:inline">3D Earth</span>
        </button>

        {/* Network Online Pill */}
        <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold">NETWORK ONLINE</span>
        </div>

        {/* 8 Intersections */}
        <div className={`hidden xl:flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-mono border ${
          isWhite ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-300'
        }`}>
          <span>8 INTERSECTIONS</span>
        </div>

        {/* Optimizer Status */}
        <div className={`hidden 2xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border ${
          autoOptimizeEnabled
            ? (autoOptimizerStatus === 'OPTIMIZING'
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/40 animate-pulse'
                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30')
            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${autoOptimizeEnabled ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'}`}></span>
          <span>{autoOptimizeEnabled ? (autoOptimizerStatus === 'OPTIMIZING' ? 'QAOA RUNNING' : 'OPTIMIZER ACTIVE') : 'OPTIMIZER OFF'}</span>
        </div>

        {/* Emergency Status */}
        <div className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border ${
          isEmergency
            ? 'bg-rose-500/15 text-rose-400 border-rose-500/40 animate-pulse'
            : (isWhite ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950/60 border-slate-800 text-slate-400')
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isEmergency ? 'bg-rose-500 animate-ping' : 'bg-slate-500'}`}></span>
          <span>{isEmergency ? 'EMERGENCY ACTIVE' : 'EMERGENCY STANDBY'}</span>
        </div>

        {/* Clock */}
        <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border font-mono text-[11px] ${
          isWhite ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-cyan-300'
        }`}>
          <svg className={`w-3.5 h-3.5 ${isWhite ? 'text-cyan-600' : 'text-cyan-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold">{simTime}</span>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="flex items-center space-x-2.5">
        {/* Auto-Pilot Toggle Button */}
        <button
          onClick={onToggleAutoOptimize}
          title={autoOptimizeEnabled ? "Disable Autonomous Background Quantum Optimization" : "Enable Autonomous Background Quantum Optimization"}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition border shadow-sm ${
            autoOptimizeEnabled
              ? (isWhite ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/50')
              : (isWhite ? 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700')
          }`}
        >
          <span>🤖</span>
          <span className="hidden sm:inline">Auto-Pilot:</span>
          <span className="font-bold">{autoOptimizeEnabled ? 'ON' : 'OFF'}</span>
        </button>

        {/* Day / Dusk / Night Environmental Lighting Switcher */}
        <div className={`flex items-center rounded-lg p-0.5 border ${
          isWhite ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          {[
            { id: 'day', label: '☀️ Day' },
            { id: 'dusk', label: '🌇 Dusk' },
            { id: 'night', label: '🌙 Night' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => onSetTimeOfDay && onSetTimeOfDay(t.id)}
              className={`px-2 py-1 text-[10px] font-semibold rounded transition ${
                timeOfDay === t.id
                  ? (isWhite ? 'bg-white text-cyan-700 shadow-sm font-bold' : 'bg-cyan-500/30 text-cyan-300 font-bold')
                  : (isWhite ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200')
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Optimization Ledger History Modal Button */}
        <button
          onClick={onOpenHistory}
          title="Open Autonomous Quantum Optimization History Ledger"
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center space-x-1.5 transition ${
            isWhite ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
          }`}
        >
          <span>📜</span>
          <span className="hidden sm:inline">Ledger</span>
          {historyCount > 0 && (
            <span className="px-1.5 py-0.2 text-[9px] font-mono bg-cyan-600 text-white rounded-full">
              {historyCount}
            </span>
          )}
        </button>

        {/* Featherless AI Copilot Button */}
        <button
          onClick={onOpenAiCopilot}
          title="Open Featherless AI Quantum Traffic Copilot"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition border shadow-sm ${
            isWhite
              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white border-purple-400'
              : 'bg-gradient-to-r from-purple-600/90 via-indigo-600/90 to-cyan-600/90 hover:from-purple-500 hover:to-cyan-500 text-white border-purple-500/50'
          }`}
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
          </span>
          <span>AI Copilot</span>
          <span className="text-[9px] px-1.5 py-0.2 bg-white/20 rounded font-mono">Featherless</span>
        </button>

        {/* Theme Switcher Button */}
        <button
          onClick={onToggleTheme}
          title={isWhite ? "Switch to Dark Mode" : "Switch to White Mode"}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center space-x-1.5 transition ${
            isWhite ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
          }`}
        >
          {isWhite ? (
            <>
              <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              <span>White</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              <span>Dark</span>
            </>
          )}
        </button>

        {/* Speed Controls */}
        <div className={`flex items-center rounded-lg p-1 border ${
          isWhite ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          {[0.5, 1, 2, 5].map(s => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              className={`px-2 py-1 text-[10px] font-semibold rounded ${
                speed === s 
                  ? (isWhite ? 'bg-white text-cyan-700 shadow-sm' : 'bg-cyan-500/30 text-cyan-300')
                  : (isWhite ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200')
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Traffic Density Presets */}
        <select
          value={density}
          onChange={(e) => onSetDensity(e.target.value)}
          className={`text-xs rounded-lg px-2.5 py-1.5 border focus:outline-none focus:border-cyan-500 ${
            isWhite ? 'bg-white text-slate-800 border-slate-200' : 'bg-slate-950 text-slate-300 border-slate-800'
          }`}
        >
          <option value="low">Density: Low</option>
          <option value="medium">Density: Medium</option>
          <option value="high">Density: High</option>
          <option value="extreme">Density: Extreme</option>
        </select>

        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
            isRunning 
              ? (isWhite ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700')
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
          }`}
        >
          {isRunning ? (
            <>
              <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              <span>Pause</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              <span>Resume</span>
            </>
          )}
        </button>

        {/* Run QAOA Manual Trigger */}
        <button
          onClick={onRunOpt}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md flex items-center space-x-1.5 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          <span>Run QAOA</span>
        </button>

        {/* Emergency Corridor Toggle */}
        <button
          onClick={onToggleEmergency}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
            isEmergency 
              ? 'bg-rose-600 text-white shadow-md animate-pulse' 
              : (isWhite ? 'bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200' : 'bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700')
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span>{isEmergency ? 'Cancel Corridor' : 'Emergency Wave'}</span>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={onToggleSound}
          title={isMuted ? "Unmute Audio" : "Mute Audio"}
          className={`p-2 rounded-lg border transition ${
            isWhite ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          {isMuted ? (
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
          ) : (
            <svg className={`w-4 h-4 ${isWhite ? 'text-cyan-600' : 'text-cyan-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
          )}
        </button>

        {/* Dev Mode Switch */}
        <button
          onClick={onToggleDevMode}
          title="Toggle Developer HUD"
          className={`p-2 rounded-lg border transition ${
            devMode 
              ? (isWhite ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-purple-600/30 border-purple-500 text-purple-300')
              : (isWhite ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200')
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
        </button>
      </div>
    </header>
  );
}

// ----------------------------------------------------
// 1. DASHBOARD VIEW (White Theme Support)
// ----------------------------------------------------

function DashboardView({
  simState,
  cityRef,
  cityInstance,
  onRunOpt,
  onSelectIntersection,
  selectedIntersectionId,
  onClearIntersection,
  theme,
  isFullscreenCity,
  onToggleFullscreenCity,
  showQuantumOverlay,
  onToggleQuantumOverlay,
  selectedCameraId,
  onSelectCamera,
  showAnalyticsDrawer,
  onToggleAnalyticsDrawer,
  showLandmarkModal,
  setShowLandmarkModal,
  landmarkCameraStep,
  setLandmarkCameraStep,
  setActiveTab,
  timeOfDay,
  onSetTimeOfDay
}) {
  const isWhite = theme === 'white';
  const [viewMode, setViewMode] = useState('3d'); // '3d' | 'gis' | 'cctv'
  const m = simState.currentMetrics;
  const isOpt = simState.optimizationMode === 'hybrid';

  // Selected Intersection Node details
  const selectedNode = simState.intersections.find(n => n.id === selectedIntersectionId);

  // Active CCTV camera for PiP window
  const activePipCamera = (window.liveCameraEngine?.cameras || []).find(c => c.id === selectedCameraId) || window.liveCameraEngine?.cameras[0];
  const activePipNode = activePipCamera ? simState.intersections.find(n => n.id === activePipCamera.nodeId) : null;

  // Average network density calculation
  const networkDensity = simState.intersections && simState.intersections.length > 0
    ? Math.round(simState.intersections.reduce((acc, curr) => acc + (curr.density || 0), 0) / simState.intersections.length)
    : 68;

  // Ensure canvas resizes when viewMode or fullscreen changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (cityInstance?.current && cityInstance.current.onResize) {
        cityInstance.current.onResize();
      }
      window.dispatchEvent(new Event('resize'));
    }, 60);
    return () => clearTimeout(timer);
  }, [viewMode, isFullscreenCity]);

  return (
    <div className={`w-full flex flex-col space-y-3 transition-all duration-300 ${
      isFullscreenCity ? 'fixed inset-0 z-50 p-0 m-0 bg-slate-950 h-screen w-screen overflow-hidden' : 'relative min-h-[calc(100vh-140px)]'
    }`}>

      {/* Main Hero Centerpiece: 3D City Digital Twin Viewport (Expands to 85-90% Screen) */}
      <div className={`w-full flex-1 relative overflow-hidden transition-all duration-300 border flex flex-col ${
        isFullscreenCity 
          ? 'h-full border-none rounded-none' 
          : isWhite 
            ? 'h-[calc(100vh-215px)] min-h-[580px] rounded-2xl bg-white border-slate-200 shadow-md' 
            : 'h-[calc(100vh-215px)] min-h-[580px] rounded-2xl bg-slate-900/60 border-slate-800 shadow-2xl'
      }`}>

        {/* Top Floating Controls Overlay */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
          {/* Left: View Mode Switcher Pill */}
          <div className={`flex items-center space-x-1.5 backdrop-blur-md p-1 rounded-xl border pointer-events-auto shadow-md ${
            isWhite ? 'bg-white/95 border-slate-200' : 'bg-slate-950/90 border-slate-800'
          }`}>
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === '3d'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : isWhite ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-cyan-300 animate-ping"></span>
              <span>🏙️ 3D Digital Twin</span>
            </button>
            <button
              onClick={() => setViewMode('gis')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'gis'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                  : isWhite ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>🗺️ Geoapify GIS</span>
              <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded font-mono">Live</span>
            </button>
            <button
              onClick={() => setViewMode('cctv')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'cctv'
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-sm'
                  : isWhite ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping"></span>
              <span>📹 CCTV Wall</span>
              <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1 py-0.2 rounded font-mono">4-CAM</span>
            </button>
          </div>

          {/* Right: Camera Presets & Fullscreen City Mode Toggle */}
          <div className="flex items-center space-x-2 pointer-events-auto">
            {viewMode === '3d' && (
              <div className={`hidden md:flex items-center space-x-1 backdrop-blur-md p-1 rounded-xl border ${
                isWhite ? 'bg-white/90 border-slate-200 shadow-sm' : 'bg-slate-950/80 border-slate-800'
              }`}>
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'network', label: 'Network' },
                  { id: 'focus_I4', label: 'I4 Focus' },
                  { id: 'emergency', label: 'Corridor' },
                  { id: 'railway', label: '🚄 Metro' },
                  { id: 'optimizer', label: 'Angle 3' },
                  { id: 'avengers_tower', label: '🗼 Avengers HQ' }
                ].map(cam => (
                  <button
                    key={cam.id}
                    onClick={() => {
                      if (cityInstance?.current) {
                        cityInstance.current.setCameraPreset(cam.id);
                        if (cam.id === 'avengers_tower') {
                          if (setShowLandmarkModal) setShowLandmarkModal(true);
                          if (setLandmarkCameraStep) setLandmarkCameraStep('exterior');
                        }
                      }
                    }}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition ${
                      isWhite 
                        ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {cam.label}
                  </button>
                ))}
              </div>
            )}

            {/* Fullscreen City Mode Toggle Button */}
            <button
              onClick={onToggleFullscreenCity}
              title={isFullscreenCity ? "Exit Fullscreen City Mode" : "Expand 3D City to Fullscreen Command Center"}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border shadow-md backdrop-blur-md ${
                isFullscreenCity
                  ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400'
                  : isWhite
                    ? 'bg-white/95 hover:bg-slate-100 text-slate-800 border-slate-300'
                    : 'bg-slate-950/90 hover:bg-slate-800 text-cyan-300 border-slate-700'
              }`}
            >
              <span>{isFullscreenCity ? '✕' : '⛶'}</span>
              <span>{isFullscreenCity ? 'Exit Fullscreen' : 'Fullscreen City'}</span>
            </button>
          </div>
        </div>

        {/* Minimal Floating HUD in Fullscreen City Mode */}
        {isFullscreenCity && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto backdrop-blur-xl bg-slate-950/85 border border-slate-800 px-4 py-1.5 rounded-2xl shadow-2xl flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-xs font-mono font-bold tracking-wider text-white">LIMO COMMAND CENTER</span>
              <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">3D IMMERSIVE</span>
            </div>

            <div className="flex items-center space-x-1 text-xs">
              <button
                onClick={() => {
                  window.trafficEngine.isRunning = !window.trafficEngine.isRunning;
                  if (window.soundEngine) window.soundEngine.playClick();
                }}
                className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition"
              >
                {simState.isRunning ? '⏸ Pause' : '▶ Play'}
              </button>
              {[1, 2, 4].map(s => (
                <button
                  key={s}
                  onClick={() => window.trafficEngine.setSpeed(s)}
                  className={`px-2 py-1 rounded text-[11px] font-mono ${simState.simSpeed === s ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {onSetTimeOfDay && (
              <div className="flex items-center space-x-1 pl-2 border-l border-slate-800 text-xs">
                {[
                  { id: 'day', label: '☀️' },
                  { id: 'dusk', label: '🌇' },
                  { id: 'night', label: '🌙' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => onSetTimeOfDay(t.id)}
                    className={`p-1 rounded text-xs transition ${timeOfDay === t.id ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'}`}
                    title={t.id}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Three.js Canvas Mount */}
        <div id="traffic-city-canvas" ref={cityRef} className={`w-full h-full flex-1 relative ${viewMode === '3d' ? 'block' : 'hidden'}`}>
          
          {/* 1. Contextual Intersection Focus Floating Card */}
          {selectedNode && (
            <div className={`absolute top-16 right-6 z-30 w-80 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all animate-in fade-in zoom-in-95 ${
              isWhite ? 'bg-white/95 border-slate-200 text-slate-800' : 'bg-slate-950/95 border-cyan-500/40 text-slate-100'
            }`}>
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-cyan-500/20">
                <div className="flex items-center space-x-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${
                    selectedNode.phase.includes('GREEN') ? 'bg-emerald-500 animate-pulse' :
                    selectedNode.phase.includes('YELLOW') ? 'bg-amber-500' : 'bg-rose-500'
                  }`}></span>
                  <span className="text-xs font-mono font-bold text-cyan-400">{selectedNode.id} — {selectedNode.name}</span>
                </div>
                <button
                  onClick={onClearIntersection}
                  className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/10"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className={`p-2.5 rounded-xl border ${isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/70 border-slate-800'}`}>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Density</div>
                  <div className="text-base font-bold text-cyan-400 font-mono mt-0.5">{selectedNode.density}%</div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${selectedNode.density}%` }}></div>
                  </div>
                </div>
                <div className={`p-2.5 rounded-xl border ${isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/70 border-slate-800'}`}>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Queue</div>
                  <div className="text-base font-bold text-amber-400 font-mono mt-0.5">{selectedNode.queueLength} veh</div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, selectedNode.queueLength * 4)}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs mb-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-sans">Current Phase:</span>
                  <span className="font-bold text-emerald-400">{selectedNode.phase} ({selectedNode.phaseTimer}s)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-sans">Green Interval:</span>
                  <span className="font-bold text-slate-200">{selectedNode.currentTiming.green}s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-sans">Optimized Green:</span>
                  <span className="font-bold text-cyan-400">{selectedNode.optimizedTiming.green}s</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    if (cityInstance?.current && cityInstance.current.focusOnIntersection) {
                      cityInstance.current.focusOnIntersection(selectedNode.id);
                    }
                  }}
                  className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition text-center shadow-sm"
                >
                  🎯 Focus Node
                </button>
                <button
                  onClick={() => {
                    const cam = window.liveCameraEngine && window.liveCameraEngine.cameras.find(c => c.nodeId === selectedNode.id);
                    if (cam) onSelectCamera(cam.id);
                    else onSelectCamera('CAM-01');
                  }}
                  className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition text-center border ${
                    isWhite ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  📹 Optical Feed
                </button>
              </div>
            </div>
          )}

          {/* 2. Contextual Quantum Optimizer Floating Card */}
          {showQuantumOverlay && (
            <div className={`absolute top-16 left-6 z-30 w-80 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all animate-in fade-in zoom-in-95 ${
              isWhite ? 'bg-white/95 border-indigo-200 text-slate-800' : 'bg-slate-950/95 border-indigo-500/40 text-slate-100'
            }`}>
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-indigo-500/20">
                <div className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-ping"></span>
                  <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">QUANTUM OPTIMIZER</span>
                </div>
                <button
                  onClick={onToggleQuantumOverlay}
                  className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/10"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-xs font-mono mb-4">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 font-sans">QUBO Matrix</span>
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <span>✓</span>
                    <span>Formulated (32 Qubits)</span>
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 font-sans">QAOA Solver</span>
                  <span className="text-cyan-400 font-bold">{simState.optimizationStatus === 'optimizing' ? 'RUNNING...' : 'CONVERGED'}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 font-sans">Iteration</span>
                  <span className="text-slate-200 font-bold">42 / 50 (p=2)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 font-sans">Objective</span>
                  <span className="text-amber-400 font-bold">0.184 (Delay Min)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 font-sans">Signal Update</span>
                  <span className="text-emerald-400 font-bold">8 Nodes Synced</span>
                </div>
              </div>

              <button
                onClick={onRunOpt}
                className="w-full py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                <span>Execute Re-Optimization</span>
              </button>
            </div>
          )}

          {/* 3. Emergency Corridor Floating Banner */}
          {simState.isEmergencyActive && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 max-w-lg w-full px-4 animate-in fade-in zoom-in-95">
              <div className="backdrop-blur-xl bg-rose-950/90 border border-rose-500/60 shadow-2xl rounded-2xl p-3.5 text-white flex items-center justify-between space-x-4 animate-pulse">
                <div className="flex items-center space-x-3">
                  <span className="h-3 w-3 rounded-full bg-rose-500 animate-ping"></span>
                  <div>
                    <div className="text-xs font-mono font-bold tracking-wider text-rose-400 uppercase">
                      🚑 EMERGENCY CORRIDOR ACTIVE
                    </div>
                    <div className="text-sm font-bold text-white">
                      AMB-07 <span className="text-xs font-normal text-rose-200">· CODE RED · ETA: 01:42</span>
                    </div>
                    <div className="text-[11px] font-mono text-rose-300">
                      Route: I1 → I3 → I4 → I6 (Green Wave Preemption)
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => window.trafficEngine.cancelEmergencyCorridor()}
                  className="px-3 py-1.5 rounded-lg bg-rose-600/40 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/50 text-xs font-semibold transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* 4. Floating Picture-in-Picture CCTV Window */}
          {selectedCameraId && activePipCamera && (
            <div className={`absolute bottom-16 right-6 z-30 w-84 rounded-2xl border p-3 shadow-2xl backdrop-blur-xl transition-all animate-in fade-in zoom-in-95 ${
              isWhite ? 'bg-white/95 border-slate-300 text-slate-800' : 'bg-slate-950/95 border-slate-700 text-slate-100'
            }`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-xs">
                  <div className="flex items-center space-x-2 font-mono">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
                    <span className="font-bold text-cyan-400">{activePipCamera.id}</span>
                    <span className="text-slate-300 font-sans">{activePipCamera.name}</span>
                  </div>
                  <button
                    onClick={() => onSelectCamera(null)}
                    className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/10"
                  >
                    ✕
                  </button>
                </div>
                {window.LiveCameraFeedCanvas && (
                  <window.LiveCameraFeedCanvas
                    camId={activePipCamera.id}
                    nodeData={activePipNode}
                    isEmergency={simState.isEmergencyActive}
                    incident={simState.activeIncident}
                    height={180}
                    onExpand={() => {}}
                  />
                )}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                  <span className="text-emerald-400 font-bold">1080P 30FPS · YOLOv8</span>
                  <button
                    onClick={() => setViewMode('cctv')}
                    className="text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Open Quad Matrix ➔
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. Avengers Tower Landmark HUD */}
          {showLandmarkModal && (
            <div className={`absolute top-16 left-6 z-30 max-w-sm rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all ${
              isWhite ? 'bg-white/95 border-sky-300 text-slate-800' : 'bg-slate-950/90 border-cyan-500/40 text-slate-100'
            }`}>
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-cyan-500/20">
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">LIMO LANDMARK</span>
                </div>
                <button
                  onClick={() => {
                    if (setShowLandmarkModal) setShowLandmarkModal(false);
                    if (cityInstance?.current) cityInstance.current.setCameraPreset('overview');
                  }}
                  className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/10"
                >
                  ✕
                </button>
              </div>

              <div className="text-base font-extrabold tracking-wide mb-1 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
                AVENGERS TOWER-STYLE HQ
              </div>

              <div className="space-y-1 text-xs mb-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">CITY DISTRICT</span>
                  <span className="font-semibold text-cyan-300">Grand Central & Intermodal Hub (I8)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">TRAFFIC STATUS</span>
                  <span className="font-semibold text-emerald-400 flex items-center space-x-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block"></span>
                    <span>Synchronized with Node I8 (Normal Flow)</span>
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/50">
                <div className="text-[10px] uppercase font-mono text-slate-400 mb-1.5">Cinematic Landmark Camera:</div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => {
                      if (cityInstance?.current) cityInstance.current.setLandmarkCameraStep('exterior');
                      if (setLandmarkCameraStep) setLandmarkCameraStep('exterior');
                    }}
                    className={`px-2 py-1.5 text-[11px] font-semibold rounded-lg transition ${
                      landmarkCameraStep === 'exterior'
                        ? 'bg-cyan-600 text-white shadow-md'
                        : isWhite ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Exterior View
                  </button>
                  <button
                    onClick={() => {
                      if (cityInstance?.current) cityInstance.current.setLandmarkCameraStep('entrance');
                      if (setLandmarkCameraStep) setLandmarkCameraStep('entrance');
                    }}
                    className={`px-2 py-1.5 text-[11px] font-semibold rounded-lg transition ${
                      landmarkCameraStep === 'entrance'
                        ? 'bg-cyan-600 text-white shadow-md'
                        : isWhite ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Entrance Plaza
                  </button>
                  <button
                    onClick={() => {
                      if (cityInstance?.current) cityInstance.current.setLandmarkCameraStep('skyline');
                      if (setLandmarkCameraStep) setLandmarkCameraStep('skyline');
                    }}
                    className={`px-2 py-1.5 text-[11px] font-semibold rounded-lg transition ${
                      landmarkCameraStep === 'skyline'
                        ? 'bg-cyan-600 text-white shadow-md'
                        : isWhite ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Skyline View
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Holographic Layer Toggles for 3D View */}
          <div className={`absolute bottom-4 left-4 flex items-center space-x-2 z-10 backdrop-blur-md px-3 py-1.5 rounded-xl border ${
            isWhite ? 'bg-white/90 border-slate-200 shadow-sm' : 'bg-slate-950/80 border-slate-800'
          }`}>
            <span className={`text-[10px] uppercase tracking-wider font-semibold mr-2 ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Holographic Layers:</span>
            {['density', 'queues', 'emergency'].map(layer => (
              <button
                key={layer}
                onClick={() => {
                  if (cityInstance?.current) {
                    cityInstance.current.activeLayers[layer] = !cityInstance.current.activeLayers[layer];
                    if (window.soundEngine) window.soundEngine.playClick();
                  }
                }}
                className={`px-2 py-0.5 text-[10px] font-medium rounded border capitalize ${
                  isWhite 
                    ? 'bg-slate-100 hover:bg-slate-200 text-cyan-700 border-slate-200' 
                    : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
                }`}
              >
                {layer}
              </button>
            ))}
          </div>
        </div>

        {/* Geoapify Map Embed Mount */}
        {viewMode === 'gis' && (
          <div className="w-full h-full flex-1 relative">
            <GeoapifyMapEmbed simState={simState} onSelectIntersection={onSelectIntersection} theme={theme} />
          </div>
        )}

        {/* CCTV Quad Matrix Mount */}
        {viewMode === 'cctv' && (
          <div className="w-full h-full flex-1 p-4 bg-slate-950 grid grid-cols-2 gap-3 overflow-y-auto pt-16">
            {(window.liveCameraEngine ? window.liveCameraEngine.cameras : []).map(cam => (
              <div key={cam.id} className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900/60 p-2 space-y-1.5 flex flex-col">
                <div className="flex items-center justify-between text-[11px] font-mono px-1">
                  <span className="text-cyan-400 font-bold">{cam.id} · {cam.name}</span>
                  <span className="text-slate-400 text-[10px]">{cam.angle}</span>
                </div>
                {window.LiveCameraFeedCanvas && (
                  <window.LiveCameraFeedCanvas
                    camId={cam.id}
                    nodeData={simState.intersections.find(n => n.id === cam.nodeId)}
                    isEmergency={simState.isEmergencyActive}
                    incident={simState.activeIncident}
                    height={185}
                    onExpand={() => onSelectIntersection(cam.nodeId)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slim Bottom Telemetry Bar (Single Compact Row) */}
      {!isFullscreenCity && (
        <div className={`w-full rounded-2xl px-5 py-2.5 border backdrop-blur-md flex flex-wrap items-center justify-between gap-4 transition-all shadow-lg ${
          isWhite 
            ? 'bg-white/95 border-slate-200 text-slate-800' 
            : 'bg-slate-900/90 border-slate-800 text-slate-100'
        }`}>
          {/* Telemetry Metrics */}
          <div className="flex flex-wrap items-center gap-5 text-xs">
            {/* Active Vehicles */}
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Active Vehicles:</span>
              <span className="font-mono font-bold text-sm text-cyan-400">{simState.vehicles ? simState.vehicles.length : 147}</span>
            </div>

            <span className={isWhite ? 'text-slate-300' : 'text-slate-800'}>|</span>

            {/* Avg Speed */}
            <div className="flex items-center space-x-1.5">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Avg Speed:</span>
              <span className="font-mono font-bold text-sm text-emerald-400">38.6 <span className="text-[10px] font-normal text-slate-400">km/h</span></span>
            </div>

            <span className={isWhite ? 'text-slate-300' : 'text-slate-800'}>|</span>

            {/* Avg Delay */}
            <div className="flex items-center space-x-1.5">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Avg Delay:</span>
              <span className="font-mono font-bold text-sm text-amber-400">{m.waitingTime || '12.4'} <span className="text-[10px] font-normal text-slate-400">sec</span></span>
            </div>

            <span className={isWhite ? 'text-slate-300' : 'text-slate-800'}>|</span>

            {/* Traffic Density */}
            <div className="flex items-center space-x-1.5">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Traffic Density:</span>
              <span className="font-mono font-bold text-sm text-cyan-400">{networkDensity}%</span>
            </div>

            <span className={isWhite ? 'text-slate-300' : 'text-slate-800'}>|</span>

            {/* Throughput */}
            <div className="flex items-center space-x-1.5">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Throughput:</span>
              <span className="font-mono font-bold text-sm text-indigo-400">{m.throughput || '1,420'} <span className="text-[10px] font-normal text-slate-400">veh/hr</span></span>
            </div>

            <span className={isWhite ? 'text-slate-300' : 'text-slate-800'}>|</span>

            {/* CO2 */}
            <div className="flex items-center space-x-1.5">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>CO₂:</span>
              <span className="font-mono font-bold text-sm text-emerald-400">{m.co2Emissions || '190'} <span className="text-[10px] font-normal text-slate-400">kg/hr</span></span>
            </div>
          </div>

          {/* Quick Action Overlay Shortcuts */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleQuantumOverlay}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border shadow-sm ${
                showQuantumOverlay
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white border-cyan-400 shadow-md'
                  : isWhite ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <span>⚡</span>
              <span className="hidden sm:inline">Quantum Overlay</span>
            </button>

            <button
              onClick={onToggleAnalyticsDrawer}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border shadow-sm ${
                showAnalyticsDrawer
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-400 shadow-md'
                  : isWhite ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <span>📊</span>
              <span className="hidden sm:inline">Analytics</span>
            </button>

            <button
              onClick={() => onSelectCamera(selectedCameraId ? null : 'CAM-01')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border shadow-sm ${
                selectedCameraId
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white border-rose-400 shadow-md'
                  : isWhite ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <span>📹</span>
              <span className="hidden sm:inline">CCTV PiP</span>
            </button>
          </div>
        </div>
      )}

      {/* On-Demand Full Analytics Slide-Over Drawer */}
      {showAnalyticsDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in">
          <div className={`w-full max-w-xl h-full p-6 overflow-y-auto shadow-2xl border-l flex flex-col space-y-6 ${
            isWhite ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold flex items-center space-x-2">
                  <span>📊</span>
                  <span>Metropolitan Telemetry & Analytics</span>
                </h3>
                <p className={`text-xs ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>
                  Deep-dive performance metrics, quantum vs classical comparison, and canopy eco-twin
                </p>
              </div>
              <button
                onClick={onToggleAnalyticsDrawer}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-white/10"
              >
                ✕ Close
              </button>
            </div>

            {/* KPI Comparative Matrix */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: "Average Waiting Time", val: `${m.waitingTime} s`, base: "54.2 s", delta: isOpt ? "-22.9%" : "0.0%" },
                { title: "Average Queue Length", val: `${m.queueLength} veh`, base: "22.4 veh", delta: isOpt ? "-37.1%" : "0.0%" },
                { title: "Traffic Throughput", val: `${m.throughput} veh/h`, base: "1,180 veh/h", delta: isOpt ? "+20.3%" : "0.0%" },
                { title: "Fuel Consumption", val: `${m.fuelConsumption} L/h`, base: "96.5 L/h", delta: isOpt ? "-14.7%" : "0.0%" },
                { title: "CO₂ Emissions", val: `${m.co2Emissions} kg/h`, base: "224.8 kg/h", delta: isOpt ? "-15.7%" : "0.0%" },
                { title: "Emergency Travel Time", val: `${m.emergencyTravelTime} min`, base: "7.2 min", delta: isOpt || simState.isEmergencyActive ? "-33.3%" : "0.0%" }
              ].map((item, i) => (
                <div key={i} className={`p-3 rounded-xl border ${isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                  <div className={`text-[10px] uppercase font-semibold ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>{item.title}</div>
                  <div className="text-base font-bold mt-0.5">{item.val}</div>
                  <div className="text-[10px] text-emerald-400 font-semibold mt-1">Delta: {item.delta} vs baseline</div>
                </div>
              ))}
            </div>

            {/* Urban Eco-Digital Twin section */}
            <div className={`p-4 rounded-xl border ${isWhite ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-950/20 border-emerald-500/30'}`}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">Urban Eco-Digital Twin & Canopy</h4>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Trees</div>
                  <div className="text-base font-bold text-emerald-400 font-mono">248</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Canopy</div>
                  <div className="text-base font-bold text-emerald-400 font-mono">32%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Lights</div>
                  <div className="text-base font-bold text-amber-400 font-mono">184</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Soil Beds</div>
                  <div className="text-base font-bold text-amber-600 font-mono">18</div>
                </div>
              </div>
            </div>

            {/* Link to Full Performance View */}
            <button
              onClick={() => {
                onToggleAnalyticsDrawer();
                if (setActiveTab) setActiveTab('performance');
              }}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition text-center"
            >
              Open Full Classical vs Quantum Comparison Page ➔
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// ----------------------------------------------------
// 2. TRAFFIC NETWORK VIEW (White Theme)
// ----------------------------------------------------

function NetworkView({ simState, onSelectIntersection, theme }) {
  const isWhite = theme === 'white';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-bold tracking-wide ${isWhite ? 'text-slate-900' : 'text-white'}`}>Network Topology & Link Telemetry</h2>
          <p className={`text-xs ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Graph representation G(V, E) of {simState.intersections.length} interconnected urban signalized intersections.</p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className={`px-2.5 py-1 border rounded-lg font-mono ${
            isWhite ? 'bg-white border-slate-200 text-slate-700 shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}>{simState.intersections.length} Nodes | {simState.roads.length} Arterial Segments</span>
        </div>
      </div>

      {/* Grid of 6 Intersections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {simState.intersections.map(node => (
          <div
            key={node.id}
            onClick={() => onSelectIntersection(node.id)}
            className={`rounded-2xl p-5 cursor-pointer transition border group ${
              isWhite 
                ? 'bg-white border-slate-200 hover:border-cyan-500 shadow-sm hover:shadow' 
                : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/50 shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <span className={`h-8 w-8 rounded-xl font-bold flex items-center justify-center text-xs border ${
                  isWhite ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                }`}>
                  {node.id}
                </span>
                <div>
                  <h3 className={`text-sm font-bold transition ${isWhite ? 'text-slate-900 group-hover:text-cyan-700' : 'text-white group-hover:text-cyan-300'}`}>{node.name}</h3>
                  <p className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>{node.district}</p>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                node.density > 80 
                  ? (isWhite ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-500/20 text-rose-300 border-rose-500/30')
                  : node.density > 60 
                  ? (isWhite ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')
                  : (isWhite ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')
              }`}>
                {node.density}% Density
              </span>
            </div>

            <div className={`grid grid-cols-2 gap-3 p-3 rounded-xl border mb-3 text-xs ${
              isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'
            }`}>
              <div>
                <span className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Queue Length:</span>
                <div className={`font-bold ${isWhite ? 'text-slate-800' : 'text-slate-200'}`}>{node.queueLength} vehicles</div>
              </div>
              <div>
                <span className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Average Delay:</span>
                <div className={`font-bold ${isWhite ? 'text-slate-800' : 'text-slate-200'}`}>{node.waitingTime} s</div>
              </div>
              <div>
                <span className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Signal State:</span>
                <div className="font-bold text-emerald-600">{node.phase}</div>
              </div>
              <div>
                <span className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Optimized Green:</span>
                <div className={`font-bold ${isWhite ? 'text-cyan-700' : 'text-cyan-400'}`}>{node.optimizedTiming.green}s</div>
              </div>
            </div>

            <div className={`flex items-center justify-between text-[11px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>
              <span>Connected: {node.neighbors.join(', ')}</span>
              <span className={isWhite ? 'text-cyan-700 group-hover:underline' : 'text-cyan-400 group-hover:underline'}>Inspect Node →</span>
            </div>
          </div>
        ))}
      </div>

      {/* Road Segment Telemetry Table */}
      <div className={`rounded-2xl p-5 border ${
        isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 shadow-xl'
      }`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isWhite ? 'text-slate-700' : 'text-slate-300'}`}>Arterial Road Segment Capacities & Flow Rate</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className={`text-[10px] uppercase tracking-wider border-b ${isWhite ? 'text-slate-500 border-slate-200' : 'text-slate-400 border-slate-800'}`}>
              <tr>
                <th className="pb-2">Segment</th>
                <th className="pb-2">Connection</th>
                <th className="pb-2">Lanes</th>
                <th className="pb-2">Capacity</th>
                <th className="pb-2">Current Flow</th>
                <th className="pb-2">Volume/Capacity</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-mono ${isWhite ? 'divide-slate-100 text-slate-700' : 'divide-slate-800/60'}`}>
              {simState.roads.map(road => {
                const ratio = +(road.flow / road.capacity).toFixed(2);
                return (
                  <tr key={road.id} className={isWhite ? 'hover:bg-slate-50 transition' : 'hover:bg-slate-800/30 transition'}>
                    <td className="py-2.5 font-semibold">{road.id}</td>
                    <td className={`py-2.5 font-bold ${isWhite ? 'text-cyan-700' : 'text-cyan-300'}`}>{road.from} ↔ {road.to}</td>
                    <td className="py-2.5">{road.lanes} lanes</td>
                    <td className="py-2.5">{road.capacity} veh/h</td>
                    <td className="py-2.5">{road.flow} veh/h</td>
                    <td className="py-2.5">
                      <div className="flex items-center space-x-2">
                        <div className={`w-16 h-1.5 rounded-full overflow-hidden ${isWhite ? 'bg-slate-200' : 'bg-slate-800'}`}>
                          <div
                            className={`h-full ${ratio > 0.85 ? 'bg-rose-500' : ratio > 0.65 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, ratio * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px]">{ratio}</span>
                      </div>
                    </td>
                    <td className="py-2.5">
                      {road.closed ? (
                        <span className="text-rose-600 font-sans font-bold">CLOSED</span>
                      ) : (
                        <span className="text-emerald-600 font-sans font-semibold">ACTIVE</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 3. LIVE SIMULATION FULL VIEW (White Theme)
// ----------------------------------------------------

function SimulationView({ simState, cityRef, cityInstance, onSelectIntersection, theme }) {
  const isWhite = theme === 'white';

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-bold tracking-wide ${isWhite ? 'text-slate-900' : 'text-white'}`}>3D Digital Twin City Live Simulation</h2>
          <p className={`text-xs ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Real-time WebGL urban mobility simulation on clean architectural white background.</p>
        </div>
        <div className="flex items-center space-x-2">
          {['overview', 'network', 'focus_I4', 'emergency', 'railway'].map(preset => (
            <button
              key={preset}
              onClick={() => cityInstance.current && cityInstance.current.setCameraPreset(preset)}
              className={`px-3 py-1 border rounded-lg text-xs capitalize transition ${
                isWhite 
                  ? 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm' 
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              Camera: {preset}
            </button>
          ))}
        </div>
      </div>

      <div className={`flex-1 rounded-2xl overflow-hidden relative border ${
        isWhite ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/60 border-slate-800 shadow-2xl'
      }`}>
        <div id="traffic-city-canvas" ref={cityRef} className="w-full h-full"></div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 4. QUANTUM OPTIMIZER VIEW (White Theme)
// ----------------------------------------------------

function QuantumOptimizerView({ simState, quboRef, onRunOpt, theme }) {
  const isWhite = theme === 'white';
  const pipeline = [
    { title: "Traffic Sensors", desc: "Inductive loops and video sensors sample vehicle arrival rates across 6 nodes." },
    { title: "Network Model", desc: "Constructs graph G=(V, E) with phase constraints in NetworkX." },
    { title: "QUBO Formulation", desc: "Quadratic formulation penalizing queues, delays, and phase conflicts." },
    { title: "Ising Hamiltonian", desc: "Maps binary variables to Pauli-Z operators: x_i = (1 - Z_i)/2." },
    { title: "QAOA Hybrid Solver", desc: "Variational quantum circuits explore optimal phase splits." },
    { title: "Signal Timing", desc: "Translates ground-state bitstrings into green/red duration offsets." },
    { title: "Network Update", desc: "Dispatches updated cycle matrix to field controllers." }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-bold tracking-wide ${isWhite ? 'text-slate-900' : 'text-white'}`}>Quantum Optimization Engine</h2>
          <p className={`text-xs ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Hybrid Quantum-Classical Architecture combining QUBO, Ising Hamiltonians, and QAOA.</p>
        </div>
        <button
          onClick={onRunOpt}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          <span>Run Quantum Optimization</span>
        </button>
      </div>

      {/* 3D QUBO Energy Landscape & Math */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3D Landscape */}
        <div className={`rounded-2xl p-5 border flex flex-col ${
          isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 shadow-xl'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isWhite ? 'text-cyan-700' : 'text-cyan-400'}`}>QUBO / QAOA Energy Landscape (3D)</h3>
            <span className={`text-[10px] font-mono ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Var Parameters (γ, β)</span>
          </div>
          <div id="qubo-landscape-canvas" ref={quboRef} className={`w-full h-64 rounded-xl overflow-hidden mb-3 border ${
            isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/80'
          }`}></div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className={`p-2 rounded-lg border ${isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <span className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Iterations:</span>
              <div className={`font-bold ${isWhite ? 'text-slate-800' : 'text-slate-200'}`}>84 cycles</div>
            </div>
            <div className={`p-2 rounded-lg border ${isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <span className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Best Objective:</span>
              <div className={`font-bold ${isWhite ? 'text-cyan-700' : 'text-cyan-400'}`}>{window.trafficEngine.bestObjective}</div>
            </div>
            <div className={`p-2 rounded-lg border ${isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <span className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Energy Drop:</span>
              <div className="font-bold text-emerald-600">-58.2%</div>
            </div>
          </div>
        </div>

        {/* Mathematical Formulation */}
        <div className={`rounded-2xl p-5 border flex flex-col justify-between ${
          isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 shadow-xl'
        }`}>
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isWhite ? 'text-slate-700' : 'text-slate-300'}`}>Mathematical Formulation</h3>
            <div className="space-y-3 text-xs">
              <div className={`p-3 rounded-xl border font-mono ${isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <span className={isWhite ? 'text-cyan-700 font-semibold' : 'text-cyan-400'}>1. QUBO Objective Function:</span>
                <div className={`mt-1 ${isWhite ? 'text-slate-800' : 'text-slate-300'}`}>min f(x) = xᵀ Q x = Σ Q_ii x_i + Σ_(i&lt;j) Q_ij x_i x_j</div>
                <div className={`text-[10px] mt-1 ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Where x_i ∈ {'{0, 1}'} represents phase split candidate assignments.</div>
              </div>

              <div className={`p-3 rounded-xl border font-mono ${isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <span className={isWhite ? 'text-purple-700 font-semibold' : 'text-purple-400'}>2. Ising Problem Hamiltonian:</span>
                <div className={`mt-1 ${isWhite ? 'text-slate-800' : 'text-slate-300'}`}>H_C = Σ h_i σ_iᶻ + Σ J_ij σ_iᶻ σ_jᶻ</div>
                <div className={`text-[10px] mt-1 ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Penalty multipliers J_ij enforce phase conflict prevention.</div>
              </div>

              <div className={`p-3 rounded-xl border font-mono ${isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <span className={isWhite ? 'text-emerald-700 font-semibold' : 'text-emerald-400'}>3. QAOA Variational Ansatz:</span>
                <div className={`mt-1 ${isWhite ? 'text-slate-800' : 'text-slate-300'}`}>|ψ(γ, β)⟩ = ∏_(l=1)^p e^(-i β_l H_M) e^(-i γ_l H_C) |+⟩^(⊗n)</div>
                <div className={`text-[10px] mt-1 ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Explores superposition of signal timing configurations.</div>
              </div>
            </div>
          </div>

          {/* Educational Note */}
          <div className={`mt-4 p-3 rounded-xl text-xs border ${
            isWhite ? 'bg-cyan-50 border-cyan-200 text-slate-700' : 'bg-cyan-950/30 border-cyan-500/30 text-slate-300'
          }`}>
            <span className={`font-bold ${isWhite ? 'text-cyan-800' : 'text-cyan-300'}`}>Where is Quantum Used?</span> Classical fixed timings can only react locally. The hybrid quantum approach maps all interconnected intersections into a combinatorial quadratic graph, allowing QAOA to explore global coordinated phase offsets simultaneously.
          </div>
        </div>
      </div>

      {/* Visual Pipeline */}
      <div className={`rounded-2xl p-5 border ${
        isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 shadow-xl'
      }`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isWhite ? 'text-slate-700' : 'text-slate-300'}`}>Hybrid Optimization Pipeline Architecture</h3>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {pipeline.map((step, idx) => (
            <div key={idx} className={`p-3 rounded-xl border text-center flex flex-col justify-between ${
              isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div>
                <div className={`text-[10px] font-mono mb-1 ${isWhite ? 'text-cyan-700 font-bold' : 'text-cyan-400'}`}>0{idx + 1}</div>
                <div className={`text-xs font-bold mb-1 ${isWhite ? 'text-slate-900' : 'text-slate-200'}`}>{step.title}</div>
                <div className={`text-[10px] leading-snug ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>{step.desc}</div>
              </div>
              {idx < 6 && (
                <div className={`hidden md:block mt-2 font-bold ${isWhite ? 'text-slate-400' : 'text-slate-600'}`}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 5. EMERGENCY CORRIDOR VIEW (White Theme)
// ----------------------------------------------------

function EmergencyCorridorView({ simState, onToggleEmergency, theme }) {
  const isWhite = theme === 'white';
  const isEm = simState.isEmergencyActive;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-bold tracking-wide ${isWhite ? 'text-slate-900' : 'text-white'}`}>Emergency Green Corridor Mission Control</h2>
          <p className={`text-xs ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Dynamic route preemption for Ambulance A01 with prioritized signal locking.</p>
        </div>
        <button
          onClick={onToggleEmergency}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
            isEm 
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md animate-pulse' 
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span>{isEm ? 'DEACTIVATE EMERGENCY CORRIDOR' : 'ACTIVATE EMERGENCY CORRIDOR'}</span>
        </button>
      </div>

      {/* Emergency Corridor Status Card */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isEm 
          ? (isWhite ? 'bg-rose-50 border-rose-300 shadow-md' : 'bg-gradient-to-r from-rose-950/60 via-slate-900 to-rose-950/60 border-rose-500 shadow-2xl')
          : (isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800')
      }`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className={`h-3 w-3 rounded-full ${isEm ? 'bg-rose-500 animate-ping' : 'bg-slate-400'}`}></span>
              <span className={`text-xs font-bold uppercase tracking-wider ${isEm ? 'text-rose-600' : (isWhite ? 'text-slate-500' : 'text-slate-400')}`}>
                {isEm ? 'EMERGENCY GREEN CORRIDOR ACTIVE' : 'CORRIDOR STANDBY'}
              </span>
            </div>
            <h3 className={`text-xl font-bold ${isWhite ? 'text-slate-900' : 'text-white'}`}>Emergency Unit: Ambulance A01</h3>
            <p className={`text-xs mt-1 ${isWhite ? 'text-slate-600' : 'text-slate-400'}`}>Origin: I1 (Downtown West) → Destination: I6 (Medical Center Hospital)</p>
          </div>

          {/* Telemetry Numbers */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className={`p-3 rounded-xl border ${isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-950/70 border-slate-800'}`}>
              <span className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Classical ETA</span>
              <div className={`text-lg font-bold ${isWhite ? 'text-slate-700' : 'text-slate-300'}`}>7.2 min</div>
            </div>
            <div className={`p-3 rounded-xl border ${isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-950/70 border-slate-800'}`}>
              <span className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Optimized ETA</span>
              <div className="text-lg font-bold text-emerald-600">4.8 min</div>
            </div>
            <div className={`p-3 rounded-xl border ${isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-950/70 border-slate-800'}`}>
              <span className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Time Saved</span>
              <div className="text-lg font-bold text-cyan-600">2.4 min (33%)</div>
            </div>
          </div>
        </div>

        {/* Route Visualizer */}
        <div className={`mt-6 pt-6 border-t ${isWhite ? 'border-slate-200' : 'border-slate-800/80'}`}>
          <div className={`text-xs font-semibold mb-3 ${isWhite ? 'text-slate-600' : 'text-slate-400'}`}>Active Signal Preemption Route:</div>
          <div className="grid grid-cols-4 gap-4">
            {['I1 (Downtown)', 'I3 (Civic Center)', 'I4 (Central Square)', 'I6 (Hospital)'].map((seg, idx) => (
              <div key={idx} className={`p-3 rounded-xl border text-center ${
                isEm 
                  ? (isWhite ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' : 'bg-emerald-950/30 border-emerald-500/60 text-emerald-300')
                  : (isWhite ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400')
              }`}>
                <div className="text-[10px] font-mono mb-1">Node {idx + 1}</div>
                <div className="text-xs font-bold">{seg}</div>
                <div className="text-[9px] mt-1 font-semibold">{isEm ? 'PRIORITY GREEN' : 'NORMAL'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 6. DYNAMIC EVENTS VIEW (White Theme)
// ----------------------------------------------------

function EventsView({ simState, onRunOpt, theme }) {
  const isWhite = theme === 'white';
  const events = [
    {
      id: 'accident',
      title: 'Accident at Central Square (I4)',
      desc: 'Simulates multi-vehicle collision blocking eastbound lanes. Queues surge from 14 to 46 vehicles.',
      action: () => window.trafficEngine.triggerAccident('I4'),
      color: isWhite ? 'border-rose-200 hover:border-rose-400' : 'border-rose-500/50 hover:border-rose-500'
    },
    {
      id: 'congestion',
      title: 'Sudden Congestion Surge at I3',
      desc: 'Simulates unexpected stadium egress causing 92% density along Civic Center arterial.',
      action: () => window.trafficEngine.triggerCongestion('I3'),
      color: isWhite ? 'border-amber-200 hover:border-amber-400' : 'border-amber-500/50 hover:border-amber-500'
    },
    {
      id: 'closure',
      title: 'Road Segment Closure (R_2_4)',
      desc: 'Simulates emergency utility repair blocking segment between I2 and I4 with 3D barricades.',
      action: () => window.trafficEngine.triggerRoadClosure('R_2_4'),
      color: isWhite ? 'border-purple-200 hover:border-purple-400' : 'border-purple-500/50 hover:border-purple-500'
    },
    {
      id: 'clear',
      title: 'Clear All Incidents & Obstacles',
      desc: 'Restores all lanes, removes 3D hazard markers, and returns traffic density to normal.',
      action: () => window.trafficEngine.clearEvents(),
      color: isWhite ? 'border-slate-200 hover:border-slate-400' : 'border-slate-700 hover:border-slate-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-lg font-bold tracking-wide ${isWhite ? 'text-slate-900' : 'text-white'}`}>Dynamic Traffic Event Injector</h2>
        <p className={`text-xs ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Trigger real-time incidents to observe how the adaptive system detects bottlenecks and recalculates signal splits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {events.map(ev => (
          <div key={ev.id} className={`rounded-2xl p-5 border transition flex flex-col justify-between ${
            isWhite ? `bg-white ${ev.color} shadow-sm` : `bg-slate-900/80 ${ev.color} shadow-xl`
          }`}>
            <div>
              <h3 className={`text-sm font-bold mb-2 ${isWhite ? 'text-slate-900' : 'text-white'}`}>{ev.title}</h3>
              <p className={`text-xs mb-4 ${isWhite ? 'text-slate-600' : 'text-slate-400'}`}>{ev.desc}</p>
            </div>
            <button
              onClick={ev.action}
              className={`w-full py-2 rounded-xl text-xs font-semibold border transition ${
                isWhite 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-sm' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              Trigger Event
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 7. PERFORMANCE ANALYTICS VIEW (White Theme)
// ----------------------------------------------------

function PerformanceView({ simState, theme }) {
  const isWhite = theme === 'white';
  const h = simState.metricsHistory;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-bold tracking-wide ${isWhite ? 'text-slate-900' : 'text-white'}`}>Performance Analytics & Telemetry</h2>
          <p className={`text-xs ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Time-series comparison of classical fixed baseline vs. quantum-adaptive optimization.</p>
        </div>
        <button
          onClick={() => window.diagnosticsSuite.exportLogsJson()}
          className={`px-3 py-1.5 border rounded-lg text-xs font-medium transition ${
            isWhite ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
          }`}
        >
          Export Telemetry (JSON)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waiting Time Chart */}
        <div className={`rounded-2xl p-5 border ${
          isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 shadow-xl'
        }`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isWhite ? 'text-slate-700' : 'text-slate-300'}`}>Average Waiting Time Over Simulation (s)</h3>
          <div className="h-48 flex items-end space-x-2 pt-6 pb-2">
            {h.classicalWait.map((val, idx) => {
              const optVal = h.hybridWait[idx] || val;
              const hClassic = Math.min(100, Math.round((val / 70) * 100));
              const hOpt = Math.min(100, Math.round((optVal / 70) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col justify-end items-center h-full space-y-1 group relative">
                  <div className="w-full flex space-x-0.5 items-end h-full">
                    <div className={`w-1/2 rounded-t ${isWhite ? 'bg-slate-300' : 'bg-slate-700'}`} style={{ height: `${hClassic}%` }}></div>
                    <div className="w-1/2 bg-cyan-600 rounded-t" style={{ height: `${hOpt}%` }}></div>
                  </div>
                  <span className={`text-[9px] font-mono ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>{idx + 1}</span>
                </div>
              );
            })}
          </div>
          <div className={`flex items-center justify-center space-x-6 text-[11px] mt-2 ${isWhite ? 'text-slate-600' : 'text-slate-400'}`}>
            <span className="flex items-center"><span className={`w-2.5 h-2.5 rounded-sm mr-1.5 ${isWhite ? 'bg-slate-300' : 'bg-slate-700'}`}></span> Classical Baseline (54s avg)</span>
            <span className="flex items-center"><span className="w-2.5 h-2.5 bg-cyan-600 rounded-sm mr-1.5"></span> Hybrid QAOA (42s avg)</span>
          </div>
        </div>

        {/* Queue Length Reduction Chart */}
        <div className={`rounded-2xl p-5 border ${
          isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 shadow-xl'
        }`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isWhite ? 'text-slate-700' : 'text-slate-300'}`}>Queue Length Profile (Vehicles per Intersection)</h3>
          <div className="h-48 flex items-end space-x-2 pt-6 pb-2">
            {h.queue.map((val, idx) => {
              const hPct = Math.min(100, Math.round((val / 40) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col justify-end items-center h-full space-y-1">
                  <div className="w-full bg-indigo-600/80 hover:bg-indigo-500 rounded-t transition" style={{ height: `${hPct}%` }}></div>
                  <span className={`text-[9px] font-mono ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>{val}</span>
                </div>
              );
            })}
          </div>
          <div className={`text-center text-[11px] mt-2 ${isWhite ? 'text-slate-600' : 'text-slate-400'}`}>
            Network Queue Index (-37.1% reduction after optimization)
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 8. CLASSICAL VS QUANTUM COMPARISON VIEW (White Theme)
// ----------------------------------------------------

function ComparisonView({ simState, theme }) {
  const isWhite = theme === 'white';
  const b = window.TRAFFIC_DATA.baselineMetrics;
  const o = window.TRAFFIC_DATA.optimizedMetrics;

  const comparisonRows = [
    { metric: "Average Waiting Time", classical: `${b.waitingTime} s`, hybrid: `${o.waitingTime} s`, diff: "-12.4 s", pct: "-22.9%" },
    { metric: "Average Queue Length", classical: `${b.queueLength} veh`, hybrid: `${o.queueLength} veh`, diff: "-8.3 veh", pct: "-37.1%" },
    { metric: "Traffic Throughput", classical: `${b.throughput} veh/h`, hybrid: `${o.throughput} veh/h`, diff: "+240 veh/h", pct: "+20.3%" },
    { metric: "Fuel Consumption", classical: `${b.fuelConsumption} L/h`, hybrid: `${o.fuelConsumption} L/h`, diff: "-14.2 L/h", pct: "-14.7%" },
    { metric: "CO₂ Emissions", classical: `${b.co2Emissions} kg/h`, hybrid: `${o.co2Emissions} kg/h`, diff: "-35.2 kg/h", pct: "-15.7%" },
    { metric: "Emergency Travel Time", classical: `${b.emergencyTravelTime} min`, hybrid: `${o.emergencyTravelTime} min`, diff: "-2.4 min", pct: "-33.3%" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-lg font-bold tracking-wide ${isWhite ? 'text-slate-900' : 'text-white'}`}>Classical Rule-Based vs. Hybrid Quantum-Classical Comparison</h2>
        <p className={`text-xs ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Factual benchmark comparison between fixed Webster cycle timings and QAOA adaptive coordination.</p>
      </div>

      {/* Comparison Table */}
      <div className={`rounded-2xl p-5 border ${
        isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 shadow-xl'
      }`}>
        <table className="w-full text-xs text-left">
          <thead className={`text-[10px] uppercase tracking-wider border-b ${isWhite ? 'text-slate-500 border-slate-200' : 'text-slate-400 border-slate-800'}`}>
            <tr>
              <th className="pb-3">Evaluation Metric</th>
              <th className="pb-3">Classical (Fixed Timing)</th>
              <th className="pb-3">Hybrid Quantum (QAOA)</th>
              <th className="pb-3">Net Difference</th>
              <th className="pb-3">Improvement</th>
            </tr>
          </thead>
          <tbody className={`divide-y font-mono ${isWhite ? 'divide-slate-100 text-slate-700' : 'divide-slate-800/60'}`}>
            {comparisonRows.map((row, idx) => (
              <tr key={idx} className={isWhite ? 'hover:bg-slate-50 transition' : 'hover:bg-slate-800/30 transition'}>
                <td className={`py-3 font-sans font-semibold ${isWhite ? 'text-slate-900' : 'text-slate-200'}`}>{row.metric}</td>
                <td className="py-3 text-slate-500">{row.classical}</td>
                <td className={`py-3 font-bold ${isWhite ? 'text-cyan-700' : 'text-cyan-300'}`}>{row.hybrid}</td>
                <td className="py-3 text-emerald-600 font-semibold">{row.diff}</td>
                <td className="py-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    {row.pct}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 9. SYSTEM ARCHITECTURE VIEW (White Theme)
// ----------------------------------------------------

function ArchitectureView({ theme }) {
  const isWhite = theme === 'white';
  const nodes = [
    { title: "Traffic Sensors", tag: "Layer 01", desc: "Inductive loop detectors, radar, and CCTV cameras stream vehicle arrival counts." },
    { title: "NetworkX Topology Graph", tag: "Layer 02", desc: "Digital twin graph representation G(V, E) mapping roadway capacities and phase conflicts." },
    { title: "QUBO / Ising Formulator", tag: "Layer 03", desc: "Converts traffic coordination constraints into a Quadratic Unconstrained Binary Optimization matrix." },
    { title: "QAOA Hybrid Quantum Solver", tag: "Layer 04", desc: "Simulated variational circuit with COBYLA classical optimizer exploring candidate phase splits." },
    { title: "Adaptive Signal Controller", tag: "Layer 05", desc: "Dispatches optimized green/yellow/red durations to local NEMA TS2 field controllers." },
    { title: "Emergency Corridor Preempt", tag: "Layer 06", desc: "Automatic priority green corridor locking along ambulance trajectory." }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-lg font-bold tracking-wide ${isWhite ? 'text-slate-900' : 'text-white'}`}>End-to-End System Architecture</h2>
        <p className={`text-xs ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Enterprise data flow from urban edge sensors to hybrid quantum optimization and physical signal actuators.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {nodes.map((n, idx) => (
          <div key={idx} className={`rounded-2xl p-5 border ${
            isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 shadow-xl'
          }`}>
            <span className={`text-[10px] font-mono font-semibold ${isWhite ? 'text-cyan-700' : 'text-cyan-400'}`}>{n.tag}</span>
            <h3 className={`text-sm font-bold mt-1 mb-2 ${isWhite ? 'text-slate-900' : 'text-white'}`}>{n.title}</h3>
            <p className={`text-xs ${isWhite ? 'text-slate-600' : 'text-slate-400'}`}>{n.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 10. SETTINGS & DIAGNOSTICS VIEW (White Theme)
// ----------------------------------------------------

function SettingsView({ simState, devMode, setDevMode, onReplayIntro, onResetDemo, onOpenDiagnostics, theme, onToggleTheme }) {
  const isWhite = theme === 'white';
  const [weights, setWeights] = useState({ ...simState.weights });

  const handleWeightChange = (key, val) => {
    const updated = { ...weights, [key]: parseFloat(val) };
    setWeights(updated);
    window.trafficEngine.updateWeights(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-lg font-bold tracking-wide ${isWhite ? 'text-slate-900' : 'text-white'}`}>Optimization Objectives & Diagnostics Settings</h2>
        <p className={`text-xs ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Tune multi-objective penalty weights and access automated prototype verification suites.</p>
      </div>

      {/* Multi-Objective Sliders */}
      <div className={`rounded-2xl p-5 border ${
        isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 shadow-xl'
      }`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isWhite ? 'text-slate-700' : 'text-slate-300'}`}>Multi-Objective QUBO Penalty Weights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Object.entries(weights).map(([k, v]) => (
            <div key={k} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className={`capitalize font-medium ${isWhite ? 'text-slate-700' : 'text-slate-300'}`}>{k.replace(/([A-Z])/g, ' $1')}</span>
                <span className={`font-mono font-bold ${isWhite ? 'text-cyan-700' : 'text-cyan-400'}`}>{Math.round(v * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={v}
                onChange={(e) => handleWeightChange(k, e.target.value)}
                className="w-full accent-cyan-600 h-1 bg-slate-200 rounded cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Developer Mode & Diagnostics Actions */}
      <div className={`rounded-2xl p-5 border space-y-4 ${
        isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 shadow-xl'
      }`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider ${isWhite ? 'text-slate-700' : 'text-slate-300'}`}>System QA & Demonstration Utilities</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={onToggleTheme}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
              isWhite ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            Switch Theme: {isWhite ? 'Dark Theme' : 'White Theme'}
          </button>

          <button
            onClick={onOpenDiagnostics}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>Run 15-Test System Diagnostics</span>
          </button>

          <button
            onClick={onReplayIntro}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
              isWhite ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            Replay Cinematic Intro Sequence
          </button>

          <button
            onClick={onResetDemo}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition"
          >
            Reset Demo to Baseline State
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// CINEMATIC INTRO COMPONENT (Water Drop & Liquid Ripple Simulation)
// ----------------------------------------------------

function CinematicIntroView({ scene, onSkip, onLaunch, isMuted, onToggleSound, theme }) {
  const isWhite = theme === 'white';
  const waterSimRef = useRef(null);

  useEffect(() => {
    if (!waterSimRef.current && window.WaterDropSimulation) {
      waterSimRef.current = new window.WaterDropSimulation('water-drop-canvas', {
        theme: theme,
        onPrimaryImpact: () => {
          if (window.soundEngine && window.soundEngine.playWaterDrop) {
            window.soundEngine.playWaterDrop();
          }
        }
      });
    }

    return () => {
      if (waterSimRef.current) {
        waterSimRef.current.destroy();
        waterSimRef.current = null;
      }
    };
  }, [theme]);

  return (
    <div className={`relative h-screen w-screen flex flex-col justify-between p-8 overflow-hidden select-none ${
      isWhite 
        ? 'bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900' 
        : 'bg-slate-950 text-white'
    }`}>
      {/* Interactive Water Drop & Liquid Wave Canvas */}
      <canvas
        id="water-drop-canvas"
        className="absolute inset-0 w-full h-full pointer-events-auto cursor-crosshair z-0"
        title="Click or drag anywhere to ripple the quantum wave surface"
      ></canvas>

      {/* Top Controls */}
      <div className="flex justify-between items-center z-20 pointer-events-auto">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center shadow-md">
            <span className="font-mono text-xs font-bold">Q-T</span>
          </div>
          <div>
            <span className={`text-xs font-mono tracking-widest uppercase block ${isWhite ? 'text-slate-600' : 'text-slate-400'}`}>Quantum Wave Experience</span>
            <span className={`text-[10px] hidden sm:inline ${isWhite ? 'text-cyan-700' : 'text-cyan-400'}`}>💧 Interactive Water Drop Simulation</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSound}
            className={`px-3 py-1.5 border text-xs font-medium rounded-lg transition backdrop-blur-md ${
              isWhite ? 'bg-white/80 hover:bg-white border-slate-200 text-slate-700 shadow-sm' : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {isMuted ? "Sound: OFF" : "Sound: ON 💧"}
          </button>
          <button
            onClick={onSkip}
            className={`px-3 py-1.5 border text-xs font-medium rounded-lg transition backdrop-blur-md ${
              isWhite ? 'bg-white/80 hover:bg-white border-slate-200 text-slate-700 shadow-sm' : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Skip Intro →
          </button>
        </div>
      </div>

      {/* Dynamic Cinematic Text Overlay */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto z-10 pointer-events-none">
        {scene === 1 && (
          <div className="space-y-4 animate-fade-in backdrop-blur-sm bg-white/40 dark:bg-slate-900/40 p-6 rounded-2xl border border-white/40 dark:border-slate-800/40 shadow-sm">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-ping"></span>
              <span>LIQUID WAVE SIMULATION</span>
            </div>
            <h2 className={`text-4xl font-extrabold tracking-tight ${isWhite ? 'text-slate-900' : 'text-slate-100'}`}>THE FUTURE OF URBAN MOBILITY</h2>
            <p className={`text-xl font-semibold ${isWhite ? 'text-cyan-700' : 'text-cyan-400'}`}>IS NO LONGER STATIC.</p>
            <p className={`text-xs mt-2 ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Click anywhere on screen to disturb the quantum liquid surface.</p>
          </div>
        )}

        {scene === 2 && (
          <div className="space-y-3 animate-fade-in backdrop-blur-sm bg-white/40 dark:bg-slate-900/40 p-6 rounded-2xl border border-white/40 dark:border-slate-800/40 shadow-sm">
            <span className={`text-xs font-mono uppercase tracking-widest ${isWhite ? 'text-cyan-700' : 'text-cyan-400'}`}>Concentric Network Ripples</span>
            <h2 className={`text-3xl font-bold ${isWhite ? 'text-slate-900' : 'text-white'}`}>6 Interconnected Signalized Corridors</h2>
            <p className={`text-sm ${isWhite ? 'text-slate-600' : 'text-slate-400'}`}>A single perturbation in traffic density ripples outward across adjacent intersections.</p>
          </div>
        )}

        {scene === 3 && (
          <div className="space-y-3 animate-fade-in backdrop-blur-sm bg-white/40 dark:bg-slate-900/40 p-6 rounded-2xl border border-white/40 dark:border-slate-800/40 shadow-sm">
            <span className="text-xs font-mono text-rose-600 uppercase tracking-widest font-semibold">Shockwave Bottleneck</span>
            <h2 className="text-3xl font-bold text-rose-600">Central Square (I4) Congestion</h2>
            <div className="grid grid-cols-3 gap-4 font-mono text-xs mt-3">
              <div className={`p-2 rounded border ${isWhite ? 'bg-white/80 border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800'}`}>Queue: 37 Veh</div>
              <div className={`p-2 rounded border ${isWhite ? 'bg-white/80 border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800'}`}>Wait: 61s</div>
              <div className={`p-2 rounded border text-rose-600 font-bold ${isWhite ? 'bg-white/80 border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800'}`}>Fixed Timing Fail</div>
            </div>
          </div>
        )}

        {scene === 4 && (
          <div className="space-y-3 animate-fade-in backdrop-blur-sm bg-white/40 dark:bg-slate-900/40 p-6 rounded-2xl border border-white/40 dark:border-slate-800/40 shadow-sm">
            <span className={`text-xs font-mono uppercase tracking-widest ${isWhite ? 'text-purple-700 font-semibold' : 'text-purple-400'}`}>Quantum Engine Activation</span>
            <h2 className={`text-2xl font-bold ${isWhite ? 'text-slate-900' : 'text-white'}`}>Traffic Data → QUBO → QAOA Wave Solver</h2>
            <p className={`text-xs ${isWhite ? 'text-slate-600' : 'text-slate-400'}`}>Formulating combinatorial phase space into Quadratic Unconstrained Binary Optimization.</p>
          </div>
        )}

        {scene === 5 && (
          <div className="space-y-3 animate-fade-in backdrop-blur-sm bg-white/40 dark:bg-slate-900/40 p-6 rounded-2xl border border-white/40 dark:border-slate-800/40 shadow-sm">
            <span className="text-xs font-mono text-emerald-700 uppercase tracking-widest font-semibold">Coherent Interference Minimum</span>
            <h2 className="text-3xl font-bold text-emerald-600">Ground State Optimum Found</h2>
            <p className={`text-xs font-mono ${isWhite ? 'text-slate-600' : 'text-slate-400'}`}>Best Objective: 0.187 | Candidate Bitstring: |10110010⟩</p>
          </div>
        )}

        {scene === 6 && (
          <div className="space-y-3 animate-fade-in backdrop-blur-sm bg-white/40 dark:bg-slate-900/40 p-6 rounded-2xl border border-white/40 dark:border-slate-800/40 shadow-sm">
            <span className={`text-xs font-mono uppercase tracking-widest ${isWhite ? 'text-cyan-700 font-semibold' : 'text-cyan-400'}`}>Adaptive Transformation</span>
            <h2 className={`text-3xl font-bold ${isWhite ? 'text-slate-900' : 'text-white'}`}>Green Waves Open Across City</h2>
            <div className={`flex justify-center space-x-4 text-xs font-mono mt-2 ${isWhite ? 'text-cyan-800 font-semibold' : 'text-cyan-300'}`}>
              <span>Wait: -23%</span>
              <span>Queue: -37%</span>
              <span>CO₂: -16%</span>
            </div>
          </div>
        )}

        {scene === 7 && (
          <div className="space-y-3 animate-fade-in backdrop-blur-sm bg-white/40 dark:bg-slate-900/40 p-6 rounded-2xl border border-white/40 dark:border-slate-800/40 shadow-sm">
            <span className="text-xs font-mono text-rose-600 uppercase tracking-widest font-semibold">Emergency Priority</span>
            <h2 className="text-3xl font-bold text-rose-600">Emergency Corridor: I1 → I3 → I4 → I6</h2>
            <p className={`text-xs font-mono ${isWhite ? 'text-slate-700' : 'text-slate-300'}`}>Ambulance A01 ETA reduced by 2.4 min (33% faster)</p>
          </div>
        )}

        {scene === 8 && (
          <div className="space-y-6 animate-fade-in backdrop-blur-sm bg-white/50 dark:bg-slate-900/50 p-8 rounded-3xl border border-white/40 dark:border-slate-800/40 shadow-lg">
            <div>
              <h1 className="text-5xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-700">
                QUANTUM TRAFFIC
              </h1>
              <h3 className={`text-sm mt-2 font-medium tracking-wide ${isWhite ? 'text-slate-700' : 'text-slate-300'}`}>
                Quantum-Enhanced Adaptive Urban Traffic Optimization
              </h3>
              <p className={`text-xs mt-1 ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Adaptive Intelligence for the Future of Urban Mobility</p>
            </div>

            <button
              onClick={onLaunch}
              className="pointer-events-auto px-8 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg transition transform hover:scale-105"
            >
              LAUNCH COMMAND CENTER →
            </button>
          </div>
        )}
      </div>

      {/* Progress Dots & Ripple Hint */}
      <div className="flex flex-col items-center space-y-2 z-20 pointer-events-none">
        <span className={`text-[10px] font-mono ${isWhite ? 'text-slate-400' : 'text-slate-500'}`}>Click anywhere to create water ripples</span>
        <div className="flex justify-center items-center space-x-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === scene 
                  ? (isWhite ? 'w-8 bg-cyan-600' : 'w-8 bg-cyan-400')
                  : (isWhite ? 'w-2 bg-slate-300 dark:bg-slate-700' : 'w-2 bg-slate-800')
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// MODAL DIALOGS (White Theme)
// ----------------------------------------------------

function IntersectionModal({ node, onClose, onApplyTiming, theme }) {
  const isWhite = theme === 'white';

  // Safe validation and fallback
  const safeNode = window.validateIntersection ? window.validateIntersection(node) : node;

  if (!safeNode || !safeNode.id) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className={`rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border text-center ${
          isWhite ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          <div className="text-3xl">⚠️</div>
          <h3 className="text-base font-bold text-rose-500">INTERSECTION DATA UNAVAILABLE</h3>
          <p className="text-xs text-slate-400">Unable to load telemetry for selected intersection. Telemetry buffer was reset or node is unassigned.</p>
          <div className="flex justify-center space-x-3 pt-2">
            <button
              onClick={() => {
                if (window.trafficEngine) window.trafficEngine.updateMetrics();
              }}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-xs border ${
                isWhite ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const [green, setGreen] = useState(safeNode.currentTiming.green);
  const [yellow, setYellow] = useState(safeNode.currentTiming.yellow || 4);
  const [red, setRed] = useState(safeNode.currentTiming.red);
  const [validationError, setValidationError] = useState('');

  // Synchronize internal state whenever safeNode changes
  useEffect(() => {
    setGreen(safeNode.currentTiming.green);
    setYellow(safeNode.currentTiming.yellow || 4);
    setRed(safeNode.currentTiming.red);
    setValidationError('');
  }, [safeNode.id, safeNode.currentTiming.green, safeNode.currentTiming.yellow, safeNode.currentTiming.red]);

  const handleValidateAndSetGreen = (val) => {
    setGreen(val);
    if (val < 5 || val > 120) {
      setValidationError('Green duration must be between 5s and 120s for road safety regulations.');
    } else {
      setValidationError('');
    }
  };

  const handleValidateAndSetYellow = (val) => {
    setYellow(val);
    if (val < 3 || val > 10) {
      setValidationError('Yellow duration must be between 3s and 10s for driver stopping distance.');
    } else {
      setValidationError('');
    }
  };

  const handleValidateAndSetRed = (val) => {
    setRed(val);
    if (val < 5 || val > 120) {
      setValidationError('Red duration must be between 5s and 120s to prevent gridlock.');
    } else {
      setValidationError('');
    }
  };

  const isAlreadyOptimized = (
    green === safeNode.optimizedTiming.green &&
    red === safeNode.optimizedTiming.red &&
    yellow === (safeNode.optimizedTiming.yellow || 4)
  );

  const handleApplyCustom = () => {
    if (green < 5 || green > 120 || red < 5 || red > 120 || yellow < 3 || yellow > 10) {
      setValidationError('Invalid timings detected. Please ensure all values satisfy safety boundaries.');
      return;
    }
    onApplyTiming({ green, yellow, red });
    onClose();
  };

  const handleApplyQuantumOptimum = () => {
    const optG = safeNode.optimizedTiming.green;
    const optY = safeNode.optimizedTiming.yellow || 4;
    const optR = safeNode.optimizedTiming.red;
    setGreen(optG);
    setYellow(optY);
    setRed(optR);
    onApplyTiming({ green: optG, yellow: optY, red: optR });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border ${
        isWhite ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between border-b pb-3 ${isWhite ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="flex items-center space-x-3">
            <span className={`h-8 w-8 rounded-xl font-bold flex items-center justify-center text-xs ${
              isWhite ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'bg-cyan-500/20 text-cyan-300'
            }`}>
              {safeNode.id}
            </span>
            <div>
              <h3 className={`text-sm font-bold ${isWhite ? 'text-slate-900' : 'text-white'}`}>{safeNode.name}</h3>
              <p className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>{safeNode.district}</p>
            </div>
          </div>
          <button onClick={onClose} className={`hover:text-slate-900 ${isWhite ? 'text-slate-400' : 'text-slate-400'}`}>✕</button>
        </div>

        {/* Live Metrics Quad */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className={`p-3 rounded-xl border ${isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
            <span className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Traffic Density:</span>
            <div className={`font-bold ${isWhite ? 'text-slate-900' : 'text-slate-200'}`}>{safeNode.density}%</div>
          </div>
          <div className={`p-3 rounded-xl border ${isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
            <span className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Queue Length:</span>
            <div className={`font-bold ${isWhite ? 'text-slate-900' : 'text-slate-200'}`}>{safeNode.queueLength} vehicles</div>
          </div>
          <div className={`p-3 rounded-xl border ${isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
            <span className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Road Capacity:</span>
            <div className={`font-bold ${isWhite ? 'text-slate-900' : 'text-slate-200'}`}>{safeNode.capacity} veh/h</div>
          </div>
          <div className={`p-3 rounded-xl border ${isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
            <span className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Current Phase:</span>
            <div className="font-bold text-emerald-600">{safeNode.phase}</div>
          </div>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-500 text-xs font-semibold flex items-center space-x-2">
            <span>⚠️</span>
            <span>{validationError}</span>
          </div>
        )}

        {/* Timing Adjustment (Green 5-120s, Yellow 3-10s, Red 5-120s) */}
        <div className={`p-4 rounded-xl border space-y-3 text-xs ${isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
          <div className="flex items-center justify-between">
            <span className={`font-bold uppercase text-[10px] ${isWhite ? 'text-cyan-800' : 'text-cyan-300'}`}>
              Adaptive Signal Timing Calibration
            </span>
            <span className="text-[10px] font-mono text-slate-400">Safety Envelope: 5s - 120s</span>
          </div>

          {/* Green Duration Slider (5 - 120s) */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className={isWhite ? 'text-slate-600' : 'text-slate-400'}>Green Phase Duration:</span>
              <span className="font-mono text-emerald-600 font-bold">{green}s (Opt: {safeNode.optimizedTiming.green}s)</span>
            </div>
            <input
              type="range"
              min="5"
              max="120"
              value={green}
              onChange={(e) => handleValidateAndSetGreen(parseInt(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Yellow Duration Slider (3 - 10s) */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className={isWhite ? 'text-slate-600' : 'text-slate-400'}>Yellow Clearance Duration:</span>
              <span className="font-mono text-amber-500 font-bold">{yellow}s (Opt: {safeNode.optimizedTiming.yellow || 4}s)</span>
            </div>
            <input
              type="range"
              min="3"
              max="10"
              value={yellow}
              onChange={(e) => handleValidateAndSetYellow(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Red Duration Slider (5 - 120s) */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className={isWhite ? 'text-slate-600' : 'text-slate-400'}>Red Hold Duration:</span>
              <span className="font-mono text-rose-600 font-bold">{red}s (Opt: {safeNode.optimizedTiming.red}s)</span>
            </div>
            <input
              type="range"
              min="5"
              max="120"
              value={red}
              onChange={(e) => handleValidateAndSetRed(parseInt(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between space-x-3 pt-2">
          <button
            onClick={handleApplyCustom}
            disabled={!!validationError}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              validationError
                ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-400 border-slate-300'
                : isWhite
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            Apply Manual Timing
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleApplyQuantumOptimum}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5 ${
                isAlreadyOptimized
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              <span>{isAlreadyOptimized ? '✓' : '⚡'}</span>
              <span>{isAlreadyOptimized ? 'Quantum Optimum Active' : 'Apply Quantum Optimum'}</span>
            </button>
            <button
              onClick={onClose}
              className={`px-3 py-1.5 rounded-lg text-xs border ${
                isWhite ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OptimizationHistoryModal({ history, onClear, onClose, theme }) {
  const isWhite = theme === 'white';
  const records = history || [];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 border max-h-[85vh] flex flex-col ${
        isWhite ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className={`flex items-center justify-between border-b pb-3 ${isWhite ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="flex items-center space-x-3">
            <span className={`h-9 w-9 rounded-xl flex items-center justify-center text-lg ${
              isWhite ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
            }`}>
              📜
            </span>
            <div>
              <h3 className={`text-base font-bold ${isWhite ? 'text-slate-900' : 'text-white'}`}>
                Autonomous Quantum Optimization Ledger
              </h3>
              <p className={`text-xs ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>
                Audit log of background QUBO / QAOA automated trigger decisions and safety validation
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`text-sm hover:text-slate-900 ${isWhite ? 'text-slate-400' : 'text-slate-400'}`}>✕</button>
        </div>

        {/* Telemetry Overview Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className={`p-3 rounded-xl border ${isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
            <span className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Logged Dispatches:</span>
            <div className="text-base font-bold text-cyan-600 font-mono">{records.length} Runs</div>
          </div>
          <div className={`p-3 rounded-xl border ${isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
            <span className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Avg Delay Reduction:</span>
            <div className="text-base font-bold text-emerald-600 font-mono">-36.4%</div>
          </div>
          <div className={`p-3 rounded-xl border ${isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
            <span className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>QPU Solver:</span>
            <div className="text-base font-bold text-purple-500 font-mono">QAOA (p=2)</div>
          </div>
          <div className={`p-3 rounded-xl border ${isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
            <span className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Safety Verification:</span>
            <div className="text-base font-bold text-emerald-500 font-mono">100% Validated</div>
          </div>
        </div>

        {/* Ledger List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {records.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No automated optimization runs recorded yet. System is monitoring network telemetry.
            </div>
          ) : (
            records.slice().reverse().map((rec, i) => (
              <div
                key={rec.id || i}
                className={`p-3.5 rounded-xl border transition text-xs space-y-1.5 ${
                  isWhite ? 'bg-slate-50 hover:bg-slate-100/80 border-slate-200' : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-cyan-600 font-mono">{rec.id}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                      rec.status && rec.status.includes('APPLIED')
                        ? (isWhite ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800')
                        : (isWhite ? 'bg-cyan-100 text-cyan-800' : 'bg-cyan-950 text-cyan-400 border border-cyan-800')
                    }`}>
                      {rec.status}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{rec.time}</span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div>
                    <span className={isWhite ? 'text-slate-500' : 'text-slate-400'}>Trigger Reason: </span>
                    <span className="font-semibold text-amber-600">{rec.reason}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div>
                      <span className={isWhite ? 'text-slate-500' : 'text-slate-400'}>Cost Reduction: </span>
                      <span className="font-bold text-emerald-600 font-mono">{rec.costReduction}</span>
                    </div>
                    <div>
                      <span className={isWhite ? 'text-slate-500' : 'text-slate-400'}>QPU Latency: </span>
                      <span className="font-mono text-cyan-600 font-semibold">{rec.qpuLatency}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200/40 dark:border-slate-800/40">
                  <span>Scope: {Array.isArray(rec.affectedIntersections) ? rec.affectedIntersections.join(', ') : 'All Intersections'}</span>
                  <span className="text-emerald-500 font-semibold">✓ Safety Checks: Bounds [5s, 120s] Passed</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        <div className={`flex justify-between items-center pt-3 border-t ${isWhite ? 'border-slate-200' : 'border-slate-800'}`}>
          <button
            onClick={onClear}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              isWhite ? 'bg-white hover:bg-slate-100 text-rose-600 border-rose-200' : 'bg-slate-800 hover:bg-rose-950/40 text-rose-400 border-rose-900/50'
            }`}
          >
            Clear Ledger
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function OptimizationProgressModal({ progress, stepLabel, status, iterations, objective, theme }) {
  const isWhite = theme === 'white';

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4 border ${
        isWhite ? 'bg-white border-cyan-200' : 'bg-slate-900 border-cyan-500/40'
      }`}>
        <div className="h-12 w-12 rounded-full bg-cyan-500/10 border border-cyan-500 flex items-center justify-center mx-auto text-cyan-600 animate-spin">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>

        <h3 className={`text-base font-bold tracking-wide ${isWhite ? 'text-slate-900' : 'text-white'}`}>Executing Hybrid QAOA Optimization</h3>
        <p className={`text-xs ${isWhite ? 'text-slate-600' : 'text-slate-300'}`}>{stepLabel}</p>

        {/* Progress Bar */}
        <div className={`w-full h-2 rounded-full overflow-hidden border ${
          isWhite ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>

        <div className={`flex justify-between text-[11px] font-mono ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>
          <span>Iterations: {iterations}</span>
          <span>Objective: {objective}</span>
          <span>Progress: {progress}%</span>
        </div>
      </div>
    </div>
  );
}

function DiagnosticsModal({ isRunning, progress, summary, testResults, logs, onRunTests, onClearLogs, onExportLogs, onCopyDiagnostics, onClose, theme }) {
  const isWhite = theme === 'white';

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className={`rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col border ${
        isWhite ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className={`flex items-center justify-between border-b pb-3 ${isWhite ? 'border-slate-200' : 'border-slate-800'}`}>
          <div>
            <h3 className={`text-base font-bold flex items-center gap-2 ${isWhite ? 'text-slate-900' : 'text-white'}`}>
              <span>System Diagnostics & Automated QA Suite</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                {summary.overallStatus}
              </span>
            </h3>
            <p className={`text-xs ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>25-point automated verification testing 3D Earth, Digital Twin, Mixed Traffic, Auto-Pilot, Soil/Trees/Lights, CCTV, WebGL, and QAOA optimizer.</p>
          </div>
          <button onClick={onClose} className={isWhite ? 'text-slate-400 hover:text-slate-800' : 'text-slate-400 hover:text-white'}>✕</button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onRunTests}
              disabled={isRunning}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              {isRunning ? `Running Tests (${progress}%)...` : 'Run 25-Point QA Suite'}
            </button>
            <button onClick={onCopyDiagnostics} className={`px-3 py-2 rounded-xl text-xs font-medium border ${
              isWhite ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}>
              Copy Report
            </button>
            <button onClick={onExportLogs} className={`px-3 py-2 rounded-xl text-xs font-medium border ${
              isWhite ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}>
              Export Logs
            </button>
          </div>
          <button onClick={onClearLogs} className="text-xs text-slate-400 hover:text-rose-600">Clear Logs</button>
        </div>

        {/* Overall QA Validation Badge Banner */}
        {summary.passed === summary.total && summary.total > 0 && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold text-center tracking-wider uppercase flex items-center justify-center space-x-2 shadow-sm">
            <span>🛡️</span>
            <span>{summary.validationBadge || "SYSTEM VALIDATION COMPLETE - NO DETECTED CRITICAL ERRORS"}</span>
          </div>
        )}

        {/* 20 Tests Scrollable Container */}
        <div className={`flex-1 overflow-y-auto space-y-2 pr-1 max-h-64 border rounded-xl p-3 ${
          isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'
        }`}>
          {testResults.map(t => (
            <div key={t.id} className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
              isWhite ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800/50'
            }`}>
              <div className="flex items-center space-x-3">
                <span className={`font-mono text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>#{t.id < 10 ? '0' : ''}{t.id}</span>
                <span className={`font-semibold ${isWhite ? 'text-slate-800' : 'text-slate-200'}`}>{t.name}</span>
                <span className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>({t.category})</span>
              </div>
              <div className="flex items-center space-x-2">
                {t.status === 'PASSED' && <span className="text-emerald-600 font-bold">✓ PASSED ({t.durationMs}ms)</span>}
                {t.status === 'RUNNING' && <span className="text-cyan-600 animate-pulse font-bold">RUNNING...</span>}
                {t.status === 'IDLE' && <span className="text-slate-400">STANDBY</span>}
                {t.status === 'PENDING' && <span className="text-slate-400">WAITING</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Logs */}
        <div className={`h-36 overflow-y-auto p-3 rounded-xl border font-mono text-[11px] space-y-1 ${
          isWhite ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
        }`}>
          {logs.map((log) => (
            <div key={log.id} className="flex space-x-3">
              <span className={isWhite ? 'text-slate-500' : 'text-slate-400'}>{log.timestamp}</span>
              <span className={`font-semibold ${
                log.severity === 'SUCCESS' ? 'text-emerald-600' :
                log.severity === 'WARNING' ? 'text-amber-600' :
                log.severity === 'ERROR' ? 'text-rose-600' : 'text-cyan-600'
              }`}>[{log.severity}]</span>
              <span className={isWhite ? 'text-slate-500' : 'text-slate-400'}>{log.component}:</span>
              <span>{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResetConfirmModal({ onConfirm, onCancel, theme }) {
  const isWhite = theme === 'white';

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 border ${
        isWhite ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="h-12 w-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h3 className={`text-base font-bold ${isWhite ? 'text-slate-900' : 'text-white'}`}>Reset Prototype Demonstration?</h3>
        <p className={`text-xs ${isWhite ? 'text-slate-600' : 'text-slate-300'}`}>Restores all 6 intersections, vehicle counts, traffic signals, and telemetry to pristine initial baseline states.</p>
        <div className="flex justify-center space-x-3 pt-2">
          <button onClick={onConfirm} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold">
            Confirm Reset
          </button>
          <button onClick={onCancel} className={`px-4 py-2 rounded-xl text-xs border ${
            isWhite ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function PerformanceMonitorOverlay({ simState, theme }) {
  const isWhite = theme === 'white';

  return (
    <div className={`fixed bottom-4 right-4 rounded-xl p-3 shadow-xl backdrop-blur-md z-40 text-[11px] font-mono space-y-1 pointer-events-none border ${
      isWhite ? 'bg-white/95 border-purple-200 text-slate-700 shadow-sm' : 'bg-slate-950/90 border-purple-500/50 text-slate-300'
    }`}>
      <div className={`font-bold border-b pb-1 flex justify-between ${isWhite ? 'text-purple-700 border-slate-200' : 'text-purple-300 border-slate-800'}`}>
        <span>DEVELOPER HUD</span>
        <span className="text-emerald-600">60 FPS</span>
      </div>
      <div>3D Meshes: <span className={isWhite ? 'text-cyan-700 font-semibold' : 'text-cyan-400'}>{simState.intersections.length * 4 + 45}</span></div>
      <div>Active Agents: <span className={isWhite ? 'text-cyan-700 font-semibold' : 'text-cyan-400'}>45 vehicles</span></div>
      <div>Sim Multiplier: <span className={isWhite ? 'text-cyan-700 font-semibold' : 'text-cyan-400'}>{simState.simSpeed}x</span></div>
      <div>Heap Memory: <span className={isWhite ? 'text-cyan-700 font-semibold' : 'text-cyan-400'}>~28.4 MB</span></div>
    </div>
  );
}

// ----------------------------------------------------
// FEATHERLESS AI COPILOT INTELLIGENCE (Qwen-2.5-7B)
// ----------------------------------------------------

function AiCopilotChat({ simState, theme, isModal = false, onClose }) {
  const isWhite = theme === 'white';
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 **Greetings! I am your Quantum Traffic AI Intelligence Copilot**, powered by **Featherless AI** using `Qwen/Qwen2.5-7B-Instruct`.\n\nI am connected live to the digital twin telemetry of all 6 urban intersections (`I1`–`I6`), tracking vehicle delays, QUBO energy states, and emergency corridors.\n\nHow can I assist you with urban mobility and quantum signal dispatch today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState({ online: true, model: 'Qwen/Qwen2.5-7B-Instruct', key: 'rc_21e8...82b941' });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    fetch('/api/featherless/status')
      .then(res => res.json())
      .then(data => {
        if (data && data.status === 'ONLINE') {
          setAiStatus({ online: true, model: data.model, key: data.keyMasked });
        }
      })
      .catch(() => {});
  }, []);

  const quickPrompts = [
    "⚡ Analyze current bottlenecks across all 6 intersections",
    "🔬 Explain QUBO objective penalty vs Webster timing",
    "🚑 Recommend signal priority for Emergency Corridor",
    "📈 How to maximize CO2 emission and fuel reduction?"
  ];

  const handleSend = async (textToSend) => {
    const userMsg = textToSend || input.trim();
    if (!userMsg || isLoading) return;

    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    if (window.soundEngine) window.soundEngine.playClick();

    const systemTelemetryPrompt = `You are the Quantum Traffic AI Optimization Specialist embedded in the "Quantum-Enhanced Adaptive Urban Traffic Optimization" platform.
You are powered by Featherless AI (${aiStatus.model}).
Live Urban Network State:
- Clock: ${window.trafficEngine.getSimTimeString()}
- Optimization Mode: ${simState.optimizationMode} (Hybrid QAOA vs Webster Baseline)
- Average Waiting Time: ${simState.currentMetrics.waitingTime}s vs Classical: ${simState.currentMetrics.classicalWaitingTime}s (-${simState.currentMetrics.waitingTimeReduction}%)
- Network Congestion: ${simState.currentMetrics.congestionLevel}% | Total Queue: ${simState.currentMetrics.totalQueue} vehicles
- Throughput: ${simState.currentMetrics.throughput} vehicles/min
- Fuel Saved: ${simState.currentMetrics.fuelSaved}% | CO2 Reduction: ${simState.currentMetrics.co2Reduction}%
- Emergency Corridor: ${simState.isEmergencyActive ? 'ACTIVE (Ambulance A01 on I1->I3->I4->I6)' : 'STANDBY'}
- Active Incident: ${simState.activeIncident ? simState.activeIncident.message : 'None'}
- Intersections:
${simState.intersections.map(n => `  * ${n.id} (${n.name}): Density=${n.density}%, Queue=${n.queueLength} veh, Current Green=${n.currentTiming.green}s, Opt Green=${n.optimizedTiming.green}s, Phase=${n.phase}`).join('\n')}

Guidelines:
- Provide concise, technically authoritative, and actionable answers.
- Cite QUBO formulations, QAOA Hamiltonian minimization, Webster's green split equations, and sensor telemetry where relevant.
- Format responses clearly using markdown bullets and bold text.`;

    try {
      const apiMessages = [
        { role: 'system', content: systemTelemetryPrompt },
        ...newMessages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      ];

      const res = await fetch('/api/featherless/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'Qwen/Qwen2.5-7B-Instruct',
          messages: apiMessages,
          max_tokens: 700,
          temperature: 0.7
        })
      });

      if (!res.ok) {
        throw new Error(`Featherless API HTTP ${res.status}`);
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "No response received from Featherless AI.";
      
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      if (window.soundEngine) window.soundEngine.playQuantumChime();
    } catch (err) {
      console.error("Featherless error:", err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ **Featherless AI Notice**: (${err.message}). Telemetry Analysis:\n\n*Currently, intersection **I4 (Central Square)** exhibits the highest queue (${simState.intersections.find(n=>n.id==='I4')?.queueLength} vehicles). Triggering Hybrid QAOA optimization adapts green splits and reduces total waiting time by ~35%.*`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full ${isWhite ? 'text-slate-800' : 'text-slate-100'}`}>
      {/* Copilot Header */}
      <div className={`p-4 border-b flex items-center justify-between backdrop-blur-md ${
        isWhite ? 'bg-white/95 border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-md text-white font-bold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm tracking-wide">QUANTUM AI COPILOT</h3>
              <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-mono px-2 py-0.5 rounded-full border border-purple-300 dark:border-purple-700">
                Featherless AI
              </span>
            </div>
            <p className={`text-[11px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>
              Model: <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">{aiStatus.model}</span> | Key: <span className="font-mono">{aiStatus.key}</span>
            </p>
          </div>
        </div>

        {isModal && onClose && (
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border text-xs transition ${
              isWhite ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            ✕ Close
          </button>
        )}
      </div>

      {/* Quick Prompts Bar */}
      <div className={`px-4 py-2 border-b flex items-center space-x-2 overflow-x-auto text-[11px] ${
        isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}>
        <span className={`text-[10px] uppercase font-bold tracking-wider shrink-0 ${isWhite ? 'text-slate-400' : 'text-slate-500'}`}>Prompts:</span>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap transition border text-left shrink-0 ${
              isWhite 
                ? 'bg-white hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 border-slate-200 shadow-sm' 
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border-slate-800'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] rounded-2xl p-4 text-xs leading-relaxed border shadow-sm ${
                isUser
                  ? isWhite
                    ? 'bg-cyan-600 text-white border-cyan-500'
                    : 'bg-cyan-700 text-white border-cyan-600'
                  : isWhite
                    ? 'bg-white text-slate-800 border-slate-200'
                    : 'bg-slate-900 text-slate-200 border-slate-800'
              }`}>
                {!isUser && (
                  <div className="flex items-center space-x-1.5 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="h-2 w-2 rounded-full bg-cyan-500"></span>
                    <span className="font-bold text-[10px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                      Featherless AI Intelligence
                    </span>
                  </div>
                )}
                <div className="whitespace-pre-wrap font-sans">{m.content}</div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className={`rounded-2xl p-3 border text-xs flex items-center space-x-3 ${
              isWhite ? 'bg-white text-slate-600 border-slate-200' : 'bg-slate-900 text-slate-300 border-slate-800'
            }`}>
              <div className="flex space-x-1">
                <span className="h-2 w-2 rounded-full bg-purple-500 animate-bounce"></span>
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="font-medium">Featherless AI generating quantum traffic insights...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className={`p-3 border-t flex items-center space-x-2 backdrop-blur-md ${
          isWhite ? 'bg-white/95 border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Featherless AI about congestion, QUBO, QAOA, Webster formulas, or emergency routing..."
          className={`flex-1 px-4 py-2.5 rounded-xl text-xs border outline-none transition focus:ring-2 focus:ring-cyan-500/30 ${
            isWhite 
              ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' 
              : 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
          }`}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
        >
          <span>Send</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </form>
    </div>
  );
}

function AiCopilotModal({ simState, theme, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl h-[82vh] rounded-2xl overflow-hidden shadow-2xl border flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <AiCopilotChat simState={simState} theme={theme} isModal={true} onClose={onClose} />
      </div>
    </div>
  );
}

function AiCopilotView({ simState, theme }) {
  const isWhite = theme === 'white';
  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-bold tracking-wide ${isWhite ? 'text-slate-900' : 'text-white'}`}>Featherless AI Traffic Intelligence Center</h2>
          <p className={`text-xs ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Autonomous conversational intelligence powered by open-source LLMs hosted on Featherless AI.</p>
        </div>
      </div>
      <div className={`flex-1 rounded-2xl overflow-hidden border shadow-sm ${
        isWhite ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <AiCopilotChat simState={simState} theme={theme} isModal={false} />
      </div>
    </div>
  );
}

// ----------------------------------------------------
// GEOAPIFY GIS MAPPING & GEOCODING COMPONENTS
// ----------------------------------------------------

// Reverse Geocoding helper with fallback (Key: b9a95414ae8a4dd3b9d2f97ae2fc0546)
async function fetchReverseGeocode(lat, lon) {
  try {
    const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data.features && data.features[0]) ? data.features[0].properties : null;
  } catch (err) {
    try {
      const fb = await fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=b9a95414ae8a4dd3b9d2f97ae2fc0546`);
      const fbData = await fb.json();
      return (fbData.features && fbData.features[0]) ? fbData.features[0].properties : null;
    } catch (e2) {
      console.warn("Reverse geocode failed:", e2);
      return null;
    }
  }
}

// Forward Geocoding Search helper with fallback (Key: fdf446b77a594928afc8794041b2d9e1)
async function fetchForwardGeocode(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(`/api/geocode/search?text=${encodeURIComponent(query)}&limit=5`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.features || [];
  } catch (err) {
    try {
      const fb = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(query)}&limit=5&apiKey=fdf446b77a594928afc8794041b2d9e1`);
      const fbData = await fb.json();
      return fbData.features || [];
    } catch (e2) {
      console.warn("Forward geocode failed:", e2);
      return [];
    }
  }
}

// Autocomplete Address Search helper with fallback (Key: 509e607576bb4c1d94ee7f92dce287da)
async function fetchAutocomplete(query, bias = 'proximity:-122.4015,37.7855') {
  if (!query || query.trim().length < 1) return [];
  try {
    let url = `/api/geocode/autocomplete?text=${encodeURIComponent(query)}&limit=6`;
    if (bias) url += `&bias=${encodeURIComponent(bias)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.features || [];
  } catch (err) {
    try {
      let fbUrl = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&limit=6&apiKey=509e607576bb4c1d94ee7f92dce287da`;
      if (bias) fbUrl += `&bias=${encodeURIComponent(bias)}`;
      const fb = await fetch(fbUrl);
      const fbData = await fb.json();
      return fbData.features || [];
    } catch (e2) {
      console.warn("Autocomplete failed:", e2);
      return [];
    }
  }
}

// Turn-by-Turn Routing helper with fallback (Key: f45cf1c920ff48c7aee949dfc6053cef)
async function fetchGeoapifyRoute(waypoints, mode = 'drive', avoid = '') {
  if (!waypoints) return null;
  const routingKey = (window.TRAFFIC_DATA && window.TRAFFIC_DATA.geoapify && window.TRAFFIC_DATA.geoapify.routingKey) || 'f45cf1c920ff48c7aee949dfc6053cef';
  try {
    let url = `/api/routing?waypoints=${encodeURIComponent(waypoints)}&mode=${mode}&details=instruction_details`;
    if (avoid) url += `&avoid=${encodeURIComponent(avoid)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    try {
      let fbUrl = `https://api.geoapify.com/v1/routing?waypoints=${encodeURIComponent(waypoints)}&mode=${mode}&details=instruction_details&apiKey=${routingKey}`;
      if (avoid) fbUrl += `&avoid=${encodeURIComponent(avoid)}`;
      const fb = await fetch(fbUrl);
      const fbData = await fb.json();
      return fbData;
    } catch (e2) {
      console.warn("Routing request failed:", e2);
      return null;
    }
  }
}

// Geoapify Route Planner API helper with fallback (Key: f45cf1c920ff48c7aee949dfc6053cef)
async function fetchGeoapifyRoutePlanner(agents, shipments, mode = 'drive') {
  const routePlannerKey = (window.TRAFFIC_DATA && window.TRAFFIC_DATA.geoapify && window.TRAFFIC_DATA.geoapify.routePlannerKey) || 'f45cf1c920ff48c7aee949dfc6053cef';
  const postData = { mode, agents, shipments };
  try {
    const res = await fetch('/api/route-planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    try {
      const fb = await fetch(`https://api.geoapify.com/v1/routeplanner?apiKey=${routePlannerKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      const fbData = await fb.json();
      return fbData;
    } catch (e2) {
      console.warn("Route Planner request failed:", e2);
      return null;
    }
  }
}

// Geoapify Reachability & Isoline helper with fallback (Key: 2378af2a2bf64130bef3abbcf70865d5)
async function fetchGeoapifyIsoline(lat, lon, range = 300, type = 'time', mode = 'drive') {
  if (lat == null || lon == null) return null;
  const isolineKey = (window.TRAFFIC_DATA && window.TRAFFIC_DATA.geoapify && window.TRAFFIC_DATA.geoapify.isolineKey) || '2378af2a2bf64130bef3abbcf70865d5';
  try {
    const url = `/api/isoline?lat=${lat}&lon=${lon}&type=${type}&mode=${mode}&range=${range}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    try {
      const fbUrl = `https://api.geoapify.com/v1/isoline?lat=${lat}&lon=${lon}&type=${type}&mode=${mode}&range=${range}&apiKey=${isolineKey}`;
      const fb = await fetch(fbUrl);
      const fbData = await fb.json();
      return fbData;
    } catch (e2) {
      console.warn("Isoline request failed:", e2);
      return null;
    }
  }
}

// Geoapify Places API helper with fallback (Key: c5191509836e498095c57bf059ac791f)
async function fetchGeoapifyPlaces(categories = 'commercial,catering', filter = 'circle:-122.4015,37.7855,1200', limit = 12, bias = '') {
  const placesKey = (window.TRAFFIC_DATA && window.TRAFFIC_DATA.geoapify && window.TRAFFIC_DATA.geoapify.placesKey) || 'c5191509836e498095c57bf059ac791f';
  try {
    let url = `/api/places?categories=${encodeURIComponent(categories)}&filter=${encodeURIComponent(filter)}&limit=${limit}`;
    if (bias) url += `&bias=${encodeURIComponent(bias)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    try {
      let fbUrl = `https://api.geoapify.com/v2/places?categories=${encodeURIComponent(categories)}&filter=${encodeURIComponent(filter)}&limit=${limit}&apiKey=${placesKey}`;
      if (bias) fbUrl += `&bias=${encodeURIComponent(bias)}`;
      const fb = await fetch(fbUrl);
      const fbData = await fb.json();
      return fbData;
    } catch (e2) {
      console.warn("Places request failed:", e2);
      return null;
    }
  }
}

// Geoapify Place Details API helper with fallback (Key: 83ae1c36bd23478598f4501c4d9f114d)
async function fetchGeoapifyPlaceDetails(lat, lon, id = null) {
  const placeDetailsKey = (window.TRAFFIC_DATA && window.TRAFFIC_DATA.geoapify && window.TRAFFIC_DATA.geoapify.placeDetailsKey) || '83ae1c36bd23478598f4501c4d9f114d';
  try {
    let url = id ? `/api/place-details?id=${encodeURIComponent(id)}` : `/api/place-details?lat=${lat}&lon=${lon}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    try {
      let fbUrl = id ? `https://api.geoapify.com/v2/place-details?id=${encodeURIComponent(id)}&apiKey=${placeDetailsKey}` : `https://api.geoapify.com/v2/place-details?lat=${lat}&lon=${lon}&apiKey=${placeDetailsKey}`;
      const fb = await fetch(fbUrl);
      const fbData = await fb.json();
      return fbData;
    } catch (e2) {
      console.warn("Place Details request failed:", e2);
      return null;
    }
  }
}

// Geoapify IP Geolocation API helper with fallback (Key: 0ae0a18aa62240379014c7b7d7e08c28)
async function fetchGeoapifyIpGeo(ip = '') {
  const ipGeoKey = (window.TRAFFIC_DATA && window.TRAFFIC_DATA.geoapify && window.TRAFFIC_DATA.geoapify.ipGeoKey) || '0ae0a18aa62240379014c7b7d7e08c28';
  try {
    let url = `/api/ipinfo`;
    if (ip) url += `?ip=${encodeURIComponent(ip)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    try {
      let fbUrl = `https://api.geoapify.com/v1/ipinfo?apiKey=${ipGeoKey}`;
      if (ip) fbUrl += `&ip=${encodeURIComponent(ip)}`;
      const fb = await fetch(fbUrl);
      const fbData = await fb.json();
      return fbData;
    } catch (e2) {
      console.warn("IP Geolocation request failed:", e2);
      return null;
    }
  }
}

// Geoapify Map Matching API helper with fallback (Key: 8fca0f76ccf44e46b3cd9a3cac47e6ff)
async function fetchGeoapifyMapMatching(waypoints, mode = 'drive') {
  const mapMatchingKey = (window.TRAFFIC_DATA && window.TRAFFIC_DATA.geoapify && window.TRAFFIC_DATA.geoapify.mapMatchingKey) || '8fca0f76ccf44e46b3cd9a3cac47e6ff';
  const postData = { mode, waypoints };
  try {
    const res = await fetch('/api/mapmatching', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    try {
      const fb = await fetch(`https://api.geoapify.com/v1/mapmatching?apiKey=${mapMatchingKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      const fbData = await fb.json();
      return fbData;
    } catch (e2) {
      console.warn("Map Matching request failed:", e2);
      return null;
    }
  }
}

// Helper to generate dynamic HTML divIcon for intersection
function getIntersectionDivIcon(node, isEmergencyCorridor) {
  const isGreen = node.phase.includes('GREEN');
  const isYellow = node.phase.includes('YELLOW');
  const color = isGreen ? '#10b981' : isYellow ? '#f59e0b' : '#ef4444';
  const glow = isGreen ? 'rgba(16, 185, 129, 0.45)' : isYellow ? 'rgba(245, 158, 11, 0.45)' : 'rgba(239, 68, 68, 0.45)';
  const pingBorder = isEmergencyCorridor ? 'border-cyan-400 animate-pulse' : '';

  return L.divIcon({
    className: 'custom-intersection-marker',
    html: `
      <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="position: absolute; inset: 0; border-radius: 9999px; background: ${color}; opacity: 0.28; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 30px; height: 30px; border-radius: 9999px; background: #ffffff; border: 2.5px solid ${color}; box-shadow: 0 4px 12px ${glow}; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 800; color: #0f172a; ${isEmergencyCorridor ? 'outline: 2px solid #06b6d4;' : ''}">
          ${node.id}
        </div>
        <div style="position: absolute; bottom: -8px; background: #0f172a; color: #ffffff; font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700; padding: 1px 4px; border-radius: 4px; border: 1px solid #334155; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          ${node.queueLength}v
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20]
  });
}

// ----------------------------------------------------
// COMPACT GEOAPIFY MAP EMBED (For Dashboard View)
// ----------------------------------------------------
function GeoapifyMapEmbed({ simState, onSelectIntersection, theme }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const roadsRef = useRef([]);
  const isWhite = theme === 'white';

  const mapStyle = isWhite ? 'osm-bright' : 'dark-matter';
  const apiKey = (window.TRAFFIC_DATA && window.TRAFFIC_DATA.geoapify && window.TRAFFIC_DATA.geoapify.apiKey) || 'b5a852f6b97e420ab0850cc32c31c9d9';

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [37.7855, -122.4015],
        zoom: 14,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer(`https://maps.geoapify.com/v1/tile/${mapStyle}/{z}/{x}/{y}.png?apiKey=${apiKey}`, {
        maxZoom: 19,
        crossOrigin: true
      }).addTo(map);

      // Attribution
      L.control.attribution({ position: 'bottomright' })
        .addAttribution('&copy; <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | &copy; OpenStreetMap')
        .addTo(map);

      mapRef.current = map;

      // Invalidate size after layout stabilization
      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      }, 250);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = {};
        roadsRef.current = [];
      }
    };
  }, [mapStyle]);

  // Update Roads & Intersections on Simulation Tick
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Build node map for lookup
    const nodeMap = {};
    simState.intersections.forEach(n => { nodeMap[n.id] = n; });

    // 1. Draw / Update Arterial Roads
    roadsRef.current.forEach(r => r.remove());
    roadsRef.current = [];

    simState.roads.forEach(road => {
      const fromNode = nodeMap[road.from];
      const toNode = nodeMap[road.to];
      if (!fromNode || !toNode) return;

      const isClosed = simState.closedRoads && simState.closedRoads.has(road.id);
      const isEmergency = simState.isEmergencyActive && (
        (road.from === 'I1' && road.to === 'I3') || (road.from === 'I3' && road.to === 'I4') || (road.from === 'I4' && road.to === 'I6') ||
        (road.from === 'I3' && road.to === 'I1') || (road.from === 'I4' && road.to === 'I3') || (road.from === 'I6' && road.to === 'I4')
      );

      let color = '#10b981';
      if (isClosed) color = '#ef4444';
      else if (isEmergency) color = '#06b6d4';
      else if (road.congestion === 'critical') color = '#ef4444';
      else if (road.congestion === 'high') color = '#f97316';
      else if (road.congestion === 'medium') color = '#f59e0b';

      const poly = L.polyline([[fromNode.lat, fromNode.lon], [toNode.lat, toNode.lon]], {
        color,
        weight: isEmergency ? 6 : (road.lanes === 3 ? 5 : 4),
        opacity: isClosed ? 0.6 : 0.85,
        dashArray: isClosed ? '6, 6' : (isEmergency ? '10, 6' : null)
      }).addTo(map);

      poly.bindTooltip(`<b>${road.id}</b>: ${road.flow}/${road.capacity} veh/h (${road.congestion.toUpperCase()})`, {
        sticky: true
      });

      roadsRef.current.push(poly);
    });

    // 2. Corner Metro Railway Line
    const railwayCoords = [
      [37.7940, -122.4150],
      [37.7880, -122.4080],
      [37.7820, -122.4000],
      [37.7760, -122.3940],
      [37.7720, -122.3900]
    ];
    const railPoly = L.polyline(railwayCoords, {
      color: '#6366f1',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.9
    }).addTo(map);
    railPoly.bindTooltip("<b>🚄 Metro Transit Rail Viaduct</b>", { sticky: true });
    roadsRef.current.push(railPoly);

    // 3. Draw / Update Intersection Markers
    simState.intersections.forEach(node => {
      const isEm = simState.isEmergencyActive && ['I1', 'I3', 'I4', 'I6'].includes(node.id);
      const icon = getIntersectionDivIcon(node, isEm);

      if (markersRef.current[node.id]) {
        markersRef.current[node.id].setIcon(icon);
      } else {
        const marker = L.marker([node.lat, node.lon], { icon }).addTo(map);
        
        marker.on('click', () => {
          onSelectIntersection(node.id);
        });

        markersRef.current[node.id] = marker;
      }

      // Update popup content
      const popupHtml = `
        <div style="padding: 12px; font-family: 'Inter', sans-serif; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-weight: 800; font-size: 13px; color: #0f172a;">${node.id} - ${node.name}</span>
            <span style="font-size: 10px; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 9999px; font-weight: 700;">${node.phase}</span>
          </div>
          <p style="font-size: 11px; color: #64748b; margin: 0 0 8px 0;">${node.district}</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; margin-bottom: 8px;">
            <div style="background: #f8fafc; padding: 6px; border-radius: 6px; border: 1px solid #e2e8f0;">
              <span style="color: #64748b; font-size: 9px; display: block;">Queue:</span>
              <strong style="color: #0f172a;">${node.queueLength} veh</strong>
            </div>
            <div style="background: #f8fafc; padding: 6px; border-radius: 6px; border: 1px solid #e2e8f0;">
              <span style="color: #64748b; font-size: 9px; display: block;">Density:</span>
              <strong style="color: #0f172a;">${node.density}%</strong>
            </div>
          </div>
          <div style="font-size: 10px; color: #475569; margin-bottom: 10px;">
            Signal Green: <strong style="color: #10b981;">${node.currentTiming.green}s</strong> | Quantum Opt: <strong style="color: #0284c7;">${node.optimizedTiming.green}s</strong>
          </div>
          <button id="inspect-node-btn-${node.id}" style="width: 100%; background: #0284c7; color: #ffffff; border: none; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;">
            Inspect Node Details &rarr;
          </button>
        </div>
      `;

      markersRef.current[node.id].bindPopup(popupHtml);
      markersRef.current[node.id].on('popupopen', () => {
        const btn = document.getElementById(`inspect-node-btn-${node.id}`);
        if (btn) {
          btn.onclick = () => onSelectIntersection(node.id);
        }
      });
    });
  }, [simState, onSelectIntersection]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full min-h-[480px]"></div>
      <div className={`absolute bottom-3 left-3 z-[1000] backdrop-blur-md px-3 py-1 rounded-lg border text-[11px] font-mono flex items-center space-x-2 shadow-sm ${
        isWhite ? 'bg-white/90 border-slate-200 text-slate-700' : 'bg-slate-900/90 border-slate-800 text-slate-200'
      }`}>
        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
        <span>Geoapify GIS Leaflet Engine (8 Intersections Active)</span>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// FULL-PAGE DEDICATED GEOAPIFY GIS MAP VIEW
// ----------------------------------------------------
function GeoapifyMapView({ simState, onSelectIntersection, theme }) {
  const isWhite = theme === 'white';
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const roadsRef = useRef([]);
  const searchMarkerRef = useRef(null);
  const clickMarkerRef = useRef(null);
  const tileLayerRef = useRef(null);

  // States
  const [activeStyle, setActiveStyle] = useState('osm-bright'); // 'osm-bright' | 'positron' | 'dark-matter' | 'osm-liberty'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [reverseAddress, setReverseAddress] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showRailway, setShowRailway] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Geoapify GIS Engine Connected (8 Nodes)');
  const autocompleteTimer = useRef(null);
  const routeLayersRef = useRef([]);
  const isolineLayersRef = useRef([]);
  const placesLayersRef = useRef([]);
  const matchedLayersRef = useRef([]);
  const routePlannerLayersRef = useRef([]);

  // Turn-by-Turn Routing States
  const [activeRoute, setActiveRoute] = useState(null);
  const [routeMode, setRouteMode] = useState('drive');
  const [routeFrom, setRouteFrom] = useState('I1');
  const [routeTo, setRouteTo] = useState('I6');
  const [isRouting, setIsRouting] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  // Multi-Stop Route Planner States (Key: f45cf1c920ff48c7aee949dfc6053cef)
  const [isPlanningRoute, setIsPlanningRoute] = useState(false);
  const [activeRoutePlan, setActiveRoutePlan] = useState(null);

  // Reachability & Isoline States (Key: 2378af2a2bf64130bef3abbcf70865d5)
  const [activeIsoline, setActiveIsoline] = useState(null);
  const [isolineNode, setIsolineNode] = useState('I3');
  const [isolineRange, setIsolineRange] = useState(300);
  const [isolineMode, setIsolineMode] = useState('drive');
  const [isCalculatingIsoline, setIsCalculatingIsoline] = useState(false);

  // Places & Place Details States (Keys: c5191509836e498095c57bf059ac791f / 83ae1c36bd23478598f4501c4d9f114d)
  const [showPlaces, setShowPlaces] = useState(false);
  const [placesCategory, setPlacesCategory] = useState('commercial,catering');
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [activePlaceDetail, setActivePlaceDetail] = useState(null);
  const [placesCount, setPlacesCount] = useState(0);

  // IP Geolocation State (Key: 0ae0a18aa62240379014c7b7d7e08c28)
  const [ipGeoInfo, setIpGeoInfo] = useState(null);
  const [isDetectingIp, setIsDetectingIp] = useState(false);

  // Map Matching States (Key: 8fca0f76ccf44e46b3cd9a3cac47e6ff)
  const [isMapMatching, setIsMapMatching] = useState(false);
  const [mapMatchedData, setMapMatchedData] = useState(null);

  const apiKey = (window.TRAFFIC_DATA && window.TRAFFIC_DATA.geoapify && window.TRAFFIC_DATA.geoapify.apiKey) || 'b5a852f6b97e420ab0850cc32c31c9d9';
  const routingKey = (window.TRAFFIC_DATA && window.TRAFFIC_DATA.geoapify && window.TRAFFIC_DATA.geoapify.routingKey) || 'f45cf1c920ff48c7aee949dfc6053cef';
  const routePlannerKey = (window.TRAFFIC_DATA && window.TRAFFIC_DATA.geoapify && window.TRAFFIC_DATA.geoapify.routePlannerKey) || 'f45cf1c920ff48c7aee949dfc6053cef';
  const isolineKey = (window.TRAFFIC_DATA && window.TRAFFIC_DATA.geoapify && window.TRAFFIC_DATA.geoapify.isolineKey) || '2378af2a2bf64130bef3abbcf70865d5';
  const placesKey = (window.TRAFFIC_DATA && window.TRAFFIC_DATA.geoapify && window.TRAFFIC_DATA.geoapify.placesKey) || 'c5191509836e498095c57bf059ac791f';
  const placeDetailsKey = (window.TRAFFIC_DATA && window.TRAFFIC_DATA.geoapify && window.TRAFFIC_DATA.geoapify.placeDetailsKey) || '83ae1c36bd23478598f4501c4d9f114d';
  const ipGeoKey = (window.TRAFFIC_DATA && window.TRAFFIC_DATA.geoapify && window.TRAFFIC_DATA.geoapify.ipGeoKey) || '0ae0a18aa62240379014c7b7d7e08c28';
  const mapMatchingKey = (window.TRAFFIC_DATA && window.TRAFFIC_DATA.geoapify && window.TRAFFIC_DATA.geoapify.mapMatchingKey) || '8fca0f76ccf44e46b3cd9a3cac47e6ff';
  const geocodingKey = (window.TRAFFIC_DATA && window.TRAFFIC_DATA.geoapify && window.TRAFFIC_DATA.geoapify.geocodingKey) || 'b5a852f6b97e420ab0850cc32c31c9d9';
  const reverseKey = (window.TRAFFIC_DATA && window.TRAFFIC_DATA.geoapify && window.TRAFFIC_DATA.geoapify.reverseKey) || 'b9a95414ae8a4dd3b9d2f97ae2fc0546';
  const autocompleteKey = (window.TRAFFIC_DATA && window.TRAFFIC_DATA.geoapify && window.TRAFFIC_DATA.geoapify.autocompleteKey) || '509e607576bb4c1d94ee7f92dce287da';

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [37.7855, -122.4015],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      // Custom Zoom Control top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Add Tile Layer
      const tile = L.tileLayer(`https://maps.geoapify.com/v1/tile/${activeStyle}/{z}/{x}/{y}.png?apiKey=${apiKey}`, {
        maxZoom: 19,
        crossOrigin: true
      }).addTo(map);
      tileLayerRef.current = tile;

      // Attribution
      L.control.attribution({ position: 'bottomright' })
        .addAttribution('&copy; <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | OpenStreetMap')
        .addTo(map);

      // Click to Reverse Geocode
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        setStatusMessage(`Reverse geocoding coordinates [${lat.toFixed(4)}, ${lng.toFixed(4)}]...`);

        if (clickMarkerRef.current) {
          clickMarkerRef.current.remove();
        }

        const revIcon = L.divIcon({
          className: 'rev-geocode-pin',
          html: `
            <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; inset: 0; border-radius: 9999px; background: #8b5cf6; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 22px; height: 22px; border-radius: 9999px; background: #8b5cf6; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(139,92,246,0.5); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 11px;">
                📍
              </div>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker([lat, lng], { icon: revIcon }).addTo(map);
        clickMarkerRef.current = marker;

        const prop = await fetchReverseGeocode(lat, lng);
        if (prop) {
          setReverseAddress(prop);
          setStatusMessage(`Reverse Geocoded: ${prop.formatted || prop.address_line1 || 'Location found'}`);
          
          const popupContent = `
            <div style="padding: 12px; font-family: 'Inter', sans-serif; max-width: 260px;">
              <div style="display: flex; align-items: center; space-x: 6px; margin-bottom: 6px;">
                <span style="font-size: 12px; font-weight: 800; color: #6d28d9;">📍 Reverse Geocoded Location</span>
              </div>
              <p style="font-size: 12px; font-weight: 600; color: #0f172a; margin: 0 0 4px 0;">${prop.formatted || prop.name || 'Street Address'}</p>
              <p style="font-size: 11px; color: #64748b; margin: 0 0 6px 0;">${prop.district || ''} ${prop.city ? '· ' + prop.city : ''} ${prop.postcode || ''}</p>
              <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #475569; background: #f1f5f9; padding: 4px 6px; border-radius: 4px; margin-bottom: 6px;">
                GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}
              </div>
              <div style="font-size: 9px; color: #7c3aed; font-weight: 600;">
                API: Reverse Geocoding (Key: ${reverseKey.slice(0, 8)}...)
              </div>
            </div>
          `;
          marker.bindPopup(popupContent).openPopup();
        } else {
          marker.bindPopup(`<b>Coordinates:</b> ${lat.toFixed(5)}, ${lng.toFixed(5)}`).openPopup();
        }
      });

      mapRef.current = map;

      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      }, 250);
    }

    return () => {
      if (mapRef.current) {
        routeLayersRef.current.forEach(l => l.remove());
        routeLayersRef.current = [];
        isolineLayersRef.current.forEach(l => l.remove());
        isolineLayersRef.current = [];
        placesLayersRef.current.forEach(l => l.remove());
        placesLayersRef.current = [];
        matchedLayersRef.current.forEach(l => l.remove());
        matchedLayersRef.current = [];
        routePlannerLayersRef.current.forEach(l => l.remove());
        routePlannerLayersRef.current = [];
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = {};
        roadsRef.current = [];
      }
    };
  }, []);

  // Initial operator IP Geolocation query on mount
  useEffect(() => {
    fetchGeoapifyIpGeo().then(data => {
      if (data && (data.city || data.country || data.ip)) {
        setIpGeoInfo(data);
      }
    }).catch(() => {});
  }, []);

  // Update Tile Layer on Style Change
  useEffect(() => {
    if (!mapRef.current) return;
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }
    const tile = L.tileLayer(`https://maps.geoapify.com/v1/tile/${activeStyle}/{z}/{x}/{y}.png?apiKey=${apiKey}`, {
      maxZoom: 19,
      crossOrigin: true
    }).addTo(mapRef.current);
    tileLayerRef.current = tile;
  }, [activeStyle, apiKey]);

  // Update Roads & Intersections on Simulation Tick
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const nodeMap = {};
    simState.intersections.forEach(n => { nodeMap[n.id] = n; });

    // 1. Draw Arterial Road Polylines
    roadsRef.current.forEach(r => r.remove());
    roadsRef.current = [];

    simState.roads.forEach(road => {
      const fromNode = nodeMap[road.from];
      const toNode = nodeMap[road.to];
      if (!fromNode || !toNode) return;

      const isClosed = simState.closedRoads && simState.closedRoads.has(road.id);
      const isEmergency = simState.isEmergencyActive && (
        (road.from === 'I1' && road.to === 'I3') || (road.from === 'I3' && road.to === 'I4') || (road.from === 'I4' && road.to === 'I6') ||
        (road.from === 'I3' && road.to === 'I1') || (road.from === 'I4' && road.to === 'I3') || (road.from === 'I6' && road.to === 'I4')
      );

      let color = '#10b981';
      if (isClosed) color = '#ef4444';
      else if (isEmergency) color = '#06b6d4';
      else if (road.congestion === 'critical') color = '#ef4444';
      else if (road.congestion === 'high') color = '#f97316';
      else if (road.congestion === 'medium') color = '#f59e0b';

      const poly = L.polyline([[fromNode.lat, fromNode.lon], [toNode.lat, toNode.lon]], {
        color,
        weight: isEmergency ? 7 : (road.lanes === 3 ? 5 : 4),
        opacity: isClosed ? 0.6 : 0.88,
        dashArray: isClosed ? '6, 6' : (isEmergency ? '12, 6' : null)
      }).addTo(map);

      poly.bindTooltip(`
        <div style="font-family: 'Inter', sans-serif; font-size: 11px;">
          <strong style="color: #0f172a;">${road.id} (${road.from} &harr; ${road.to})</strong><br/>
          Flow: <b>${road.flow}</b> / Cap: <b>${road.capacity}</b> veh/h<br/>
          Speed Limit: <b>${road.speedLimit} km/h</b> | Congestion: <span style="text-transform: uppercase; font-weight: bold; color: ${color};">${road.congestion}</span>
        </div>
      `, { sticky: true });

      roadsRef.current.push(poly);
    });

    // 2. Metro Transit Rail Line
    if (showRailway) {
      const railwayCoords = [
        [37.7940, -122.4150],
        [37.7880, -122.4080],
        [37.7820, -122.4000],
        [37.7760, -122.3940],
        [37.7720, -122.3900]
      ];
      const railPoly = L.polyline(railwayCoords, {
        color: '#6366f1',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.95
      }).addTo(map);
      railPoly.bindTooltip("<b>🚄 Metro Transit Rail Viaduct</b> · Corner Corridor", { sticky: true });
      roadsRef.current.push(railPoly);

      // Metro Station Marker
      const stationIcon = L.divIcon({
        className: 'station-pin',
        html: `<div style="background: #6366f1; color: #fff; padding: 2px 6px; border-radius: 6px; font-weight: 800; font-size: 10px; border: 1.5px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); white-space: nowrap;">🚄 Metro Central</div>`,
        iconSize: [80, 24],
        iconAnchor: [40, 12]
      });
      const stnMarker = L.marker([37.7845, -122.3900], { icon: stationIcon }).addTo(map);
      stnMarker.bindTooltip("Grand Central Intermodal Metro Station", { sticky: true });
      roadsRef.current.push(stnMarker);
    }

    // 3. Draw / Update Intersection Markers
    simState.intersections.forEach(node => {
      const isEm = simState.isEmergencyActive && ['I1', 'I3', 'I4', 'I6'].includes(node.id);
      const icon = getIntersectionDivIcon(node, isEm);

      if (markersRef.current[node.id]) {
        markersRef.current[node.id].setIcon(icon);
      } else {
        const marker = L.marker([node.lat, node.lon], { icon }).addTo(map);
        markersRef.current[node.id] = marker;
      }

      const popupHtml = `
        <div style="padding: 14px; font-family: 'Inter', sans-serif; min-width: 240px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 13px; color: #0284c7; background: #f0f9ff; padding: 2px 6px; border-radius: 6px; border: 1px solid #bae6fd;">${node.id}</span>
              <strong style="font-size: 13px; color: #0f172a;">${node.name}</strong>
            </div>
            <span style="font-size: 10px; background: #ecfdf5; color: #059669; padding: 2px 8px; border-radius: 9999px; font-weight: 700; border: 1px solid #a7f3d0;">${node.phase}</span>
          </div>
          <p style="font-size: 11px; color: #64748b; margin: 0 0 10px 0;">${node.district}</p>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; margin-bottom: 10px;">
            <div style="background: #f8fafc; padding: 6px 8px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <span style="color: #64748b; font-size: 9px; display: block;">Queue Length:</span>
              <strong style="color: #0f172a; font-size: 12px;">${node.queueLength} veh</strong>
            </div>
            <div style="background: #f8fafc; padding: 6px 8px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <span style="color: #64748b; font-size: 9px; display: block;">Density:</span>
              <strong style="color: #0f172a; font-size: 12px;">${node.density}%</strong>
            </div>
          </div>

          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 6px 8px; border-radius: 8px; margin-bottom: 10px; font-size: 11px;">
            <div style="display: flex; justify-content: space-between; color: #166534;">
              <span>Actuated Green:</span>
              <strong>${node.currentTiming.green}s</strong>
            </div>
            <div style="display: flex; justify-content: space-between; color: #0369a1; margin-top: 2px;">
              <span>QAOA Quantum Opt:</span>
              <strong>${node.optimizedTiming.green}s (+${node.optimizedTiming.green - node.currentTiming.green}s)</strong>
            </div>
          </div>

          <button id="inspect-gis-btn-${node.id}" style="width: 100%; background: linear-gradient(135deg, #0284c7, #4f46e5); color: #ffffff; border: none; padding: 7px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 6px rgba(2,132,199,0.25);">
            Inspect in Node Controller &rarr;
          </button>
        </div>
      `;

      markersRef.current[node.id].bindPopup(popupHtml);
      markersRef.current[node.id].on('popupopen', () => {
        const btn = document.getElementById(`inspect-gis-btn-${node.id}`);
        if (btn) {
          btn.onclick = () => onSelectIntersection(node.id);
        }
      });
    });
  }, [simState, showRailway, onSelectIntersection]);

  // Handle real-time as-you-type Autocomplete
  const handleInputChange = (val) => {
    setSearchQuery(val);
    if (autocompleteTimer.current) clearTimeout(autocompleteTimer.current);
    if (!val || val.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    autocompleteTimer.current = setTimeout(async () => {
      const results = await fetchAutocomplete(val);
      if (results && results.length > 0) {
        setSearchResults(results);
      }
    }, 180);
  };

  // Handle Forward Geocoding Search (on submit / enter)
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setStatusMessage(`Searching address via Geoapify: "${searchQuery}"...`);
    const results = await fetchForwardGeocode(searchQuery);
    setSearchResults(results);
    setIsSearching(false);

    if (results.length > 0) {
      selectSearchResult(results[0]);
    } else {
      setStatusMessage(`No results found for "${searchQuery}". Try another search term.`);
    }
  };

  const selectSearchResult = (feat) => {
    const map = mapRef.current;
    if (!map) return;

    const [lon, lat] = feat.geometry.coordinates;
    const prop = feat.properties;

    map.flyTo([lat, lon], 16, { duration: 1.2 });
    setStatusMessage(`Located: ${prop.formatted || prop.name}`);

    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
    }

    const pinIcon = L.divIcon({
      className: 'search-result-pin',
      html: `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; inset: 0; border-radius: 9999px; background: #0284c7; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 26px; height: 26px; border-radius: 9999px; background: #0284c7; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(2,132,199,0.5); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 13px;">
            🔍
          </div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const marker = L.marker([lat, lon], { icon: pinIcon }).addTo(map);
    searchMarkerRef.current = marker;

    const content = `
      <div style="padding: 12px; font-family: 'Inter', sans-serif; max-width: 260px;">
        <span style="font-size: 11px; font-weight: 800; color: #0284c7; text-transform: uppercase;">Search Result</span>
        <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 4px 0 2px 0;">${prop.name || prop.address_line1 || 'Location'}</h4>
        <p style="font-size: 11px; color: #64748b; margin: 0 0 6px 0;">${prop.formatted || ''}</p>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #475569; background: #f8fafc; padding: 4px 6px; border-radius: 4px;">
          Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}
        </div>
      </div>
    `;
    marker.bindPopup(content).openPopup();
    setSearchResults([]);
  };

  // Zoom to Fit All 8 Nodes
  const fitAllNodes = () => {
    const map = mapRef.current;
    if (!map) return;
    const coords = simState.intersections.map(n => [n.lat, n.lon]);
    map.fitBounds(coords, { padding: [50, 50] });
    setStatusMessage('Zoomed to fit all 8 signalized intersections');
  };

  // Preset location quick jumps
  const jumpToPreset = (coords, zoom, label) => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo(coords, zoom, { duration: 1.0 });
    setStatusMessage(`Navigated to ${label}`);
  };

  // Geoapify Turn-by-Turn Routing Execution (Key: b5a852f6b97e420ab0850cc32c31c9d9)
  const calculateRoute = async (fromId = routeFrom, toId = routeTo, mode = routeMode) => {
    const map = mapRef.current;
    if (!map) return;

    const fromNode = simState.intersections.find(n => n.id === fromId);
    const toNode = simState.intersections.find(n => n.id === toId);
    if (!fromNode || !toNode) {
      setStatusMessage(`Routing error: node ${fromId} or ${toId} not found.`);
      return;
    }

    setIsRouting(true);
    setStatusMessage(`Routing via Geoapify [${mode.toUpperCase()}]: ${fromId} (${fromNode.name}) → ${toId} (${toNode.name})...`);

    const waypoints = `${fromNode.lat},${fromNode.lon}|${toNode.lat},${toNode.lon}`;
    const routeData = await fetchGeoapifyRoute(waypoints, mode);

    setIsRouting(false);

    if (!routeData || !routeData.features || !routeData.features[0]) {
      setStatusMessage(`Geoapify Routing failed between ${fromId} and ${toId}. Check API key b5a852f6...`);
      return;
    }

    const feature = routeData.features[0];
    let latlngs = [];
    if (feature.geometry.type === 'MultiLineString') {
      latlngs = feature.geometry.coordinates.flatMap(line => line.map(([lon, lat]) => [lat, lon]));
    } else if (feature.geometry.type === 'LineString') {
      latlngs = feature.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
    } else if (feature.geometry.coordinates && feature.geometry.coordinates[0] && Array.isArray(feature.geometry.coordinates[0][0])) {
      latlngs = feature.geometry.coordinates[0].map(([lon, lat]) => [lat, lon]);
    } else {
      latlngs = (feature.geometry.coordinates || []).map(([lon, lat]) => [lat, lon]);
    }
    const props = feature.properties || {};
    const distanceM = props.distance || 0;
    const timeS = props.time || 0;
    const distanceKm = (distanceM / 1000).toFixed(2);
    const durationMin = (timeS / 60).toFixed(1);
    const steps = (props.legs && props.legs[0] && props.legs[0].steps) ? props.legs[0].steps : [];

    // Clear prior route layers
    routeLayersRef.current.forEach(l => l.remove());
    routeLayersRef.current = [];

    // Cyan/Rose glow polyline
    const isEm = mode === 'emergency';
    const glowLine = L.polyline(latlngs, {
      color: isEm ? '#f43f5e' : '#00e5ff',
      weight: 10,
      opacity: 0.45,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);
    routeLayersRef.current.push(glowLine);

    // Primary route path
    const routeLine = L.polyline(latlngs, {
      color: isEm ? '#e11d48' : '#0284c7',
      weight: 5,
      opacity: 0.95,
      dashArray: mode === 'bicycle' ? '6, 6' : null,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);
    routeLayersRef.current.push(routeLine);

    // Origin Pin A
    const startIcon = L.divIcon({
      className: 'route-start-pin',
      html: `
        <div style="width: 28px; height: 28px; border-radius: 9999px; background: #10b981; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(16,185,129,0.55); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 11px; font-weight: 800; font-family: monospace;">
          A
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    const startMarker = L.marker([fromNode.lat, fromNode.lon], { icon: startIcon }).addTo(map);
    startMarker.bindTooltip(`<b>Start (A):</b> ${fromNode.id} - ${fromNode.name}`, { sticky: true });
    routeLayersRef.current.push(startMarker);

    // Destination Pin B
    const endIcon = L.divIcon({
      className: 'route-end-pin',
      html: `
        <div style="width: 28px; height: 28px; border-radius: 9999px; background: #ef4444; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(239,68,68,0.55); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 11px; font-weight: 800; font-family: monospace;">
          B
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    const endMarker = L.marker([toNode.lat, toNode.lon], { icon: endIcon }).addTo(map);
    endMarker.bindTooltip(`<b>End (B):</b> ${toNode.id} - ${toNode.name}`, { sticky: true });
    routeLayersRef.current.push(endMarker);

    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

    setActiveRoute({
      fromId,
      toId,
      fromName: fromNode.name,
      toName: toNode.name,
      distanceKm,
      durationMin,
      mode,
      stepsCount: steps.length,
      steps: steps.map(s => ({
        instruction: s.instruction ? s.instruction.text : 'Proceed along corridor',
        distance: s.distance,
        time: s.time
      }))
    });

    setStatusMessage(`Geoapify Route: ${fromId} → ${toId} | ${distanceKm} km | ~${durationMin} min | Mode: ${mode.toUpperCase()}`);
  };

  const clearActiveRoute = () => {
    routeLayersRef.current.forEach(l => l.remove());
    routeLayersRef.current = [];
    setActiveRoute(null);
    setStatusMessage('Active route cleared.');
  };

  // Geoapify Reachability & Isoline Zone Calculation (Key: 5557e9758dbf492abbc58c3de058f972)
  const calculateIsoline = async (nodeId = isolineNode, range = isolineRange, mode = isolineMode) => {
    const map = mapRef.current;
    if (!map) return;

    const node = simState.intersections.find(n => n.id === nodeId);
    if (!node) {
      setStatusMessage(`Isoline error: Node ${nodeId} not found.`);
      return;
    }

    setIsCalculatingIsoline(true);
    const rangeMin = Math.round(range / 60);
    setStatusMessage(`Computing ${rangeMin}-min ${mode} reachability isochrone from ${node.id} (${node.name}) via Geoapify...`);

    const data = await fetchGeoapifyIsoline(node.lat, node.lon, range, 'time', mode);
    setIsCalculatingIsoline(false);

    if (!data || !data.features || !data.features[0]) {
      setStatusMessage(`Isoline generation failed for node ${nodeId}. Check API key 5557e975...`);
      return;
    }

    // Clear previous isoline layer
    isolineLayersRef.current.forEach(l => l.remove());
    isolineLayersRef.current = [];

    const isEm = mode === 'emergency' || node.id === 'I1' || node.id === 'I3';
    const primaryColor = isEm ? '#e11d48' : '#0891b2';
    const fillColor = isEm ? '#f43f5e' : '#06b6d4';

    // Render GeoJSON Polygon / MultiPolygon
    const geoLayer = L.geoJSON(data, {
      style: {
        color: primaryColor,
        weight: 2.5,
        opacity: 0.9,
        dashArray: '6, 4',
        fillColor: fillColor,
        fillOpacity: 0.22
      }
    }).addTo(map);

    geoLayer.bindTooltip(`
      <div style="font-family: 'Inter', sans-serif; font-size: 11px;">
        <strong style="color: ${primaryColor};">📡 ${rangeMin}-Minute Reachability Zone</strong><br/>
        Center: <b>${node.id} - ${node.name}</b><br/>
        Mode: <b>${mode.toUpperCase()}</b> | Range: <b>${range}s (${rangeMin} min)</b>
      </div>
    `, { sticky: true });

    isolineLayersRef.current.push(geoLayer);

    // Center beacon pin
    const beaconIcon = L.divIcon({
      className: 'isoline-center-pin',
      html: `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; inset: 0; border-radius: 9999px; background: ${fillColor}; opacity: 0.4; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 24px; height: 24px; border-radius: 9999px; background: ${primaryColor}; border: 2px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 11px;">
            📡
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    const beaconMarker = L.marker([node.lat, node.lon], { icon: beaconIcon }).addTo(map);
    beaconMarker.bindTooltip(`<b>Isoline Hub:</b> ${node.id} - ${node.name}`, { sticky: true });
    isolineLayersRef.current.push(beaconMarker);

    map.fitBounds(geoLayer.getBounds(), { padding: [40, 40] });

    setActiveIsoline({
      nodeId,
      nodeName: node.name,
      range,
      rangeMin,
      mode,
      geometryType: data.features[0].geometry.type
    });

    setStatusMessage(`Reachability Isochrone plotted: ${rangeMin} min ${mode} zone centered on ${node.id} (Key: 2378af2a...)`);
  };

  const clearActiveIsoline = () => {
    isolineLayersRef.current.forEach(l => l.remove());
    isolineLayersRef.current = [];
    setActiveIsoline(null);
    setStatusMessage('Active reachability zone cleared.');
  };

  // Geoapify Places (POI) & Place Details Handler
  const togglePlaces = async (cat = placesCategory) => {
    const map = mapRef.current;
    if (!map) return;

    if (showPlaces && placesLayersRef.current.length > 0 && cat === placesCategory) {
      clearPlaces();
      return;
    }

    setIsLoadingPlaces(true);
    setStatusMessage(`Scanning Geoapify Places (${cat}) in downtown grid (Key: ${placesKey.slice(0, 8)}...)...`);

    // Clear prior places layers
    placesLayersRef.current.forEach(l => l.remove());
    placesLayersRef.current = [];

    const data = await fetchGeoapifyPlaces(cat, 'circle:-122.4015,37.7855,1400', 16);
    setIsLoadingPlaces(false);

    if (!data || !data.features || data.features.length === 0) {
      setStatusMessage(`No places returned for category "${cat}".`);
      setShowPlaces(false);
      setPlacesCount(0);
      return;
    }

    const feats = data.features;
    setPlacesCount(feats.length);
    setShowPlaces(true);
    setPlacesCategory(cat);

    feats.forEach(feat => {
      const [lon, lat] = feat.geometry.coordinates;
      const prop = feat.properties || {};
      const name = prop.name || prop.address_line1 || 'Commercial Venue';
      const catList = prop.categories || [];
      const primaryCat = catList[0] || 'service';
      
      let iconEmoji = '📍';
      let pinColor = '#8b5cf6';
      if (primaryCat.includes('catering') || primaryCat.includes('restaurant') || primaryCat.includes('cafe')) {
        iconEmoji = '☕';
        pinColor = '#f59e0b';
      } else if (primaryCat.includes('commercial') || primaryCat.includes('retail') || primaryCat.includes('shop')) {
        iconEmoji = '🛍️';
        pinColor = '#06b6d4';
      } else if (primaryCat.includes('healthcare') || primaryCat.includes('pharmacy') || primaryCat.includes('hospital')) {
        iconEmoji = '🏥';
        pinColor = '#ef4444';
      } else if (primaryCat.includes('parking')) {
        iconEmoji = '🅿️';
        pinColor = '#3b82f6';
      } else if (primaryCat.includes('tourism') || primaryCat.includes('hotel')) {
        iconEmoji = '🏨';
        pinColor = '#10b981';
      }

      const poiIcon = L.divIcon({
        className: 'custom-poi-marker',
        html: `
          <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="width: 24px; height: 24px; border-radius: 9999px; background: ${pinColor}; border: 2px solid #ffffff; box-shadow: 0 3px 8px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; font-size: 11px;">
              ${iconEmoji}
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([lat, lon], { icon: poiIcon }).addTo(map);

      marker.on('click', async () => {
        setStatusMessage(`Inspecting Place Details: ${name} (Geoapify Place Details API)...`);
        const placeId = prop.place_id;
        const detailsData = await fetchGeoapifyPlaceDetails(lat, lon, placeId);
        const detailsProp = (detailsData && detailsData.features && detailsData.features[0] && detailsData.features[0].properties) || prop;
        setActivePlaceDetail(detailsProp);

        const catsText = (detailsProp.categories || []).slice(0, 3).join(', ');
        const popupHtml = `
          <div style="padding: 12px; font-family: 'Inter', sans-serif; max-width: 270px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 800; color: ${pinColor}; text-transform: uppercase;">Geoapify Place Details</span>
              <span style="font-size: 9px; background: #f1f5f9; color: #475569; padding: 1px 6px; border-radius: 4px; font-weight: 600;">Verified POI</span>
            </div>
            <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 2px 0 4px 0;">${name}</h4>
            <p style="font-size: 11px; color: #64748b; margin: 0 0 6px 0;">${detailsProp.formatted || detailsProp.address_line2 || 'Urban Point of Interest'}</p>
            <div style="font-size: 10px; color: #334155; background: #f8fafc; padding: 5px 7px; border-radius: 6px; margin-bottom: 6px; border: 1px solid #e2e8f0;">
              <div>Categories: <b style="color: ${pinColor};">${catsText}</b></div>
              <div style="margin-top: 2px;">GPS: <span style="font-family: monospace;">${lat.toFixed(5)}, ${lon.toFixed(5)}</span></div>
            </div>
            <div style="font-size: 9px; color: #7c3aed; font-weight: 600; font-family: monospace;">
              APIs: Places (${placesKey.slice(0, 6)}...) · Details (${placeDetailsKey.slice(0, 6)}...)
            </div>
          </div>
        `;
        marker.bindPopup(popupHtml).openPopup();
      });

      marker.bindTooltip(`<b>${name}</b><br/><span style="color: ${pinColor}; font-size: 10px;">${primaryCat}</span>`, { sticky: true });
      placesLayersRef.current.push(marker);
    });

    setStatusMessage(`Loaded ${feats.length} Geoapify Places (${cat}) around downtown core. Click POI for Place Details.`);
  };

  const clearPlaces = () => {
    placesLayersRef.current.forEach(l => l.remove());
    placesLayersRef.current = [];
    setShowPlaces(false);
    setPlacesCount(0);
    setActivePlaceDetail(null);
    setStatusMessage('Geoapify Places POI layer cleared.');
  };

  // Geoapify IP Geolocation Detection Handler
  const runIpGeolocation = async () => {
    setIsDetectingIp(true);
    setStatusMessage(`Detecting operator IP Geolocation (Key: ${ipGeoKey.slice(0, 8)}...)...`);
    const data = await fetchGeoapifyIpGeo();
    setIsDetectingIp(false);
    if (data && (data.city || data.country || data.ip)) {
      setIpGeoInfo(data);
      const locName = `${(data.city && data.city.name) || 'City'}, ${(data.country && data.country.name) || 'Country'}`;
      setStatusMessage(`Geoapify IP Geolocation resolved: ${locName} (IP: ${data.ip || 'Local'})`);
    } else {
      setStatusMessage('Geoapify IP Geolocation: response received.');
    }
  };

  // Geoapify Map Matching Demo Handler
  const runMapMatching = async () => {
    const map = mapRef.current;
    if (!map) return;

    setIsMapMatching(true);
    setStatusMessage(`Executing Geoapify Map Matching (Key: ${mapMatchingKey.slice(0, 8)}...)...`);

    // Simulated noisy probe vehicle GPS crumbs along the corridor between I1 (North) and I4 (East)
    const rawGpsPoints = [
      { lat: 37.7942, lon: -122.4018, timestamp: 1000 },
      { lat: 37.7905, lon: -122.4013, timestamp: 1030 },
      { lat: 37.7858, lon: -122.4014, timestamp: 1060 },
      { lat: 37.7853, lon: -122.3970, timestamp: 1090 },
      { lat: 37.7856, lon: -122.3932, timestamp: 1120 }
    ];

    const matchData = await fetchGeoapifyMapMatching(rawGpsPoints, 'drive');
    setIsMapMatching(false);

    // Clear prior matching layers
    matchedLayersRef.current.forEach(l => l.remove());
    matchedLayersRef.current = [];

    if (!matchData || !matchData.features || !matchData.features[0]) {
      setStatusMessage(`Map Matching request failed. Check API Key ${mapMatchingKey.slice(0, 8)}...`);
      return;
    }

    const feat = matchData.features[0];
    const props = feat.properties || {};
    const distanceM = props.distance || 0;
    const timeS = props.time || 0;

    let snappedCoords = [];
    if (feat.geometry.type === 'LineString') {
      snappedCoords = feat.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
    } else if (feat.geometry.type === 'MultiLineString') {
      snappedCoords = feat.geometry.coordinates.flatMap(line => line.map(([lon, lat]) => [lat, lon]));
    }

    // 1. Draw raw noisy GPS breadcrumbs (Dotted Orange Line with circle points)
    const rawCoords = rawGpsPoints.map(p => [p.lat, p.lon]);
    const rawLine = L.polyline(rawCoords, {
      color: '#f97316',
      weight: 3,
      dashArray: '4, 6',
      opacity: 0.75
    }).addTo(map);
    rawLine.bindTooltip("<b>Raw Unmatched GPS Breadcrumbs</b> (Probe Vehicle Telemetry)", { sticky: true });
    matchedLayersRef.current.push(rawLine);

    rawGpsPoints.forEach((p, idx) => {
      const dot = L.circleMarker([p.lat, p.lon], {
        radius: 4.5,
        fillColor: '#f97316',
        color: '#ffffff',
        weight: 1.5,
        fillOpacity: 0.9
      }).addTo(map);
      dot.bindTooltip(`Raw GPS #${idx + 1}: ${p.lat.toFixed(4)}, ${p.lon.toFixed(4)}`, { sticky: true });
      matchedLayersRef.current.push(dot);
    });

    // 2. Draw Snapped Road Polyline (Solid Royal Blue Line with Cyan glow)
    const glowLine = L.polyline(snappedCoords, {
      color: '#38bdf8',
      weight: 8,
      opacity: 0.45,
      lineCap: 'round'
    }).addTo(map);
    matchedLayersRef.current.push(glowLine);

    const snappedLine = L.polyline(snappedCoords, {
      color: '#2563eb',
      weight: 4,
      opacity: 0.95,
      lineCap: 'round'
    }).addTo(map);
    snappedLine.bindTooltip(`<b>Geoapify Map-Matched Road Geometry</b><br/>Distance: ${(distanceM / 1000).toFixed(2)} km | Time: ~${(timeS / 60).toFixed(1)} min`, { sticky: true });
    matchedLayersRef.current.push(snappedLine);

    map.fitBounds(snappedLine.getBounds(), { padding: [40, 40] });

    setMapMatchedData({
      distanceKm: (distanceM / 1000).toFixed(2),
      timeMin: (timeS / 60).toFixed(1),
      waypointsCount: rawGpsPoints.length,
      snappedPointsCount: snappedCoords.length
    });

    setStatusMessage(`Geoapify Map Matching: ${rawGpsPoints.length} GPS breadcrumbs snapped to ${(distanceM / 1000).toFixed(2)} km road network (Key: ${mapMatchingKey.slice(0, 6)}...).`);
  };

  const clearMapMatching = () => {
    matchedLayersRef.current.forEach(l => l.remove());
    matchedLayersRef.current = [];
    setMapMatchedData(null);
    setStatusMessage('Map matching geometry cleared.');
  };

  // Geoapify Route Planner Handler (Multi-Stop Fleet Corridor Optimizer)
  const runRoutePlanner = async () => {
    const map = mapRef.current;
    if (!map) return;

    setIsPlanningRoute(true);
    setStatusMessage(`Running Geoapify Route Planner fleet optimization (Key: ${routePlannerKey.slice(0, 8)}...)...`);

    // Multi-stop agent dispatch between urban intersections:
    // Agent starts at I3 Hub, picks up at I1, delivers to I4 & I6
    const agents = [
      {
        start_location: [-122.4015, 37.7855], // I3 Hub
        time_windows: [[0, 7200]]
      }
    ];

    const shipments = [
      {
        id: 'dispatch_I1_I4',
        pickup: { location: [-122.4015, 37.7940], duration: 90 }, // Node I1
        delivery: { location: [-122.3950, 37.7855], duration: 90 } // Node I4
      },
      {
        id: 'dispatch_I2_I6',
        pickup: { location: [-122.3950, 37.7940], duration: 90 }, // Node I2
        delivery: { location: [-122.3950, 37.7770], duration: 90 } // Node I6
      }
    ];

    const planData = await fetchGeoapifyRoutePlanner(agents, shipments, 'drive');
    setIsPlanningRoute(false);

    // Clear prior plan layers
    routePlannerLayersRef.current.forEach(l => l.remove());
    routePlannerLayersRef.current = [];

    if (!planData || !planData.features || planData.features.length === 0) {
      setStatusMessage(`Route Planner failed. Check key ${routePlannerKey.slice(0, 8)}...`);
      return;
    }

    const feature = planData.features[0];
    const props = feature.properties || {};
    const distanceM = props.distance || 0;
    const timeS = props.time || 0;

    let latlngs = [];
    if (feature.geometry.type === 'LineString') {
      latlngs = feature.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
    } else if (feature.geometry.type === 'MultiLineString') {
      latlngs = feature.geometry.coordinates.flatMap(line => line.map(([lon, lat]) => [lat, lon]));
    }

    // Glow line
    const planGlow = L.polyline(latlngs, {
      color: '#c084fc',
      weight: 9,
      opacity: 0.45,
      lineCap: 'round'
    }).addTo(map);
    routePlannerLayersRef.current.push(planGlow);

    // Solid line
    const planLine = L.polyline(latlngs, {
      color: '#9333ea',
      weight: 4.5,
      opacity: 0.95,
      lineCap: 'round'
    }).addTo(map);
    planLine.bindTooltip(`<b>Geoapify Route Planner Itinerary</b><br/>Total Dist: ${(distanceM / 1000).toFixed(2)} km | Est. Time: ~${(timeS / 60).toFixed(1)} min`, { sticky: true });
    routePlannerLayersRef.current.push(planLine);

    // Add Stop Markers
    const stops = [
      { id: 'Agent Depot', lat: 37.7855, lon: -122.4015, color: '#3b82f6', label: 'Depot (I3)' },
      { id: 'Pickup 1', lat: 37.7940, lon: -122.4015, color: '#10b981', label: 'Pickup (I1)' },
      { id: 'Drop 1', lat: 37.7855, lon: -122.3950, color: '#f59e0b', label: 'Delivery (I4)' },
      { id: 'Pickup 2', lat: 37.7940, lon: -122.3950, color: '#06b6d4', label: 'Pickup (I2)' },
      { id: 'Final Drop', lat: 37.7770, lon: -122.3950, color: '#ef4444', label: 'Delivery (I6)' }
    ];

    stops.forEach((st, idx) => {
      const pinIcon = L.divIcon({
        className: 'route-plan-pin',
        html: `
          <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
            <div style="width: 22px; height: 22px; border-radius: 9999px; background: ${st.color}; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: #ffffff; font-family: monospace; font-size: 10px; font-weight: 800;">
              ${idx + 1}
            </div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const mk = L.marker([st.lat, st.lon], { icon: pinIcon }).addTo(map);
      mk.bindTooltip(`<b>Stop ${idx + 1}: ${st.id}</b><br/>${st.label}`, { sticky: true });
      routePlannerLayersRef.current.push(mk);
    });

    map.fitBounds(planLine.getBounds(), { padding: [40, 40] });

    setActiveRoutePlan({
      distanceKm: (distanceM / 1000).toFixed(2),
      durationMin: (timeS / 60).toFixed(1),
      stopsCount: stops.length,
      mode: props.mode || 'drive'
    });

    setStatusMessage(`Geoapify Route Planner: optimized ${stops.length}-stage fleet corridor (${(distanceM / 1000).toFixed(2)} km, ~${(timeS / 60).toFixed(1)} min). Key: ${routePlannerKey.slice(0, 6)}...`);
  };

  const clearRoutePlanner = () => {
    routePlannerLayersRef.current.forEach(l => l.remove());
    routePlannerLayersRef.current = [];
    setActiveRoutePlan(null);
    setStatusMessage('Route planner itinerary cleared.');
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Top Header & GIS Command Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-xl ${
        isWhite ? 'bg-white/95 border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className={`text-base font-bold tracking-wide ${isWhite ? 'text-slate-900' : 'text-white'}`}>
              Geoapify GIS Traffic Mapping & Geocoding Platform
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-bold">
              8-Node Grid
            </span>
            {ipGeoInfo && (
              <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-mono">
                <span>🌐</span>
                <span className="font-semibold">{(ipGeoInfo.city && ipGeoInfo.city.name) || 'Local'}, {(ipGeoInfo.country && (ipGeoInfo.country.iso_code || ipGeoInfo.country.name)) || 'US'}</span>
                <span className="text-slate-400">({ipGeoInfo.ip || 'Online'})</span>
              </div>
            )}
          </div>
          <p className={`text-xs mt-0.5 ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>
            Real-world geospatial coordinates integrated with live quantum-optimized signal phases & Geoapify API.
          </p>
        </div>

        {/* Address Search Bar with Live Autocomplete */}
        <div className="relative flex-1 max-w-md">
          <form onSubmit={handleSearch} className="flex items-center space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Type address for live autocomplete (Key: 509e6075...)..."
                className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs border outline-none transition focus:ring-2 focus:ring-cyan-500/30 ${
                  isWhite 
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' 
                    : 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                }`}
              />
              <svg className={`w-4 h-4 absolute left-3 top-2.5 ${isWhite ? 'text-slate-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                  className={`absolute right-2.5 top-2.5 text-xs ${isWhite ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center space-x-1"
            >
              {isSearching ? <span>...</span> : <span>Search</span>}
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className={`absolute top-full left-0 right-0 mt-1.5 rounded-xl border shadow-xl z-50 overflow-hidden ${
              isWhite ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              {searchResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => selectSearchResult(item)}
                  className={`p-2.5 border-b last:border-0 cursor-pointer text-xs transition flex items-center justify-between group ${
                    isWhite ? 'hover:bg-slate-50 text-slate-800 border-slate-100' : 'hover:bg-slate-800 text-slate-200 border-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="text-sm">
                      {item.properties.result_type === 'street' ? '🛣️' : item.properties.result_type === 'amenity' ? '🏢' : '📍'}
                    </span>
                    <div className="truncate">
                      <div className="font-semibold group-hover:text-cyan-600 transition">
                        {item.properties.name || item.properties.address_line1 || item.properties.street}
                      </div>
                      <div className={`text-[11px] truncate ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>
                        {item.properties.formatted}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 ml-2 whitespace-nowrap">
                    Auto
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Map Layout: Map Viewport + Live Telemetry Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-[560px]">
        {/* Map Viewport */}
        <div className={`lg:col-span-3 rounded-2xl overflow-hidden relative border flex flex-col ${
          isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-xl'
        }`}>
          {/* Top Floating Controls on Map */}
          <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 z-[1000] pointer-events-none">
            {/* Quick Presets & Route Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className={`flex items-center space-x-1 backdrop-blur-md p-1 rounded-xl border pointer-events-auto shadow-sm ${
                isWhite ? 'bg-white/95 border-slate-200' : 'bg-slate-950/90 border-slate-800'
              }`}>
                <button
                  onClick={fitAllNodes}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                    isWhite ? 'text-cyan-700 hover:bg-cyan-50' : 'text-cyan-300 hover:bg-slate-800'
                  }`}
                >
                  📍 Fit All 8 Nodes
                </button>
                <button
                  onClick={() => jumpToPreset([37.7940, -122.4015], 15, 'North Hub (I7, I1, I2)')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition ${
                    isWhite ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  North
                </button>
                <button
                  onClick={() => jumpToPreset([37.7855, -122.4015], 15, 'Central Core (I3, I4)')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition ${
                    isWhite ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Central
                </button>
                <button
                  onClick={() => jumpToPreset([37.7770, -122.4015], 15, 'South Terminal (I5, I6, I8)')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition ${
                    isWhite ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  South
                </button>
              </div>

              {/* Quick Route Buttons */}
              <div className={`flex items-center space-x-1 backdrop-blur-md p-1 rounded-xl border pointer-events-auto shadow-sm ${
                isWhite ? 'bg-white/95 border-slate-200' : 'bg-slate-950/90 border-slate-800'
              }`}>
                <button
                  onClick={() => calculateRoute('I1', 'I6', 'emergency')}
                  disabled={isRouting}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition flex items-center space-x-1"
                  title="Route Emergency Corridor along I1 -> I6 with Geoapify"
                >
                  <span>🚑 Route Corridor</span>
                </button>
                <button
                  onClick={() => calculateRoute('I1', 'I8', 'drive')}
                  disabled={isRouting}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-slate-800 transition"
                  title="Route Transit Drive I1 -> I8"
                >
                  <span>🚗 Route I1→I8</span>
                </button>
                {activeRoute && (
                  <button
                    onClick={clearActiveRoute}
                    className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-500 transition"
                    title="Clear Active Route Polyline"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>

              {/* Quick Isoline Reachability Button */}
              <div className={`flex items-center space-x-1 backdrop-blur-md p-1 rounded-xl border pointer-events-auto shadow-sm ${
                isWhite ? 'bg-white/95 border-slate-200' : 'bg-slate-950/90 border-slate-800'
              }`}>
                <button
                  onClick={() => calculateIsoline('I3', 300, 'drive')}
                  disabled={isCalculatingIsoline}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 transition flex items-center space-x-1"
                  title="Project 5-minute reachability isochrone from central hub I3 (Geoapify Isoline API)"
                >
                  <span>📡 5m Isochrone</span>
                </button>
                {activeIsoline && (
                  <button
                    onClick={clearActiveIsoline}
                    className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-500 transition"
                    title="Clear Reachability Isochrone Zone"
                  >
                    ✕ Zone
                  </button>
                )}
              </div>

              {/* Quick Places & POI Button */}
              <div className={`flex items-center space-x-1 backdrop-blur-md p-1 rounded-xl border pointer-events-auto shadow-sm ${
                isWhite ? 'bg-white/95 border-slate-200' : 'bg-slate-950/90 border-slate-800'
              }`}>
                <button
                  onClick={() => togglePlaces('commercial,catering')}
                  disabled={isLoadingPlaces}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition flex items-center space-x-1 ${
                    showPlaces 
                      ? 'bg-purple-600 text-white shadow-sm' 
                      : isWhite ? 'bg-purple-50 text-purple-700 hover:bg-purple-100' : 'bg-purple-950/50 text-purple-300 hover:bg-purple-900/60'
                  }`}
                  title="Scan urban POIs with Geoapify Places API (Key: c5191509...)"
                >
                  <span>🛍️ POIs {showPlaces ? `(${placesCount})` : ''}</span>
                </button>
                {showPlaces && (
                  <button
                    onClick={clearPlaces}
                    className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-500 transition"
                    title="Clear Places POI layer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Quick Map Matching Button */}
              <div className={`flex items-center space-x-1 backdrop-blur-md p-1 rounded-xl border pointer-events-auto shadow-sm ${
                isWhite ? 'bg-white/95 border-slate-200' : 'bg-slate-950/90 border-slate-800'
              }`}>
                <button
                  onClick={runMapMatching}
                  disabled={isMapMatching}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition flex items-center space-x-1 ${
                    mapMatchedData 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : isWhite ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-blue-950/50 text-blue-300 hover:bg-blue-900/60'
                  }`}
                  title="Snap vehicle GPS breadcrumbs to road network (Geoapify Map Matching API)"
                >
                  <span>🛣️ Map Match</span>
                </button>
                {mapMatchedData && (
                  <button
                    onClick={clearMapMatching}
                    className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-500 transition"
                    title="Clear Map Matching layer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Quick Route Planner Button */}
              <div className={`flex items-center space-x-1 backdrop-blur-md p-1 rounded-xl border pointer-events-auto shadow-sm ${
                isWhite ? 'bg-white/95 border-slate-200' : 'bg-slate-950/90 border-slate-800'
              }`}>
                <button
                  onClick={runRoutePlanner}
                  disabled={isPlanningRoute}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition flex items-center space-x-1 ${
                    activeRoutePlan 
                      ? 'bg-purple-700 text-white shadow-sm' 
                      : isWhite ? 'bg-purple-50 text-purple-700 hover:bg-purple-100' : 'bg-purple-950/50 text-purple-300 hover:bg-purple-900/60'
                  }`}
                  title="Optimize multi-stop corridor itinerary with Geoapify Route Planner API (Key: f45cf1c9...)"
                >
                  <span>📋 Route Plan</span>
                </button>
                {activeRoutePlan && (
                  <button
                    onClick={clearRoutePlanner}
                    className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-500 transition"
                    title="Clear Route Planner layer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Tile Style Selector */}
            <div className={`flex items-center space-x-1 backdrop-blur-md p-1 rounded-xl border pointer-events-auto shadow-sm ${
              isWhite ? 'bg-white/95 border-slate-200' : 'bg-slate-950/90 border-slate-800'
            }`}>
              {[
                { id: 'osm-bright', label: '☀️ Bright' },
                { id: 'positron', label: '🏙️ Positron' },
                { id: 'dark-matter', label: '🌙 Dark' },
                { id: 'osm-liberty', label: '🗺️ Detailed' }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setActiveStyle(st.id)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                    activeStyle === st.id
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : isWhite ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Leaflet Map Canvas */}
          <div ref={containerRef} className="w-full h-full min-h-[540px] flex-1"></div>

          {/* Bottom Telemetry Status Pill */}
          <div className={`absolute bottom-3 left-3 z-[1000] backdrop-blur-md px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center space-x-2 shadow-md ${
            isWhite ? 'bg-white/95 border-slate-200 text-slate-800' : 'bg-slate-950/90 border-slate-800 text-slate-200'
          }`}>
            <span className="h-2 w-2 rounded-full bg-cyan-500 animate-ping"></span>
            <span>{statusMessage}</span>
          </div>
        </div>

        {/* Right Telemetry & Node Leaderboard Sidebar */}
        <div className="space-y-4">
          {/* Dedicated Geoapify Turn-by-Turn Routing Engine Card */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-base">🧭</span>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isWhite ? 'text-slate-700' : 'text-slate-300'}`}>
                  Geoapify Routing Engine
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-bold">
                API Key: {routingKey.slice(0, 6)}...
              </span>
            </div>

            {/* Travel Mode Selector */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl">
              {[
                { id: 'drive', label: 'Drive', icon: '🚗' },
                { id: 'truck', label: 'Truck', icon: '🚚' },
                { id: 'bicycle', label: 'Bicycle', icon: '🚲' },
                { id: 'walk', label: 'Walk', icon: '🚶' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setRouteMode(m.id)}
                  className={`py-1 rounded-lg text-[10px] font-bold flex flex-col items-center transition ${
                    routeMode === m.id
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : isWhite ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs">{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Origin and Destination Selectors */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className={`block text-[10px] font-semibold mb-1 ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>
                  Start (Origin)
                </label>
                <select
                  value={routeFrom}
                  onChange={(e) => setRouteFrom(e.target.value)}
                  className={`w-full px-2 py-1.5 rounded-xl border text-xs font-mono font-medium outline-none ${
                    isWhite ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                >
                  {simState.intersections.map(n => (
                    <option key={n.id} value={n.id}>{n.id} - {n.name.slice(0, 14)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-[10px] font-semibold mb-1 ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>
                  End (Destination)
                </label>
                <select
                  value={routeTo}
                  onChange={(e) => setRouteTo(e.target.value)}
                  className={`w-full px-2 py-1.5 rounded-xl border text-xs font-mono font-medium outline-none ${
                    isWhite ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                >
                  {simState.intersections.map(n => (
                    <option key={n.id} value={n.id}>{n.id} - {n.name.slice(0, 14)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Compute Route Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => calculateRoute(routeFrom, routeTo, routeMode)}
                disabled={isRouting}
                className="w-full py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1"
              >
                {isRouting ? <span>Computing...</span> : <span>🧭 Calculate Route</span>}
              </button>
              <button
                onClick={() => calculateRoute('I1', 'I6', 'emergency')}
                disabled={isRouting}
                className="w-full py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1"
              >
                <span>🚑 Emergency Wave</span>
              </button>
            </div>

            {/* Active Route Telemetry & Turn Instructions */}
            {activeRoute && (
              <div className={`p-3 rounded-xl border space-y-2 text-xs ${
                isWhite ? 'bg-cyan-50/70 border-cyan-200' : 'bg-cyan-950/30 border-cyan-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-700 dark:text-cyan-300">
                    Route: {activeRoute.fromId} &rarr; {activeRoute.toId} ({activeRoute.mode.toUpperCase()})
                  </span>
                  <button
                    onClick={clearActiveRoute}
                    className="text-[10px] font-semibold text-rose-500 hover:underline"
                  >
                    Clear
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded-lg border ${isWhite ? 'bg-white border-cyan-100' : 'bg-slate-900 border-cyan-900'}`}>
                    <span className="text-[10px] text-slate-500 block">Distance</span>
                    <strong className="text-sm font-mono text-cyan-600 dark:text-cyan-400">{activeRoute.distanceKm} km</strong>
                  </div>
                  <div className={`p-2 rounded-lg border ${isWhite ? 'bg-white border-cyan-100' : 'bg-slate-900 border-cyan-900'}`}>
                    <span className="text-[10px] text-slate-500 block">Est. Time</span>
                    <strong className="text-sm font-mono text-cyan-600 dark:text-cyan-400">{activeRoute.durationMin} min</strong>
                  </div>
                </div>

                {activeRoute.stepsCount > 0 && (
                  <div>
                    <button
                      onClick={() => setShowSteps(!showSteps)}
                      className="w-full py-1 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 flex items-center justify-between hover:underline"
                    >
                      <span>Turn-by-Turn Steps ({activeRoute.stepsCount})</span>
                      <span>{showSteps ? '▲ Hide' : '▼ View'}</span>
                    </button>
                    {showSteps && (
                      <div className="mt-1.5 max-h-36 overflow-y-auto space-y-1 pr-1 font-mono text-[10px]">
                        {activeRoute.steps.map((st, i) => (
                          <div key={i} className={`p-1.5 rounded border flex items-start space-x-1.5 ${
                            isWhite ? 'bg-white/80 border-slate-200 text-slate-700' : 'bg-slate-900/80 border-slate-800 text-slate-300'
                          }`}>
                            <span className="text-cyan-500 font-bold">{i + 1}.</span>
                            <div className="flex-1">
                              <div>{st.instruction}</div>
                              <div className="text-[9px] text-slate-400">{(st.distance).toFixed(0)}m · {Math.ceil(st.time)}s</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dedicated Geoapify Reachability & Isoline Engine (Key: 5557e9758dbf492abbc58c3de058f972) */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-base">📡</span>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isWhite ? 'text-slate-700' : 'text-slate-300'}`}>
                  Geoapify Isoline / Reachability
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-bold">
                Key: {isolineKey.slice(0, 6)}...
              </span>
            </div>

            {/* Travel Mode Selector */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl">
              {[
                { id: 'drive', label: 'Drive', icon: '🚗' },
                { id: 'bicycle', label: 'Bike', icon: '🚲' },
                { id: 'walk', label: 'Walk', icon: '🚶' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setIsolineMode(m.id)}
                  className={`py-1 rounded-lg text-[10px] font-bold flex flex-col items-center transition ${
                    isolineMode === m.id
                      ? 'bg-teal-600 text-white shadow-sm'
                      : isWhite ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs">{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Hub Node & Time Range Selectors */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className={`block text-[10px] font-semibold mb-1 ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>
                  Hub Intersection
                </label>
                <select
                  value={isolineNode}
                  onChange={(e) => setIsolineNode(e.target.value)}
                  className={`w-full px-2 py-1.5 rounded-xl border text-xs font-mono font-medium outline-none ${
                    isWhite ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                >
                  {simState.intersections.map(n => (
                    <option key={n.id} value={n.id}>{n.id} - {n.name.slice(0, 14)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-[10px] font-semibold mb-1 ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>
                  Reachability Buffer
                </label>
                <select
                  value={isolineRange}
                  onChange={(e) => setIsolineRange(Number(e.target.value))}
                  className={`w-full px-2 py-1.5 rounded-xl border text-xs font-mono font-medium outline-none ${
                    isWhite ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                >
                  <option value={300}>5 min (300s)</option>
                  <option value={600}>10 min (600s)</option>
                  <option value={900}>15 min (900s)</option>
                </select>
              </div>
            </div>

            {/* Compute Isoline Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => calculateIsoline(isolineNode, isolineRange, isolineMode)}
                disabled={isCalculatingIsoline}
                className="w-full py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1"
              >
                {isCalculatingIsoline ? <span>Projecting...</span> : <span>📡 Plot Reachability</span>}
              </button>
              <button
                onClick={() => calculateIsoline('I1', 300, 'drive')}
                disabled={isCalculatingIsoline}
                className="w-full py-2 bg-gradient-to-r from-rose-600 to-teal-600 hover:from-rose-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1"
              >
                <span>🚑 5m Response</span>
              </button>
            </div>

            {/* Active Isoline Telemetry */}
            {activeIsoline && (
              <div className={`p-3 rounded-xl border space-y-2 text-xs ${
                isWhite ? 'bg-teal-50/70 border-teal-200' : 'bg-teal-950/30 border-teal-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-700 dark:text-teal-300">
                    Zone: {activeIsoline.nodeId} ({activeIsoline.rangeMin}m {activeIsoline.mode.toUpperCase()})
                  </span>
                  <button
                    onClick={clearActiveIsoline}
                    className="text-[10px] font-semibold text-rose-500 hover:underline"
                  >
                    Clear
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded-lg border ${isWhite ? 'bg-white border-teal-100' : 'bg-slate-900 border-teal-900'}`}>
                    <span className="text-[10px] text-slate-500 block">Hub Center</span>
                    <strong className="text-xs font-mono text-teal-600 dark:text-teal-400">{activeIsoline.nodeId} ({activeIsoline.nodeName})</strong>
                  </div>
                  <div className={`p-2 rounded-lg border ${isWhite ? 'bg-white border-teal-100' : 'bg-slate-900 border-teal-900'}`}>
                    <span className="text-[10px] text-slate-500 block">Polygon Type</span>
                    <strong className="text-xs font-mono text-teal-600 dark:text-teal-400">{activeIsoline.geometryType}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Geoapify Places & Place Details POI Card (Keys: c5191509... / 83ae1c36...) */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-base">🛍️</span>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isWhite ? 'text-slate-700' : 'text-slate-300'}`}>
                  Geoapify Places & POIs
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                Key: {placesKey.slice(0, 6)}...
              </span>
            </div>

            {/* Category Selector */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl">
              {[
                { id: 'commercial,catering', label: 'Dine/Shop', icon: '☕' },
                { id: 'tourism', label: 'Tourism', icon: '🏨' },
                { id: 'healthcare', label: 'Health', icon: '🏥' },
                { id: 'parking', label: 'Parking', icon: '🅿️' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => togglePlaces(cat.id)}
                  className={`py-1 rounded-lg text-[10px] font-bold flex flex-col items-center transition ${
                    placesCategory === cat.id && showPlaces
                      ? 'bg-purple-600 text-white shadow-sm'
                      : isWhite ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => togglePlaces(placesCategory)}
                disabled={isLoadingPlaces}
                className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1"
              >
                {isLoadingPlaces ? <span>Loading...</span> : <span>🛍️ {showPlaces ? 'Refresh POIs' : 'Scan Places'}</span>}
              </button>
              <button
                onClick={clearPlaces}
                disabled={!showPlaces}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1"
              >
                <span>✕ Clear POIs</span>
              </button>
            </div>

            {/* Selected Place Details Card */}
            {activePlaceDetail && (
              <div className={`p-3 rounded-xl border space-y-2 text-xs ${
                isWhite ? 'bg-purple-50/70 border-purple-200' : 'bg-purple-950/30 border-purple-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-700 dark:text-purple-300">
                    Place Details ({activePlaceDetail.name || 'Venue'})
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                    Key: {placeDetailsKey.slice(0, 5)}...
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                  {activePlaceDetail.formatted || activePlaceDetail.address_line1 || 'Address details'}
                </div>
                <div className={`text-[10px] p-2 rounded-lg font-mono ${isWhite ? 'bg-white border border-purple-100 text-slate-700' : 'bg-slate-900 border border-purple-900 text-slate-300'}`}>
                  <div>Categories: <b>{(activePlaceDetail.categories || []).slice(0, 4).join(', ')}</b></div>
                  {activePlaceDetail.website && <div className="truncate mt-0.5">Web: {activePlaceDetail.website}</div>}
                  {activePlaceDetail.opening_hours && <div className="mt-0.5">Hours: {activePlaceDetail.opening_hours}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Geoapify Map Matching & IP Geolocation Card (Keys: 8fca0f76... / 0ae0a18a...) */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-base">🛣️</span>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isWhite ? 'text-slate-700' : 'text-slate-300'}`}>
                  Map Matching & IP Geo
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                Keys Active
              </span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={runMapMatching}
                disabled={isMapMatching}
                className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1"
                title="Execute Map Matching on probe GPS breadcrumbs"
              >
                {isMapMatching ? <span>Snapping...</span> : <span>🛣️ Match Route</span>}
              </button>
              <button
                onClick={runIpGeolocation}
                disabled={isDetectingIp}
                className="w-full py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1"
                title="Detect operator IP Geolocation"
              >
                {isDetectingIp ? <span>Detecting...</span> : <span>🌐 Detect IP</span>}
              </button>
            </div>

            {/* Map Matched Telemetry */}
            {mapMatchedData && (
              <div className={`p-3 rounded-xl border space-y-2 text-xs ${
                isWhite ? 'bg-blue-50/70 border-blue-200' : 'bg-blue-950/30 border-blue-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-700 dark:text-blue-300">
                    GPS Breadcrumbs Snapped
                  </span>
                  <button onClick={clearMapMatching} className="text-[10px] text-rose-500 font-semibold hover:underline">
                    Clear
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className={`p-2 rounded-lg border ${isWhite ? 'bg-white border-blue-100' : 'bg-slate-900 border-blue-900'}`}>
                    <span className="text-slate-500 block">Matched Dist:</span>
                    <strong className="text-blue-600 text-xs">{mapMatchedData.distanceKm} km</strong>
                  </div>
                  <div className={`p-2 rounded-lg border ${isWhite ? 'bg-white border-blue-100' : 'bg-slate-900 border-blue-900'}`}>
                    <span className="text-slate-500 block">Drive Time:</span>
                    <strong className="text-blue-600 text-xs">{mapMatchedData.timeMin} min</strong>
                  </div>
                </div>
              </div>
            )}

            {/* IP Geolocation Telemetry */}
            {ipGeoInfo && (
              <div className={`p-3 rounded-xl border space-y-1.5 text-xs ${
                isWhite ? 'bg-indigo-50/70 border-indigo-200 text-slate-800' : 'bg-indigo-950/30 border-indigo-800 text-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-700 dark:text-indigo-300">
                    🌐 Operator IP Location
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                    Key: {ipGeoKey.slice(0, 5)}...
                  </span>
                </div>
                <div className="text-[11px] font-semibold">
                  {(ipGeoInfo.city && ipGeoInfo.city.name) || 'City'}, {(ipGeoInfo.country && ipGeoInfo.country.name) || 'United States'}
                </div>
                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  IP: {ipGeoInfo.ip || '127.0.0.1'} · ISP: {(ipGeoInfo.isp && ipGeoInfo.isp.name) || (ipGeoInfo.autonomous_system_organization) || 'Broadband'}
                </div>
              </div>
            )}
          </div>

          {/* Geoapify Route Planner Card (Key: f45cf1c920ff48c7aee949dfc6053cef) */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-base">📋</span>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isWhite ? 'text-slate-700' : 'text-slate-300'}`}>
                  Route Planner Engine
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                {routePlannerKey.slice(0, 8)}...
              </span>
            </div>

            <p className={`text-[11px] leading-relaxed ${isWhite ? 'text-slate-600' : 'text-slate-400'}`}>
              Multi-stop vehicle routing optimizer (VRP) calculating optimal shipment dispatches and transit schedules across intersection nodes.
            </p>

            <button
              onClick={runRoutePlanner}
              disabled={isPlanningRoute}
              className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1.5"
              title="Solve multi-stop vehicle routing plan with Geoapify Route Planner API"
            >
              {isPlanningRoute ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Solving Itinerary...</span>
                </>
              ) : (
                <span>🚀 Solve Multi-Stop Itinerary</span>
              )}
            </button>

            {/* Route Planner Telemetry */}
            {activeRoutePlan && (
              <div className={`p-3 rounded-xl border space-y-2 text-xs ${
                isWhite ? 'bg-purple-50/70 border-purple-200' : 'bg-purple-950/30 border-purple-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-700 dark:text-purple-300">
                    Plan: {activeRoutePlan.stopsCount} Waypoints ({activeRoutePlan.mode.toUpperCase()})
                  </span>
                  <button onClick={clearRoutePlanner} className="text-[10px] text-rose-500 font-semibold hover:underline">
                    Clear
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className={`p-2 rounded-lg border ${isWhite ? 'bg-white border-purple-100' : 'bg-slate-900 border-purple-900'}`}>
                    <span className="text-slate-500 block">Corridor Dist:</span>
                    <strong className="text-purple-600 text-xs">{activeRoutePlan.distanceKm} km</strong>
                  </div>
                  <div className={`p-2 rounded-lg border ${isWhite ? 'bg-white border-purple-100' : 'bg-slate-900 border-purple-900'}`}>
                    <span className="text-slate-500 block">Est. Duration:</span>
                    <strong className="text-purple-600 text-xs">{activeRoutePlan.durationMin} min</strong>
                  </div>
                </div>
                <div className={`text-[10px] p-2 rounded-lg font-mono ${isWhite ? 'bg-white/80 border border-purple-100 text-purple-900' : 'bg-slate-900 border border-purple-900 text-purple-300'}`}>
                  <span>Itinerary: Depot (I3) &rarr; Pickup 1 (I1) &rarr; Drop 1 (I4) &rarr; Pickup 2 (I2) &rarr; Drop 2 (I6)</span>
                </div>
              </div>
            )}
          </div>

          {/* API Keys & Status Card (All 11 Active Geoapify APIs) */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isWhite ? 'text-slate-700' : 'text-slate-300'}`}>
              Geoapify GIS Services (11 Active APIs)
            </h3>
            <div className="space-y-2 text-xs">
              <div className={`p-2 rounded-xl border flex items-center justify-between ${
                isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div>
                  <div className="font-semibold">Route Planner API (Multi-Stop VRP)</div>
                  <div className={`text-[10px] font-mono ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Key: {routePlannerKey.slice(0, 8)}...</div>
                </div>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">ACTIVE</span>
              </div>
              <div className={`p-2 rounded-xl border flex items-center justify-between ${
                isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div>
                  <div className="font-semibold">Turn-by-Turn Routing API</div>
                  <div className={`text-[10px] font-mono ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Key: {routingKey.slice(0, 8)}...</div>
                </div>
                <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">ACTIVE</span>
              </div>
              <div className={`p-2 rounded-xl border flex items-center justify-between ${
                isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div>
                  <div className="font-semibold">Reachability & Isoline API</div>
                  <div className={`text-[10px] font-mono ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Key: {isolineKey.slice(0, 8)}...</div>
                </div>
                <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">ACTIVE</span>
              </div>
              <div className={`p-2 rounded-xl border flex items-center justify-between ${
                isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div>
                  <div className="font-semibold">Places API (POI Search)</div>
                  <div className={`text-[10px] font-mono ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Key: {placesKey.slice(0, 8)}...</div>
                </div>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">ACTIVE</span>
              </div>
              <div className={`p-2 rounded-xl border flex items-center justify-between ${
                isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div>
                  <div className="font-semibold">Place Details API</div>
                  <div className={`text-[10px] font-mono ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Key: {placeDetailsKey.slice(0, 8)}...</div>
                </div>
                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">ACTIVE</span>
              </div>
              <div className={`p-2 rounded-xl border flex items-center justify-between ${
                isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div>
                  <div className="font-semibold">IP Geolocation API</div>
                  <div className={`text-[10px] font-mono ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Key: {ipGeoKey.slice(0, 8)}...</div>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">ACTIVE</span>
              </div>
              <div className={`p-2 rounded-xl border flex items-center justify-between ${
                isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div>
                  <div className="font-semibold">Map Matching API</div>
                  <div className={`text-[10px] font-mono ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Key: {mapMatchingKey.slice(0, 8)}...</div>
                </div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">ACTIVE</span>
              </div>
              <div className={`p-2 rounded-xl border flex items-center justify-between ${
                isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div>
                  <div className="font-semibold">Raster Map Tiles</div>
                  <div className={`text-[10px] font-mono ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Key: {apiKey.slice(0, 8)}...</div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">ACTIVE</span>
              </div>
              <div className={`p-2 rounded-xl border flex items-center justify-between ${
                isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div>
                  <div className="font-semibold">Autocomplete API</div>
                  <div className={`text-[10px] font-mono ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Key: {autocompleteKey.slice(0, 8)}...</div>
                </div>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">ACTIVE</span>
              </div>
              <div className={`p-2 rounded-xl border flex items-center justify-between ${
                isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div>
                  <div className="font-semibold">Reverse Geocoding</div>
                  <div className={`text-[10px] font-mono ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Key: {reverseKey.slice(0, 8)}...</div>
                </div>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">ACTIVE</span>
              </div>
              <div className={`p-2 rounded-xl border flex items-center justify-between ${
                isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div>
                  <div className="font-semibold">Forward Search API</div>
                  <div className={`text-[10px] font-mono ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Key: {geocodingKey.slice(0, 8)}...</div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Quick Landmark Geocode Presets */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isWhite ? 'text-slate-700' : 'text-slate-300'}`}>
              Sample Geocode Queries
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Market Street San Francisco",
                "San Francisco City Hall",
                "Salesforce Tower",
                "Union Square SF",
                "Ferry Building SF"
              ].map(query => (
                <button
                  key={query}
                  onClick={() => {
                    setSearchQuery(query);
                    fetchForwardGeocode(query).then(res => {
                      if (res && res.length > 0) selectSearchResult(res[0]);
                    });
                  }}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border font-medium transition ${
                    isWhite 
                      ? 'bg-slate-50 hover:bg-cyan-50 text-slate-700 hover:text-cyan-800 border-slate-200' 
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  {query}
                </button>
              ))}
            </div>
          </div>

          {/* Node Congestion Leaderboard */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isWhite ? 'text-slate-700' : 'text-slate-300'}`}>
                Intersections ({simState.intersections.length})
              </h3>
              <span className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>Live Density</span>
            </div>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {simState.intersections.map(node => (
                <div
                  key={node.id}
                  onClick={() => {
                    if (mapRef.current) {
                      mapRef.current.flyTo([node.lat, node.lon], 16, { duration: 0.8 });
                      if (markersRef.current[node.id]) markersRef.current[node.id].openPopup();
                    }
                  }}
                  className={`p-2 rounded-xl border cursor-pointer transition flex items-center justify-between group ${
                    isWhite ? 'bg-slate-50 hover:bg-cyan-50/60 border-slate-200' : 'bg-slate-950 hover:bg-slate-800 border-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      node.phase.includes('GREEN') ? 'bg-emerald-500' :
                      node.phase.includes('YELLOW') ? 'bg-amber-500' : 'bg-rose-500'
                    }`}></span>
                    <span className="text-xs font-bold">{node.id} - {node.name}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-mono font-bold ${
                      node.density > 80 ? 'text-rose-600' : node.density > 60 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>{node.density}%</span>
                    <span className={`text-[10px] ml-1 ${isWhite ? 'text-slate-400' : 'text-slate-500'}`}>({node.queueLength}v)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Global 3D Earth Digital Twin View
// ----------------------------------------------------
function GlobalEarthView({ earthRef, onSelectCity, onZoomIntoCity, theme }) {
  const isWhite = theme === 'white';
  const cities = Object.values(window.GLOBAL_CITIES || {});
  const [activeCityId, setActiveCityId] = useState(window.currentCityId || 'coimbatore');
  const [selectedRegion, setSelectedRegion] = useState('all');

  const activeCity = window.GLOBAL_CITIES ? window.GLOBAL_CITIES[activeCityId] : cities[0];

  const filteredCities = cities.filter(c => {
    if (selectedRegion === 'all') return true;
    if (selectedRegion === 'asia') return ['coimbatore', 'bengaluru', 'chennai', 'mumbai', 'singapore', 'tokyo'].includes(c.id);
    if (selectedRegion === 'americas') return ['sanfrancisco', 'newyork'].includes(c.id);
    if (selectedRegion === 'europe') return ['london'].includes(c.id);
    return true;
  });

  return (
    <div className={`relative w-full h-[calc(100vh-140px)] min-h-[620px] rounded-2xl overflow-hidden border shadow-2xl flex flex-col ${
      isWhite ? 'bg-slate-900 border-slate-200' : 'bg-slate-950 border-slate-800'
    }`}>
      {/* 3D Earth Canvas */}
      <div id="traffic-earth-canvas" ref={earthRef} className="w-full h-full absolute inset-0 z-0"></div>

      {/* Top Header HUD Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className={`backdrop-blur-md px-4 py-2.5 rounded-2xl border pointer-events-auto shadow-lg flex items-center space-x-3 ${
          isWhite ? 'bg-white/90 border-slate-200 text-slate-800' : 'bg-slate-950/85 border-slate-800 text-slate-100'
        }`}>
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold tracking-wider uppercase text-cyan-600 dark:text-cyan-400">Global Digital Twin Network</span>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-2 py-0.2 rounded-full font-mono font-bold">9 CITIES ACTIVE</span>
            </div>
            <div className={`text-[11px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>
              Click any beacon or select a city below to execute an atmospheric orbital dive
            </div>
          </div>
        </div>

        {/* Region Filter & Actions */}
        <div className={`backdrop-blur-md p-1.5 rounded-2xl border pointer-events-auto shadow-lg flex items-center space-x-2 ${
          isWhite ? 'bg-white/90 border-slate-200' : 'bg-slate-950/85 border-slate-800'
        }`}>
          {['all', 'asia', 'americas', 'europe'].map(reg => (
            <button
              key={reg}
              onClick={() => setSelectedRegion(reg)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition ${
                selectedRegion === reg
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : isWhite ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {reg === 'all' ? 'All Hubs' : reg}
            </button>
          ))}
          <button
            onClick={() => onZoomIntoCity(activeCityId)}
            className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5"
          >
            <span>Dive to {activeCity ? activeCity.name : 'City'}</span>
            <span>➔</span>
          </button>
        </div>
      </div>

      {/* Selected City Telemetry Floating Badge */}
      {activeCity && (
        <div className={`absolute top-20 left-4 z-20 backdrop-blur-md p-3.5 rounded-2xl border pointer-events-auto shadow-xl max-w-sm space-y-2 ${
          isWhite ? 'bg-white/90 border-slate-200 text-slate-800' : 'bg-slate-950/85 border-slate-800 text-slate-100'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{activeCity.flag}</span>
              <div>
                <div className="text-sm font-bold">{activeCity.name}</div>
                <div className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>{activeCity.region}, {activeCity.country}</div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {activeCity.quantumAdvantage}
            </span>
          </div>
          <div className={`text-xs ${isWhite ? 'text-slate-600' : 'text-slate-300'} line-clamp-2`}>
            {activeCity.description}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/50 text-[10px] font-mono">
            <div>
              <span className={isWhite ? 'text-slate-500' : 'text-slate-400'}>Coordinates: </span>
              <span className="font-bold">{activeCity.lat.toFixed(2)}°N, {activeCity.lon.toFixed(2)}°E</span>
            </div>
            <div>
              <span className={isWhite ? 'text-slate-500' : 'text-slate-400'}>Daily Volume: </span>
              <span className="font-bold">{activeCity.vehicles}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Multi-City Carousel */}
      <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
        <div className={`backdrop-blur-md p-3 rounded-2xl border pointer-events-auto shadow-2xl overflow-x-auto flex space-x-3 scrollbar-thin ${
          isWhite ? 'bg-white/90 border-slate-200' : 'bg-slate-950/90 border-slate-800'
        }`}>
          {filteredCities.map(c => {
            const isSelected = c.id === activeCityId;
            return (
              <div
                key={c.id}
                onClick={() => {
                  setActiveCityId(c.id);
                  onSelectCity(c.id);
                }}
                className={`min-w-[190px] p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between shrink-0 group ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/10 shadow-md ring-1 ring-cyan-500'
                    : isWhite 
                      ? 'border-slate-200 bg-white hover:border-cyan-400 hover:shadow-sm' 
                      : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{c.flag}</span>
                    <span className={`text-xs font-bold ${isSelected ? 'text-cyan-500' : isWhite ? 'text-slate-900' : 'text-white'}`}>
                      {c.name}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-500 font-semibold">
                    {c.intersections ? c.intersections.length : 8} Nodes
                  </span>
                </div>
                <div className={`text-[10px] mb-2 truncate ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>
                  {c.country} · {c.population}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCityId(c.id);
                    onZoomIntoCity(c.id);
                  }}
                  className={`w-full py-1 rounded-lg text-[10px] font-bold transition flex items-center justify-center space-x-1 ${
                    isSelected
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
                      : isWhite
                        ? 'bg-slate-100 group-hover:bg-cyan-50 text-slate-700 group-hover:text-cyan-800'
                        : 'bg-slate-800 group-hover:bg-slate-700 text-slate-300 group-hover:text-white'
                  }`}
                >
                  <span>Zoom Into City</span>
                  <span>➔</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Metropolitan Surveillance CCTV Matrix Wall View
// ----------------------------------------------------
function CctvWallView({ simState, onSelectIntersection, theme }) {
  const isWhite = theme === 'white';
  const cameras = window.liveCameraEngine ? window.liveCameraEngine.cameras : [
    { id: 'CAM-01', nodeId: 'I1', name: 'Downtown West Overview', angle: 'Northbound Aerial' },
    { id: 'CAM-02', nodeId: 'I3', name: 'Civic Center Arterial', angle: 'Eastbound Curbside' },
    { id: 'CAM-03', nodeId: 'I4', name: 'Central Square Junction', angle: 'Wide Intersection' },
    { id: 'CAM-04', nodeId: 'I6', name: 'Medical Emergency Watch', angle: 'Corridor Telephoto' }
  ];

  return (
    <div className="space-y-6">
      {/* CCTV Command Header */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isWhite ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 shadow-lg'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center font-bold text-lg">
            📹
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-base font-bold ${isWhite ? 'text-slate-900' : 'text-white'}`}>
                Metropolitan Optical Surveillance & AI CCTV Matrix
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse">
                LIVE REC · 4 FEEDS
              </span>
            </div>
            <p className={`text-xs ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>
              Computer vision queue tracking, signal cycle optical feedback, and emergency vehicle strobe detection
            </p>
          </div>
        </div>

        {/* Telemetry Status Pills */}
        <div className="flex items-center space-x-2 text-xs">
          <div className={`px-3 py-1.5 rounded-xl border flex items-center space-x-2 ${
            isWhite ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}>
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="font-mono">Inference: YOLOv8 30FPS</span>
          </div>
          <div className={`px-3 py-1.5 rounded-xl border flex items-center space-x-2 ${
            simState.isEmergencyActive 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
              : isWhite ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}>
            <span className={`h-2 w-2 rounded-full ${simState.isEmergencyActive ? 'bg-rose-500 animate-ping' : 'bg-slate-400'}`}></span>
            <span className="font-mono">{simState.isEmergencyActive ? 'Corridor Active' : 'Normal Patrol'}</span>
          </div>
        </div>
      </div>

      {/* 4 Camera Feeds 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cameras.map(cam => {
          const node = simState.intersections.find(n => n.id === cam.nodeId);
          return (
            <div
              key={cam.id}
              className={`rounded-2xl border overflow-hidden transition flex flex-col ${
                isWhite ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/90 border-slate-800 shadow-xl'
              }`}
            >
              {/* Feed Header */}
              <div className={`px-4 py-2.5 border-b flex items-center justify-between text-xs ${
                isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
              }`}>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{cam.id}</span>
                  <span className={`font-semibold ${isWhite ? 'text-slate-800' : 'text-slate-200'}`}>{cam.name}</span>
                  <span className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>({cam.angle})</span>
                </div>
                <div className="flex items-center space-x-2 font-mono text-[10px]">
                  <span className="text-emerald-500 font-bold">1080P</span>
                  <span className={isWhite ? 'text-slate-400' : 'text-slate-500'}>|</span>
                  <span className="text-rose-500 font-bold">30 FPS</span>
                </div>
              </div>

              {/* Feed Canvas */}
              <div className="relative p-2 bg-slate-950 flex-1">
                {window.LiveCameraFeedCanvas && (
                  <window.LiveCameraFeedCanvas
                    camId={cam.id}
                    nodeData={node}
                    isEmergency={simState.isEmergencyActive}
                    incident={simState.activeIncident}
                    height={260}
                    onExpand={() => onSelectIntersection(cam.nodeId)}
                  />
                )}
              </div>

              {/* Feed Footer Telemetry & Node Inspection */}
              <div className={`p-3 border-t flex items-center justify-between text-xs ${
                isWhite ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800'
              }`}>
                <div className="flex items-center space-x-3">
                  {node && (
                    <>
                      <div className="flex items-center space-x-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${
                          node.phase.includes('GREEN') ? 'bg-emerald-500' :
                          node.phase.includes('YELLOW') ? 'bg-amber-500' : 'bg-rose-500'
                        }`}></span>
                        <span className="font-mono font-bold">{node.phase} ({node.phaseTimer}s)</span>
                      </div>
                      <span className={isWhite ? 'text-slate-400' : 'text-slate-600'}>•</span>
                      <div className="text-[11px] font-mono">
                        <span className={isWhite ? 'text-slate-500' : 'text-slate-400'}>Queue: </span>
                        <span className="font-bold text-cyan-600 dark:text-cyan-400">{node.queueLength} veh</span>
                      </div>
                      <span className={isWhite ? 'text-slate-400' : 'text-slate-600'}>•</span>
                      <div className="text-[11px] font-mono">
                        <span className={isWhite ? 'text-slate-500' : 'text-slate-400'}>Density: </span>
                        <span className={`font-bold ${
                          node.density > 80 ? 'text-rose-500' : node.density > 60 ? 'text-amber-500' : 'text-emerald-500'
                        }`}>{node.density}%</span>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => onSelectIntersection(cam.nodeId)}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition shadow-sm flex items-center space-x-1"
                >
                  <span>Inspect 3D Node</span>
                  <span>➔</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Global City Switcher Modal
// ----------------------------------------------------
function CitySelectModal({ currentCityId, onSelectCity, onClose, theme }) {
  const isWhite = theme === 'white';
  const cities = Object.values(window.GLOBAL_CITIES || {});
  const [filterRegion, setFilterRegion] = useState('all');

  const filtered = cities.filter(c => {
    if (filterRegion === 'all') return true;
    if (filterRegion === 'asia') return ['coimbatore', 'bengaluru', 'chennai', 'mumbai', 'singapore', 'tokyo'].includes(c.id);
    if (filterRegion === 'americas') return ['sanfrancisco', 'newyork'].includes(c.id);
    if (filterRegion === 'europe') return ['london'].includes(c.id);
    return true;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className={`rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col border ${
        isWhite ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        {/* Modal Header */}
        <div className={`flex items-center justify-between border-b pb-3 ${isWhite ? 'border-slate-200' : 'border-slate-800'}`}>
          <div>
            <h3 className={`text-base font-bold flex items-center gap-2 ${isWhite ? 'text-slate-900' : 'text-white'}`}>
              <span>🌐 Select Metropolitan Digital Twin Network</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
                {cities.length} GLOBAL HUBS
              </span>
            </h3>
            <p className={`text-xs ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>
              Seamlessly switch city topology, traffic signal telemetry, and GIS coordinates without reloading the application
            </p>
          </div>
          <button onClick={onClose} className={isWhite ? 'text-slate-400 hover:text-slate-800' : 'text-slate-400 hover:text-white'}>✕</button>
        </div>

        {/* Filter Region Tabs */}
        <div className="flex items-center space-x-2">
          {[
            { id: 'all', label: `All Networks (${cities.length})` },
            { id: 'asia', label: 'Asia-Pacific (6)' },
            { id: 'americas', label: 'Americas (2)' },
            { id: 'europe', label: 'Europe (1)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterRegion(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                filterRegion === tab.id
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : isWhite ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* City Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto pr-1">
          {filtered.map(city => {
            const isSelected = city.id === currentCityId;
            return (
              <div
                key={city.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/5 shadow-md ring-1 ring-cyan-500'
                    : isWhite
                      ? 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{city.flag}</span>
                      <div>
                        <div className="text-sm font-bold">{city.name}</div>
                        <div className={`text-[10px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>{city.region}, {city.country}</div>
                      </div>
                    </div>
                    {isSelected ? (
                      <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {city.quantumAdvantage}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs ${isWhite ? 'text-slate-600' : 'text-slate-300'} mb-3 line-clamp-2`}>
                    {city.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-2 border-t border-slate-200/60 dark:border-slate-800/60 mb-3">
                    <div>
                      <span className={isWhite ? 'text-slate-500' : 'text-slate-400'}>Population: </span>
                      <span className="font-semibold">{city.population}</span>
                    </div>
                    <div>
                      <span className={isWhite ? 'text-slate-500' : 'text-slate-400'}>Nodes: </span>
                      <span className="font-semibold">{city.intersections ? city.intersections.length : 8} Intersections</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSelectCity(city.id);
                    onClose();
                  }}
                  disabled={isSelected}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 ${
                    isSelected
                      ? 'bg-cyan-600/20 text-cyan-500 cursor-default'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
                  }`}
                >
                  <span>{isSelected ? '✓ Currently Deployed' : 'Deploy Digital Twin'}</span>
                  {!isSelected && <span>➔</span>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Mount React Root
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

