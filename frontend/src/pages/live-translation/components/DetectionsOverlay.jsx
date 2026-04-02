import React, { useEffect, useRef } from "react";

const DetectionsOverlay = ({ videoRef, detections = [] }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef?.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach((det) => {
      const [x1, y1, x2, y2] = det.bbox || [];
      if (!x1 && !y1) return;

      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      ctx.fillStyle = "#22c55e";
      ctx.font = "14px sans-serif";
      ctx.fillText(
        `${det.class} (${(det.confidence * 100).toFixed(1)}%)`,
        x1 + 4,
        y1 - 6
      );
    });
  }, [detections, videoRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
    />
  );
};

export default DetectionsOverlay;
