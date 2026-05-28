import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function MacroTargetsPage() {
  return (
    <div className="pb-8">
      {/* Daily Budget */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3" style={{ color: "var(--ink)" }}>
          📊 Daily Calorie & Macro Budget
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-[13px] font-semibold mb-1.5" style={{ color: "var(--ink)" }}>Regular Day</p>
              <p className="text-sm font-semibold" style={{ color: "var(--green)" }}>1,400–1,550 kcal</p>
              <p className="text-[11px] mt-1.5" style={{ color: "var(--ink-muted)" }}>No gym</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-[13px] font-semibold mb-1.5" style={{ color: "var(--ink)" }}>Gym Day</p>
              <p className="text-sm font-semibold" style={{ color: "var(--blue)" }}>1,600–1,700 kcal</p>
              <p className="text-[11px] mt-1.5" style={{ color: "var(--ink-muted)" }}>+200 kcal pre/post</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Macro Targets Table */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3" style={{ color: "var(--ink)" }}>
          🎯 Macronutrient Targets
        </h2>
        <Card className="overflow-hidden overflow-x-auto">
          <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--peach)", borderBottom: "1px solid var(--border-color)" }}>
                <th className="px-3 py-2.5 text-left font-semibold" style={{ color: "var(--ink)" }}>Macro</th>
                <th className="px-3 py-2.5 text-center font-semibold" style={{ color: "var(--ink)" }}>Regular</th>
                <th className="px-3 py-2.5 text-center font-semibold" style={{ color: "var(--ink)" }}>Gym</th>
                <th className="px-3 py-2.5 text-left font-semibold" style={{ color: "var(--ink)" }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {[
                { macro: "Protein", regular: "110–130g", gym: "120–140g", note: "~0.8–1g/kg body" },
                { macro: "Carbs",   regular: "150–180g", gym: "180–210g", note: "Around gym time" },
                { macro: "Fat",     regular: "40–50g",   gym: "45–55g",   note: "Measured (aceite)" },
                { macro: "Fiber",   regular: "25–30g",   gym: "25–30g",   note: "For satiety" },
                { macro: "Sugar",   regular: "<25g",     gym: "<25g",     note: "Fruit + treats" },
              ].map((row, i) => (
                <tr
                  key={i}
                  style={{
                    background: i % 2 === 0 ? "var(--cream)" : "var(--beige)",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  <td className="px-3 py-2.5 font-semibold" style={{ color: "var(--ink)" }}>{row.macro}</td>
                  <td className="px-3 py-2.5 text-center" style={{ color: "var(--ink-muted)" }}>{row.regular}</td>
                  <td className="px-3 py-2.5 text-center" style={{ color: "var(--ink-muted)" }}>{row.gym}</td>
                  <td className="px-3 py-2.5 text-[11px]" style={{ color: "var(--ink-muted)" }}>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Regular Day Breakdown */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3" style={{ color: "var(--ink)" }}>
          📅 Regular Day Breakdown
        </h2>

        <MealSection
          mealType="Breakfast"
          emoji="🌅"
          accentColor="var(--orange)"
          targetKcal="220–310"
          targetProtein="24–28g"
          targetCarbs="0–35g"
          targetFiber="0–5g"
          options={[
            {
              name: "Batido Mocha",
              kcal: 220, protein: 28, carbs: 0, fiber: 0,
              ingredients: [
                "1 scoop proteína Rossmann = 24g prot",
                "200ml leche soya sin azúcar = 7g prot",
                "1 shot café",
                "1 cdita cacao sin azúcar",
              ],
            },
            {
              name: "Tostada de Proteína",
              kcal: 310, protein: 25, carbs: 28, fiber: 5,
              ingredients: [
                "2 rebanadas pan integral = 7g prot + 28g carbs + 5g fiber",
                "2 huevos revueltos = 14g prot + 1g carbs",
              ],
            },
          ]}
        />

        <MealSection
          mealType="Lunch + Fruit"
          emoji="🍽️"
          accentColor="var(--green)"
          targetKcal="420–490"
          targetProtein="35–40g"
          targetCarbs="35–50g"
          targetFiber="3–8g"
          options={[
            {
              name: "Quinoa & Chicken Bowl",
              kcal: 420, protein: 40, carbs: 33, fiber: 4.5,
              ingredients: [
                "150g pechuga pollo = 31g prot",
                "120g quinoa cocida = 5g prot + 24g carbs + 2.5g fiber",
                "150g pimentones = 1.5g prot + 9g carbs + 2g fiber",
                "100g tomate cherry = 0.9g prot + 3.9g carbs + 1.2g fiber",
                "80g cerezas = 0.8g prot + 12g carbs + 1.6g fiber",
              ],
            },
            {
              name: "Wrap de Proteína + Fruta",
              kcal: 430, protein: 36, carbs: 35, fiber: 6.5,
              ingredients: [
                "1 wrap proteína = 12g prot + 12g carbs + 5g fiber",
                "120g pollo desmenuzado = 24g prot",
                "30g espinaca = 0.9g prot + 1g carbs + 0.7g fiber",
                "100g uvas = 0.7g prot + 17g carbs + 0.9g fiber",
              ],
            },
            {
              name: "Ensalada de Atún",
              kcal: 400, protein: 35, carbs: 45, fiber: 5,
              ingredients: [
                "120g atún en lata = 28g prot",
                "80g quinoa cocida = 4g prot + 16g carbs + 2g fiber",
                "100g lechuga mix = 1.2g prot + 2.5g carbs + 1.3g fiber",
                "100g tomate = 0.9g prot + 3.9g carbs + 1.2g fiber",
                "1 manzana Pink Lady = 0.5g prot + 23g carbs + 2.5g fiber",
              ],
            },
          ]}
        />

        <MealSection
          mealType="Snack"
          emoji="🥜"
          accentColor="var(--lavender)"
          targetKcal="100–180"
          targetProtein="1–12g"
          targetCarbs="12–23g"
          targetFiber="0–3g"
          options={[
            {
              name: "Yogur Stracciatella",
              kcal: 130, protein: 12, carbs: 12, fiber: 0,
              ingredients: ["1 yogur stracciatella = 12g prot + 12g carbs"],
            },
            {
              name: "Queso + Fruta",
              kcal: 180, protein: 8, carbs: 17, fiber: 0.9,
              ingredients: [
                "25g queso manchego = 6g prot + 0.5g carbs",
                "100g uvas = 0.7g prot + 17g carbs + 0.9g fiber",
              ],
            },
            {
              name: "Banana",
              kcal: 100, protein: 1.3, carbs: 23, fiber: 2.6,
              ingredients: ["1 banana mediana = 1.3g prot + 23g carbs + 2.6g fiber"],
            },
          ]}
        />

        <Card className="mt-3">
          <CardContent className="pt-5 pb-5">
            <p className="text-[13px] font-semibold mb-2" style={{ color: "var(--ink)" }}>
              📌 Total Regular Day
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span style={{ color: "var(--ink-muted)" }}>Kcal:</span> <span className="font-semibold" style={{ color: "var(--ink)" }}>~1,450</span></div>
              <div><span style={{ color: "var(--ink-muted)" }}>Protein:</span> <span className="font-semibold" style={{ color: "var(--ink)" }}>110–130g</span></div>
              <div><span style={{ color: "var(--ink-muted)" }}>Carbs:</span> <span className="font-semibold" style={{ color: "var(--ink)" }}>160–190g</span></div>
              <div><span style={{ color: "var(--ink-muted)" }}>Fiber:</span> <span className="font-semibold" style={{ color: "var(--ink)" }}>25–30g</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gym Day Breakdown */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3" style={{ color: "var(--ink)" }}>
          💪 Gym Day Breakdown
        </h2>
        <div
          className="px-3 py-2.5 mb-3 text-xs"
          style={{ background: "var(--peach)", borderLeft: "3px solid var(--blue)", color: "var(--ink)" }}
        >
          💡 Breakfast + Lunch same as Regular Day. Add pre-gym carbs + post-gym protein.
        </div>

        <MealSection
          mealType="Pre-Gym (30–60 min before)"
          emoji="⚡"
          accentColor="var(--blue)"
          targetKcal="75–150"
          targetProtein="0–10g"
          targetCarbs="15–38g"
          targetFiber="0–4g"
          options={[
            {
              name: "Banana",
              kcal: 100, protein: 1.3, carbs: 23, fiber: 2.6,
              ingredients: ["1 banana = 23g carbs (rápido, fácil)"],
            },
            {
              name: "Arepa Mini",
              kcal: 120, protein: 2, carbs: 38, fiber: 2,
              ingredients: ["40g harina PAN = 38g carbs (más sustancia que banana)"],
            },
            {
              name: "Tostada con Miel",
              kcal: 130, protein: 3, carbs: 27, fiber: 1.5,
              ingredients: [
                "1 rebanada pan masa madre = 20g carbs + 4g prot + 1.5g fiber",
                "1 cdita miel = 7g carbs",
              ],
            },
            {
              name: "Uvas + Café",
              kcal: 75, protein: 0.7, carbs: 17, fiber: 0.9,
              ingredients: ["100g uvas = 17g carbs (lightest option)"],
            },
          ]}
        />

        <MealSection
          mealType="Post-Gym (within 2h, protein-focused)"
          emoji="🏆"
          accentColor="var(--pink)"
          targetKcal="215–220"
          targetProtein="28–29g"
          targetCarbs="0–2g"
          targetFiber="0g"
          options={[
            {
              name: "Batido Mocha",
              kcal: 220, protein: 28, carbs: 0, fiber: 0,
              ingredients: [
                "1 scoop proteína Rossmann = 24g prot",
                "200ml leche soya sin azúcar = 7g prot",
                "1 shot café",
                "1 cdita cacao sin azúcar",
              ],
            },
            {
              name: "Yogur + Pavo",
              kcal: 215, protein: 29, carbs: 13, fiber: 0,
              ingredients: [
                "1 yogur stracciatella = 12g prot + 12g carbs",
                "2 lonchas pavo = 17g prot + 1g carbs",
              ],
            },
          ]}
        />

        <Card className="mt-3 mb-3">
          <CardContent className="pt-5 pb-5">
            <p className="text-[13px] font-semibold mb-1.5" style={{ color: "var(--ink)" }}>
              🌙 Optional Evening Snack (if hungry)
            </p>
            <p className="text-xs" style={{ color: "var(--ink-muted)" }}>0–100 kcal</p>
            <p className="text-xs mt-1.5" style={{ color: "var(--ink-muted)" }}>Banana or Uvas</p>
          </CardContent>
        </Card>

        <Card className="mt-3">
          <CardContent className="pt-5 pb-5">
            <p className="text-[13px] font-semibold mb-2" style={{ color: "var(--ink)" }}>
              📌 Total Gym Day
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span style={{ color: "var(--ink-muted)" }}>Kcal:</span> <span className="font-semibold" style={{ color: "var(--ink)" }}>~1,650</span></div>
              <div><span style={{ color: "var(--ink-muted)" }}>Protein:</span> <span className="font-semibold" style={{ color: "var(--ink)" }}>120–140g</span></div>
              <div><span style={{ color: "var(--ink-muted)" }}>Carbs:</span> <span className="font-semibold" style={{ color: "var(--ink)" }}>180–210g</span></div>
              <div><span style={{ color: "var(--ink-muted)" }}>Fiber:</span> <span className="font-semibold" style={{ color: "var(--ink)" }}>25–30g</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fiber & Sugar Reference */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3" style={{ color: "var(--ink)" }}>
          🌱 Fiber & Sugar Reference
        </h2>

        <Card className="mb-3">
          <CardContent className="pt-5 pb-5">
            <p className="text-[13px] font-semibold mb-2.5" style={{ color: "var(--ink)" }}>
              Fiber Sources (aim for 25–30g/day)
            </p>
            <ul className="pl-4 text-xs leading-[1.8]" style={{ color: "var(--ink-muted)" }}>
              <li><strong>Veggies:</strong> pimentones, brócoli, espárragos, espinaca (2–4g per portion)</li>
              <li><strong>Whole grains:</strong> quinoa (2.5g/120g), pan integral (5g/2 slices)</li>
              <li><strong>Beans:</strong> black beans (8g/100g), red beans (7g/100g)</li>
              <li><strong>Fruits:</strong> cerezas (1.6g/80g), uvas (0.9g/100g), manzana (2.5g)</li>
              <li><strong>Seeds:</strong> chía (3.4g/10g)</li>
            </ul>
            <div className="mt-3 px-3 py-2.5 text-[11px]" style={{ background: "var(--peach)", color: "var(--ink)" }}>
              <strong>Rule:</strong> If you hit 25g+ fiber, you're hitting your veggie quota & satiety is good.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-[13px] font-semibold mb-2.5" style={{ color: "var(--ink)" }}>
              Sugar Intake (keep &lt;25g/day)
            </p>
            <div className="text-xs leading-[1.8]" style={{ color: "var(--ink-muted)" }}>
              <p className="mb-2.5">
                <strong>Fruits only contribute:</strong> banana (14g), uvas (16g/100g), manzana (18g), cerezas (10g/80g)
              </p>
              <p className="mb-2.5">
                If you eat 1 fruit/day: you're at ~10–15g from that alone. Rest comes from veggies (minimal) and treats.
              </p>
              <p>
                <strong>Sweets rule:</strong> Max 2 days/week, measured portion. That day, the snack IS the sweet; no extra snack.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Checklist */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3" style={{ color: "var(--ink)" }}>
          ✅ Quick Macro Checklist
        </h2>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="text-xs leading-loose" style={{ color: "var(--ink)" }}>
              {[
                "Breakfast: 220–310 kcal, 24–28g protein",
                "Lunch: 420–490 kcal, 35–40g protein (includes fruit)",
                "Snack: 100–180 kcal, varies protein",
                "Total protein: 110–130g?",
                "Total fiber: 25–30g?",
                "Sugar <25g?",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span
                    className="w-4 h-4 shrink-0"
                    style={{ border: "2px solid var(--border-color)", borderRadius: 4 }}
                  />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <Separator className="my-3.5" />
            <div className="px-3 py-2.5 text-[11px]" style={{ background: "var(--peach)", color: "var(--ink)" }}>
              <strong>Tip:</strong> If any "no", adjust snack or add protein-rich food (Greek yogurt, pavo, etc.)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface MealOption {
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fiber: number;
  ingredients: string[];
}

function MealSection({
  mealType,
  emoji,
  accentColor,
  targetKcal,
  targetProtein,
  targetCarbs,
  targetFiber,
  options,
}: {
  mealType: string;
  emoji: string;
  accentColor: string;
  targetKcal: string;
  targetProtein: string;
  targetCarbs: string;
  targetFiber: string;
  options: MealOption[];
}) {
  return (
    <Card className="mb-3">
      <CardContent className="pt-5 pb-5">
        <div className="mb-3">
          <p className="text-[13px] font-semibold mb-1.5" style={{ color: "var(--ink)" }}>
            {emoji} {mealType}
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><span style={{ color: "var(--ink-muted)" }}>Kcal:</span> <span className="font-semibold" style={{ color: accentColor }}>{targetKcal}</span></div>
            <div><span style={{ color: "var(--ink-muted)" }}>Protein:</span> <span className="font-semibold" style={{ color: accentColor }}>{targetProtein}</span></div>
            <div><span style={{ color: "var(--ink-muted)" }}>Carbs:</span> <span className="font-semibold" style={{ color: accentColor }}>{targetCarbs}</span></div>
            <div><span style={{ color: "var(--ink-muted)" }}>Fiber:</span> <span className="font-semibold" style={{ color: accentColor }}>{targetFiber}</span></div>
          </div>
        </div>

        {options.map((option, i) => (
          <div
            key={i}
            className="px-3 py-3 mb-2.5 last:mb-0"
            style={{ background: "var(--peach)" }}
          >
            <div className="flex justify-between items-baseline flex-wrap gap-2 mb-2">
              <span className="text-xs font-semibold" style={{ color: "var(--ink)" }}>{option.name}</span>
              <Badge
                className="text-[11px] font-medium opacity-80"
                style={{ background: accentColor, color: "var(--ink)" }}
              >
                {option.kcal} | {option.protein}g P | {option.carbs}g C | {option.fiber}g F
              </Badge>
            </div>
            <ul className="pl-4 text-[11.5px] leading-[1.7]" style={{ color: "var(--ink-muted)" }}>
              {option.ingredients.map((ing, j) => <li key={j}>{ing}</li>)}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
