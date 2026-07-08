const { contextBridge, ipcRenderer } = require("electron");

const api = {
  sendPrompt: (args) => ipcRenderer.invoke("qvac:send-prompt", args),
  speakTTS: (text) => ipcRenderer.invoke("qvac:tts-speak", text),
  unload: () => ipcRenderer.invoke("qvac:unload"),
  
  // Voice Input & Transcription bindings
  transcribeAudio: (buffer, language) => {
    return ipcRenderer.invoke("qvac:transcribe", language ? { buffer, language } : buffer);
  },
  onTranscriptResult: (callback) => {
    const listener = (event, result) => callback(result);
    ipcRenderer.on("qvac:transcript-result", listener);
    return () => ipcRenderer.off("qvac:transcript-result", listener);
  },
  onLoadProgress: (callback) => {
    const listener = (event, progress) => callback(progress);
    ipcRenderer.on("qvac:load-progress", listener);
    return () => ipcRenderer.off("qvac:load-progress", listener);
  },
  onAllReady: (callback) => {
    const listener = (event) => callback();
    ipcRenderer.on("qvac:all-ready", listener);
    return () => ipcRenderer.off("qvac:all-ready", listener);
  },
  
  // Existing progress / loading events from Day 2
  onProgress: (callback) => {
    const listener = (event, progress) => callback(progress);
    ipcRenderer.on("qvac:load-progress", listener);
    return () => ipcRenderer.off("qvac:load-progress", listener);
  },
  onLoaded: (callback) => {
    const listener = (event) => callback();
    ipcRenderer.on("qvac:loaded", listener);
    return () => ipcRenderer.off("qvac:loaded", listener);
  },
  onError: (callback) => {
    const listener = (event, error) => callback(error);
    ipcRenderer.on("qvac:error", listener);
    return () => ipcRenderer.off("qvac:error", listener);
  },
  onToken: (callback) => {
    const listener = (event, token) => callback(token);
    ipcRenderer.on("qvac:token-stream", listener);
    return () => ipcRenderer.off("qvac:token-stream", listener);
  },
  onTTSAudio: (callback) => {
    const listener = (event, buffer) => callback(buffer);
    ipcRenderer.on("qvac:tts-audio", listener);
    return () => ipcRenderer.off("qvac:tts-audio", listener);
  },
  onTTSFallback: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on("qvac:tts-fallback", listener);
    return () => ipcRenderer.off("qvac:tts-fallback", listener);
  },
  onTTSStatus: (callback) => {
    const listener = (event, status) => callback(status);
    ipcRenderer.on("qvac:tts-status", listener);
    return () => ipcRenderer.off("qvac:tts-status", listener);
  }
};

// Dual exposure to ensure compatibility with Day 2 and Day 3 call patterns
contextBridge.exposeInMainWorld("qvac", api);
contextBridge.exposeInMainWorld("electronAPI", api);
