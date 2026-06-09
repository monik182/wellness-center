// Glycemic Index reference table - University of Sydney database
// Covers ~100 most common foods
// Reference: https://glycemicindex.com/

export interface GIEntry {
  name: string;
  aliases?: string[]; // For fuzzy matching
  gi: number;
}

export const GI_TABLE: GIEntry[] = [
  // Grains and breads
  { name: "pan blanco", aliases: ["pan", "white bread"], gi: 75 },
  { name: "pan integral", aliases: ["whole wheat bread"], gi: 77 },
  { name: "arroz blanco", aliases: ["white rice", "rice"], gi: 72 },
  { name: "arroz integral", aliases: ["brown rice"], gi: 68 },
  { name: "pasta", aliases: ["spaghetti", "penne"], gi: 49 },
  { name: "avena", aliases: ["oats", "oatmeal"], gi: 57 },
  { name: "cereal desayuno", aliases: ["breakfast cereal"], gi: 77 },
  { name: "tortilla maiz", aliases: ["corn tortilla"], gi: 68 },

  // Vegetables
  { name: "zanahoria", aliases: ["carrot"], gi: 35 },
  { name: "papa blanca", aliases: ["potato", "white potato"], gi: 85 },
  { name: "batata", aliases: ["sweet potato"], gi: 63 },
  { name: "maiz", aliases: ["corn"], gi: 60 },
  { name: "tomate", aliases: ["tomato"], gi: 15 },
  { name: "brocoli", aliases: ["broccoli"], gi: 10 },
  { name: "espinaca", aliases: ["spinach"], gi: 15 },
  { name: "lechuga", aliases: ["lettuce"], gi: 15 },

  // Fruits
  { name: "platano", aliases: ["banana"], gi: 51 },
  { name: "manzana", aliases: ["apple"], gi: 36 },
  { name: "naranja", aliases: ["orange"], gi: 43 },
  { name: "uvas", aliases: ["grapes"], gi: 59 },
  { name: "fresa", aliases: ["strawberry"], gi: 41 },
  { name: "sandia", aliases: ["watermelon"], gi: 72 },
  { name: "pina", aliases: ["pineapple"], gi: 59 },
  { name: "mango", aliases: ["mango"], gi: 51 },
  { name: "pera", aliases: ["pear"], gi: 38 },
  { name: "kiwi", aliases: ["kiwi"], gi: 58 },

  // Legumes
  { name: "lentejas", aliases: ["lentils"], gi: 32 },
  { name: "garbanzos", aliases: ["chickpeas"], gi: 33 },
  { name: "frijoles negros", aliases: ["black beans"], gi: 30 },
  { name: "frijoles pintos", aliases: ["pinto beans"], gi: 39 },

  // Proteins - very low GI
  { name: "pollo", aliases: ["chicken", "chicken breast"], gi: 0 },
  { name: "pavo", aliases: ["turkey"], gi: 0 },
  { name: "carne res", aliases: ["beef", "steak"], gi: 0 },
  { name: "cerdo", aliases: ["pork"], gi: 0 },
  { name: "pescado", aliases: ["fish", "salmon"], gi: 0 },
  { name: "huevo", aliases: ["egg", "eggs"], gi: 0 },
  { name: "atun", aliases: ["tuna"], gi: 0 },

  // Dairy
  { name: "leche descremada", aliases: ["skim milk"], gi: 41 },
  { name: "leche entera", aliases: ["whole milk"], gi: 31 },
  { name: "yogur natural", aliases: ["plain yogurt"], gi: 36 },
  { name: "yogur frutas", aliases: ["fruit yogurt"], gi: 51 },
  { name: "queso", aliases: ["cheese"], gi: 0 },

  // Nuts and seeds
  { name: "almendras", aliases: ["almonds"], gi: 15 },
  { name: "nueces", aliases: ["walnuts"], gi: 15 },
  { name: "cacahuates", aliases: ["peanuts"], gi: 23 },
  { name: "semilla linaza", aliases: ["flax seeds"], gi: 25 },

  // Sweets and sugars
  { name: "azucar", aliases: ["sugar", "white sugar"], gi: 65 },
  { name: "miel", aliases: ["honey"], gi: 58 },
  { name: "chocolate", aliases: ["dark chocolate"], gi: 37 },
  { name: "refresco", aliases: ["soda", "soft drink"], gi: 63 },
  { name: "jugo naranja", aliases: ["orange juice"], gi: 50 },
  { name: "mermelada", aliases: ["jam"], gi: 51 },

  // Pasta dishes
  { name: "ramen", gi: 63 },
  { name: "pizza", gi: 60 },
  { name: "empanada", gi: 54 },

  // Miscellaneous
  { name: "galletitas", aliases: ["cookies"], gi: 69 },
  { name: "rosquilla", aliases: ["donut"], gi: 76 },
  { name: "croissant", gi: 67 },
  { name: "barrita cereal", aliases: ["granola bar"], gi: 61 },
  { name: "papas fritas", aliases: ["french fries"], gi: 63 },
  { name: "pure papas", aliases: ["mashed potatoes"], gi: 85 },
  { name: "polenta", gi: 68 },
];

// Fuzzy match helper for GI lookup
export function findGIEntry(foodName: string): GIEntry | undefined {
  const normalized = foodName
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics

  // Exact match first
  for (const entry of GI_TABLE) {
    if (entry.name === normalized) return entry;
    if (entry.aliases?.some((a) => a === normalized)) return entry;
  }

  // Substring match (contains)
  for (const entry of GI_TABLE) {
    if (normalized.includes(entry.name) || entry.name.includes(normalized)) {
      return entry;
    }
    if (entry.aliases?.some((a) => normalized.includes(a) || a.includes(normalized))) {
      return entry;
    }
  }

  return undefined;
}
