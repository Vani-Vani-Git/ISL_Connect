import React from "react";

const SessionHistory = ({ history }) => {
  if (!history.length) {
    return <p style={{ textAlign: "center" }}>No history yet</p>;
  }

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: 12,
        borderRadius: 8,
        maxHeight: 250,
        overflowY: "auto",
      }}
    >
      <h4>Session History</h4>

      {history.map((item, index) => (
        <div
          key={index}
          style={{
            padding: 8,
            borderBottom: "1px solid #eee",
          }}
        >
          <strong>{item.label}</strong>
          <div style={{ fontSize: 12 }}>
            Confidence: {(item.confidence * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: 11, color: "#777" }}>
            {item.time}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SessionHistory;
