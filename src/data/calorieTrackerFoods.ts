import { FOODS } from "./foods";
import type { TrackerFood } from "../pages/calorie-tracker/types";

// Portion weight in grams for each food name, used to derive per-100g macros.
// Only foods listed here will appear in the calorie tracker selector.
const PORTION_WEIGHTS: Record<string, number> = {
  // Proteins
  "Atún en agua (lata)":          120,
  "Atún fresco":                   125,
  "Carne molida magra (cocida)":   150,
  "Huevo":                          60,
  "Jamón serrano":                  30,
  "Merluza":                       150,
  "Pavo en lonchas":                80,
  "Pechuga de pollo":              150,
  "Proteína Rossmann":              30,
  "Salmón ahumado":                 50,
  "Salmón fresco":                 125,
  // Carbs
  "Arepa (harina PAN)":             60,
  "Arroz blanco (recién cocido)":  120,
  "Arroz blanco (enfriado/recalentado)": 120,
  "Avena (overnight oats)":         40,
  "Black beans (cocidos)":         100,
  "Maíz en lata":                   50,
  "Pan integral fibra":             70,
  "Pan masa madre":                 40,
  "Papa horneada con aceite":      150,
  "Papa sancochada":               150,
  "Pasta (cocida)":                120,
  "Plátano macho (enfriado/recalentado)": 120,
  "Plátano macho sancochado":      120,
  "Quinoa cocida":                 120,
  "Red beans (cocidos)":           100,
  "Totopos de maíz":                30,
  "Wrap de proteína":               65,
  // Vegetables
  "Brócoli":                       100,
  "Canónigos":                      50,
  "Cebolla asada/caramelizada":     50,
  "Cebolla cruda":                  50,
  "Espárragos":                    100,
  "Espinaca baby":                  30,
  "Lechuga mix":                   100,
  "Pepino":                         50,
  "Pimentones":                    150,
  "Rúcula":                         30,
  "Tomate cherry":                 100,
  // Fruits
  "Aguacate":                       50,
  "Banana":                        120,
  "Cerezas":                        80,
  "Manzana Pink Lady":             180,
  "Uvas verdes":                   100,
  // Dairy
  "Cacaolat sin azúcar añadida":   200,
  "Leche de soya sin azúcar":      200,
  "Mantequilla":                    10,
  "Queso cheddar":                  25,
  "Queso manchego":                 25,
  "Queso mozzarella":               30,
  "Queso parmesano/pecorino":       10,
  "Yogur griego 0%":                40,
  "Yogur stracciatella 0% proteico": 125,
  // Fats
  "Aceite de oliva (1 cdita)":       5,
  "Aceite de oliva (1 cda)":        15,
  "Chía":                           10,
  "Mostaza":                         5,
  "Spray de aceite":                 1,
  // Extras
  "Cacao en polvo sin azúcar":       5,
  "Popcorn (aceite, salados)":       30,
};

function r(n: number): number {
  return Math.round(n * 10) / 10;
}

export const TRACKER_FOODS: TrackerFood[] = FOODS
  .filter((f) => f.group !== "❌ Eliminado" && PORTION_WEIGHTS[f.name] !== undefined)
  .map((f) => {
    const w = PORTION_WEIGHTS[f.name];
    const scale = 100 / w;
    return {
      id: f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: f.name,
      group: f.group,
      defaultWeight_g: w,
      kcalPer100g:    r(f.kcal    * scale),
      proteinPer100g: r(f.protein * scale),
      carbsPer100g:   r(f.carbs   * scale),
      fatPer100g:     r(f.fat     * scale),
      fiberPer100g:   r(f.fiber   * scale),
      sugarPer100g:   r(f.sugar   * scale),
    };
  });
