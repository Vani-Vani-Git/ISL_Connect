import React, { useState, useRef } from "react";
import WebcamFeed from "./components/WebcamFeed";
import TranslationResults from "./components/TranslationResults";
import TranslationHistory from "./components/TranslationHistory";
import "./liveTranslation.css";

const CONF_THRESHOLD = 0.2;     // ignore weak predictions
const WORD_COOLDOWN_MS = 1500; // time before same word allowed again

export default function LiveTranslation() {
  const [running, setRunning] = useState(false);
  const [currentWord, setCurrentWord] = useState(null);
  const [sentence, setSentence] = useState("");
  const [history, setHistory] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastWordRef = useRef(null);
  const lastAcceptedTimeRef = useRef(0);
  
  const handlePrediction = (data) => {
  console.log("🧠 handlePrediction received:", data);

  if (!data?.label || data.confidence < CONF_THRESHOLD) return;

  const now = Date.now();

  // 🚫 Ignore same word too frequently
  if (
    data.label === lastWordRef.current &&
    now - lastAcceptedTimeRef.current < WORD_COOLDOWN_MS
  ) {
    return;
  }

  // ✅ Accept new word
  lastWordRef.current = data.label;
  lastAcceptedTimeRef.current = now;

  setCurrentWord({
    text: data.label,
    confidence: data.confidence,
  });

  const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/^\d+\.\s*/, "") // remove "95. "
    .replace(/\s+/g, " ")     // collapse spaces
    .trim();

setSentence((prev) => {
  const prevWords = prev
    ? prev.split(" ").map(normalize)
    : [];

  const newWord = normalize(data.label);

  // 🚫 block if word already exists anywhere
  if (prevWords.includes(newWord)) {
    return prev;
  }

  return prev ? `${prev} ${data.label}` : data.label;
});

};

   const speakSentence = (text) => {
  if (!audioEnabled || !text) return;

  setIsSpeaking(true);

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.onend = () => setIsSpeaking(false);
  utterance.onerror = () => setIsSpeaking(false);

  window.speechSynthesis.cancel(); // 🔑 prevents crash
  window.speechSynthesis.speak(utterance);
};

  return (
    <div className="isl-app">
      <header className="isl-header">
        ✋ ISL Live Translator
      </header>
      <div className="isl-controls">
  <button
    onClick={() => {
      if (running) {
        // 🔴 STOP → save sentence only
        if (sentence && sentence.trim()) {
          setHistory((prev) => [
            {
              sentence: sentence.trim(),
              time: new Date().toLocaleTimeString(),
            },
            ...prev,
          ]);
        }
      } else {
        // ▶ START → prepare for new sentence
        setSentence("");
        setCurrentWord(null);
      }

      setRunning((p) => !p);
    }}
  >
    {running ? "⏹ Stop Camera" : "▶ Start Camera"}
  </button>
  <button onClick={() => setAudioEnabled((p) => !p)}>
          🔊 Audio {audioEnabled ? "ON" : "OFF"}
  </button>
</div>

      <div className="isl-main">
        {/* LEFT – CAMERA */}
        <div className="camera-card">
          {running ? (
            <WebcamFeed running={running} onPrediction={handlePrediction} />
          ) : (
            <div className="camera-placeholder">
              Camera is stopped
            </div>
          )}
        </div>

        {/* RIGHT – RESULTS */}
        <div className="results-card">
          <TranslationResults
              currentWord={currentWord}
  sentence={sentence}
  audioEnabled={audioEnabled}
  isSpeaking={isSpeaking}
  onSpeak={speakSentence}
  onToggleAudio={() => setAudioEnabled((prev) => !prev)}
          />
        </div>
      </div>

      {/* BOTTOM – HISTORY */}
      <div className="history-card">
        <h3>Translation History</h3>

        {history.length === 0 && <p>No translations yet</p>}

        {history.map((h, i) => (
          <div key={i} className="history-item">
            <span>{h.text}</span>
            <small>{h.time}</small>
          </div>
        ))}
              {/* HISTORY */}
       <div className="mt-8">
         <TranslationHistory history={history} />
       </div>
      </div>
    </div>
  );
}
