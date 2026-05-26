export default function MacroTargetsPage() {
  return (
    <div style={{ padding: "0 14px 20px" }}>
      {/* Daily Budget */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>
          📊 Daily Calorie & Macro Budget
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{
            background: "var(--cream)", borderRadius: 12, padding: 14,
            border: "1px solid var(--border)",
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Regular Day</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--green)" }}>1,400–1,550 kcal</p>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>No gym</p>
          </div>
          <div style={{
            background: "var(--cream)", borderRadius: 12, padding: 14,
            border: "1px solid var(--border)",
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Gym Day</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--blue)" }}>1,600–1,700 kcal</p>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>+200 kcal pre/post</p>
          </div>
        </div>
      </div>

      {/* Macro Targets Table */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>
          🎯 Macronutrient Targets
        </h2>
        <div style={{
          background: "var(--cream)", borderRadius: 12, border: "1px solid var(--border)",
          overflow: "hidden", overflowX: "auto",
        }}>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--peach)", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "var(--ink)" }}>Macro</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600, color: "var(--ink)" }}>Regular</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600, color: "var(--ink)" }}>Gym</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "var(--ink)" }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {[
                { macro: "Protein", regular: "110–130g", gym: "120–140g", note: "~0.8–1g/kg body" },
                { macro: "Carbs", regular: "150–180g", gym: "180–210g", note: "Around gym time" },
                { macro: "Fat", regular: "40–50g", gym: "45–55g", note: "Measured (aceite)" },
                { macro: "Fiber", regular: "25–30g", gym: "25–30g", note: "For satiety" },
                { macro: "Sugar", regular: "<25g", gym: "<25g", note: "Fruit + treats" },
              ].map((row, i) => (
                <tr key={i} style={{
                  background: i % 2 === 0 ? "var(--cream)" : "var(--beige)",
                  borderBottom: "1px solid var(--border)",
                }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--ink)" }}>{row.macro}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center", color: "var(--muted)" }}>{row.regular}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center", color: "var(--muted)" }}>{row.gym}</td>
                  <td style={{ padding: "10px 12px", color: "var(--muted)", fontSize: 11 }}>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regular Day Breakdown */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>
          📅 Regular Day Breakdown
        </h2>

        {/* Breakfast */}
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
              kcal: 220,
              protein: 28,
              carbs: 0,
              fiber: 0,
              ingredients: [
                "1 scoop proteína Rossmann = 24g prot",
                "200ml leche soya sin azúcar = 7g prot",
                "1 shot café",
                "1 cdita cacao sin azúcar",
              ],
            },
            {
              name: "Tostada de Proteína",
              kcal: 310,
              protein: 25,
              carbs: 28,
              fiber: 5,
              ingredients: [
                "2 rebanadas pan integral = 7g prot + 28g carbs + 5g fiber",
                "2 huevos revueltos = 14g prot + 1g carbs",
              ],
            },
          ]}
        />

        {/* Lunch + Fruit */}
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
              kcal: 420,
              protein: 40,
              carbs: 33,
              fiber: 4.5,
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
              kcal: 430,
              protein: 36,
              carbs: 35,
              fiber: 6.5,
              ingredients: [
                "1 wrap proteína = 12g prot + 12g carbs + 5g fiber",
                "120g pollo desmenuzado = 24g prot",
                "30g espinaca = 0.9g prot + 1g carbs + 0.7g fiber",
                "100g uvas = 0.7g prot + 17g carbs + 0.9g fiber",
              ],
            },
            {
              name: "Ensalada de Atún",
              kcal: 400,
              protein: 35,
              carbs: 45,
              fiber: 5,
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

        {/* Snack */}
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
              kcal: 130,
              protein: 12,
              carbs: 12,
              fiber: 0,
              ingredients: [
                "1 yogur stracciatella = 12g prot + 12g carbs",
              ],
            },
            {
              name: "Queso + Fruta",
              kcal: 180,
              protein: 8,
              carbs: 17,
              fiber: 0.9,
              ingredients: [
                "25g queso manchego = 6g prot + 0.5g carbs",
                "100g uvas = 0.7g prot + 17g carbs + 0.9g fiber",
              ],
            },
            {
              name: "Banana",
              kcal: 100,
              protein: 1.3,
              carbs: 23,
              fiber: 2.6,
              ingredients: [
                "1 banana mediana = 1.3g prot + 23g carbs + 2.6g fiber",
              ],
            },
          ]}
        />

        <div style={{
          background: "var(--cream)", borderRadius: 12, padding: 14,
          border: "1px solid var(--border)", marginTop: 12,
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>
            📌 Total Regular Day
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
            <div><span style={{ color: "var(--muted)" }}>Kcal:</span> <span style={{ fontWeight: 600, color: "var(--ink)" }}>~1,450</span></div>
            <div><span style={{ color: "var(--muted)" }}>Protein:</span> <span style={{ fontWeight: 600, color: "var(--ink)" }}>110–130g</span></div>
            <div><span style={{ color: "var(--muted)" }}>Carbs:</span> <span style={{ fontWeight: 600, color: "var(--ink)" }}>160–190g</span></div>
            <div><span style={{ color: "var(--muted)" }}>Fiber:</span> <span style={{ fontWeight: 600, color: "var(--ink)" }}>25–30g</span></div>
          </div>
        </div>
      </div>

      {/* Gym Day Breakdown */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>
          💪 Gym Day Breakdown
        </h2>
        <div style={{
          background: "var(--peach)", borderRadius: 12, padding: 12, marginBottom: 12,
          fontSize: 12, color: "var(--ink)", borderLeft: "3px solid var(--blue)",
        }}>
          💡 Breakfast + Lunch same as Regular Day. Add pre-gym carbs + post-gym protein.
        </div>

        {/* Pre-Gym */}
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
              kcal: 100,
              protein: 1.3,
              carbs: 23,
              fiber: 2.6,
              ingredients: [
                "1 banana = 23g carbs (rápido, fácil)",
              ],
            },
            {
              name: "Arepa Mini",
              kcal: 120,
              protein: 2,
              carbs: 38,
              fiber: 2,
              ingredients: [
                "40g harina PAN = 38g carbs (más sustancia que banana)",
              ],
            },
            {
              name: "Tostada con Miel",
              kcal: 130,
              protein: 3,
              carbs: 27,
              fiber: 1.5,
              ingredients: [
                "1 rebanada pan masa madre = 20g carbs + 4g prot + 1.5g fiber",
                "1 cdita miel = 7g carbs",
              ],
            },
            {
              name: "Uvas + Café",
              kcal: 75,
              protein: 0.7,
              carbs: 17,
              fiber: 0.9,
              ingredients: [
                "100g uvas = 17g carbs (lightest option)",
              ],
            },
          ]}
        />

        {/* Post-Gym */}
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
              kcal: 220,
              protein: 28,
              carbs: 0,
              fiber: 0,
              ingredients: [
                "1 scoop proteína Rossmann = 24g prot",
                "200ml leche soya sin azúcar = 7g prot",
                "1 shot café",
                "1 cdita cacao sin azúcar",
              ],
            },
            {
              name: "Yogur + Pavo",
              kcal: 215,
              protein: 29,
              carbs: 13,
              fiber: 0,
              ingredients: [
                "1 yogur stracciatella = 12g prot + 12g carbs",
                "2 lonchas pavo = 17g prot + 1g carbs",
              ],
            },
          ]}
        />

        {/* Optional Evening */}
        <div style={{
          background: "var(--cream)", borderRadius: 12, padding: 14,
          border: "1px solid var(--border)", marginTop: 12, marginBottom: 12,
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>
            🌙 Optional Evening Snack (if hungry)
          </p>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>0–100 kcal</p>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>Banana or Uvas</p>
        </div>

        <div style={{
          background: "var(--cream)", borderRadius: 12, padding: 14,
          border: "1px solid var(--border)", marginTop: 12,
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>
            📌 Total Gym Day
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
            <div><span style={{ color: "var(--muted)" }}>Kcal:</span> <span style={{ fontWeight: 600, color: "var(--ink)" }}>~1,650</span></div>
            <div><span style={{ color: "var(--muted)" }}>Protein:</span> <span style={{ fontWeight: 600, color: "var(--ink)" }}>120–140g</span></div>
            <div><span style={{ color: "var(--muted)" }}>Carbs:</span> <span style={{ fontWeight: 600, color: "var(--ink)" }}>180–210g</span></div>
            <div><span style={{ color: "var(--muted)" }}>Fiber:</span> <span style={{ fontWeight: 600, color: "var(--ink)" }}>25–30g</span></div>
          </div>
        </div>
      </div>

      {/* Fiber & Sugar Reference */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>
          🌱 Fiber & Sugar Reference
        </h2>

        {/* Fiber */}
        <div style={{
          background: "var(--cream)", borderRadius: 12, padding: 14,
          border: "1px solid var(--border)", marginBottom: 12,
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 10 }}>
            Fiber Sources (aim for 25–30g/day)
          </p>
          <ul style={{ paddingLeft: 16, fontSize: 12, color: "var(--muted)", lineHeight: 1.8 }}>
            <li><strong>Veggies:</strong> pimentones, brócoli, espárragos, espinaca (2–4g per portion)</li>
            <li><strong>Whole grains:</strong> quinoa (2.5g/120g), pan integral (5g/2 slices)</li>
            <li><strong>Beans:</strong> black beans (8g/100g), red beans (7g/100g)</li>
            <li><strong>Fruits:</strong> cerezas (1.6g/80g), uvas (0.9g/100g), manzana (2.5g)</li>
            <li><strong>Seeds:</strong> chía (3.4g/10g)</li>
          </ul>
          <div style={{
            marginTop: 12, padding: "10px 12px", background: "var(--peach)",
            borderRadius: 8, fontSize: 11, color: "var(--ink)",
          }}>
            <strong>Rule:</strong> If you hit 25g+ fiber, you're hitting your veggie quota & satiety is good.
          </div>
        </div>

        {/* Sugar */}
        <div style={{
          background: "var(--cream)", borderRadius: 12, padding: 14,
          border: "1px solid var(--border)",
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 10 }}>
            Sugar Intake (keep &lt;25g/day)
          </p>
          <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.8 }}>
            <p style={{ marginBottom: 10 }}>
              <strong>Fruits only contribute:</strong> banana (14g), uvas (16g/100g), manzana (18g), cerezas (10g/80g)
            </p>
            <p style={{ marginBottom: 10 }}>
              If you eat 1 fruit/day: you're at ~10–15g from that alone. Rest comes from veggies (minimal) and treats.
            </p>
            <p>
              <strong>Sweets rule:</strong> Max 2 days/week, measured portion. That day, the snack IS the sweet; no extra snack.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Checklist */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>
          ✅ Quick Macro Checklist
        </h2>
        <div style={{
          background: "var(--cream)", borderRadius: 12, padding: 14,
          border: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: 12, color: "var(--ink)", lineHeight: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                width: 18, height: 18, border: "2px solid var(--border)",
                borderRadius: 4, flexShrink: 0,
              }} />
              <span>Breakfast: 220–310 kcal, 24–28g protein</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                width: 18, height: 18, border: "2px solid var(--border)",
                borderRadius: 4, flexShrink: 0,
              }} />
              <span>Lunch: 420–490 kcal, 35–40g protein (includes fruit)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                width: 18, height: 18, border: "2px solid var(--border)",
                borderRadius: 4, flexShrink: 0,
              }} />
              <span>Snack: 100–180 kcal, varies protein</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                width: 18, height: 18, border: "2px solid var(--border)",
                borderRadius: 4, flexShrink: 0,
              }} />
              <span>Total protein: 110–130g?</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                width: 18, height: 18, border: "2px solid var(--border)",
                borderRadius: 4, flexShrink: 0,
              }} />
              <span>Total fiber: 25–30g?</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                width: 18, height: 18, border: "2px solid var(--border)",
                borderRadius: 4, flexShrink: 0,
              }} />
              <span>Sugar &lt;25g?</span>
            </div>
          </div>
          <div style={{
            marginTop: 14, padding: "10px 12px", background: "var(--peach)",
            borderRadius: 8, fontSize: 11, color: "var(--ink)",
          }}>
            <strong>Tip:</strong> If any "no", adjust snack or add protein-rich food (Greek yogurt, pavo, etc.)
          </div>
        </div>
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
    <div style={{
      background: "var(--cream)", borderRadius: 12, padding: 14,
      border: "1px solid var(--border)", marginBottom: 12,
    }}>
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>
          {emoji} {mealType}
        </p>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11,
        }}>
          <div><span style={{ color: "var(--muted)" }}>Kcal:</span> <span style={{ fontWeight: 600, color: accentColor }}>{targetKcal}</span></div>
          <div><span style={{ color: "var(--muted)" }}>Protein:</span> <span style={{ fontWeight: 600, color: accentColor }}>{targetProtein}</span></div>
          <div><span style={{ color: "var(--muted)" }}>Carbs:</span> <span style={{ fontWeight: 600, color: accentColor }}>{targetCarbs}</span></div>
          <div><span style={{ color: "var(--muted)" }}>Fiber:</span> <span style={{ fontWeight: 600, color: accentColor }}>{targetFiber}</span></div>
        </div>
      </div>

      {options.map((option, i) => (
        <div key={i} style={{
          background: "var(--peach)", borderRadius: 10, padding: 12,
          marginBottom: i === options.length - 1 ? 0 : 10,
        }}>
          <p style={{
            fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 8,
            display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8,
          }}>
            <span>{option.name}</span>
            <span style={{
              fontSize: 11, color: "var(--muted)",
              background: accentColor, padding: "2px 8px",
              borderRadius: 20, fontWeight: 500, whiteSpace: "nowrap", opacity: 0.8,
            }}>
              {option.kcal} | {option.protein}g P | {option.carbs}g C | {option.fiber}g F
            </span>
          </p>
          <ul style={{
            paddingLeft: 16, fontSize: 11.5, color: "var(--muted)",
            lineHeight: 1.7, margin: 0,
          }}>
            {option.ingredients.map((ing, j) => <li key={j}>{ing}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}
