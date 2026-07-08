import React, { useState, useEffect, useRef } from "react";
import { useAppState } from "../core/stateManager.js";
import { teams } from "../data/teams.js";
import { translations } from "../data/translations.js";
import { useVoiceInput } from "../core/useVoiceInput.js";

const getXCoords = (count) => {
  if (count === 1) return [200];
  const coords = [];
  const margin = 60;
  const step = (400 - margin * 2) / (count - 1);
  for (let i = 0; i < count; i++) {
    coords.push(margin + i * step);
  }
  return coords;
};

const getPositionLabels = (role, count) => {
  if (role === "DEF") {
    if (count === 3) return ["LCB", "CB", "RCB"];
    if (count === 4) return ["LB", "LCB", "RCB", "RB"];
    if (count === 5) return ["LWB", "LCB", "CB", "RCB", "RWB"];
  }
  if (role === "MID") {
    if (count === 1) return ["DM"];
    if (count === 2) return ["LCM", "RCM"];
    if (count === 3) return ["LCM", "CM", "RCM"];
    if (count === 4) return ["LM", "LCM", "RCM", "RM"];
  }
  if (role === "AM") {
    if (count === 1) return ["AM"];
    if (count === 3) return ["LAM", "AM", "RAM"];
    if (count === 4) return ["LM", "LAM", "RAM", "RM"];
  }
  if (role === "FWD") {
    if (count === 1) return ["ST"];
    if (count === 2) return ["LS", "RS"];
    if (count === 3) return ["LW", "ST", "RW"];
    if (count === 4) return ["LW", "LS", "RS", "RW"];
  }
  return Array.from({ length: count }, (_, i) => `${role}${i + 1}`);
};

