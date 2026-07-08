import React from "react";
import { useAppState } from "../core/stateManager.js";
import { teams } from "../data/teams.js";
import { translations } from "../data/translations.js";

export default function PredictInput() {
  const { predictTeams, setPredictTeams, sendMessage, isGenerating, currentLanguage } = useAppState();
  const t = translations[currentLanguage] || translations.en;

  const homeTeam = teams.find(t => t.id === predictTeams.home);
  const awayTeam = teams.find(t => t.id === predictTeams.away);

  const handleSelectHome = (e) => {
    setPredictTeams(prev => ({ ...prev, home: e.target.value }));
  };

  const handleSelectAway = (e) => {
    setPredictTeams(prev => ({ ...prev, away: e.target.value }));
  };

  const runPrediction = () => {
    if (!homeTeam || !awayTeam) return;
    
    const promptText = `Generate a match preview and outcome forecast for the match: ${homeTeam.name} vs ${awayTeam.name}. 
Please use the QVAC framework to compare Quality, Value, Cohesion, and Variation. Highlight key tactical matchups.`;
    
    sendMessage(promptText, { homeTeam, awayTeam });
  };

  return (
    <div className="predict-container glass-panel" style={{ padding: "1.25rem" }}>
      <h3 style={{ fontSize: "1.05rem", borderBottom: "1px solid var(--glass-border)", paddingBottom: "0.5rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>🏟️</span> {t.modes.predict} Setup
      </h3>

      {/* Selectors */}
      <div className="team-selectors">
        {/* Home Selector */}
        <div className="glass-panel team-selector-card" style={{ background: "rgba(0,0,0,0.1)" }}>
          <label style={{ fontSize: "0.85rem", color: "var(--accent-green)", fontWeight: 600 }}>🏠 {t.labels.home}</label>
          <select 
            value={predictTeams.home} 
            onChange={handleSelectHome} 
            className="team-select-dropdown"
          >
            <option value="">Select Team...</option>
            {teams.map(t => (
              <option key={t.id} value={t.id} disabled={t.id === predictTeams.away}>
                {t.emoji} {t.name}
              </option>
            ))}
          </select>

          {homeTeam && (
            <div className="team-preview-info">
              <div>Manager: <strong style={{ color: "#fff" }}>{homeTeam.manager}</strong></div>
              <div>Formation: <strong style={{ color: "var(--accent-green)" }}>{homeTeam.preferredFormation}</strong></div>
              
              {/* Comparative QVAC progress bars */}
              <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <div className="stat-row">
                  <div className="stat-header"><span>Quality</span><span>{homeTeam.stats.quality}</span></div>
                  <div className="stat-progress-bar">
                    <div className="stat-fill" style={{ width: `${homeTeam.stats.quality}%`, background: "var(--accent-green)" }} />
                  </div>
                </div>
                <div className="stat-row">
                  <div className="stat-header"><span>Tactical Value</span><span>{homeTeam.stats.value}</span></div>
                  <div className="stat-progress-bar">
                    <div className="stat-fill" style={{ width: `${homeTeam.stats.value}%`, background: "var(--accent-green)" }} />
                  </div>
                </div>
                <div className="stat-row">
                  <div className="stat-header"><span>Cohesion</span><span>{homeTeam.stats.cohesion}</span></div>
                  <div className="stat-progress-bar">
                    <div className="stat-fill" style={{ width: `${homeTeam.stats.cohesion}%`, background: "var(--accent-green)" }} />
                  </div>
                </div>
                <div className="stat-row">
                  <div className="stat-header"><span>Variation</span><span>{homeTeam.stats.variation}</span></div>
                  <div className="stat-progress-bar">
                    <div className="stat-fill" style={{ width: `${homeTeam.stats.variation}%`, background: "var(--accent-green)" }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Away Selector */}
        <div className="glass-panel team-selector-card" style={{ background: "rgba(0,0,0,0.1)" }}>
          <label style={{ fontSize: "0.85rem", color: "var(--accent-gold)", fontWeight: 600 }}>✈️ {t.labels.away}</label>
          <select 
            value={predictTeams.away} 
            onChange={handleSelectAway} 
            className="team-select-dropdown"
          >
            <option value="">Select Team...</option>
            {teams.map(t => (
              <option key={t.id} value={t.id} disabled={t.id === predictTeams.home}>
                {t.emoji} {t.name}
              </option>
            ))}
          </select>

          {awayTeam && (
            <div className="team-preview-info">
              <div>Manager: <strong style={{ color: "#fff" }}>{awayTeam.manager}</strong></div>
              <div>Formation: <strong style={{ color: "var(--accent-gold)" }}>{awayTeam.preferredFormation}</strong></div>
              
              {/* Comparative QVAC progress bars */}
              <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <div className="stat-row">
                  <div className="stat-header"><span>Quality</span><span>{awayTeam.stats.quality}</span></div>
                  <div className="stat-progress-bar">
                    <div className="stat-fill" style={{ width: `${awayTeam.stats.quality}%`, background: "var(--accent-gold)" }} />
                  </div>
                </div>
                <div className="stat-row">
                  <div className="stat-header"><span>Tactical Value</span><span>{awayTeam.stats.value}</span></div>
                  <div className="stat-progress-bar">
                    <div className="stat-fill" style={{ width: `${awayTeam.stats.value}%`, background: "var(--accent-gold)" }} />
                  </div>
                </div>
                <div className="stat-row">
                  <div className="stat-header"><span>Cohesion</span><span>{awayTeam.stats.cohesion}</span></div>
                  <div className="stat-progress-bar">
                    <div className="stat-fill" style={{ width: `${awayTeam.stats.cohesion}%`, background: "var(--accent-gold)" }} />
                  </div>
                </div>
                <div className="stat-row">
                  <div className="stat-header"><span>Variation</span><span>{awayTeam.stats.variation}</span></div>
                  <div className="stat-progress-bar">
                    <div className="stat-fill" style={{ width: `${awayTeam.stats.variation}%`, background: "var(--accent-gold)" }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Launch Prediction Button */}
      <button
        onClick={runPrediction}
        disabled={!homeTeam || !awayTeam || isGenerating}
        className="btn-primary"
        style={{ width: "100%", marginTop: "0.5rem", padding: "0.85rem", fontSize: "0.95rem" }}
      >
        {isGenerating ? "🧠 ..." : `⚡ ${t.buttons.predict}`}
      </button>
    </div>
  );
}
