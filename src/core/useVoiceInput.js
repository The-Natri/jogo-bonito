import { useState, useRef } from "react";
import { translations } from "../data/translations.js";

export function useVoiceInput({ onTranscript, onError, language }) {
  const [isListening, setIsListening] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const api = window.qvac || window.electronAPI;

  const startListening = async () => {
    try {
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const arrayBuffer = await blob.arrayBuffer();

          if (api) {
            // Register transcript result listener ONCE
            const cleanupListener = api.onTranscriptResult((result) => {
              cleanupListener(); // Unsubscribe immediately after the first event fires
              if (result.error) {
                onError(result.error);
              } else {
                onTranscript(result.text);
              }
            });

            // Call main process transcribe API
            await api.transcribeAudio(arrayBuffer, language || "en");
          } else {
            console.error("QVAC electron API is not available.");
            onError("Electron API not available.");
          }
        } catch (err) {
          console.error("Error during voice transcription processing:", err);
          onError(err.message);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      console.error("Mic permission or recorder startup failed:", err);
      const errMsg = translations[language]?.errorNoMic || "Microphone permission denied.";
      onError(errMsg);
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    // Stop all media tracks to release the microphone lock immediately
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsListening(false);
  };

  return { isListening, startListening, stopListening };
}
