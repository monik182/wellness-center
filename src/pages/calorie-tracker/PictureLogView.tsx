import { useState, useMemo } from "react";
import { TRACKER_FOODS } from "../../data/calorieTrackerFoods";
import { macroScale, sumTotals, type LoggedFoodItem, type LoggedMeal } from "./types";
import { api } from "../../api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, AlertCircle, Loader } from "lucide-react";

interface Props {
  onLogged: () => void;
  mealDate: string;
  mealTime: string;
}

type Phase = "upload" | "detecting" | "confirm" | "done";

interface EditedItem {
  detectedName: string;
  weight_g: number;
  foodId: string | null;
}

export default function PictureLogView({ onLogged, mealDate, mealTime }: Props) {
  const [phase, setPhase] = useState<Phase>("upload");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editedItems, setEditedItems] = useState<EditedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  const foodById = useMemo(() => {
    const map = new Map<string, typeof TRACKER_FOODS[0]>();
    TRACKER_FOODS.forEach((f) => map.set(f.id, f));
    return map;
  }, []);

  const runningTotals = useMemo(() => {
    const loggedItems = editedItems.map((edited) => {
      if (edited.foodId) {
        const food = foodById.get(edited.foodId)!;
        return {
          foodId: edited.foodId,
          name: food.name,
          weight_g: edited.weight_g,
          ...macroScale(food, edited.weight_g),
        };
      } else {
        return {
          foodId: `unmapped-${edited.detectedName}`,
          name: edited.detectedName,
          weight_g: edited.weight_g,
          kcal: edited.weight_g * 2,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
        };
      }
    });
    return sumTotals(loggedItems);
  }, [editedItems, foodById]);

  function matchFoodByName(detectedName: string): string | null {
    const lower = detectedName.toLowerCase().trim();
    const exact = TRACKER_FOODS.find((f) => f.name.toLowerCase() === lower);
    if (exact) return exact.id;

    // Simple fuzzy: match if detected name contains or is contained in food name
    const partial = TRACKER_FOODS.find(
      (f) =>
        f.name.toLowerCase().includes(lower) ||
        lower.includes(f.name.toLowerCase())
    );
    return partial?.id ?? null;
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate size
    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > 10) {
      setError("Imagen demasiado grande (máximo 10 MB)");
      return;
    }

    // Validate MIME type
    const validMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!validMimes.includes(file.type)) {
      setError("Formato inválido. Usa JPEG, PNG o WebP.");
      return;
    }

    // Read file
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const base64 = dataUrl.split(",")[1];

      setImagePreview(dataUrl);
      setPhase("detecting");

      // Call API
      try {
        const result = await api.detectImage(
          base64,
          file.type,
          TRACKER_FOODS.map((f) => ({ id: f.id, name: f.name, group: f.group }))
        );

        if (!result.success || !result.detected_items) {
          setError(result.error ?? "No se pudo detectar alimentos");
          setPhase("upload");
          return;
        }

        if (result.detected_items.length === 0) {
          setError("No se detectaron alimentos en la imagen");
          setPhase("upload");
          return;
        }

        setWarnings(result.warnings ?? []);

        // Build edited items with food matching
        const edited = result.detected_items.map((item) => ({
          detectedName: item.name,
          weight_g: item.weight_g,
          foodId: matchFoodByName(item.name),
        }));
        setEditedItems(edited);

        setPhase("confirm");
      } catch {
        setError("Error al procesar la imagen");
        setPhase("upload");
      }
    };

    reader.onerror = () => {
      setError("Error al leer el archivo");
    };

    reader.readAsDataURL(file);
  }

  function updateItemWeight(idx: number, newWeight: number) {
    if (newWeight <= 0) return;
    const updated = editedItems.map((item, i) =>
      i === idx ? { ...item, weight_g: newWeight } : item
    );
    setEditedItems(updated);
  }

  function removeItem(idx: number) {
    setEditedItems(editedItems.filter((_, i) => i !== idx));
  }

  async function handleConfirmAndLog() {
    if (editedItems.length === 0 || saving) return;

    setSaving(true);
    try {
      const loggedItems: LoggedFoodItem[] = editedItems.map((edited) => {
        if (edited.foodId) {
          const food = foodById.get(edited.foodId)!;
          return {
            foodId: edited.foodId,
            name: food.name,
            weight_g: edited.weight_g,
            ...macroScale(food, edited.weight_g),
          };
        } else {
          // Fallback: unmapped food, estimate as 2 kcal per gram
          return {
            foodId: `unmapped-${edited.detectedName}`,
            name: edited.detectedName,
            weight_g: edited.weight_g,
            kcal: edited.weight_g * 2,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
          };
        }
      });

      const totals = sumTotals(loggedItems);
      const meal: LoggedMeal = {
        id: crypto.randomUUID(),
        date: mealDate,
        time: mealTime,
        items: loggedItems,
        totals,
      };

      await api.addMeal(meal);

      // Reset
      setPhase("done");
      setImagePreview(null);
      setEditedItems([]);
      setError(null);
      setWarnings([]);

      // Trigger parent callback
      onLogged();
    } catch {
      setError("Error al guardar la comida");
    } finally {
      setSaving(false);
    }
  }

  if (phase === "upload") {
    return (
      <div>
        {error && (
          <div
            className="px-3.5 py-2.5 mb-3 rounded-[4px] flex items-start gap-2.5"
            style={{ background: "#fde8e8", color: "#c62828" }}
          >
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[13px] font-medium">{error}</p>
            </div>
          </div>
        )}

        <Card className="mb-4 p-5">
          <div className="text-center">
            <Camera size={32} className="mx-auto mb-3" style={{ color: "var(--ink-muted)" }} />
            <p className="text-[13px] font-semibold mb-3" style={{ color: "var(--ink)" }}>
              Sube una foto de tu comida
            </p>
            <p className="text-[11px] mb-4 leading-relaxed" style={{ color: "var(--ink-muted)" }}>
              Asegúrate de que todos los alimentos sean claramente visibles y bien iluminados.
            </p>
            <div className="flex gap-2">
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  className="w-full px-4 py-2.5 text-[13px] font-medium rounded-[4px] cursor-pointer border-0 transition-all"
                  style={{ background: "var(--blue)", color: "white" }}
                  onClick={(e) => {
                    (e.currentTarget.parentElement?.querySelector("input") as HTMLInputElement)?.click();
                  }}
                >
                  <Upload size={14} className="inline mr-1" /> Subir foto
                </button>
              </label>
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  className="w-full px-4 py-2.5 text-[13px] font-medium rounded-[4px] cursor-pointer border-0 transition-all"
                  style={{ background: "var(--cream)", color: "var(--ink)", border: "1px solid var(--border-color)" }}
                  onClick={(e) => {
                    (e.currentTarget.parentElement?.querySelector("input") as HTMLInputElement)?.click();
                  }}
                >
                  <Camera size={14} className="inline mr-1" /> Cámara
                </button>
              </label>
            </div>
          </div>
        </Card>

        <div className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
          <p className="font-semibold mb-1.5">Consejos:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Usa un plato claro o fondo blanco</li>
            <li>Evita alimentos superpuestos</li>
            <li>Buena iluminación (luz natural es mejor)</li>
            <li>Incluye toda la comida en el marco</li>
          </ul>
          <p className="font-semibold mt-2.5 mb-1.5">Importante:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>La IA puede cometer errores (~95% de precisión)</li>
            <li>Las porciones son estimadas — siempre confirma</li>
            <li>Si no estás seguro, usa Chat o Selector manualmente</li>
          </ul>
        </div>
      </div>
    );
  }

  if (phase === "detecting") {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Uploaded meal"
            className="max-w-full max-h-[300px] object-contain mb-4 rounded-[4px]"
          />
        )}
        <Loader size={24} className="animate-spin mb-2" style={{ color: "var(--ink)" }} />
        <p className="text-[13px]" style={{ color: "var(--ink-muted)" }}>
          Analizando imagen...
        </p>
      </div>
    );
  }

  if (phase === "confirm") {
    return (
      <div>
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Uploaded meal"
            className="w-full max-h-[250px] object-contain mb-3 rounded-[4px]"
          />
        )}

        {warnings.length > 0 && (
          <div
            className="px-3.5 py-2.5 mb-3 rounded-[4px] flex items-start gap-2.5"
            style={{ background: "#fde8e8", color: "#c62828" }}
          >
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              {warnings.map((w, i) => (
                <p key={i} className="text-[11px]">
                  {w}
                </p>
              ))}
            </div>
          </div>
        )}

        <p className="text-[12px] font-semibold mb-2.5" style={{ color: "var(--ink-muted)" }}>
          ALIMENTOS DETECTADOS
        </p>

        {editedItems.map((item, idx) => {
          const food = item.foodId ? foodById.get(item.foodId) : null;
          const macros = food ? macroScale(food, item.weight_g) : { kcal: item.weight_g * 2, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 };

          return (
            <Card key={idx} className="mb-2">
              <CardContent className="pt-2.5 pb-2.5 flex items-start gap-2.5">
                <div className="flex-1">
                  <p className="text-[13px] font-medium mb-0.5" style={{ color: "var(--ink)" }}>
                    {food?.name ?? item.detectedName}
                  </p>
                  {!food && (
                    <p className="text-[10px] mb-1" style={{ color: "#c62828" }}>
                      ⚠️ No encontrado — usando estimación
                    </p>
                  )}
                  <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                    {Math.round(macros.kcal)} kcal · {Math.round(macros.protein * 10) / 10}g P
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={2000}
                    value={item.weight_g}
                    onChange={(e) => updateItemWeight(idx, parseFloat(e.target.value))}
                    className="w-16 px-1.5 py-1 text-[13px] text-center font-[inherit]"
                    style={{
                      border: "1px solid var(--border-color)",
                      background: "var(--beige)",
                    }}
                  />
                  <span className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                    g
                  </span>
                </div>
                <button
                  onClick={() => removeItem(idx)}
                  className="bg-transparent border-0 cursor-pointer text-base px-1"
                  style={{ color: "var(--ink-muted)" }}
                >
                  x
                </button>
              </CardContent>
            </Card>
          );
        })}

        {/* Running totals */}
        <div
          className="grid grid-cols-3 gap-1.5 p-5 mb-4 text-xs"
          style={{ background: "var(--beige)" }}
        >
          {[
            { label: "Kcal", val: Math.round(runningTotals.kcal) },
            { label: "Proteina", val: `${Math.round(runningTotals.protein * 10) / 10}g` },
            { label: "Carbos", val: `${Math.round(runningTotals.carbs * 10) / 10}g` },
            { label: "Grasa", val: `${Math.round(runningTotals.fat * 10) / 10}g` },
            { label: "Fibra", val: `${Math.round(runningTotals.fiber * 10) / 10}g` },
            { label: "Azucar", val: `${Math.round(runningTotals.sugar * 10) / 10}g` },
          ].map(({ label, val }) => (
            <div key={label} className="text-center">
              <p className="text-[10px]" style={{ color: "var(--ink-muted)" }}>
                {label}
              </p>
              <p className="font-semibold" style={{ color: "var(--ink)" }}>
                {val}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setPhase("upload");
              setImagePreview(null);
              setEditedItems([]);
              setError(null);
              setWarnings([]);
            }}
          >
            Intentar de nuevo
          </Button>
          <Button
            className="flex-[2]"
            disabled={saving}
            onClick={handleConfirmAndLog}
          >
            {saving ? "Guardando..." : "Confirmar y registrar"}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
