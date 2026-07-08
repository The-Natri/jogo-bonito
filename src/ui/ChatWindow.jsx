import React, { useEffect, useRef, useState } from "react";
import { useAppState } from "../core/stateManager.js";
import { translations } from "../data/translations.js";
import { useVoiceInput } from "../core/useVoiceInput.js";

const ROLES = {
  en: { user: "You", assistant: "Jogo Bonito Engine" },
  pt: { user: "Você", assistant: "Mecanismo Jogo Bonito" },
  es: { user: "Tú", assistant: "Motor Jogo Bonito" },
  fr: { user: "Vous", assistant: "Moteur Jogo Bonito" },
  de: { user: "Sie", assistant: "Jogo Bonito Engine" },
  it: { user: "Tu", assistant: "Motore Jogo Bonito" },
  nl: { user: "Jij", assistant: "Jogo Bonito Engine" },
  ja: { user: "あなた", assistant: "Jogo Bonito エンジン" }
};

const EMPTY_MESSAGES = {
  en: "Send a message to analyze tactics, learn, predict, or debate!",
  pt: "Envie uma mensagem para analisar táticas, aprender, prever ou debater!",
  es: "¡Envía un mensaje para analizar tácticas, aprender, predecir o debatir!",
  fr: "Envoyez un message pour analyser la tactique, apprendre, prédire ou débattre !",
  de: "Sende eine Nachricht, um Taktiken zu analysieren, zu lernen, zu prognostizieren oder zu debattieren!",
  it: "Invia un messaggio per analizzare le tattiche, imparare, pronosticare o dibattere!",
  nl: "Stuur een bericht om tactieken te analyseren, te leren, te voorspellen of te debatteren!",
  ja: "メッセージを送信して、戦術の分析、学習、予想、または討論を開始します！"
};

const VERDICT_STRINGS = {
  en: { title: "Debate Verdict", confidence: "Confidence", winner: "Winner", args: "Key Deciding Arguments" },
  pt: { title: "Veredicto do Debate", confidence: "Confiança", winner: "Vencedor", args: "Argumentos Finais" },
  es: { title: "Veredicto del Debate", confidence: "Confianza", winner: "Ganador", args: "Argumentos Decisivos" },
  fr: { title: "Verdict du Débat", confidence: "Confiance", winner: "Vainqueur", args: "Arguments Décisifs" },
  de: { title: "Debatten-Urteil", confidence: "Vertrauen", winner: "Gewinner", args: "Ausschlaggebende Argumente" },
  it: { title: "Verdetto del Dibattito", confidence: "Fiducia", winner: "Vincitore", args: "Argomenti Decisivi" },
  nl: { title: "Debat Verdict", confidence: "Vertrouwen", winner: "Winnaar", args: "Doorslaggevende Argumenten" },
  ja: { title: "討論の判定", confidence: "信頼度", winner: "勝者", args: "主な逆転の理由" }
};

// Helper to safely format Markdown into basic HTML elements
function formatMarkdown(text) {
  if (!text) return "";
  
  // Escape HTML
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Inline code / stats
  html = html.replace(/`(.*?)`/g, '<code class="font-mono" style="background: rgba(255,255,255,0.08); padding: 0.1rem 0.3rem; border-radius: 4px; color: #00ff87;">$1</code>');
  
  // Bullet items
  const lines = html.split('\n');
  let inList = false;
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.substring(2);
      let out = "";
      if (!inList) {
        out += '<ul style="margin-left: 1.5rem; margin-bottom: 0.75rem; list-style-type: disc;">';
        inList = true;
      }
      out += `<li style="margin-bottom: 0.25rem;">${content}</li>`;
      return out;
    } else {
      let out = "";
      if (inList) {
        out += '</ul>';
        inList = false;
      }
      out += line ? `<p style="margin-bottom: 0.5rem;">${line}</p>` : '';
      return out;
    }
  });
  if (inList) {
    processedLines.push('</ul>');
  }
  
  return processedLines.join('');
}

// Verdict Parser Helper
const parseVerdict = (content) => {
  const match = content.match(/\[VERDICT\]([\s\S]*?)\[\/VERDICT\]/);
  if (!match) return null;
  
  const rawData = match[1].trim();
  const parts = rawData.split("|").map(p => p.trim());
  const data = {};
  parts.forEach(part => {
    const colonIdx = part.indexOf(":");
    if (colonIdx !== -1) {
      const key = part.slice(0, colonIdx).trim().toLowerCase();
      const val = part.slice(colonIdx + 1).trim();
      data[key] = val;
    }
  });

  // Remove verdict block from primary text
  const cleanContent = content.replace(/\[VERDICT\][\s\S]*?\[\/VERDICT\]/, "").trim();

  return {
    cleanContent,
    winner: data.winner || "Draw / Undetermined",
    confidence: data.confidence || "50%",
    arguments: data.arguments ? data.arguments.split(";").map(a => a.trim()).filter(Boolean) : []
  };
};

