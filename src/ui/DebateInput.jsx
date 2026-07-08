import React, { useState, useEffect, useRef } from "react";
import { useAppState } from "../core/stateManager.js";
import { translations } from "../data/translations.js";
import { useVoiceInput } from "../core/useVoiceInput.js";

const PRESETS = [
  {
    title: "Messi vs Ronaldo",
    sideA: "Lionel Messi: Fluid playmaker, low center of gravity, creative genius, superior playmaking stats and dribbles.",
    sideB: "Cristiano Ronaldo: Lethal direct goalscorer, physical powerhouse, elite off-the-ball movements, records in Champions League."
  },
  {
    title: "High Press vs Low Block",
    sideA: "High Counter-Press (Gegenpressing): Defending in opposition half, forcing immediate turnovers, high physical demand.",
    sideB: "Deep Low Block Defense: Compact lines, closing down half-spaces, exploiting fast counter-attacks behind defensive lines."
  },
  {
    title: "Pep vs Ancelotti",
    sideA: "Pep Guardiola (Positional Play): Strict positional discipline, inverted fullbacks, overloading zones, high possession.",
    sideB: "Carlo Ancelotti (Tactical Freedom): Fluid formations, playing to individual player strengths, relaxed structure, transition mastery."
  },
  {
    title: "3-5-2 Wingbacks vs 4-3-3",
    sideA: "3-5-2 Wingbacks System: Five in midfield, overlapping wingbacks, double strikers, robust three-man defensive spine.",
    sideB: "4-3-3 Attacking Width: Wide wingers isolation, overlapping fullbacks, midfield double-pivot supporting a single striker."
  }
];

