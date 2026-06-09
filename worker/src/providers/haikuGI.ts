import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

const GIResponseSchema = z.object({
  gi: z.number().int().min(0).max(100),
  confidence: z.enum(["known", "estimated"]),
  reference_food: z.string().optional(),
});

type GIResponse = z.infer<typeof GIResponseSchema>;

export async function estimateGIWithHaiku(
  foodName: string,
  apiKey: string
): Promise<GIResponse | null> {
  try {
    const client = createAnthropic({ apiKey });

    const { object } = await generateObject({
      model: "claude-haiku-4-5-20250101",
      schema: GIResponseSchema,
      prompt: `For the food "${foodName}", provide the Glycemic Index (GI) value.
Use the International Tables of Glycemic Index (University of Sydney) as your reference.
If the food is not in standard GI tables, estimate based on similar foods.

Respond with ONLY a JSON object:
{
  "gi": <number 0-100>,
  "confidence": "known" | "estimated",
  "reference_food": "<the closest food in GI tables you based this on, if estimated>"
}`,
    });

    return object;
  } catch (e) {
    console.error("estimateGIWithHaiku failed:", e);
    return null;
  }
}
