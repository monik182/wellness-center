export type FoodGroup =
  | "Proteína"
  | "Carbohidrato"
  | "Verdura"
  | "Fruta"
  | "Lácteo"
  | "Grasa"
  | "Extra"
  | "❌ Eliminado";

export type FoodTag =
  | "Alta proteína"
  | "Alta fibra"
  | "Baja cal"
  | "Omega-3"
  | "Pre-workout"
  | "Almidón resistente"
  | "⚠️ Calórico"
  | "⚠️ Calóricos"
  | "⚠️ Calórica"
  | "Calorías vacías"
  | "Azúcar";

export interface Food {
  name: string;
  group: FoodGroup;
  portion: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  fiber: number;
  tags: FoodTag[];
  // Optional: used by food wheel (if present, item appears in wheel for that category)
  wheelCategory?: "protein" | "veggie" | "carb" | "fruit";
}

export const FOODS: Food[] = [
  // ─── PROTEINS ────────────────────────────────────────────────────
  {
    name: "Atún en agua (lata)",
    group: "Proteína",
    portion: "120g escurrido",
    kcal: 130, protein: 28, carbs: 0, fat: 1.5, sugar: 0, fiber: 0,
    tags: ["Alta proteína"],
    wheelCategory: "protein",
  },
  {
    name: "Atún fresco",
    group: "Proteína",
    portion: "125g filete",
    kcal: 155, protein: 30, carbs: 0, fat: 3.5, sugar: 0, fiber: 0,
    tags: ["Alta proteína"],
    wheelCategory: "protein",
  },
  {
    name: "Carne molida magra (cocida)",
    group: "Proteína",
    portion: "150g",
    kcal: 205, protein: 31, carbs: 0, fat: 8.5, sugar: 0, fiber: 0,
    tags: ["Alta proteína"],
    wheelCategory: "protein",
  },
  {
    name: "Huevo",
    group: "Proteína",
    portion: "1 unidad (~60g)",
    kcal: 90, protein: 7, carbs: 0.6, fat: 6.5, sugar: 0, fiber: 0,
    tags: ["Alta proteína"],
  },
  {
    name: "Huevos (3)",
    group: "Proteína",
    portion: "3 unidades",
    kcal: 270, protein: 21, carbs: 1.8, fat: 19.5, sugar: 0, fiber: 0,
    tags: ["Alta proteína"],
    wheelCategory: "protein",
  },
  {
    name: "Jamón serrano",
    group: "Proteína",
    portion: "30g (~2 lonchas)",
    kcal: 70, protein: 9, carbs: 0, fat: 3.5, sugar: 0, fiber: 0,
    tags: ["Alta proteína", "Baja cal"],
  },
  {
    name: "Merluza",
    group: "Proteína",
    portion: "150g filete",
    kcal: 120, protein: 25, carbs: 0, fat: 1.5, sugar: 0, fiber: 0,
    tags: ["Alta proteína", "Baja cal"],
    wheelCategory: "protein",
  },
  {
    name: "Pavo en lonchas",
    group: "Proteína",
    portion: "80g",
    kcal: 85, protein: 17, carbs: 1, fat: 1.5, sugar: 0.5, fiber: 0,
    tags: ["Alta proteína", "Baja cal"],
    wheelCategory: "protein",
  },
  {
    name: "Pechuga de pollo",
    group: "Proteína",
    portion: "150g cruda",
    kcal: 165, protein: 31, carbs: 0, fat: 3.6, sugar: 0, fiber: 0,
    tags: ["Alta proteína"],
    wheelCategory: "protein",
  },
  {
    name: "Proteína Rossmann",
    group: "Proteína",
    portion: "1 scoop (30g)",
    kcal: 115, protein: 24, carbs: 2, fat: 1, sugar: 1, fiber: 0,
    tags: ["Alta proteína"],
  },
  {
    name: "Protein Elite Vanilla",
    group: "Proteína",
    portion: "1 scoop (30g) con agua",
    kcal: 113, protein: 23, carbs: 2.1, fat: 1.4, sugar: 1.6, fiber: 0,
    tags: ["Alta proteína"],
  },
  {
    name: "Salmón ahumado",
    group: "Proteína",
    portion: "50g (~3 lonchas)",
    kcal: 100, protein: 10, carbs: 0, fat: 6.5, sugar: 0, fiber: 0,
    tags: ["Alta proteína"],
  },
  {
    name: "Salmón fresco",
    group: "Proteína",
    portion: "125g filete",
    kcal: 260, protein: 25, carbs: 0, fat: 17, sugar: 0, fiber: 0,
    tags: ["Alta proteína", "Omega-3"],
    wheelCategory: "protein",
  },

  // ─── CARBS ───────────────────────────────────────────────────────
  {
    name: "Arepa (harina PAN)",
    group: "Carbohidrato",
    portion: "1 mediana (60g harina)",
    kcal: 180, protein: 3, carbs: 38, fat: 1.5, sugar: 0.5, fiber: 2,
    tags: [],
    wheelCategory: "carb",
  },
  {
    name: "Arroz blanco (recién cocido)",
    group: "Carbohidrato",
    portion: "120g cocido",
    kcal: 155, protein: 3, carbs: 34, fat: 0.3, sugar: 0, fiber: 0.4,
    tags: [],
  },
  {
    name: "Arroz blanco (enfriado/recalentado)",
    group: "Carbohidrato",
    portion: "120g cocido",
    kcal: 130, protein: 3, carbs: 28, fat: 0.3, sugar: 0, fiber: 1.5,
    tags: ["Almidón resistente"],
    wheelCategory: "carb",
  },
  {
    name: "Avena (overnight oats)",
    group: "Carbohidrato",
    portion: "40g seca",
    kcal: 150, protein: 5, carbs: 27, fat: 2.7, sugar: 0.4, fiber: 4,
    tags: ["Alta fibra"],
  },
  {
    name: "Black beans (cocidos)",
    group: "Carbohidrato",
    portion: "100g",
    kcal: 130, protein: 9, carbs: 22, fat: 0.5, sugar: 0.3, fiber: 8,
    tags: ["Alta fibra", "Alta proteína"],
    wheelCategory: "carb",
  },
  {
    name: "Maíz en lata",
    group: "Carbohidrato",
    portion: "50g escurrido",
    kcal: 45, protein: 1.5, carbs: 9, fat: 0.5, sugar: 2.5, fiber: 1,
    tags: [],
  },
  {
    name: "Pan integral fibra",
    group: "Carbohidrato",
    portion: "2 rebanadas (~70g)",
    kcal: 170, protein: 7, carbs: 28, fat: 2.5, sugar: 2, fiber: 5,
    tags: ["Alta fibra"],
  },
  {
    name: "Pan masa madre",
    group: "Carbohidrato",
    portion: "1 rebanada (~40g)",
    kcal: 110, protein: 4, carbs: 20, fat: 1, sugar: 0.5, fiber: 1.5,
    tags: [],
    wheelCategory: "carb",
  },
  {
    name: "Papa horneada con aceite",
    group: "Carbohidrato",
    portion: "150g + 1 cdita aceite",
    kcal: 160, protein: 3, carbs: 27, fat: 4.6, sugar: 1, fiber: 2,
    tags: [],
  },
  {
    name: "Papa sancochada",
    group: "Carbohidrato",
    portion: "150g (~1 mediana)",
    kcal: 120, protein: 3, carbs: 27, fat: 0.1, sugar: 1, fiber: 2,
    tags: ["Baja cal"],
    wheelCategory: "carb",
  },
  {
    name: "Pasta (cocida)",
    group: "Carbohidrato",
    portion: "120g cocida (~50g seca)",
    kcal: 155, protein: 5.5, carbs: 31, fat: 0.9, sugar: 0.5, fiber: 1.8,
    tags: [],
    wheelCategory: "carb",
  },
  {
    name: "Plátano macho (enfriado/recalentado)",
    group: "Carbohidrato",
    portion: "120g cocido",
    kcal: 120, protein: 1.5, carbs: 28, fat: 0.2, sugar: 2, fiber: 3,
    tags: ["Almidón resistente"],
  },
  {
    name: "Plátano macho sancochado",
    group: "Carbohidrato",
    portion: "120g cocido",
    kcal: 140, protein: 1.5, carbs: 34, fat: 0.2, sugar: 2, fiber: 2,
    tags: [],
    wheelCategory: "carb",
  },
  {
    name: "Quinoa cocida",
    group: "Carbohidrato",
    portion: "120g",
    kcal: 140, protein: 5, carbs: 24, fat: 2, sugar: 0.8, fiber: 2.5,
    tags: [],
    wheelCategory: "carb",
  },
  {
    name: "Red beans (cocidos)",
    group: "Carbohidrato",
    portion: "100g",
    kcal: 125, protein: 8.5, carbs: 22, fat: 0.5, sugar: 0.5, fiber: 7,
    tags: ["Alta fibra", "Alta proteína"],
  },
  {
    name: "Totopos de maíz",
    group: "Carbohidrato",
    portion: "30g (~15 totopos)",
    kcal: 140, protein: 2, carbs: 19, fat: 6.5, sugar: 0.3, fiber: 1.5,
    tags: ["⚠️ Calóricos"],
  },
  {
    name: "Wrap de proteína",
    group: "Carbohidrato",
    portion: "1 unidad",
    kcal: 130, protein: 12, carbs: 12, fat: 3.5, sugar: 1, fiber: 5,
    tags: ["Alta proteína", "Alta fibra"],
  },

  // ─── VEGETABLES ──────────────────────────────────────────────────
  {
    name: "Brócoli",
    group: "Verdura",
    portion: "100g",
    kcal: 34, protein: 2.8, carbs: 7, fat: 0.4, sugar: 1.7, fiber: 2.6,
    tags: ["Baja cal", "Alta fibra"],
    wheelCategory: "veggie",
  },
  {
    name: "Canónigos",
    group: "Verdura",
    portion: "50g",
    kcal: 10, protein: 1, carbs: 1.8, fat: 0.2, sugar: 0.2, fiber: 1,
    tags: ["Baja cal"],
    wheelCategory: "veggie",
  },
  {
    name: "Cebolla asada/caramelizada",
    group: "Verdura",
    portion: "50g",
    kcal: 45, protein: 0.5, carbs: 8, fat: 1.5, sugar: 4.5, fiber: 0.7,
    tags: [],
  },
  {
    name: "Cebolla cruda",
    group: "Verdura",
    portion: "50g (~½ pequeña)",
    kcal: 20, protein: 0.5, carbs: 4.5, fat: 0.1, sugar: 2.1, fiber: 0.8,
    tags: ["Baja cal"],
  },
  {
    name: "Espárragos",
    group: "Verdura",
    portion: "100g",
    kcal: 20, protein: 2.2, carbs: 3.9, fat: 0.1, sugar: 1.9, fiber: 2.1,
    tags: ["Baja cal", "Alta fibra"],
    wheelCategory: "veggie",
  },
  {
    name: "Espinaca baby",
    group: "Verdura",
    portion: "30g",
    kcal: 7, protein: 0.9, carbs: 1, fat: 0.1, sugar: 0.1, fiber: 0.7,
    tags: ["Baja cal"],
    wheelCategory: "veggie",
  },
  {
    name: "Lechuga mix",
    group: "Verdura",
    portion: "100g",
    kcal: 15, protein: 1.2, carbs: 2.5, fat: 0.2, sugar: 0.8, fiber: 1.3,
    tags: ["Baja cal"],
    wheelCategory: "veggie",
  },
  {
    name: "Pepino",
    group: "Verdura",
    portion: "50g",
    kcal: 8, protein: 0.3, carbs: 1.8, fat: 0.1, sugar: 0.9, fiber: 0.3,
    tags: ["Baja cal"],
  },
  {
    name: "Pimentones",
    group: "Verdura",
    portion: "150g",
    kcal: 45, protein: 1.5, carbs: 9, fat: 0.3, sugar: 6, fiber: 2,
    tags: ["Baja cal"],
    wheelCategory: "veggie",
  },
  {
    name: "Rúcula",
    group: "Verdura",
    portion: "30g",
    kcal: 8, protein: 0.8, carbs: 1.1, fat: 0.2, sugar: 0.6, fiber: 0.5,
    tags: ["Baja cal"],
    wheelCategory: "veggie",
  },
  {
    name: "Tomate cherry",
    group: "Verdura",
    portion: "100g",
    kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.1, sugar: 2.6, fiber: 1.2,
    tags: ["Baja cal"],
    wheelCategory: "veggie",
  },

  // ─── FRUITS ──────────────────────────────────────────────────────
  {
    name: "Aguacate",
    group: "Fruta",
    portion: "50g (~¼ mediano)",
    kcal: 80, protein: 1, carbs: 4.3, fat: 7.3, sugar: 0.3, fiber: 3.4,
    tags: ["Alta fibra", "⚠️ Calórico"],
  },
  {
    name: "Banana",
    group: "Fruta",
    portion: "1 mediana (~120g)",
    kcal: 100, protein: 1.3, carbs: 23, fat: 0.3, sugar: 14, fiber: 2.6,
    tags: ["Pre-workout"],
    wheelCategory: "fruit",
  },
  {
    name: "Cerezas",
    group: "Fruta",
    portion: "80g (~12-15)",
    kcal: 50, protein: 0.8, carbs: 12, fat: 0.2, sugar: 10, fiber: 1.6,
    tags: ["Baja cal"],
    wheelCategory: "fruit",
  },
  {
    name: "Manzana Pink Lady",
    group: "Fruta",
    portion: "1 mediana (~180g)",
    kcal: 95, protein: 0.5, carbs: 23, fat: 0.3, sugar: 18, fiber: 2.5,
    tags: [],
    wheelCategory: "fruit",
  },
  {
    name: "Uvas verdes",
    group: "Fruta",
    portion: "100g (~15-18)",
    kcal: 70, protein: 0.7, carbs: 17, fat: 0.2, sugar: 16, fiber: 0.9,
    tags: [],
    wheelCategory: "fruit",
  },

  // ─── DAIRY ───────────────────────────────────────────────────────
  {
    name: "Cacaolat sin azúcar añadida",
    group: "Lácteo",
    portion: "200ml",
    kcal: 90, protein: 4, carbs: 10, fat: 3.5, sugar: 7, fiber: 1.5,
    tags: [],
  },
  {
    name: "Leche de soya sin azúcar",
    group: "Lácteo",
    portion: "200ml",
    kcal: 54, protein: 7, carbs: 0.4, fat: 2.6, sugar: 3.6, fiber: 0.6,
    tags: ["Alta proteína", "Baja cal"],
  },
  {
    name: "Mantequilla",
    group: "Lácteo",
    portion: "10g (~1 cdita)",
    kcal: 74, protein: 0.1, carbs: 0, fat: 8.1, sugar: 0, fiber: 0,
    tags: ["⚠️ Calórica"],
  },
  {
    name: "Queso cheddar",
    group: "Lácteo",
    portion: "25g (1 loncha)",
    kcal: 100, protein: 6.3, carbs: 0.3, fat: 8.5, sugar: 0.1, fiber: 0,
    tags: ["⚠️ Calórico"],
  },
  {
    name: "Queso manchego",
    group: "Lácteo",
    portion: "25g (1 loncha)",
    kcal: 100, protein: 6, carbs: 0.5, fat: 8, sugar: 0.3, fiber: 0,
    tags: ["⚠️ Calórico"],
  },
  {
    name: "Queso mozzarella",
    group: "Lácteo",
    portion: "30g",
    kcal: 85, protein: 6, carbs: 0.7, fat: 6.5, sugar: 0.3, fiber: 0,
    tags: [],
  },
  {
    name: "Queso parmesano/pecorino",
    group: "Lácteo",
    portion: "10g rallado (~1 cda)",
    kcal: 40, protein: 3.5, carbs: 0.3, fat: 2.8, sugar: 0, fiber: 0,
    tags: ["Alta proteína"],
  },
  {
    name: "Yogur griego 0%",
    group: "Lácteo",
    portion: "2 cdas (40g)",
    kcal: 22, protein: 4, carbs: 1.5, fat: 0, sugar: 1.5, fiber: 0,
    tags: ["Alta proteína", "Baja cal"],
  },
  {
    name: "Yogur stracciatella 0% proteico",
    group: "Lácteo",
    portion: "1 envase",
    kcal: 130, protein: 12, carbs: 12, fat: 3, sugar: 8, fiber: 0,
    tags: ["Alta proteína"],
  },

  // ─── FATS ────────────────────────────────────────────────────────
  {
    name: "Aceite de oliva (1 cdita)",
    group: "Grasa",
    portion: "5ml",
    kcal: 40, protein: 0, carbs: 0, fat: 4.5, sugar: 0, fiber: 0,
    tags: [],
  },
  {
    name: "Aceite de oliva (1 cda)",
    group: "Grasa",
    portion: "15ml",
    kcal: 120, protein: 0, carbs: 0, fat: 13.5, sugar: 0, fiber: 0,
    tags: ["⚠️ Calórico"],
  },
  {
    name: "Chía",
    group: "Grasa",
    portion: "10g (~1 cda)",
    kcal: 49, protein: 1.7, carbs: 4.2, fat: 3.1, sugar: 0, fiber: 3.4,
    tags: ["Alta fibra", "Omega-3"],
  },
  {
    name: "Mantequilla de almendra Rossmann",
    group: "Grasa",
    portion: "15g (1 cda)",
    kcal: 97, protein: 3.5, carbs: 0.8, fat: 8.6, sugar: 0.6, fiber: 1.4,
    tags: ["Baja cal"],
  },
  {
    name: "Mostaza",
    group: "Grasa",
    portion: "1 cdita (5g)",
    kcal: 3, protein: 0.2, carbs: 0.3, fat: 0.2, sugar: 0.1, fiber: 0,
    tags: ["Baja cal"],
  },
  {
    name: "Spray de aceite",
    group: "Grasa",
    portion: "1 spray (1 seg)",
    kcal: 8, protein: 0, carbs: 0, fat: 0.9, sugar: 0, fiber: 0,
    tags: ["Baja cal"],
  },

  // ─── EXTRAS ──────────────────────────────────────────────────────
  {
    name: "Cacao en polvo sin azúcar",
    group: "Extra",
    portion: "1 cdita (5g)",
    kcal: 12, protein: 1, carbs: 1.5, fat: 0.5, sugar: 0, fiber: 1.5,
    tags: ["Baja cal"],
  },
  {
    name: "Popcorn (aceite, salados)",
    group: "Extra",
    portion: "30g maíz → ~25g hecho",
    kcal: 170, protein: 3, carbs: 20, fat: 9, sugar: 0, fiber: 3.5,
    tags: ["Alta fibra", "⚠️ Calórico"],
  },
  {
    name: "Mini Helado Magnum Clasico",
    group: "Extra",
    portion: "1 unidad (~42g)",
    kcal: 119,
    protein: 2.2,
    carbs: 14.8,
    fat: 5.8,
    sugar: 14.8,
    fiber: 0,
    tags: ["⚠️ Calórico", "Azúcar", "Calorías vacías"],
  },
  {
    name: "Papas fritas con aceite de oliva 29%",
    group: "Extra",
    portion: "100g",
    kcal: 508,
    protein: 7.3,
    carbs: 52,
    fat: 29,
    sugar: 0.5,
    fiber: 4.7,
    tags: ["⚠️ Calórico", "Calorías vacías"],
  },

  // ─── ELIMINATED ──────────────────────────────────────────────────
  {
    name: "Corn flakes",
    group: "❌ Eliminado",
    portion: "30g",
    kcal: 114, protein: 2, carbs: 25, fat: 0.3, sugar: 3, fiber: 0.5,
    tags: ["Calorías vacías"],
  },
  {
    name: "Ketchup",
    group: "❌ Eliminado",
    portion: "1 cdita (5g)",
    kcal: 5, protein: 0, carbs: 1.2, fat: 0, sugar: 1, fiber: 0,
    tags: ["Azúcar"],
  },
  {
    name: "Mayonesa",
    group: "❌ Eliminado",
    portion: "1 cdita (5g)",
    kcal: 33, protein: 0, carbs: 0.1, fat: 3.6, sugar: 0.1, fiber: 0,
    tags: ["Calorías vacías"],
  },
];

