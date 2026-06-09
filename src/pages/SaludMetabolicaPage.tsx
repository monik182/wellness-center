import { Apple, Zap, AlertCircle, Lightbulb, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function SaludMetabolicaPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--ink)" }}>
        Salud Metabólica
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--ink-muted)" }}>
        Aprende cómo los alimentos afectan tu glucosa y energía
      </p>

      {/* Section 1 */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex gap-3 mb-3">
            <Apple size={24} style={{ color: "var(--blue)" }} />
            <h2 className="text-lg font-semibold">¿Qué son el Índice y la Carga Glucémica?</h2>
          </div>
          <div className="space-y-3 text-sm" style={{ color: "var(--ink)" }}>
            <p>
              <strong>Índice Glucémico (IG):</strong> Mide qué tan rápido tu cuerpo absorbe el azúcar de un alimento. Escala 0-100.
            </p>
            <ul className="list-disc list-inside space-y-1" style={{ color: "var(--ink-muted)" }}>
              <li>IG bajo (&lt;55): Absorción lenta, sin pico de energía</li>
              <li>IG medio (55-69): Absorción moderada</li>
              <li>IG alto (≥70): Absorción rápida, pico de energía seguido de caída</li>
            </ul>

            <p className="mt-3">
              <strong>Carga Glucémica (CG):</strong> Lo que realmente importa. Combina IG con la cantidad de carbohidratos.
            </p>
            <div
              className="px-3 py-2 rounded text-xs font-mono"
              style={{ background: "var(--beige)" }}
            >
              Carbohidratos Netos = Carbohidratos Totales - Fibra
              <br />
              Carga Glucémica = (IG × Carbohidratos Netos) / 100
            </div>

            <p className="mt-3">
              <strong>Ejemplo clásico: Sandía</strong>
            </p>
            <ul className="list-disc list-inside space-y-1" style={{ color: "var(--ink-muted)" }}>
              <li>IG alto (72) → parece que absorberá azúcar rápido</li>
              <li>Pero 90% agua, pocos carbohidratos reales</li>
              <li>CG baja (4-5) → impacto glucémico mínimo</li>
            </ul>

            <p className="mt-3">
              <strong>Interpretación de CG:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1" style={{ color: "var(--ink-muted)" }}>
              <li>Baja: ≤10 (estable, sin pico)</li>
              <li>Media: 11-19 (aumento gradual de energía)</li>
              <li>Alta: ≥20 (pico rápido, caída después)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex gap-3 mb-3">
            <Apple size={24} style={{ color: "var(--blue)" }} />
            <h2 className="text-lg font-semibold">Frutas vs. Dulces: No todo el azúcar es igual</h2>
          </div>
          <div className="space-y-3 text-sm" style={{ color: "var(--ink)" }}>
            <p>
              Ambos tienen azúcar, pero tu cuerpo los procesa muy diferente.
            </p>

            <div
              className="px-3 py-2 rounded"
              style={{ background: "var(--beige)" }}
            >
              <p className="font-semibold mb-1">Fruta (Ej: Manzana)</p>
              <ul className="list-disc list-inside space-y-1 text-xs" style={{ color: "var(--ink-muted)" }}>
                <li><strong>Escudo de fibra:</strong> La piel y pulpa ralentizan la absorción</li>
                <li><strong>Matriz celular:</strong> Tu cuerpo debe romper mecánicamente las células</li>
                <li><strong>Pico glucémico:</strong> A los 30-60 minutos, gradual</li>
                <li><strong>Resultado:</strong> Energía sostenida, sin caída</li>
              </ul>
            </div>

            <div
              className="px-3 py-2 rounded"
              style={{ background: "#fde8e8" }}
            >
              <p className="font-semibold mb-1">Dulce (Ej: Caramelo)</p>
              <ul className="list-disc list-inside space-y-1 text-xs" style={{ color: "var(--ink-muted)" }}>
                <li><strong>Sin protección:</strong> Azúcar refinado, absorción directa</li>
                <li><strong>Sin matriz:</strong> Entra al torrente sanguíneo casi inmediatamente</li>
                <li><strong>Pico glucémico:</strong> A los 15 minutos, abrupto y alto</li>
                <li><strong>Resultado:</strong> Pico de energía seguido de "mal del puerco"</li>
              </ul>
            </div>

            <p className="mt-3">
              <strong>Lo mismo 10g de carbohidratos produce impactos muy diferentes.</strong> La fibra, la estructura y los nutrientes acompañantes importan más que la cantidad de azúcar.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 3 */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex gap-3 mb-3">
            <Zap size={24} style={{ color: "var(--blue)" }} />
            <h2 className="text-lg font-semibold">El Orden Importa</h2>
          </div>
          <div className="space-y-3 text-sm" style={{ color: "var(--ink)" }}>
            <p>
              El orden en que comes los alimentos afecta cómo tu cuerpo los procesa.
            </p>

            <div className="space-y-2 text-xs">
              <div className="px-3 py-2 rounded" style={{ background: "var(--beige)" }}>
                <p className="font-semibold">Escenario A: Chips primero (CG 15.9)</p>
                <p style={{ color: "var(--ink-muted)" }}>Pico abrupto de glucosa a los 30 minutos</p>
              </div>
              <div className="px-3 py-2 rounded" style={{ background: "#dcfce7" }}>
                <p className="font-semibold">Escenario B: Proteína/verdura primero (CG 9.96)</p>
                <p style={{ color: "var(--ink-muted)" }}>Curva plana y gradual, <strong>37% menor impacto</strong></p>
              </div>
            </div>

            <p className="mt-3">
              <strong>¿Por qué?</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs" style={{ color: "var(--ink-muted)" }}>
              <li>La proteína ralentiza el vaciado gástrico (el estómago procesa más lentamente)</li>
              <li>La fibra ralentiza la absorción intestinal</li>
              <li>Los minerales (especialmente cromo) mejoran la sensibilidad a insulina</li>
            </ul>

            <p className="mt-3 font-semibold">
              Estrategia: Come en este orden:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-xs" style={{ color: "var(--ink-muted)" }}>
              <li>Verduras y fibra (ensalada, brócoli)</li>
              <li>Proteína (pollo, pescado, queso)</li>
              <li>Grasas (aceite, aguacate)</li>
              <li>Carbohidratos (arroz, pan, pasta) últimos</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Section 4 */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex gap-3 mb-3">
            <AlertCircle size={24} style={{ color: "var(--blue)" }} />
            <h2 className="text-lg font-semibold">Señales de un Pico de Glucosa</h2>
          </div>
          <div className="space-y-3 text-sm" style={{ color: "var(--ink)" }}>
            <p>
              Si experimentas esto después de comer, probablemente tuviste un pico glucémico:
            </p>

            <ul className="space-y-2">
              <li>
                <strong>Somnolencia</strong> ("mal del puerco") 30-60 min después de comer
              </li>
              <li>
                <strong>Niebla mental</strong> / Dificultad concentrarse
              </li>
              <li>
                <strong>Antojo súbito</strong> de dulces o café 2 horas después (buscando más energía)
              </li>
              <li>
                <strong>Irritabilidad</strong> o cambios de humor al caer la glucosa
              </li>
              <li>
                <strong>Cansancio intenso</strong> sin razón aparente
              </li>
            </ul>

            <p className="mt-3" style={{ color: "var(--ink-muted)" }}>
              <strong>Nota:</strong> Estas señales típicamente ocurren 30-90 minutos después de comer. Si las notas consistentemente, prueba cambiar la composición de tus comidas (más fibra, proteína antes de carbs).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 5 */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex gap-3 mb-3">
            <Lightbulb size={24} style={{ color: "var(--blue)" }} />
            <h2 className="text-lg font-semibold">Estrategias de Rescate</h2>
          </div>
          <div className="space-y-3 text-sm" style={{ color: "var(--ink)" }}>
            <p>
              Si ya comiste algo con alto IG, estas acciones después de comer reducen el pico:
            </p>

            <div className="space-y-2">
              <div className="px-3 py-2 rounded border-l-4" style={{ background: "var(--beige)", borderColor: "var(--blue)" }}>
                <p className="font-semibold">🏃 Movimiento muscular (10-20 min después)</p>
                <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                  Camina, haz sentadillas o sube escaleras. Los músculos absorben glucosa sin necesidad de insulina (transportadores GLUT4).
                </p>
              </div>

              <div className="px-3 py-2 rounded border-l-4" style={{ background: "var(--beige)", borderColor: "var(--blue)" }}>
                <p className="font-semibold">🥄 Vinagre de manzana (1 cucharada diluida)</p>
                <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                  Tómalo antes o después de comer. Desactiva alpha-amilasa (enzima que descompone almidón). Usa pajita para proteger los dientes.
                </p>
              </div>

              <div className="px-3 py-2 rounded border-l-4" style={{ background: "var(--beige)", borderColor: "var(--blue)" }}>
                <p className="font-semibold">💧 Hidratación (1-2 vasos en 2 horas)</p>
                <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                  Agua diluye la concentración de glucosa en sangre. Facilita que los riñones eliminen exceso de glucosa.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 6 */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex gap-3 mb-3">
            <BarChart3 size={24} style={{ color: "var(--blue)" }} />
            <h2 className="text-lg font-semibold">Cómo Leer tu Tracker</h2>
          </div>
          <div className="space-y-3 text-sm" style={{ color: "var(--ink)" }}>
            <p>
              Tu tracker te muestra 3 claves para entender tu metabolismo:
            </p>

            <div className="space-y-2">
              <div className="px-3 py-2 rounded" style={{ background: "var(--beige)" }}>
                <p className="font-semibold text-xs">Azúcar Real (Bruta vs. Neta)</p>
                <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                  <strong>Bruta:</strong> Todo el azúcar que registraste.
                  <br />
                  <strong>Neta:</strong> Azúcar que tu cuerpo realmente absorbe (bruta - fibra × 0.5).
                  <br />
                  <strong>Meta diaria:</strong> Mantén neta bajo 25g.
                </p>
              </div>

              <div className="px-3 py-2 rounded" style={{ background: "var(--beige)" }}>
                <p className="font-semibold text-xs">Balance Glucémico (Ratio Fibra-Carbs)</p>
                <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                  Muestra g fibra por cada 10g carbohidratos.
                  <br />
                  <strong>Verde (≥1.5):</strong> Excelente protección contra picos.
                  <br />
                  <strong>Amarillo (≥1.0):</strong> Aceptable.
                  <br />
                  <strong>Rojo (&lt;1.0):</strong> Demasiados carbohidratos sin fibra, riesgo de picos.
                </p>
              </div>

              <div className="px-3 py-2 rounded" style={{ background: "var(--beige)" }}>
                <p className="font-semibold text-xs">Impacto Metabólico (Carga Glucémica por comida)</p>
                <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                  Gráfico que muestra cómo subió/bajó tu glucosa durante 4 horas después de la comida.
                  <br />
                  <strong>Verde (Baja):</strong> Energía estable.
                  <br />
                  <strong>Amarillo (Media):</strong> Energía, luego leve caída.
                  <br />
                  <strong>Rojo (Alta):</strong> Pico seguido de caída → cansancio.
                </p>
              </div>
            </div>

            <p className="mt-3">
              <strong>Objetivo:</strong> Maximiza días con impacto Baja/Media, minimiza comidas con impacto Alta. Tu energía y enfoque lo agradecerán.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
