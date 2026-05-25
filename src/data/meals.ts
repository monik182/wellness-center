// ─── MEAL PLAN DATA ──────────────────────────────────────────────

export interface MealOption {
  name: string;
  kcal: number;
  protein: string;
  ingredients: string[];
  notes?: string;
  prep?: string;
}

export interface MealCategory {
  title: string;
  emoji: string;
  options: MealOption[];
}

export const MEALS: Record<string, MealCategory> = {
  desayuno: {
    title: "Desayuno",
    emoji: "☀️",
    options: [
      {
        name: "Batido mocha proteico",
        kcal: 220,
        protein: "28g",
        ingredients: [
          "1 scoop proteína Rossmann (30g)",
          "200ml leche de soya sin azúcar",
          "1 shot de café (espresso o café concentrado frío)",
          "1 cdita cacao en polvo sin azúcar (5g)",
          "Hielo al gusto",
        ],
        notes: "~220 kcal, alto en proteína, cero azúcar añadida.",
        prep: "Licuar todo. 2 min.",
      },
      {
        name: "Tostada de proteína",
        kcal: 310,
        protein: "25g",
        ingredients: [
          "2 rebanadas pan integral (tipo Mercadona fibra, ~70g)",
          "2 huevos revueltos (spray de aceite, NO aceite vertido)",
          "Sal, pimienta, pimentón",
          "Opcional: espinaca baby encima",
        ],
        notes: "Para días que quieras algo caliente y masticable.",
        prep: "5 min.",
      },
    ],
  },
  almuerzo: {
    title: "Almuerzo (Meal Prep)",
    emoji: "🍱",
    options: [
      {
        name: "Bowl de quinoa y pollo",
        kcal: 420,
        protein: "40g",
        ingredients: [
          "150g pechuga de pollo a la plancha (PESADA CRUDA)",
          "120g quinoa COCIDA",
          "150g pimentones asados",
          "1 cucharadita aceite de oliva (5ml) — MEDIDA",
          "100g tomate cherry",
          "Puñado de espinaca (~30g)",
          "Jugo de limón, sal, pimienta, orégano",
        ],
        notes: "MIDE el aceite. 1 cucharadita para tu plato al servir.",
        prep: "Prep domingo.",
      },
      {
        name: "Wrap de proteína",
        kcal: 380,
        protein: "36g",
        ingredients: [
          "1 wrap de proteína",
          "120g pollo desmenuzado o pavo",
          "30g espinaca",
          "50g pimentones asados",
          "Salsa: 2 cdas yogur griego 0% + 1 cdita mostaza + limón",
        ],
        notes: "FUERA mayo y ketchup. Yogur + mostaza + limón.",
        prep: "Montar. 3 min.",
      },
      {
        name: "Ensalada grande de atún",
        kcal: 370,
        protein: "35g",
        ingredients: [
          "1 lata atún en agua (escurrido, ~120g)",
          "Mix de lechugas (~100g)",
          "100g tomate",
          "50g pepino",
          "50g maíz (de lata, escurrido)",
          "80g quinoa cocida",
          "Vinagreta: 1 cdita aceite oliva + vinagre + limón + sal",
        ],
        notes: "Para variedad sin cocinar extra.",
        prep: "Montar. 5 min.",
      },
    ],
  },
  postre: {
    title: "Postre post-almuerzo",
    emoji: "🍒",
    options: [
      {
        name: "Cerezas",
        kcal: 50,
        protein: "1g",
        ingredients: ["80g cerezas (~12-15 cerezas)"],
        notes: "La opción más baja en calorías.",
      },
      {
        name: "Uvas verdes",
        kcal: 70,
        protein: "1g",
        ingredients: ["100g uvas verdes (~15-18 uvas)"],
        notes: "Pesa o cuenta.",
      },
    ],
  },
  snack: {
    title: "Snack (1/día, 2 en día gym)",
    emoji: "🧀",
    options: [
      {
        name: "Yogur stracciatella proteico",
        kcal: 130,
        protein: "12g",
        ingredients: ["1 yogur stracciatella 0% azúcar con proteína"],
        notes: "Directo del envase.",
      },
      {
        name: "Queso manchego/cheddar + fruta",
        kcal: 180,
        protein: "8g",
        ingredients: [
          "25g queso manchego O cheddar (1 loncha fina, PESAR)",
          "80g cerezas O 100g uvas verdes",
        ],
        notes: "25g, no más. ~400 kcal/100g estos quesos.",
      },
      {
        name: "Banana",
        kcal: 100,
        protein: "1g",
        ingredients: ["1 banana mediana (~120g)"],
        notes: "Ideal pre-gym. Energía rápida.",
      },
    ],
  },
  preworkout: {
    title: "Pre-workout (30-60 min antes)",
    emoji: "⚡",
    options: [
      {
        name: "Banana",
        kcal: 100,
        protein: "1g",
        ingredients: ["1 banana mediana (~120g)"],
        notes: "El clásico. Carbohidrato rápido, fácil de digerir, cero prep.",
      },
      {
        name: "Tostada con miel",
        kcal: 130,
        protein: "3g",
        ingredients: ["1 rebanada pan masa madre (~35g)", "1 cdita miel (7g)"],
        notes: "Carbohidrato rápido + un poco de sustancia. Ligero.",
        prep: "1 min.",
      },
      {
        name: "Arepa mini",
        kcal: 120,
        protein: "2g",
        ingredients: ["1 arepa pequeña (40g harina PAN, agua, sal)"],
        notes: "Sola, sin relleno. Carbohidrato que te da energía para entrenar.",
        prep: "10 min (o del batch).",
      },
      {
        name: "Uvas + café",
        kcal: 75,
        protein: "1g",
        ingredients: ["100g uvas verdes", "1 café negro"],
        notes: "La opción más ligera. La cafeína ayuda al rendimiento.",
      },
      {
        name: "Overnight oats mini",
        kcal: 150,
        protein: "10g",
        ingredients: [
          "25g avena",
          "5g chía",
          "100ml leche soya sin azúcar",
          "½ scoop proteína (15g)",
        ],
        notes: "Prep la noche anterior. Porción pequeña para no entrenar pesada.",
        prep: "0 min (prepped).",
      },
    ],
  },
};