// ─── DERIVED WHEEL DATA (from FOODS with wheelCategory) ──────────
export type WheelCategory = "protein" | "veggie" | "carb" | "fruit";

export interface WheelItem {
  name: string;
  portion: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export const WHEEL_CATEGORY_META: Record<WheelCategory, { label: string; color: string; skippable: boolean }> = {
  protein: { label: "Proteína", color: "#FFD1A1", skippable: false },
  veggie: { label: "Veggie / Fibra", color: "#B2D8B2", skippable: false },
  carb: { label: "Carbohidrato", color: "#BDE0FE", skippable: true },
  fruit: { label: "Fruta / Postre", color: "#F5C6D0", skippable: false },
};

export const WHEEL_STEPS: WheelCategory[] = ["protein", "veggie", "carb", "fruit"];

export function getWheelItems(category: WheelCategory): WheelItem[] {
  return FOODS.filter((f) => f.wheelCategory === category).map((f) => ({
    name: f.name,
    portion: f.portion,
    kcal: f.kcal,
    protein: f.protein,
    carbs: f.carbs,
    fat: f.fat,
    fiber: f.fiber,
  }));
}

// ─── FOOD DB HELPERS ─────────────────────────────────────────────
export const GROUP_ORDER: FoodGroup[] = [
  "Proteína", "Carbohidrato", "Verdura", "Fruta",
  "Lácteo", "Grasa", "Extra", "❌ Eliminado",
];

export const GROUP_COLORS: Record<FoodGroup, { bg: string; text: string }> = {
  "Proteína": { bg: "#FFD1A1", text: "#1A1A1A" },
  "Carbohidrato": { bg: "#BDE0FE", text: "#1A1A1A" },
  "Verdura": { bg: "#B2D8B2", text: "#1A1A1A" },
  "Fruta": { bg: "#F5C6D0", text: "#1A1A1A" },
  "Lácteo": { bg: "#FFF0E5", text: "#1A1A1A" },
  "Grasa": { bg: "#E8E0D4", text: "#1A1A1A" },
  "Extra": { bg: "#E0BBE4", text: "#1A1A1A" },
  "❌ Eliminado": { bg: "#D4D4D4", text: "#666" },
};

export const TAG_COLORS: Partial<Record<FoodTag, { bg: string; text: string }>> = {
  "Alta proteína": { bg: "#FFD1A1", text: "#1A1A1A" },
  "Alta fibra": { bg: "#B2D8B2", text: "#1A1A1A" },
  "Baja cal": { bg: "#BDE0FE", text: "#1A1A1A" },
  "Omega-3": { bg: "#BDE0FE", text: "#1A1A1A" },
  "Pre-workout": { bg: "#E0BBE4", text: "#1A1A1A" },
  "Almidón resistente": { bg: "#BDE0FE", text: "#1A1A1A" },
  "⚠️ Calórico": { bg: "#F5C6D0", text: "#1A1A1A" },
  "⚠️ Calóricos": { bg: "#F5C6D0", text: "#1A1A1A" },
  "⚠️ Calórica": { bg: "#F5C6D0", text: "#1A1A1A" },
  "Calorías vacías": { bg: "#D4D4D4", text: "#666" },
  "Azúcar": { bg: "#D4D4D4", text: "#666" },
};
