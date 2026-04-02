import React from "react";

export default function TranslationHistory({ history }) {
  return (
    <div className="bg-white/10 rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-3">Translation History</h2>

      {history.length === 0 ? (
        <p className="text-sm text-gray-400">No translations yet</p>
      ) : (
        <ul className="space-y-3 max-h-60 overflow-y-auto">
          {history.map((item, index) => (
  <li key={index} className="p-3 rounded bg-slate-900">
    <p className="text-white">{item.sentence}</p>
    <span className="text-xs text-gray-400">{item.time}</span>
  </li>
))}
        </ul>
      )}
    </div>
  );
}