// ─── SCHEDULES ───────────────────────────────────────────────────

export interface ScheduleRow {
  time: string;
  meal: string;
  detail: string;
}

export interface DaySchedule {
  title: string;
  schedule: ScheduleRow[];
  notes?: string;
  total: string;
}

export const SCHEDULES: DaySchedule[] = [
  {
    title: "🏋️ Gym en la TARDE/NOCHE",
    schedule: [
      { time: "Mañana",    meal: "Desayuno normal",             detail: "Batido mocha o tostada (~220-310 kcal)" },
      { time: "Mediodía",  meal: "Almuerzo + postre fruta",     detail: "Bowl/wrap (~380-420 kcal) + cerezas/uvas (~50-70 kcal). Mínimo 2h antes del gym." },
      { time: "Pre-gym",   meal: "Snack energético",            detail: "Banana, arepa mini, tostada con miel, uvas+café, u overnight oats mini (~75-150 kcal)" },
      { time: "Post-gym",  meal: "Snack recuperación (25-30g prot)", detail: "Batido mocha proteico (28g prot, ~220 kcal) — ideal. O yogur stracciatella + 2 lonchas pavo (29g prot, ~215 kcal). El yogur solo (12g) no es suficiente." },
    ],
    notes: "2 snacks en día de gym (pre + post). Total ~1,600-1,700 kcal. Sigue en déficit por lo que quemaste.",
    total: "~1,600-1,700 kcal",
  },
  {
    title: "🌅 Gym en la MAÑANA",
    schedule: [
      { time: "Al despertar", meal: "Pre-gym ligero",       detail: "Banana, uvas+café, o arepa mini (~75-120 kcal). Algo que se digiera rápido, 30 min antes." },
      { time: "Post-gym",     meal: "Desayuno completo",    detail: "Batido mocha proteico O tostada de proteína O overnight oats con scoop completo (~220-310 kcal). La proteína post-entreno es clave." },
      { time: "Mediodía",     meal: "Almuerzo + postre",    detail: "Bowl/wrap/ensalada (~370-420 kcal) + cerezas/uvas (~50-70 kcal)" },
      { time: "Tarde",        meal: "1 snack",              detail: "Yogur, queso+fruta (~130-180 kcal)" },
    ],
    notes: "No entrenes en ayunas si vas a hacer cardio intenso o pesas. Algo pequeño marca la diferencia en rendimiento.",
    total: "~1,550-1,700 kcal",
  },
  {
    title: "🛋️ Día sin Gym",
    schedule: [
      { time: "Mañana",          meal: "Desayuno",           detail: "Batido mocha o tostada (~220-310 kcal)" },
      { time: "Mediodía",        meal: "Almuerzo + postre",  detail: "Bowl, wrap o ensalada (~370-420 kcal) + cerezas/uvas (~50-70 kcal)" },
      { time: "Cuando tengas hambre", meal: "1 snack",       detail: "Yogur, queso+fruta, o banana (~100-180 kcal)" },
    ],
    total: "~1,400-1,550 kcal",
  },
];