export default function FormationBuilder() {
  const { 
    sendMessage, 
    isGenerating, 
    speakWithWebSpeech, 
    chats, 
    currentLanguage 
  } = useAppState();

  const t = translations[currentLanguage] || translations.en;

  const [selectedTeamId, setSelectedTeamId] = useState(teams[0].id);
  const [lineup, setLineup] = useState({}); // slotId -> player
  const [draggedPlayer, setDraggedPlayer] = useState(null);
  const [dragSource, setDragSource] = useState(null); // "roster" or slotId
  const [hasCompared, setHasCompared] = useState(false);
  const [errorToast, setErrorToast] = useState(null);

  const prevIsGenerating = useRef(false);

  const team = teams.find(x => x.id === selectedTeamId) || teams[0];

  // Parse keyPlayers to structured roster
  const keyPlayers = team.keyPlayers.map(pStr => {
    const match = pStr.match(/^(.*?)\s*\((.*?)\)$/);
    return {
      name: match ? match[1].trim() : pStr,
      position: match ? match[2].trim() : "Player",
      raw: pStr
    };
  });

  // Automatically reset lineup when team changes
  useEffect(() => {
    setLineup({});
    setHasCompared(false);
  }, [selectedTeamId]);

  // TTS playback monitor: trigger spoken speech when assistant finishes streaming
  useEffect(() => {
    if (prevIsGenerating.current && !isGenerating) {
      const formationChats = chats.formation || [];
      const lastMsg = formationChats[formationChats.length - 1];
      if (lastMsg && lastMsg.role === "assistant") {
        // speakWithWebSpeech(lastMsg.content, currentLanguage); // TTS disabled until Round 2
      }
    }
    prevIsGenerating.current = isGenerating;
  }, [isGenerating, chats.formation, currentLanguage, speakWithWebSpeech]);

  // Build coordinate slots for visual pitch
  const getSlots = () => {
    const formation = team.preferredFormation;
    const parts = formation.split("-").map(Number);
    const slots = [];
    
    // GK at bottom
    slots.push({ id: "slot-gk", role: "GK", label: "GK", x: 200, y: 530 });

    if (parts.length === 3) {
      const [numDef, numMid, numFwd] = parts;
      
      // Defenders y=430
      const defX = getXCoords(numDef);
      const defLabels = getPositionLabels("DEF", numDef);
      for (let i = 0; i < numDef; i++) {
        slots.push({ id: `slot-def-${i}`, role: "DEF", label: defLabels[i], x: defX[i], y: 410 });
      }
      
      // Midfielders y=290
      const midX = getXCoords(numMid);
      const midLabels = getPositionLabels("MID", numMid);
      for (let i = 0; i < numMid; i++) {
        slots.push({ id: `slot-mid-${i}`, role: "MID", label: midLabels[i], x: midX[i], y: 290 });
      }
      
      // Forwards y=170
      const fwdX = getXCoords(numFwd);
      const fwdLabels = getPositionLabels("FWD", numFwd);
      for (let i = 0; i < numFwd; i++) {
        slots.push({ id: `slot-fwd-${i}`, role: "FWD", label: fwdLabels[i], x: fwdX[i], y: 170 });
      }
    } else if (parts.length === 4) {
      const [numDef, numMid1, numMid2, numFwd] = parts;
      
      // Defenders y=430
      const defX = getXCoords(numDef);
      const defLabels = getPositionLabels("DEF", numDef);
      for (let i = 0; i < numDef; i++) {
        slots.push({ id: `slot-def-${i}`, role: "DEF", label: defLabels[i], x: defX[i], y: 410 });
      }
      
      // Midfielders 1 y=320
      const mid1X = getXCoords(numMid1);
      const mid1Labels = getPositionLabels("MID", numMid1);
      for (let i = 0; i < numMid1; i++) {
        slots.push({ id: `slot-mid1-${i}`, role: "MID", label: mid1Labels[i], x: mid1X[i], y: 320 });
      }
      
      // Midfielders 2 / AM y=220
      const mid2X = getXCoords(numMid2);
      const mid2Labels = getPositionLabels("AM", numMid2);
      for (let i = 0; i < numMid2; i++) {
        slots.push({ id: `slot-mid2-${i}`, role: "AM", label: mid2Labels[i], x: mid2X[i], y: 220 });
      }
      
      // Forwards y=120
      const fwdX = getXCoords(numFwd);
      const fwdLabels = getPositionLabels("FWD", numFwd);
      for (let i = 0; i < numFwd; i++) {
        slots.push({ id: `slot-fwd-${i}`, role: "FWD", label: fwdLabels[i], x: fwdX[i], y: 120 });
      }
    }
    
    return slots;
  };

  const slots = getSlots();

  // Find which players are placed where
  const placedPlayerNames = Object.values(lineup).filter(Boolean).map(p => p.name);
  const availableRoster = keyPlayers.filter(p => !placedPlayerNames.includes(p.name));

  // HTML5 Drag and Drop events
  const handleDragStart = (e, player, source) => {
    setDraggedPlayer(player);
    setDragSource(source);
    e.dataTransfer.setData("text/plain", player.name);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, slotId) => {
    e.preventDefault();
    if (!draggedPlayer) return;

    setLineup(prev => {
      const next = { ...prev };
      // Clear previous slot if it was dragged from a slot
      if (dragSource && dragSource !== "roster") {
        next[dragSource] = null;
      }
      // Place player on the slot
      next[slotId] = draggedPlayer;
      return next;
    });

    setDraggedPlayer(null);
    setDragSource(null);
  };

  const handleDropOnRoster = (e) => {
    e.preventDefault();
    if (!draggedPlayer) return;

    // Clear player from slot if dragged off pitch
    if (dragSource && dragSource !== "roster") {
      setLineup(prev => {
        const next = { ...prev };
        next[dragSource] = null;
        return next;
      });
    }

    setDraggedPlayer(null);
    setDragSource(null);
  };

  const handleCompare = () => {
    const userPlacements = [];
    slots.forEach(s => {
      const player = lineup[s.id];
      if (player) {
        userPlacements.push(`${player.name} placed in the ${s.label} slot`);
      }
    });

    if (userPlacements.length === 0) {
      showToastError("Please drag at least one player onto the pitch first!");
      return;
    }

    const managerLineup = team.keyPlayers.join(", ");
    const userLineupStr = userPlacements.join(", ");

    const promptText = `Evaluate my lineup compared to the manager's default selection.
Manager: ${team.manager}
Real lineup: ${managerLineup}
User lineup: ${userLineupStr}`;

    setHasCompared(true);
    sendMessage(promptText, {
      teamName: team.name,
      managerName: team.manager,
      managerLineup: managerLineup,
      userLineup: userLineupStr
    });
  };

  const showToastError = (msg) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 3000);
  };

  // Setup Voice Counter-Argument Mic
  const voiceResponse = useVoiceInput({
    language: currentLanguage,
    onTranscript: (text) => {
      if (!text.trim()) return;

      const managerLineup = team.keyPlayers.join(", ");
      const userPlacements = [];
      slots.forEach(s => {
        const player = lineup[s.id];
        if (player) {
          userPlacements.push(`${player.name} placed in the ${s.label} slot`);
        }
      });
      const userLineupStr = userPlacements.join(", ");

      const promptText = `Here is my reply to your tactical feedback: ${text}`;
      sendMessage(promptText, {
        teamName: team.name,
        managerName: team.manager,
        managerLineup: managerLineup,
        userLineup: userLineupStr
      });
    },
    onError: showToastError
  });

  return (
    <div className="predict-container glass-panel" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem", minHeight: "100%", overflowY: "auto" }}>
      <h3 style={{ fontSize: "1.05rem", borderBottom: "1px solid var(--glass-border)", paddingBottom: "0.5rem", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>⚽</span> {t.modes.formation} Builder
      </h3>

      {/* Roster Select Dropdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <label style={{ fontSize: "0.8rem", color: "var(--accent-green)", fontWeight: 600 }}>Select Active Squad:</label>
        <select
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
          className="team-select-dropdown"
          style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", background: "rgba(0,0,0,0.2)", color: "white", border: "1px solid var(--glass-border)" }}
        >
          {teams.map(t => (
            <option key={t.id} value={t.id} style={{ background: "#0b1a13" }}>
              {t.emoji} {t.name} ({t.preferredFormation})
            </option>
          ))}
        </select>
      </div>

      {/* Available Roster Section (HTML5 Drop Zone to return players) */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDropOnRoster}
        style={{
          position: "relative",
          zIndex: 10,
          background: "rgba(0, 0, 0, 0.2)",
          border: "1px dashed var(--glass-border)",
          borderRadius: "8px",
          padding: "0.75rem",
          minHeight: "75px",
          flexShrink: 0,
          marginBottom: "0.5rem"
        }}
      >
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: "bold" }}>
          AVAILABLE KEY SQUAD (Drag onto the field):
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {availableRoster.map(p => (
            <div
              key={p.name}
              draggable="true"
              onDragStart={(e) => handleDragStart(e, p, "roster")}
              style={{
                background: "rgba(251, 191, 36, 0.08)",
                border: "1px solid #fbbf24",
                borderRadius: "6px",
                padding: "0.35rem 0.6rem",
                cursor: "grab",
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                color: "white"
              }}
            >
              <span style={{ background: "rgba(251, 191, 36, 0.15)", color: "#fbbf24", padding: "0.05rem 0.25rem", borderRadius: "3px", fontWeight: "bold", fontSize: "0.65rem" }}>
                {p.position}
              </span>
              <span>{p.name}</span>
            </div>
          ))}
          {availableRoster.length === 0 && (
            <div style={{ fontSize: "0.75rem", color: "var(--accent-neon)", fontStyle: "italic", padding: "0.2rem" }}>
              All key players placed on the field!
            </div>
          )}
        </div>
      </div>

      {/* SVG Pitch Display */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0, marginTop: "0.5rem" }}>
        <svg
          viewBox="0 0 400 600"
          style={{
            width: "100%",
            maxWidth: "340px",
            maxHeight: "480px",
            height: "auto",
            background: "#1a4a2e",
            borderRadius: "10px",
            border: "1.5px solid var(--glass-border)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)"
          }}
        >
          {/* Pitch Markings */}
          {/* Outer Boundary */}
          <rect x="15" y="15" width="370" height="570" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          {/* Midfield Line */}
          <line x1="15" y1="300" x2="385" y2="300" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          {/* Midfield Circle */}
          <circle cx="200" cy="300" r="45" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          {/* Center Spot */}
          <circle cx="200" cy="300" r="2" fill="rgba(255,255,255,0.4)" />
          {/* Penalty Box Top */}
          <rect x="100" y="15" width="200" height="85" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          <rect x="145" y="15" width="110" height="30" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          <circle cx="200" cy="75" r="1.5" fill="rgba(255,255,255,0.4)" />
          {/* Penalty Box Bottom */}
          <rect x="100" y="500" width="200" height="85" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          <rect x="145" y="585" width="110" height="-30" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          <circle cx="200" cy="525" r="1.5" fill="rgba(255,255,255,0.4)" />

          {/* Render Position Slots */}
          {slots.map(s => {
            const occupant = lineup[s.id];
            return (
              <g 
                key={s.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, s.id)}
              >
                {/* Outer slot boundary */}
                <circle
                  cx={s.x}
                  cy={s.y}
                  r="18"
                  fill="rgba(255, 255, 255, 0.15)"
                  stroke={occupant ? "#fbbf24" : "#10b981"}
                  strokeWidth="2"
                  style={{ transition: "stroke 0.2s" }}
                />
                
                {/* Slot Tag overlay */}
                <text
                  x={s.x}
                  y={s.y + 4}
                  textAnchor="middle"
                  fill={occupant ? "transparent" : "rgba(255,255,255,0.6)"}
                  fontSize="10px"
                  fontWeight="bold"
                  style={{ pointerEvents: "none", fontFamily: "sans-serif" }}
                >
                  {s.label}
                </text>

                {/* Occupant card text label */}
                {occupant && (
                  <g 
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, occupant, s.id)}
                    style={{ cursor: "grab" }}
                  >
                    <rect
                      x={s.x - 45}
                      y={s.y - 28}
                      width="90"
                      height="16"
                      rx="3"
                      fill="rgba(11, 26, 19, 0.9)"
                      stroke="#fbbf24"
                      strokeWidth="0.8"
                    />
                    <text
                      x={s.x}
                      y={s.y - 17}
                      textAnchor="middle"
                      fill="white"
                      fontSize="9px"
                      fontWeight="bold"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {occupant.name.length > 14 ? occupant.name.substring(0, 12) + ".." : occupant.name}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Controller Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "auto" }}>
        <button
          onClick={handleCompare}
          disabled={placedPlayerNames.length === 0 || isGenerating}
          className="btn-primary"
          style={{ width: "100%", padding: "0.75rem", fontSize: "0.9rem" }}
        >
          {isGenerating ? "Analyzing..." : "🔍 Compare with Manager"}
        </button>

        {/* Voice counter argument mic shown after first comparison */}
        {hasCompared && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", borderTop: "1px solid var(--glass-border)", paddingTop: "0.75rem" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--accent-gold)", textAlign: "center", fontWeight: "bold" }}>
              ARGUING A DIFFERENT STRATEGY?
            </div>
            <button
              type="button"
              className={`mic-button ${voiceResponse.isListening ? "listening" : ""}`}
              onClick={voiceResponse.isListening ? voiceResponse.stopListening : voiceResponse.startListening}
              disabled={isGenerating}
              style={{ width: "100%", height: "45px", borderRadius: "8px", display: "none", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
              title="Voice Counter-Argument"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" x2="12" y1="19" y2="22"/>
              </svg>
              <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>
                {voiceResponse.isListening ? "Listening (click to send)..." : "Talk back to Coach (Mic)"}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Toast notifications */}
      {errorToast && (
        <div className="toast-error" style={{ position: "relative", bottom: "auto", marginTop: "0.5rem" }}>
          {errorToast}
        </div>
      )}
    </div>
  );
}
