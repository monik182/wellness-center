import { useState, useRef } from "react";
import { api } from "../api/client";
import type { NutritionLabelResult, CustomFood } from "../api/client";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Separator } from "../components/ui/separator";

type Phase = "upload" | "extracting" | "review" | "saving" | "done";

export default function NutritionLabelPage() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("");
  const [extractedData, setExtractedData] = useState<NutritionLabelResult | null>(null);
  const [error, setError] = useState<string>("");
  const [savedFood, setSavedFood] = useState<CustomFood | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tips dismissal
  const [showTips, setShowTips] = useState(() => {
    if (typeof window === "undefined") return true;
    return !localStorage.getItem("nutrition_label_tips_seen");
  });

  // Editable values from extracted data
  const [editValues, setEditValues] = useState<{
    product_name: string;
    serving_size: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    sugar_g: number;
    fat_g: number;
    saturated_fat_g: number | null;
    fiber_g: number | null;
    sodium_mg: number | null;
  }>({
    product_name: "",
    serving_size: "",
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    sugar_g: 0,
    fat_g: 0,
    saturated_fat_g: null,
    fiber_g: null,
    sodium_mg: null,
  });

  const handleFileSelect = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large (max 10 MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setUploadedImage(base64);
      setImageMimeType(file.type);
      handleExtract(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleExtract = async (base64: string, mimeType: string) => {
    setPhase("extracting");
    setError("");

    try {
      const result = await api.extractNutritionLabel(base64, mimeType);

      if (!result.success) {
        if (result.error === "not_a_label") {
          setError("No parece una etiqueta nutricional. Intenta de nuevo.");
        } else if (result.error === "parse_error") {
          setError("No pude extraer los valores. Intenta con una foto más clara.");
        } else {
          setError(result.error || "Error al procesar la imagen");
        }
        setPhase("upload");
        return;
      }

      setExtractedData(result);

      // Populate edit values
      setEditValues({
        product_name: result.product_name || "",
        serving_size: result.serving_size || "",
        calories: result.calories || 0,
        protein_g: result.protein_g || 0,
        carbs_g: result.carbs_g || 0,
        sugar_g: result.sugar_g || 0,
        fat_g: result.fat_g || 0,
        saturated_fat_g: result.saturated_fat_g || null,
        fiber_g: result.fiber_g || null,
        sodium_mg: result.sodium_mg || null,
      });

      setPhase("review");
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
      setPhase("upload");
    }
  };

  const handleEditValue = <K extends keyof typeof editValues>(key: K, value: typeof editValues[K]) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };

  const validateEditValues = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!editValues.product_name || editValues.product_name.trim().length < 3) {
      errors.push("Nombre del producto (mín. 3 caracteres)");
    }

    if (editValues.calories < 0) {
      errors.push("Calorías debe ser ≥ 0");
    }

    if (editValues.protein_g < 0) {
      errors.push("Proteína debe ser ≥ 0");
    }

    if (editValues.carbs_g < 0) {
      errors.push("Carbohidratos debe ser ≥ 0");
    }

    if (editValues.sugar_g < 0) {
      errors.push("Azúcar debe ser ≥ 0");
    }

    if (editValues.fat_g < 0) {
      errors.push("Grasas debe ser ≥ 0");
    }

    return { valid: errors.length === 0, errors };
  };

  const handleSave = async () => {
    const validation = validateEditValues();
    if (!validation.valid) {
      setError("Errores: " + validation.errors.join(", "));
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const result = await api.saveCustomFood({
        name: editValues.product_name.trim(),
        serving_size: editValues.serving_size || undefined,
        serving_size_g: editValues.serving_size ? undefined : 100,
        calories: editValues.calories,
        protein_g: editValues.protein_g,
        carbs_g: editValues.carbs_g,
        sugar_g: editValues.sugar_g,
        fat_g: editValues.fat_g,
        saturated_fat_g: editValues.saturated_fat_g || undefined,
        fiber_g: editValues.fiber_g || undefined,
        sodium_mg: editValues.sodium_mg || undefined,
      });

      if (!result.success) {
        setError(result.error || "Error al guardar");
        setIsSaving(false);
        return;
      }

      if (result.food) {
        setSavedFood(result.food);
        setPhase("done");
      }
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPhase("upload");
    setUploadedImage(null);
    setImageMimeType("");
    setExtractedData(null);
    setError("");
    setSavedFood(null);
    setEditValues({
      product_name: "",
      serving_size: "",
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      sugar_g: 0,
      fat_g: 0,
      saturated_fat_g: null,
      fiber_g: null,
      sodium_mg: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const dismissTips = () => {
    setShowTips(false);
    localStorage.setItem("nutrition_label_tips_seen", "true");
  };

  const confidencePercent = extractedData?.confidence ? Math.round(extractedData.confidence * 100) : 0;
  const confidenceBadge =
    confidencePercent >= 80 ? "✓ Alta confianza" : confidencePercent >= 60 ? "~ Confianza media" : "⚠️ Baja confianza";

  // Phase: upload
  if (phase === "upload") {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">📋 Escanear Etiqueta Nutricional</h1>

        {showTips && (
          <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold mb-3">Consejos para mejores resultados:</h3>
            <ul className="text-sm space-y-2 mb-4">
              <li>• Toma una foto recta y plana de la etiqueta</li>
              <li>• Asegúrate de que el texto sea legible (buena iluminación)</li>
              <li>• Incluye toda la tabla de información nutricional</li>
              <li>• Evita sombras o reflejos</li>
            </ul>
            <p className="text-sm font-semibold text-orange-700 mb-3">⚠️ Importante:</p>
            <ul className="text-sm space-y-2 mb-4">
              <li>• La extracción es ~90% precisa</li>
              <li>• Siempre verifica los valores extraídos con la etiqueta</li>
              <li>• Algunos formatos inusuales pueden no extraerse perfectamente</li>
            </ul>
            <Button variant="outline" size="sm" onClick={dismissTips}>
              Entendido
            </Button>
          </Card>
        )}

        <Card className="p-6">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
            <div className="text-4xl mb-2">📸</div>
            <p className="font-semibold mb-2">Sube una foto de la etiqueta</p>
            <p className="text-sm text-gray-600 mb-4">JPG, PNG o WebP • Máx 10 MB</p>
            <Button>Seleccionar archivo</Button>
          </div>

          <Separator className="my-4" />

          <p className="text-sm text-gray-600 text-center">O usa la cámara de tu dispositivo</p>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.capture = "environment";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleFileSelect(file);
                };
                input.click();
              }}
            >
              Usar cámara
            </Button>
          </div>
        </Card>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
        )}
      </div>
    );
  }

  // Phase: extracting
  if (phase === "extracting") {
    return (
      <div className="p-4 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">⏳</div>
          <p className="text-lg font-semibold">Analizando etiqueta...</p>
        </div>
      </div>
    );
  }

  // Phase: review
  if (phase === "review" && extractedData) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Revisar Valores Extraídos</h1>

        {uploadedImage && (
          <div className="mb-6 flex justify-center">
            <img
              src={`data:${imageMimeType};base64,${uploadedImage}`}
              alt="Etiqueta"
              className="max-h-40 rounded-lg border"
            />
          </div>
        )}

        <Card className="p-6 mb-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="font-semibold">Confianza:</span>
            <span className="text-sm">{confidenceBadge} ({confidencePercent}%)</span>
          </div>

          {extractedData.notes && (
            <p className="text-sm text-gray-600 mb-4">{extractedData.notes}</p>
          )}

          {extractedData.warnings && extractedData.warnings.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
              {extractedData.warnings.map((w, i) => (
                <p key={i}>⚠️ {w}</p>
              ))}
            </div>
          )}

          <Separator className="my-4" />

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">
                Nombre del producto <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={editValues.product_name}
                onChange={(e) => handleEditValue("product_name", e.target.value)}
                placeholder="Ej: Yogur Griego Natural"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Porción (opcional)</label>
              <Input
                type="text"
                value={editValues.serving_size}
                onChange={(e) => handleEditValue("serving_size", e.target.value)}
                placeholder="Ej: 1 recipiente (150g)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Calorías <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={editValues.calories}
                    onChange={(e) => handleEditValue("calories", parseFloat(e.target.value) || 0)}
                    className="flex-1"
                  />
                  <span className="flex items-center text-gray-600">kcal</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Proteína <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={editValues.protein_g}
                    onChange={(e) => handleEditValue("protein_g", parseFloat(e.target.value) || 0)}
                    className="flex-1"
                  />
                  <span className="flex items-center text-gray-600">g</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Carbohidratos <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={editValues.carbs_g}
                    onChange={(e) => handleEditValue("carbs_g", parseFloat(e.target.value) || 0)}
                    className="flex-1"
                  />
                  <span className="flex items-center text-gray-600">g</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Azúcar <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={editValues.sugar_g}
                    onChange={(e) => handleEditValue("sugar_g", parseFloat(e.target.value) || 0)}
                    className="flex-1"
                  />
                  <span className="flex items-center text-gray-600">g</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Grasas <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={editValues.fat_g}
                    onChange={(e) => handleEditValue("fat_g", parseFloat(e.target.value) || 0)}
                    className="flex-1"
                  />
                  <span className="flex items-center text-gray-600">g</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Grasas saturadas (opcional)</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={editValues.saturated_fat_g === null ? "" : editValues.saturated_fat_g}
                    onChange={(e) =>
                      handleEditValue(
                        "saturated_fat_g",
                        e.target.value === "" ? null : parseFloat(e.target.value) || 0
                      )
                    }
                    className="flex-1"
                  />
                  <span className="flex items-center text-gray-600">g</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Fibra (opcional)</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={editValues.fiber_g === null ? "" : editValues.fiber_g}
                    onChange={(e) =>
                      handleEditValue(
                        "fiber_g",
                        e.target.value === "" ? null : parseFloat(e.target.value) || 0
                      )
                    }
                    className="flex-1"
                  />
                  <span className="flex items-center text-gray-600">g</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Sodio (opcional)</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={editValues.sodium_mg === null ? "" : editValues.sodium_mg}
                    onChange={(e) =>
                      handleEditValue(
                        "sodium_mg",
                        e.target.value === "" ? null : parseFloat(e.target.value) || 0
                      )
                    }
                    className="flex-1"
                  />
                  <span className="flex items-center text-gray-600">mg</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex-1" disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar alimento"}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  // Phase: done
  if (phase === "done" && savedFood) {
    return (
      <div className="p-4 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-sm">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold mb-2">¡Guardado!</h2>
          <p className="text-gray-600 mb-6">"{savedFood.name}" se agregó a tus alimentos personalizados</p>
          <Button onClick={handleReset} className="w-full">
            Registrar otro
          </Button>
        </Card>
      </div>
    );
  }

  return null;
}