export default function DebateInput() {
  const { debateSides, setDebateSides, sendMessage, isGenerating, currentLanguage, chats, speakWithWebSpeech } = useAppState();
  const [errorToast, setErrorToast] = useState(null);
  const [roundCount, setRoundCount] = useState(0);
  
  const prevIsGenerating = useRef(false);
  
  const t = translations[currentLanguage] || translations.en;
  // Reset roundCount when the debate is cleared
  useEffect(() => {
    const list = chats.debate || [];
    if (list.length === 0) {
      setRoundCount(0);
    }
  }, [chats.debate]);

  // TTS speaker for counter replies
  useEffect(() => {
    if (prevIsGenerating.current && !isGenerating) {
      const list = chats.debate || [];
      const lastMsg = list[list.length - 1];
      if (lastMsg && lastMsg.role === "assistant" && roundCount > 0) {
        // speakWithWebSpeech(lastMsg.content, currentLanguage); // TTS disabled until Round 2
      }
    }
    prevIsGenerating.current = isGenerating;
  }, [isGenerating, chats.debate, currentLanguage, speakWithWebSpeech, roundCount]);

  const debateChats = chats.debate || [];

  const handleApplyPreset = (preset) => {
    setDebateSides({ sideA: preset.sideA, sideB: preset.sideB });
  };

  const runDebate = () => {
    if (!debateSides.sideA.trim() || !debateSides.sideB.trim()) return;
    setRoundCount(0);

    const promptText = `Conduct a structured debate comparing these two football concepts:
Side A: ${debateSides.sideA}
Side B: ${debateSides.sideB}
Please present strong, balanced arguments for both sides, evaluate them objectively, and conclude with a decisive winner and confidence in your verdict using the requested [VERDICT] layout.`;

    sendMessage(promptText, { sideA: debateSides.sideA, sideB: debateSides.sideB });
  };

  const showToastError = (err) => {
    setErrorToast(err);
    setTimeout(() => {
      setErrorToast(null);
    }, 3000);
  };

  const voiceSideA = useVoiceInput({
    language: currentLanguage,
    onTranscript: (text) => {
      setDebateSides(prev => ({ ...prev, sideA: (prev.sideA ? prev.sideA + " " : "") + text }));
    },
    onError: showToastError
  });

  const voiceSideB = useVoiceInput({
    language: currentLanguage,
    onTranscript: (text) => {
      setDebateSides(prev => ({ ...prev, sideB: (prev.sideB ? prev.sideB + " " : "") + text }));
    },
    onError: showToastError
  });

  const voiceCounter = useVoiceInput({
    language: currentLanguage,
    onTranscript: (text) => {
      handleCounterTranscript(text);
    },
    onError: showToastError
  });

  const handleCounterTranscript = (text) => {
    if (!text.trim() || roundCount >= 3) return;

    const assistantMsgs = debateChats.filter(m => m.role === "assistant");
    const lastMsg = assistantMsgs[assistantMsgs.length - 1];
    const previousVerdict = lastMsg ? lastMsg.content : "";

    const topic = `${debateSides.sideA} vs ${debateSides.sideB}`;
    const promptText = `Counter-argument (Round ${roundCount + 1}): ${text}`;

    setRoundCount(prev => prev + 1);
    sendMessage(promptText, {
      topic,
      userCounter: text,
      previousVerdict,
      mode: "debate_counter"
    });
  };

  return (
    <div className="debate-container glass-panel" style={{ padding: "1.25rem" }}>
      <h3 style={{ fontSize: "1.05rem", borderBottom: "1px solid var(--glass-border)", paddingBottom: "0.5rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>⚔️</span> {t.modes.debate} Arena
      </h3>

      {/* Inputs */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "0.85rem", color: "var(--accent-green)", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>🟢 {t.labels.sideA}</label>
            <textarea
              value={debateSides.sideA}
              onChange={(e) => setDebateSides(prev => ({ ...prev, sideA: e.target.value }))}
              className="chat-input"
              rows="2"
              placeholder={t.placeholders.debate}
              style={{ width: "100%", resize: "none", fontFamily: "inherit" }}
            />
          </div>
          <button
            type="button"
            className={`mic-button ${voiceSideA.isListening ? "listening" : ""}`}
            onClick={voiceSideA.isListening ? voiceSideA.stopListening : voiceSideA.startListening}
            disabled={isGenerating}
            style={{ width: "40px", height: "40px", marginTop: "1.3rem", display: "none" }}
            title="Voice Input Side A"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" x2="12" y1="19" y2="22"/>
            </svg>
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "0.85rem", color: "var(--accent-gold)", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>🟡 {t.labels.sideB}</label>
            <textarea
              value={debateSides.sideB}
              onChange={(e) => setDebateSides(prev => ({ ...prev, sideB: e.target.value }))}
              className="chat-input"
              rows="2"
              placeholder={t.placeholders.debate}
              style={{ width: "100%", resize: "none", fontFamily: "inherit" }}
            />
          </div>
          <button
            type="button"
            className={`mic-button ${voiceSideB.isListening ? "listening" : ""}`}
            onClick={voiceSideB.isListening ? voiceSideB.stopListening : voiceSideB.startListening}
            disabled={isGenerating}
            style={{ width: "40px", height: "40px", marginTop: "1.3rem", display: "none" }}
            title="Voice Input Side B"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" x2="12" y1="19" y2="22"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Preset grid */}
      <div style={{ marginTop: "0.5rem" }}>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.4rem", fontWeight: 600 }}>Quick Presets:</span>
        <div className="debate-presets">
          {PRESETS.map((p, idx) => (
            <div key={idx} onClick={() => handleApplyPreset(p)} className="preset-card">
              📌 {p.title}
            </div>
          ))}
        </div>
      </div>

      {/* Debate Button */}
      <button
        onClick={runDebate}
        disabled={!debateSides.sideA.trim() || !debateSides.sideB.trim() || isGenerating}
        className="btn-primary"
        style={{ width: "100%", marginTop: "0.5rem", padding: "0.85rem", fontSize: "0.95rem" }}
      >
        {isGenerating ? "⚔️ ..." : `⚡ ${t.buttons.debate}`}
      </button>

      {/* Argue Back section (shown when there's an assistant verdict in history) */}
      {debateChats.some(m => m.role === "assistant" && m.content.includes("[VERDICT]")) && (
        <div style={{ borderTop: "1px solid var(--glass-border)", marginTop: "1rem", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {roundCount >= 3 ? (
            <div 
              style={{ 
                border: "1.5px solid var(--accent-gold)", 
                background: "rgba(251, 191, 36, 0.05)", 
                color: "var(--accent-gold)", 
                padding: "0.75rem", 
                borderRadius: "8px", 
                textAlign: "center", 
                fontWeight: "bold", 
                fontSize: "0.85rem" 
              }}
            >
              🔒 DEBATE CLOSED (3 Rounds Completed)
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--accent-gold)", fontWeight: "bold" }}>
                  🎙️ VOICE DEBATE LOOP ACTIVE
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "auto", fontWeight: "bold" }}>
                  Round {roundCount} of 3
                </span>
              </div>
              <button
                type="button"
                className={`mic-button ${voiceCounter.isListening ? "listening" : ""}`}
                onClick={voiceCounter.isListening ? voiceCounter.stopListening : voiceCounter.startListening}
                disabled={isGenerating}
                style={{ width: "100%", height: "45px", borderRadius: "8px", display: "none", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                title="Your Counter-Argument"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" x2="12" y1="19" y2="22"/>
                </svg>
                <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>
                  {voiceCounter.isListening ? "Listening (click to send)..." : "Your Counter-Argument (Mic)"}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Toast error message */}
      {errorToast && (
        <div className="toast-error" style={{ position: "relative", bottom: "auto", marginTop: "0.5rem" }}>
          {errorToast}
        </div>
      )}
    </div>
  );
}
