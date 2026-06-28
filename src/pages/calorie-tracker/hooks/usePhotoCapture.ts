import { useState, useCallback } from "react";
import { api } from "../../../api/client";
import { TRACKER_FOODS } from "../../../data/calorieTrackerFoods";
import type { DetectedItem } from "../../../api/client";

type Status = "idle" | "detecting" | "detected" | "error";

const VALID_MIMES = ["image/jpeg", "image/png", "image/webp"];
const MAX_EDGE = 1568; // Anthropic vision downscales beyond this; keep payload < 5MB

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// Downscale to <= MAX_EDGE and re-encode as JPEG so the request stays under
// Anthropic's 5MB image cap and recommended dimensions.
function downscale(dataUrl: string): Promise<{ dataUrl: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      if (scale === 1) {
        resolve({ dataUrl, mime: "image/jpeg" });
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve({ dataUrl: canvas.toDataURL("image/jpeg", 0.85), mime: "image/jpeg" });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}

export function usePhotoCapture() {
  const [status, setStatus] = useState<Status>("idle");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setImageDataUrl(null);
    setDetectedItems([]);
    setSummary("");
    setWarnings([]);
    setError(null);
  }, []);

  const onFileSelected = useCallback(async (file: File) => {
    setError(null);
    if (!VALID_MIMES.includes(file.type)) {
      setImageDataUrl(null);
      setStatus("error");
      setError("Unsupported image format. Use JPEG, PNG, or WebP.");
      return;
    }

    let dataUrl: string;
    let mime: string;
    try {
      const raw = await readDataUrl(file);
      const scaled = await downscale(raw);
      dataUrl = scaled.dataUrl;
      mime = scaled.mime;
    } catch {
      setStatus("error");
      setError("Failed to read image.");
      return;
    }

    setImageDataUrl(dataUrl);
    setStatus("detecting");

    const base64 = dataUrl.split(",")[1] ?? "";
    const foods = TRACKER_FOODS.map((f) => ({ id: f.id, name: f.name, group: f.group }));

    try {
      const res = await api.detectImage(base64, mime, foods);
      if (!res.success) {
        setStatus("error");
        setError(res.error ?? "Could not analyze the image.");
        return;
      }
      setDetectedItems(res.detected_items ?? []);
      setSummary(res.confidence_summary ?? "");
      setWarnings(res.warnings ?? []);
      setStatus("detected");
    } catch {
      setStatus("error");
      setError("Could not analyze the image.");
    }
  }, []);

  return { status, imageDataUrl, detectedItems, summary, warnings, error, onFileSelected, reset };
}
