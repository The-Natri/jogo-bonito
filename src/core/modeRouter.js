import { promptTemplates } from "./promptTemplates.js";

const LANGUAGE_NAMES = {
  en: "English",
  pt: "Português",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  nl: "Nederlands",
  ja: "日本語"
};

/**
 * Resolves the appropriate system prompt based on the current mode and options.
 * 
 * @param {string} mode - The active mode.
 * @param {object} options - Input details (userLevel, homeTeam, awayTeam, etc.).
 * @returns {string} The system prompt string.
 */
export function getSystemPrompt(mode, options = {}) {
  let prompt = "";
  switch (options.mode || mode) {
    case "tactician":
      prompt = promptTemplates.tactician;
      break;
    case "learn":
      prompt = promptTemplates.learn(options.userLevel || "intermediate");
      break;
    case "predict":
      if (options.homeTeam && options.awayTeam) {
        prompt = promptTemplates.predict(options.homeTeam, options.awayTeam);
      } else {
        prompt = "You are a match predictor assistant comparing teams on Quality, Value, Cohesion, and Variation.";
      }
      break;
    case "debate":
      prompt = promptTemplates.debate
        .replace(/{sideA}/g, options.sideA || "Concept A")
        .replace(/{sideB}/g, options.sideB || "Concept B");
      break;
    case "commentate":
      prompt = promptTemplates.commentate
        .replace(/{event}/g, options.type || "Match Event")
        .replace(/{note}/g, options.note || "None");
      break;
    case "formation":
      prompt = promptTemplates.formation(
        options.teamName || "",
        options.managerName || "",
        options.managerLineup || "",
        options.userLineup || ""
      );
      break;
    case "debate_counter":
      prompt = promptTemplates.debateCounter(
        options.topic || "",
        options.userCounter || "",
        options.previousVerdict || ""
      );
      break;
    default:
      prompt = "You are a football analysis engine named Jogo Bonito.";
  }

  const langCode = options.language || "en";
  const languageName = LANGUAGE_NAMES[langCode] || "English";
  return prompt.replace(/{languageName}/g, languageName);
}
