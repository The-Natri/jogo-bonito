import React, { useState, useRef, useEffect } from "react";
import { useAppState, SUPPORTED_LANGUAGES } from "../core/stateManager.js";

export default function LanguageSelector() {
  const { currentLanguage, setCurrentLanguage } = useAppState();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = SUPPORTED_LANGUAGES[currentLanguage] || SUPPORTED_LANGUAGES.en;

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (langCode) => {
    setCurrentLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: "relative", 
        display: "inline-block",
        zIndex: 50
      }}
    >
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "rgba(17, 43, 29, 0.75)",
          backdropFilter: "blur(8px)",
          border: "1px solid var(--accent-gold)",
          color: "#fff",
          padding: "0.4rem 0.8rem",
          borderRadius: "6px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontWeight: "600",
          fontSize: "0.85rem",
          boxShadow: isOpen ? "0 0 10px rgba(251, 191, 36, 0.25)" : "none",
          transition: "var(--transition-smooth)",
          outline: "none"
        }}
      >
        <span style={{ fontSize: "1.1rem" }}>{selected.flag}</span>
        <span>{selected.name}</span>
        <span style={{ 
          fontSize: "0.6rem", 
          transform: isOpen ? "rotate(180deg)" : "rotate(0)",
          transition: "transform 0.2s"
        }}>
          ▼
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "0.5rem",
            background: "rgba(11, 26, 19, 0.95)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--glass-border)",
            borderRadius: "8px",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.5), 0 0 15px rgba(251, 191, 36, 0.1)",
            padding: "0.25rem",
            minWidth: "160px",
            display: "flex",
            flexDirection: "column",
            gap: "0.15rem",
            animation: "fadeIn 0.2s ease-out"
          }}
        >
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => {
            const isActive = code === currentLanguage;
            return (
              <button
                key={code}
                onClick={() => handleSelect(code)}
                style={{
                  background: isActive ? "rgba(16, 185, 129, 0.15)" : "transparent",
                  border: "none",
                  borderRadius: "6px",
                  color: isActive ? "var(--accent-neon)" : "var(--text-primary)",
                  padding: "0.5rem 0.75rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  width: "100%",
                  textAlign: "left",
                  fontSize: "0.85rem",
                  fontWeight: isActive ? "700" : "500",
                  transition: "var(--transition-smooth)",
                  outline: "none"
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
