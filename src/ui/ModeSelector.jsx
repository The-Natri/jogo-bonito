import React from "react";
import { useAppState } from "../core/stateManager.js";
import { translations } from "../data/translations.js";

const MODE_TABS = [
  {
    id: "tactician",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <path d="M4 4h16v16H4z"/><path d="M4 12h16M12 4v16"/>
      </svg>
    ),
  },
  {
    id: "learn",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <path d="M12 4L2 8l10 4 10-4-10-4z"/>
        <path d="M6 10v6c0 1 3 3 6 3s6-2 6-3v-6"/>
      </svg>
    ),
  },
  {
    id: "predict",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <path d="M4 20V10M12 20V4M20 20v-7"/>
      </svg>
    ),
  },
  {
    id: "debate",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <path d="M8 12a4 4 0 118 0 4 4 0 01-8 0z"/>
        <path d="M2 20c0-3 3-5 6-5M22 20c0-3-3-5-6-5"/>
      </svg>
    ),
  },
  {
    id: "commentate",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
      </svg>
    ),
  },
  {
    id: "formation",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <circle cx="12" cy="6" r="2"/><circle cx="6" cy="14" r="2"/>
        <circle cx="18" cy="14" r="2"/><circle cx="12" cy="20" r="2"/>
      </svg>
    ),
  },
];

export default function ModeSelector() {
  const { currentMode, setCurrentMode, currentLanguage, setTextInput } = useAppState();
  const t = translations[currentLanguage] || translations.en;

  function handleSelect(id) {
    if (id === currentMode) return;
    setCurrentMode(id);
    setTextInput("");
  }

  return (
    <nav className="bottom-nav" aria-label="Mode navigation">
      {MODE_TABS.map((tab) => (
        <button
          key={tab.id}
          className={`bottom-tab${currentMode === tab.id ? " active" : ""}`}
          onClick={() => handleSelect(tab.id)}
          aria-current={currentMode === tab.id ? "page" : undefined}
        >
          {tab.icon}
          <span>{t.modes[tab.id]}</span>
        </button>
      ))}
    </nav>
  );
}