// ─── MEAL PREP GUIDE ─────────────────────────────────────────────

export interface PrepStep {
  step: string;
  title: string;
  detail: string;
  time: string;
}

export const PREP_GUIDE: PrepStep[] = [
  { step: "1", title: "Cocinar quinoa",   detail: "Batch. Guardar en tupper grande. Servir 120g cocida por porción.",                                              time: "20 min" },
  { step: "2", title: "Pollo a la plancha", detail: "750g pechuga. Salpimentar. SPRAY de aceite. Porciones de 150g.",                                              time: "20 min" },
  { step: "3", title: "Asar pimentones", detail: "4-5 cortados. 1 CUCHARADA aceite para TODO (medir). Horno 200°C, 25 min.",                                       time: "30 min" },
  { step: "4", title: "Hervir huevos",   detail: "4-5 huevos duros. Guardar con cáscara.",                                                                        time: "12 min" },
  { step: "5", title: "Overnight oats (opcional)", detail: "2-3 porciones: 40g avena + 10g chía + 200ml leche soya por porción. Nevera.",                         time: "5 min"  },
  { step: "6", title: "Montar tuppers",  detail: "4-5 tuppers: quinoa (120g cocida) + pollo + pimentones + espinaca + tomate. SIN aceite — 1 cdita al servir.",   time: "10 min" },
];

// ─── GROCERY LIST ────────────────────────────────────────────────

export const GROCERY_LIST: Record<string, string[]> = {
  "Proteínas": [
    "Pechuga de pollo (~750g)",
    "1-2 latas de atún en agua",
    "Huevos (6-10)",
    "Pavo en lonchas",
    "Jamón serrano (opcional)",
    "Pescado fresco: salmón, atún, o merluza (1-2 filetes)",
  ],
  "Carbohidratos": [
    "Quinoa",
    "Wraps de proteína",
    "Pan integral con fibra",
    "Pan masa madre (opcional)",
    "Avena",
    "Harina PAN (para arepas)",
    "Black o red beans (lata o secos)",
  ],
  "Verduras y frutas": [
    "Pimentones rojos/amarillos (4-5)",
    "Espinaca baby (bolsa grande)",
    "Rúcula y/o canónigos",
    "Tomates cherry (2 bandejas)",
    "Pepino (2)",
    "Brócoli (fresco o congelado)",
    "Espárragos congelados",
    "Bananas (3-4)",
    "Uvas verdes (1 racimo)",
    "Cerezas (temporada)",
    "Manzanas Pink Lady",
    "Limones (3-4)",
  ],
  "Lácteos y otros": [
    "Yogur stracciatella 0% proteico (pack)",
    "Queso manchego O cheddar (bloque pequeño)",
    "Mozzarella (opcional)",
    "Parmesano o pecorino (para rallar)",
    "Leche de soya sin azúcar (1L)",
    "Cacaolat sin azúcar (opcional)",
    "Proteína en polvo Rossmann",
    "Cacao en polvo sin azúcar",
    "Chía",
    "Mostaza",
    "Aceite de oliva",
    "Spray de aceite ← COMPRAR SI NO TIENES",
    "Vinagre",
    "Maíz en lata",
  ],
};

// ─── RULES ───────────────────────────────────────────────────────

export const KEY_RULES = [
  "MIDE EL ACEITE. Siempre. Spray para sartén, cucharita para aliñar. Culpable #1.",
  "PORCIONA ANTES DE COMER. Nunca del paquete/olla/bloque de queso directo. Pesa, sirve, guarda.",
];

export const WHAT_CHANGED = [
  { what: "Aceite",       change: "Chorro libre → spray + 1 cdita medida",         saving: "~200-300 kcal menos/día" },
  { what: "Salsa wrap",   change: "Yogur+mayo+ketchup → yogur+mostaza+limón",       saving: "~80 kcal menos"          },
  { what: "Corn flakes",  change: "Eliminados del batido",                          saving: "Calorías vacías"          },
  { what: "Postre",       change: "Fruta medida después del almuerzo",              saving: "Cierre de comida sin pasarse" },
];

export const SWEETS_RULES = [
  'No es "prohibido". Es "presupuestado".',
  "Máximo 2 días/semana con dulce.",
  "Porción medida ANTES de comer (saca, guarda el paquete, siéntate).",
  "Si comes dulce ese día, el snack ES el dulce. No es extra.",
  "Si un día te pasas: el día siguiente sigue normal. No compenses saltando comidas.",
];
