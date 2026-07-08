import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { 
  loadModel, 
  LLAMA_3_2_1B_INST_Q4_0,
  TTS_MULTILINGUAL_SUPERTONIC2_Q4_0,
  WHISPER_BASE_Q8_0,
  completion, 
  textToSpeech, 
  transcribe,
  unloadModel 
} from "@qvac/sdk";
import { getSystemPrompt } from "../src/core/modeRouter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let modelId = null;
let ttsModelId = null;
let whisperId = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      autoplayPolicy: "no-user-gesture-required"
    },
    backgroundColor: "#0b1a13",
    show: false
  });

  // Check if we are running in development mode
  const isDev = process.env.NODE_ENV === "development" || process.argv.includes("--dev");

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer Console] [Level ${level}] ${message} (at ${path.basename(sourceId)}:${line})`);
  });
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    // Start downloading/loading the QVAC local model once the window is ready
    loadQvacModel();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// 1. Load the QVAC Model
// 1. Load the QVAC Model
async function loadQvacModel() {
  try {
    console.log("Starting local QVAC model load process (LLM required, TTS and Whisper optional)...");
    
    if (mainWindow) {
      mainWindow.webContents.send("qvac:load-progress", { model: "llm", percent: 0 });
      mainWindow.webContents.send("qvac:load-progress", { model: "tts", percent: 0 });
      mainWindow.webContents.send("qvac:load-progress", { model: "whisper", percent: 0 });
    }

    // Start LLM model load (Required)
    const llmPromise = loadModel({
      modelSrc: LLAMA_3_2_1B_INST_Q4_0,
      onProgress: (progress) => {
        const percent = typeof progress === "object" && progress !== null
          ? Math.round(progress.percentage || progress.percent || 0)
          : Math.round(progress || 0);
        console.log(`LLM load progress: ${percent}%`);
        if (mainWindow) {
          mainWindow.webContents.send("qvac:load-progress", { model: "llm", percent });
        }
      }
    });

    // Start TTS model load in background (Optional)
    const ttsPromise = loadModel({
      modelSrc: TTS_MULTILINGUAL_SUPERTONIC2_Q4_0,
      modelType: "tts-ggml",
      modelConfig: {
        ttsEngine: "supertonic",
        language: "en"
      },
      onProgress: (progress) => {
        const percent = typeof progress === "object" && progress !== null
          ? Math.round(progress.percentage || progress.percent || 0)
          : Math.round(progress || 0);
        console.log(`TTS load progress: ${percent}%`);
        if (mainWindow) {
          mainWindow.webContents.send("qvac:load-progress", { model: "tts", percent });
        }
      }
    }).catch(err => {
      console.warn("TTS load failed (background):", err.message || JSON.stringify(err));
      if (mainWindow) {
        mainWindow.webContents.send("qvac:load-progress", { model: "tts", percent: 100 });
      }
      return null;
    });

    // Start Whisper model load in background (Optional)
    const whisperPromise = loadModel({
      modelSrc: WHISPER_BASE_Q8_0,
      modelType: "whispercpp-transcription",
      onProgress: (progress) => {
        const percent = typeof progress === "object" && progress !== null
          ? Math.round(progress.percentage || progress.percent || 0)
          : Math.round(progress || 0);
        console.log(`Whisper load progress: ${percent}%`);
        if (mainWindow) {
          mainWindow.webContents.send("qvac:load-progress", { model: "whisper", percent });
        }
      }
    }).catch(err => {
      console.warn("Whisper load failed (background):", err.message || JSON.stringify(err));
      if (mainWindow) {
        mainWindow.webContents.send("qvac:load-progress", { model: "whisper", percent: 100 });
      }
      return null;
    });

    // We await ONLY the required LLM load before launching
    modelId = await llmPromise;
    console.log("LLM Model loaded successfully! ID:", modelId);

    // Fire loaded and ready IPC signals so app unblocks immediately
    if (mainWindow) {
      mainWindow.webContents.send("qvac:loaded");
      mainWindow.webContents.send("qvac:all-ready");
    }

    // Await background models asynchronously so state gets set when they finish
    ttsPromise.then(res => {
      ttsModelId = res;
      console.log(`Background TTS model load complete. ID: ${ttsModelId}`);
    });

    whisperPromise.then(res => {
      whisperId = res;
      console.log(`Background Whisper model load complete. ID: ${whisperId}`);
    });

  } catch (error) {
    console.error("❌ Error loading local QVAC LLM model:", error);
    if (mainWindow) {
      mainWindow.webContents.send("qvac:error", error.message || "Failed to load LLM model.");
    }
  }
}

// 2. Unload the QVAC Model on Quit
async function unloadQvacModel() {
  if (modelId) {
    try {
      console.log("Unloading local QVAC model...");
      await unloadModel({ modelId });
      console.log("QVAC model unloaded successfully.");
      modelId = null;
    } catch (error) {
      console.error("Error unloading local QVAC model:", error);
    }
  }
  if (ttsModelId) {
    try {
      console.log("Unloading local QVAC TTS model...");
      await unloadModel({ modelId: ttsModelId });
      console.log("QVAC TTS model unloaded successfully.");
      ttsModelId = null;
    } catch (error) {
      console.error("Error unloading local QVAC TTS model:", error);
    }
  }
  if (whisperId) {
    try {
      console.log("Unloading local QVAC Whisper model...");
      await unloadModel({ modelId: whisperId });
      console.log("QVAC Whisper model unloaded successfully.");
      whisperId = null;
    } catch (error) {
      console.error("Error unloading local QVAC Whisper model:", error);
    }
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Unload model on exit
app.on("will-quit", async (event) => {
  // Prevent immediate quit to perform async unloading
  if (modelId || ttsModelId || whisperId) {
    event.preventDefault();
    await unloadQvacModel();
    app.quit();
  }
});

// IPC Handler: Completion inference (Prompt Streaming)
ipcMain.handle("qvac:send-prompt", async (event, args) => {
  const { mode, history, userInput, userLevel, contextData, language } = args;

  if (!modelId) {
    throw new Error("Model is not loaded yet.");
  }

  try {
    // Resolve system prompt using mode router
    const systemPrompt = getSystemPrompt(mode, {
      userLevel,
      homeTeam: contextData?.homeTeam,
      awayTeam: contextData?.awayTeam,
      language,
      ...contextData
    });

    // Format chat history for local completion
    const formattedHistory = [
      { role: "system", content: systemPrompt },
      ...history
    ];

    console.log(`Executing local completion for mode [${mode}]...`);

    // Call completion from QVAC SDK
    const response = completion({
      modelId,
      history: formattedHistory,
      stream: true
    });

    // Stream tokens to renderer
    for await (const token of response.tokenStream) {
      if (mainWindow) {
        mainWindow.webContents.send("qvac:token-stream", token);
      }
    }

    if (mainWindow) {
      mainWindow.webContents.send("qvac:token-stream-done");
    }
  } catch (error) {
    console.error("Error during inference completion:", error);
    throw error;
  }
});

// IPC Handler: Speech synthesis (TTS)
ipcMain.handle("qvac:tts-speak", async (event, args) => {
  try {
    let text = "";
    let language = "en";

    if (typeof args === "string") {
      text = args;
    } else if (args && typeof args === "object") {
      text = args.text || "";
      language = args.language || "en";
    }

    if (!text || text.trim() === "") return;
    if (!ttsModelId) throw new Error("TTS model not loaded");

    if (mainWindow) {
      mainWindow.webContents.send("qvac:tts-status", "playing");
    }

    console.log(`Synthesizing speech via QVAC local TTS [lang: ${language}]:`, text);

    const result = textToSpeech({ 
      modelId: ttsModelId,
      text,
      language: language,
      stream: false 
    });
    const buffer = await result.buffer; // number[] PCM samples

    if (buffer && buffer.length > 0) {
      console.log(`Speech synthesized. Sending ${buffer.length} PCM samples to renderer.`);
      if (mainWindow) {
        mainWindow.webContents.send("qvac:tts-audio", buffer);
      }
    } else {
      throw new Error("Local TTS returned empty PCM buffer.");
    }
  } catch (error) {
    console.error("Local QVAC TTS fallback triggered due to error:", error);
    let text = typeof args === "string" ? args : (args?.text || "");
    let language = typeof args === "string" ? "en" : (args?.language || "en");
    if (mainWindow) {
      mainWindow.webContents.send("qvac:tts-fallback", { text, language });
    }
  }
});

// IPC Handler: Unload request from renderer (forced cleanup)
ipcMain.handle("qvac:unload", async () => {
  await unloadQvacModel();
});

// IPC Handler: Audio transcription (Whisper)
ipcMain.handle("qvac:transcribe", async (event, args) => {
  try {
    if (!whisperId) throw new Error("Whisper model not loaded");

    let audioBuffer;
    let languageCode = "en";

    // Handle both object payload { buffer, language } and raw buffer payload
    if (args && args.buffer) {
      audioBuffer = args.buffer;
      languageCode = args.language || "en";
    } else {
      audioBuffer = args;
    }

    if (!audioBuffer) throw new Error("No audio buffer provided");

    // Ensure raw audio buffer sent from renderer is a Node.js Buffer
    const nodeBuffer = Buffer.isBuffer(audioBuffer) 
      ? audioBuffer 
      : Buffer.from(audioBuffer);

    console.log(`Transcribing audio chunk via QVAC local Whisper [size: ${nodeBuffer.length} bytes, lang: ${languageCode}]...`);

    // Call transcribe from QVAC SDK
    const textResult = await transcribe({
      modelId: whisperId,
      audioChunk: nodeBuffer,
      audio: nodeBuffer,
      language: languageCode
    });

    console.log("Transcription completed successfully:", textResult);

    if (mainWindow) {
      mainWindow.webContents.send("qvac:transcript-result", { text: textResult });
    }

    return { text: textResult };
  } catch (error) {
    console.error("❌ Error transcribing audio:", error);
    if (mainWindow) {
      mainWindow.webContents.send("qvac:transcript-result", { error: error.message });
    }
    return { error: error.message };
  }
});
