import React, { createContext, useContext, useState, useEffect } from "react";

export const SUPPORTED_LANGUAGES = { 
  en: { name: 'English', flag: '🇬🇧' },
  pt: { name: 'Português', flag: '🇧🇷' },
  es: { name: 'Español', flag: '🇪🇸' },
  fr: { name: 'Français', flag: '🇫🇷' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
  it: { name: 'Italiano', flag: '🇮🇹' },
  nl: { name: 'Nederlands', flag: '🇳🇱' },
  ja: { name: '日本語', flag: '🇯🇵' }
};

const AppStateContext = createContext();

export function AppStateProvider({ children }) {
  const [currentMode, setCurrentMode] = useState("tactician");
  const [currentLanguage, setCurrentLanguage] = useState("en");
  
  // Model loading state
  const [modelProgress, setModelProgress] = useState(0); // 0 to 100
  const [modelStatus, setModelStatus] = useState("loading"); // "loading", "ready", "error"
  const [modelError, setModelError] = useState(null);

  // Chat histories for each mode
  const [chats, setChats] = useState({
    tactician: [],
    learn: [],
    predict: [],
    debate: [],
    commentate: [],
    formation: []
  });

  // Dynamic user level for Learn mode
  const [userLevel, setUserLevel] = useState(null); // null, "beginner", "intermediate", "expert"

  // Mode inputs
  const [predictTeams, setPredictTeams] = useState({ home: "", away: "" });
  const [debateSides, setDebateSides] = useState({ sideA: "", sideB: "" });
  const [commentaryTimeline, setCommentaryTimeline] = useState([]);
  const [textInput, setTextInput] = useState("");
  
  // Running states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Connect to Electron IPC events for model loading
  useEffect(() => {
    if (window.qvac) {
      window.qvac.onProgress((progress) => {
        const pct = typeof progress === "object" && progress !== null
          ? (progress.percent !== undefined ? progress.percent : progress.percentage)
          : progress;
        const numericPct = Math.round(pct || 0);
        setModelProgress(numericPct);
        if (numericPct >= 100) {
          setModelStatus("ready");
        }
      });

      window.qvac.onLoaded(() => {
        setModelProgress(100);
        setModelStatus("ready");
      });

      window.qvac.onError((error) => {
        setModelStatus("error");
        setModelError(error);
      });
      
      // Hear back fallback TTS events
      window.qvac.onTTSFallback(({ text, language }) => {
        console.log(`QVAC main process requested Web Speech API fallback for [${language}]:`, text);
        speakWithWebSpeech(text, language);
      });
      
      // Hear back TTS audio PCM samples
      window.qvac.onTTSAudio((buffer) => {
        console.log(`Received local TTS PCM buffer: ${buffer?.length} samples.`);
        if (buffer && buffer.length > 0) {
          playPCMAudio(buffer);
        } else {
          setIsSpeaking(false);
        }
      });
      
      // Hear back TTS state changes
      window.qvac.onTTSStatus((status) => {
        setIsSpeaking(status === "playing");
      });
    } else {
      // Browser fallback / fallback mock for standalone design testing
      console.warn("Electron API (window.qvac) not found. Simulating model loading...");
      let prog = 0;
      const interval = setInterval(() => {
        prog += 5;
        setModelProgress(prog);
        if (prog >= 100) {
          clearInterval(interval);
          setModelStatus("ready");
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Web Speech API Synthesis Player (Fallback & Standard)
  const speakWithWebSpeech = (text, langCode = "en") => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop current speech
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    // Find a voice matching the language code if possible
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.toLowerCase().startsWith(langCode.toLowerCase())) || voices[0];
    if (voice) utterance.voice = voice;
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Play PCM audio samples received from local TTS engine (24000Hz mono)
  const playPCMAudio = (pcmSamples, sampleRate = 24000) => {
    try {
      if (!window.AudioContext && !window.webkitAudioContext) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      
      const buffer = ctx.createBuffer(1, pcmSamples.length, sampleRate);
      const channelData = buffer.getChannelData(0);
      
      let maxVal = 0;
      for (let i = 0; i < pcmSamples.length; i++) {
        const val = Math.abs(pcmSamples[i]);
        if (val > maxVal) maxVal = val;
      }
      
      const divisor = maxVal > 1.0 ? 32768 : 1;
      for (let i = 0; i < pcmSamples.length; i++) {
        channelData[i] = pcmSamples[i] / divisor;
      }
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        setIsSpeaking(false);
      };
      
      setIsSpeaking(true);
      source.start(0);
    } catch (e) {
      console.error("Error playing local QVAC TTS PCM audio:", e);
      setIsSpeaking(false);
    }
  };

  // Triggers TTS playback
  const triggerTTS = (text, lang = "en") => {
    if (window.qvac) {
      setIsSpeaking(true);
      window.qvac.speakTTS({ text, language: lang });
    } else {
      speakWithWebSpeech(text, lang);
    }
  };

  // Helper to detect learning query complexity
  const detectLearningComplexity = (message) => {
    const text = message.toLowerCase();
    const expertTerms = [
      "half-space", "half space", "juego de posicion", "positional play",
      "rest defense", "resting defense", "low block", "mid block", "gegenpress",
      "pressing trigger", "inverted fullback", "inverted wingback", "double pivot",
      "double-pivot", "regista", "catenaccio", "tiki-taka", "tikitaka", "false nine",
      "false 9", "asymmetric", "box midfield", "overload", "xg", "expected goals"
    ];
    const intermediateTerms = [
      "formation", "tactics", "midfielder", "winger", "fullback", "wingback",
      "counter-attack", "counter attack", "offside trap", "zonal marking",
      "man marking", "4-3-3", "4-2-3-1", "3-5-2", "overlapping", "underlapping"
    ];

    const hasExpert = expertTerms.some(term => text.includes(term));
    if (hasExpert) return "expert";

    const hasIntermediate = intermediateTerms.some(term => text.includes(term));
    if (hasIntermediate) return "intermediate";

    return "beginner";
  };

  // Send message helper
  const sendMessage = async (messageText, customInput = null) => {
    if (!messageText.trim() && !customInput) return;
    
    let activeLevel = userLevel;
    // Set user level dynamically from the first message in learn mode
    if (currentMode === "learn" && chats.learn.length === 0) {
      const level = detectLearningComplexity(messageText);
      setUserLevel(level);
      activeLevel = level;
    }

    // Append user message
    const userMsg = { role: "user", content: messageText };
    setChats(prev => ({
      ...prev,
      [currentMode]: [...prev[currentMode], userMsg]
    }));
    
    setIsGenerating(true);

    // Placeholder for assistant streaming message
    const assistantMsgId = Date.now();
    let currentContent = "";
    
    setChats(prev => ({
      ...prev,
      [currentMode]: [...prev[currentMode], { id: assistantMsgId, role: "assistant", content: "" }]
    }));

    if (window.qvac) {
      try {
        // Send to main process via contextBridge
        const cleanupTokenListener = window.qvac.onToken((token) => {
          currentContent += token;
          setChats(prev => {
            const list = [...prev[currentMode]];
            const idx = list.findIndex(m => m.id === assistantMsgId);
            if (idx !== -1) {
              list[idx] = { ...list[idx], content: currentContent };
            }
            return { ...prev, [currentMode]: list };
          });
        });

        const recentHistory = chats[currentMode].slice(-4);
        const history = recentHistory.map(m => ({
          role: m.role,
          content: m.content.slice(0, 300)
        }));
        history.push({ role: userMsg.role, content: userMsg.content.slice(0, 300) });

        // Dispatches the IPC prompt call
        await window.qvac.sendPrompt({
          mode: currentMode,
          history,
          userInput: messageText,
          userLevel: activeLevel,
          contextData: customInput,
          language: currentLanguage
        });

        cleanupTokenListener();
        setIsGenerating(false);
        
        // Post-generation actions (e.g. speak commentary if we just generated match commentary)
        if (currentMode === "commentate") {
          // triggerTTS(currentContent, currentLanguage); // TTS disabled until Round 2
        }
      } catch (err) {
        console.error("IPC sendPrompt error:", err);
        setChats(prev => {
          const list = [...prev[currentMode]];
          const idx = list.findIndex(m => m.id === assistantMsgId);
          if (idx !== -1) {
            list[idx] = { ...list[idx], content: "⚠️ Error generating response: " + err.message };
          }
          return { ...prev, [currentMode]: list };
        });
        setIsGenerating(false);
      }
    } else {
      // Mock streaming fallback for styling & browser dev testing
      let count = 0;
      const responseText = `[Simulated response for ${currentMode} mode]: Football intelligence local engine is ready. You queried: "${messageText}". 
Here is your breakdown in Pitch Green styling!`;
      
      const streamInterval = setInterval(() => {
        if (count < responseText.length) {
          currentContent += responseText.charAt(count);
          setChats(prev => {
            const list = [...prev[currentMode]];
            const idx = list.findIndex(m => m.id === assistantMsgId);
            if (idx !== -1) {
              list[idx] = { ...list[idx], content: currentContent };
            }
            return { ...prev, [currentMode]: list };
          });
          count += 3; // stream 3 chars at a time
        } else {
          clearInterval(streamInterval);
          setIsGenerating(false);
          if (currentMode === "commentate") {
            // triggerTTS(currentContent, currentLanguage); // TTS disabled until Round 2
          }
        }
      }, 30);
    }
  };

  const clearChat = () => {
    setChats(prev => ({
      ...prev,
      [currentMode]: []
    }));
    if (currentMode === "learn") {
      setUserLevel(null); // Reset detected level on clear
    }
  };

  return React.createElement(
    AppStateContext.Provider,
    {
      value: {
        currentMode,
        setCurrentMode,
        currentLanguage,
        setCurrentLanguage,
        modelProgress,
        modelStatus,
        modelError,
        chats,
        sendMessage,
        clearChat,
        userLevel,
        setUserLevel,
        predictTeams,
        setPredictTeams,
        debateSides,
        setDebateSides,
        commentaryTimeline,
        setCommentaryTimeline,
        textInput,
        setTextInput,
        isGenerating,
        isSpeaking,
        triggerTTS,
        speakWithWebSpeech
      }
    },
    children
  );
}

export function useAppState() {
  return useContext(AppStateContext);
}
