import React, { useState } from "react";
import { useAppState } from "../core/stateManager.js";
import { matchEvents } from "../data/matchEvents.js";
import { translations } from "../data/translations.js";
import { useVoiceInput } from "../core/useVoiceInput.js";

export default function CommentateInput() {
  const { 
    commentaryTimeline, 
    setCommentaryTimeline, 
    sendMessage, 
    isGenerating, 
    isSpeaking,
    currentLanguage,
    chats,
    speakWithWebSpeech
  } = useAppState();

  const [commentaryNote, setCommentaryNote] = useState("");
  const [errorToast, setErrorToast] = useState(null);
  const lastSpokenIdRef = React.useRef(null);

  const t = translations[currentLanguage] || translations.en;

  const handleTriggerEvent = (event) => {
    if (isGenerating) return;

    // Calculate match minute sequentially
    let nextMin = 0;
    if (commentaryTimeline.length > 0) {
      const lastItem = commentaryTimeline[commentaryTimeline.length - 1];
      if (event.type === "KICKOFF") {
        nextMin = 0;
      } else if (event.type === "FULL_TIME") {
        nextMin = 90;
      } else {
        nextMin = Math.min(89, lastItem.minute + Math.floor(Math.random() * 12) + 3);
      }
    } else {
      if (event.type !== "KICKOFF") {
        nextMin = Math.floor(Math.random() * 15) + 1;
      }
    }

    // Append transcribed commentary note context if present
    const noteText = commentaryNote.trim();
    const finalContext = event.defaultText + (noteText ? ` (${currentLanguage === 'ja' ? '補足メモ' : 'Note'}: ${noteText})` : "");

    const newEvent = {
      id: Date.now(),
      type: event.type,
      label: event.label,
      icon: event.icon,
      minute: nextMin,
      defaultText: finalContext
    };

    setCommentaryTimeline(prev => [...prev, newEvent]);

    // Send to LLM
    const promptText = `[Minute ${nextMin}'] Match Event: ${event.type}. Context: ${finalContext}. 
Please provide live, spoken-style commentary for this moment. Keep it under 3 short paragraphs.`;
    
    sendMessage(promptText, newEvent);

    // Clear the note field
    setCommentaryNote("");
  };

  React.useEffect(() => {
    if (isGenerating) return;
    const history = chats.commentate;
    if (!history || history.length === 0) return;
    const lastMsg = history[history.length - 1];
    if (lastMsg.role === "assistant" && lastMsg.content && lastSpokenIdRef.current !== lastMsg.id) {
      lastSpokenIdRef.current = lastMsg.id;
      speakWithWebSpeech(lastMsg.content, currentLanguage);
    }
  }, [isGenerating, chats.commentate, currentLanguage, speakWithWebSpeech]);

  const handleReplayTTS = (text) => {
    speakWithWebSpeech(text, currentLanguage);
  };

  const handleStopAudio = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const clearTimeline = () => {
    setCommentaryTimeline([]);
  };

  const voiceInput = useVoiceInput({
    language: currentLanguage,
    onTranscript: (text) => {
      setCommentaryNote(prev => (prev ? prev + " " : "") + text);
    },
    onError: (err) => {
      setErrorToast(err);
      setTimeout(() => {
        setErrorToast(null);
      }, 3000);
    }
  });

  return (
    <div className="commentate-container glass-panel" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", paddingBottom: "0.5rem", marginBottom: "0.75rem" }}>
        <h3 style={{ fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
          <span>🎙️</span> {t.modes.commentate}
        </h3>
        {commentaryTimeline.length > 0 && (
          <button className="btn-secondary" onClick={clearTimeline} style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem", borderRadius: "4px" }}>
            {t.buttons.resetMatch}
          </button>
        )}
      </div>

      {/* Grid of buttons */}
      <div>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.4rem", fontWeight: 600 }}>{t.buttons.addEvent}:</span>
        <div className="event-grid">
          {matchEvents.map(e => (
            <button
              key={e.type}
              onClick={() => handleTriggerEvent(e)}
              disabled={isGenerating}
              className="btn-event"
            >
              <span>{e.icon}</span>
              <span>{e.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Commentary Note Input with Mic Button */}
      <div style={{ margin: "0.75rem 0", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
          {currentLanguage === 'ja' ? '解説メモ（オプション）:' : 'Commentary Note (Optional):'}
        </label>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="text"
            value={commentaryNote}
            onChange={(e) => setCommentaryNote(e.target.value)}
            placeholder={currentLanguage === 'ja' ? '例：ホームチームが攻勢を強めています...' : 'e.g., Home team is pressing hard...'}
            className="chat-input"
            style={{ flex: 1, fontSize: "0.85rem", padding: "0.55rem" }}
            disabled={isGenerating}
          />
          <button
            type="button"
            className={`mic-button ${voiceInput.isListening ? "listening" : ""}`}
            onClick={voiceInput.isListening ? voiceInput.stopListening : voiceInput.startListening}
            disabled={isGenerating}
            style={{ width: "40px", height: "40px", display: "none" }}
            title="Voice Input Commentary Note"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" x2="12" y1="19" y2="22"/>
            </svg>
          </button>
        </div>
      </div>

      {/* TTS Status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px dashed var(--glass-border)", fontSize: "0.85rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ 
            width: "8px", 
            height: "8px", 
            borderRadius: "50%", 
            background: isSpeaking ? "var(--accent-neon)" : "var(--text-muted)",
            boxShadow: isSpeaking ? "0 0 8px var(--accent-neon)" : "none",
            transition: "all 0.3s"
          }}></div>
          <span style={{ color: isSpeaking ? "#fff" : "var(--text-muted)" }}>
            {isSpeaking ? t.labels.audioSpeaking : t.labels.audioIdle}
          </span>
        </div>
        {isSpeaking && (
          <button 
            type="button"
            onClick={handleStopAudio} 
            className="btn-secondary" 
            style={{ 
              padding: "0.2rem 0.6rem", 
              fontSize: "0.75rem", 
              borderRadius: "4px", 
              background: "rgba(239, 68, 68, 0.15)", 
              border: "1px solid rgba(239, 68, 68, 0.4)", 
              color: "#f87171",
              cursor: "pointer"
            }}
          >
            ⏹️ Stop Audio
          </button>
        )}
      </div>

      {/* Scrolling Match Timeline visual */}
      <div style={{ marginTop: "0.75rem" }}>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.4rem", fontWeight: 600 }}>{t.labels.matchTimeline}</span>
        <div className="timeline-scroller">
          {commentaryTimeline.length === 0 ? (
            <div style={{ display: "flex", height: "100%", justifyContent: "center", alignItems: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              {t.labels.noEvents}
            </div>
          ) : (
            commentaryTimeline.map((item) => (
              <div key={item.id} className="timeline-event-item">
                <div className="timeline-event-icon">
                  {item.icon}
                </div>
                <div className="timeline-event-content">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="timeline-event-title">
                      {item.label} ({item.minute}')
                    </span>
                  </div>
                  <span className="timeline-event-text">
                    {item.defaultText}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Toast error message */}
      {errorToast && (
        <div className="toast-error" style={{ position: "relative", bottom: "auto", marginTop: "0.5rem" }}>
          {errorToast}
        </div>
      )}
    </div>
  );
}
