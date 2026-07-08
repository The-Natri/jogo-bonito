import React, { lazy, Suspense, useState } from "react";
import { AppStateProvider, useAppState } from "../core/stateManager.js";
import ModeSelector from "./ModeSelector.jsx";
import ChatWindow from "./ChatWindow.jsx";
import PredictInput from "./PredictInput.jsx";
import DebateInput from "./DebateInput.jsx";
import CommentateInput from "./CommentateInput.jsx";
import LanguageSelector from "./LanguageSelector.jsx";
import { translations } from "../data/translations.js";

const CinematicIntro = lazy(() => import("./CinematicIntro.jsx"));
const FormationBuilder = lazy(() => import("./FormationBuilder.jsx"));

// ---------- Live background (persistent layer) ----------
function LiveBackground({ mode }) {
  return (
    <div className="live-bg" aria-hidden="true">
      {/* layer 1: pitch wireframe */}
      <svg className="pitch-wire" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        <rect x="60" y="30" width="680" height="540" rx="4"/>
        <line x1="60" y1="300" x2="740" y2="300"/>
        <circle cx="400" cy="300" r="70"/>
        <rect x="220" y="30" width="360" height="100"/>
        <rect x="220" y="470" width="360" height="100"/>
        <circle cx="400" cy="130" r="4"/>
        <circle cx="400" cy="470" r="4"/>
      </svg>

      {/* layer 2: floodlight corner glows */}
      <div className="floodlight fl-tl"/>
      <div className="floodlight fl-tr"/>
      <div className="floodlight fl-bl"/>
      <div className="floodlight fl-br"/>

      {/* layer 3: scanline sweep */}
      <div className="scanline-sweep"/>

      {/* layer 4: tab-specific atmosphere */}
      {mode === "tactician"  && <div className="atmo atmo-grid"/>}
      {mode === "commentate" && (
        <div className="atmo atmo-ticker">
          <span>⚽ LIVE — Tactician Analysis Active · Formation locked · Press confidence 94%</span>
        </div>
      )}
      {mode === "predict"    && <div className="atmo atmo-predict"/>}
      {mode === "debate"     && <div className="atmo atmo-debate"/>}
      {mode === "formation"  && <div className="atmo atmo-formation"/>}
    </div>
  );
}

// ---------- Dashboard (post-intro) ----------
function Dashboard() {
  const { currentMode, currentLanguage, userLevel, setUserLevel, setTextInput, sendMessage } = useAppState();

  const t = translations[currentLanguage] || translations.en;

  const tacticianPresets = [
    "Analyze a high press vs low block",
    "Explain gegenpressing in 30 seconds",
    "Best formation against a 4-3-3?",
    "How to exploit wide spaces?",
  ];

  const handleQuickPrompt = (prompt) => {
    setTextInput(prompt);
    sendMessage(prompt);
  };

  return (
    <div className="app-container">
      <LiveBackground mode={currentMode} />

      {/* gold broadcast bar */}
      <div className="broadcast-bar" aria-hidden="true" />

      <header className="app-header">
        <div className="logo-section">
          <span className="logo-icon">⚽</span>
          <h1 className="logo-text">Jogo Bonito</h1>
          <span style={{ fontSize: "0.75rem", background: "rgba(0, 255, 137, 0.1)", color: "var(--accent-neon)", padding: "0.15rem 0.4rem", borderRadius: "4px", marginLeft: "0.5rem", fontWeight: "bold" }}>
            {t.labels.engineOffline}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <LanguageSelector />
          <div className="font-mono" style={{ fontSize: "0.8rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.03)", padding: "0.4rem 0.75rem", borderRadius: "6px", border: "1px solid var(--glass-border)" }}>
            🟢 Llama 3.2 1B
          </div>
        </div>
      </header>

      <main className="main-workspace">
        <div className="workspace-panel">
          <div className="chat-section">
            <ChatWindow language={currentLanguage} />
          </div>

          <div className="input-section" key={currentMode}>
            {currentMode === "tactician" && (
              <div className="mode-panel__presets">
                {tacticianPresets.map((p) => (
                  <button key={p} className="preset-chip" onClick={() => handleQuickPrompt(p)}>
                    {p}
                  </button>
                ))}
              </div>
            )}
            {currentMode === "learn" && (
              <div className="mode-panel__levels" style={{ width: "100%" }}>
                <button 
                  onClick={() => setUserLevel("beginner")} 
                  className={`level-chip${userLevel === "beginner" ? " active" : ""}`}
                >
                  Beginner
                </button>
                <button 
                  onClick={() => setUserLevel("intermediate")} 
                  className={`level-chip${userLevel === "intermediate" ? " active" : ""}`}
                >
                  Intermediate
                </button>
                <button 
                  onClick={() => setUserLevel("expert")} 
                  className={`level-chip${userLevel === "expert" ? " active" : ""}`}
                >
                  Expert
                </button>
              </div>
            )}
            {currentMode === "predict"    && <PredictInput />}
            {currentMode === "debate"     && <DebateInput />}
            {currentMode === "commentate" && <CommentateInput />}
            {currentMode === "formation"  && (
              <Suspense fallback={<div className="glass-panel" style={{ padding: "1.25rem", color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center" }}>⚽ Loading Formation Builder...</div>}>
                <FormationBuilder />
              </Suspense>
            )}
          </div>
        </div>
      </main>

      {/* bottom nav replaces the old header ModeSelector */}
      <ModeSelector />
    </div>
  );
}

// ---------- Root with intro gate ----------
function AppWithIntro() {
  const [showIntro, setShowIntro] = useState(true);
  const { currentLanguage, modelStatus, modelProgress, modelError } = useAppState();

  const t = translations[currentLanguage] || translations.en;

  if (showIntro) {
    return (
      <Suspense fallback={<div className="intro-fallback" />}>
        <CinematicIntro
          currentLanguage={currentLanguage}
          translations={translations}
          onComplete={() => setShowIntro(false)}
        />
      </Suspense>
    );
  }

  // Render Loader Splash Screen if model is loading or downloading
  if (modelStatus === "loading" && !showIntro) {
    return (
      <div className="loader-overlay">
        <div className="loader-logo">⚽</div>
        <h1 className="loader-title">Jogo Bonito</h1>
        <p className="loader-desc">
          {t.labels.loading}
        </p>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${modelProgress}%` }} />
        </div>
        <div className="progress-label font-mono">
          {t.labels.loading} {modelProgress}%
        </div>
      </div>
    );
  }

  // Render Error state if loading failed
  if (modelStatus === "error") {
    return (
      <div className="loader-overlay">
        <div className="loader-logo">⚠️</div>
        <h1 className="loader-title" style={{ color: "#ef4444" }}>Startup Error</h1>
        <p className="loader-desc" style={{ color: "#f87171" }}>
          Failed to load local QVAC model: {modelError}
        </p>
        <button 
          className="btn-primary" 
          onClick={() => window.location.reload()} 
          style={{ background: "#ef4444", color: "#fff" }}
        >
          {t.buttons.retry}
        </button>
      </div>
    );
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <AppStateProvider>
      <AppWithIntro />
    </AppStateProvider>
  );
}
