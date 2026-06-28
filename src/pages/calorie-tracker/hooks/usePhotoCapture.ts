import { useState, useCallback } from "react";
import { api } from "../../../api/client";
import { TRACKER_FOODS } from "../../../data/calorieTrackerFoods";
import type { DetectedItem } from "../../../api/client";

type Status = "idle" | "detecting" | "detected" | "error";

const VALID_MIMES = ["image/jpeg", "image/png", "image/webp"];

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
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
    try {
      dataUrl = await readDataUrl(file);
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
      const res = await api.detectImage(base64, file.type, foods);
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