export default function ChatWindow({ language }) {
  const { 
    currentMode, 
    chats, 
    clearChat, 
    userLevel, 
    isGenerating, 
    currentLanguage,
    textInput,
    setTextInput,
    sendMessage
  } = useAppState();

  const messagesEndRef = useRef(null);
  const currentChats = chats[currentMode] || [];
  const [errorToast, setErrorToast] = useState(null);

  const lang = language || currentLanguage;
  const t = translations[lang] || translations.en;
  const roleNames = ROLES[lang] || ROLES.en;
  const emptyMsg = EMPTY_MESSAGES[lang] || EMPTY_MESSAGES.en;
  const verdictStr = VERDICT_STRINGS[lang] || VERDICT_STRINGS.en;

  const { isListening, startListening, stopListening } = useVoiceInput({
    language: lang,
    onTranscript: (text) => {
      setTextInput(text);
      if (text.trim()) {
        sendMessage(text);
        setTextInput("");
      }
    },
    onError: (err) => {
      setErrorToast(err);
      setTimeout(() => {
        setErrorToast(null);
      }, 3000);
    }
  });

  const handleSend = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!textInput.trim() || isGenerating) return;
    sendMessage(textInput);
    setTextInput("");
  };

  const isCustomInputMode = ["predict", "debate", "commentate"].includes(currentMode);

  // Auto-scroll to bottom of chats
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChats.length, isGenerating]);

  return (
    <div className="chat-section glass-panel" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Chat header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--glass-border)", paddingBottom: "0.75rem", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <h2 style={{ textTransform: "capitalize", fontSize: "1.1rem", margin: 0 }}>
            {t.modes[currentMode] || currentMode} {t.labels.streamTitle}
          </h2>
          
          {/* Knowledge level badge shown in Learn mode */}
          {currentMode === "learn" && userLevel && (
            <span className={`user-level-badge ${userLevel}`}>
              🎓 {userLevel} {t.labels.levelDetected}
            </span>
          )}
        </div>
        
        {currentChats.length > 0 && (
          <button className="btn-secondary" onClick={clearChat} style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", borderRadius: "6px" }}>
            🧹 {t.buttons.clearChat}
          </button>
        )}
      </div>

      {/* Message List */}
      <div className="chat-window-container" style={{ flex: 1, overflowY: "auto", marginBottom: "1rem" }}>
        {currentChats.length === 0 ? (
          <div style={{ display: "flex", flex: 1, height: "100%", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "var(--text-muted)", fontSize: "0.95rem" }}>
            <span>⚽ Jogo Bonito</span>
            <span>{emptyMsg}</span>
          </div>
        ) : (
          currentChats.map((msg, index) => {
            const isUser = msg.role === "user";
            
            // Check for debate verdict card parsing
            const verdict = !isUser && currentMode === "debate" ? parseVerdict(msg.content) : null;
            const contentToDisplay = verdict ? verdict.cleanContent : msg.content;
            
            const getBubbleHeader = () => {
              if (isUser) return roleNames.user;
              if (currentMode === "debate" && !msg.content.includes("[VERDICT]")) {
                return "⚖️ JUDGE RESPONDS";
              }
              return roleNames.assistant;
            };

            return (
              <div key={index} className={`chat-bubble ${msg.role}`}>
                <div className="bubble-header">{getBubbleHeader()}</div>
                
                {/* Main body content */}
                <div 
                  className="bubble-content" 
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(contentToDisplay) }} 
                />

                {/* Verdict Card UI */}
                {verdict && (
                  <div className="verdict-card">
                    <div className="verdict-header">
                      <div className="verdict-title">
                        <span>🏆</span> {verdictStr.title}
                      </div>
                      <span className="font-mono" style={{ fontSize: "0.85rem", color: "var(--accent-gold)", fontWeight: "bold" }}>
                        {verdictStr.confidence}: {verdict.confidence}
                      </span>
                    </div>
                    <div className="verdict-winner">
                      {verdictStr.winner}: <span style={{ color: "var(--accent-neon)" }}>{verdict.winner}</span>
                    </div>
                    
                    {/* Confidence Meter Visual */}
                    <div className="verdict-confidence-bar">
                      <div 
                        className="verdict-confidence-fill" 
                        style={{ width: verdict.confidence.includes("%") ? verdict.confidence : `${verdict.confidence}%` }}
                      />
                    </div>
                    
                    {verdict.arguments.length > 0 && (
                      <div>
                        <div className="verdict-args-title">{verdictStr.args}</div>
                        <ul className="verdict-args-list">
                          {verdict.arguments.map((arg, idx) => (
                            <li key={idx} className="verdict-args-item">{arg}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        
        {/* Streaming loader indicator */}
        {isGenerating && (
          <div className="chat-bubble assistant" style={{ width: "fit-content" }}>
            <div className="bubble-header">{roleNames.assistant}</div>
            <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
              <div style={{ width: "6px", height: "6px", background: "var(--accent-green)", borderRadius: "50%", animation: "pulse-glow 1s infinite alternate" }}></div>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{t.labels.thinking}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input section at the bottom of the chat display */}
      {!isCustomInputMode ? (
        <div className="chat-input-container" style={{ position: "relative", display: "flex", gap: "0.5rem", flexShrink: 0 }}>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(e); }}
            placeholder={t.placeholders[currentMode]}
            className="chat-input"
            disabled={isGenerating}
            style={{ flex: 1 }}
          />
          
          {/* Circular Voice Input Mic Button */}
          <button
            type="button"
            className={`mic-button ${isListening ? "listening" : ""}`}
            onClick={isListening ? stopListening : startListening}
            disabled={isGenerating}
            style={{ display: "none" }}
            title="Voice Input"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" x2="12" y1="19" y2="22"/>
            </svg>
          </button>

          <button type="button" onClick={handleSend} className="btn-primary" disabled={!textInput.trim() || isGenerating}>
            {t.buttons.send} ⚡
          </button>

          {/* Toast error message */}
          {errorToast && (
            <div className="toast-error">
              {errorToast}
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", padding: "0.5rem", background: "rgba(0,0,0,0.15)", borderRadius: "6px", border: "1px dashed var(--glass-border)", flexShrink: 0 }}>
          ℹ️ {lang === 'ja' ? '入力はこのモード用の右側の設定パネルで行います。' : 'Input for this mode is handled by the setup panel on the right.'}
        </div>
      )}
    </div>
  );
}
