import React, { useEffect, useRef } from "react";
import { Holistic } from "@mediapipe/holistic";
import { Camera } from "@mediapipe/camera_utils";

const SEQ_LEN = 60;              // MUST match backend expectation
const FEATURES_PER_FRAME = 258; // MUST match model input

export default function WebcamFeed({ running, onPrediction }) {
  const videoRef = useRef(null);
  const cameraRef = useRef(null);
  const holisticRef = useRef(null);
  const frameBufferRef = useRef([]);
  const sendingRef = useRef(false);

  /* ---------------- FEATURE EXTRACTION ---------------- */
  const extractFrameVector = (results) => {
    const vec = [];

    const pushLandmarks = (landmarks, count) => {
      if (!landmarks) {
        for (let i = 0; i < count * 3; i++) vec.push(0);
        return;
      }
      landmarks.slice(0, count).forEach((p) => {
        vec.push(p.x, p.y, p.z ?? 0);
      });
    };

    pushLandmarks(results.poseLandmarks, 33);
    pushLandmarks(results.leftHandLandmarks, 21);
    pushLandmarks(results.rightHandLandmarks, 21);
    pushLandmarks(results.faceLandmarks, 11);

    return vec;
  };

  /* ---------------- SEND TO BACKEND ---------------- */
  const sendToServer = async () => {
    if (sendingRef.current) return;
    sendingRef.current = true;

    try {
      const res = await fetch("https://isl-connect.onrender.com/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keypoints: frameBufferRef.current }),
      });

      const data = await res.json();
      console.log("📤 Backend response:", data);

      // 🔥 THIS WAS THE MISSING PIECE
      if (data?.label) {
        onPrediction?.(data);
      }

    } catch (err) {
      console.error("❌ Prediction fetch error:", err);
    } finally {
      sendingRef.current = false;
    }
  };

  /* ---------------- HANDLE MEDIAPIPE ---------------- */
  const handleResults = (results) => {
    if (!running) return;

    const frameVec = extractFrameVector(results);
    if (frameVec.length !== FEATURES_PER_FRAME) return;

    frameBufferRef.current.push(frameVec);

    if (frameBufferRef.current.length > SEQ_LEN) {
      frameBufferRef.current.shift();
    }

    if (frameBufferRef.current.length === SEQ_LEN) {
      sendToServer();
    }
  };

  /* ---------------- START / STOP CAMERA ---------------- */
  useEffect(() => {
    if (!running || !videoRef.current) return;

    const holistic = new Holistic({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1675471629/${file}`,
    });

    holistic.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      refineFaceLandmarks: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    holistic.onResults(handleResults);
    holisticRef.current = holistic;

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (holisticRef.current) {
          await holisticRef.current.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480,
    });

    camera.start();
    cameraRef.current = camera;
    console.log("✅ WebcamFeed: Camera started");

    return () => {
      frameBufferRef.current = [];
      sendingRef.current = false;

      cameraRef.current?.stop();
      holisticRef.current?.close();

      cameraRef.current = null;
      holisticRef.current = null;

      console.log("🛑 WebcamFeed: Camera stopped");
    };
  }, [running]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="w-full h-full object-cover rounded-lg"
    />
  );
}
