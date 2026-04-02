import React from "react";
export default function TranslationResults({
  currentWord,
  sentence,
  audioEnabled,
  isSpeaking,
  onSpeak,
  onToggleAudio,
}) {
  return (
    <div className="space-y-6">

      {/* CURRENT WORD */}
      <div>
        <h3 className="section-title">Current Word</h3>
        <div key={currentWord?.text} className="current-word pop-in">
          {currentWord?.text || "—"}
        </div>
      </div>

      {/* SENTENCE */}
      <div>
        <h3 className="section-title">Sentence</h3>
        <div className="sentence-box">
          {sentence || "Start signing to build a sentence…"}
        </div>
      </div>

      {/* AUDIO TOGGLE */}
      <button
        onClick={onToggleAudio}
        className={`audio-btn ${audioEnabled ? "on" : "off"}`}
      >
        🔊 Audio {audioEnabled ? "ON" : "OFF"}
      </button>

      {/* WAVEFORM (ONLY WHEN AUDIO ENABLED) */}
      {audioEnabled && (
        <div className="waveform-container">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`wave ${isSpeaking ? "active" : ""}`}
            />
          ))}
        </div>
      )}

      {/* SPEAK BUTTON */}
      {audioEnabled && sentence && (
        <button onClick={() => onSpeak(sentence)} className="speak-btn">
          ▶ Speak
        </button>
      )}
    </div>
  );
}
