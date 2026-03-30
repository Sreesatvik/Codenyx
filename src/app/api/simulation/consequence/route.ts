import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { AIConsequenceResponseSchema } from "@/lib/contracts/schemas";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, state } = body;

    if (!action || !state) {
      return NextResponse.json({ error: "Missing action or simulation state" }, { status: 400 });
    }

    const key = process.env.GROQ_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 500 });
    }

    const groq = createGroq({ apiKey: key });

    const systemPrompt = `You are the VentureSimulate Consequence Engine. You MUST respond with ONLY a valid JSON object — no markdown, no code blocks, no explanation, no extra text before or after.

Simulation Context:
- Domain: ${state.context?.domain || "Unknown"}
- Purpose: ${state.context?.purpose || "Unknown"}
- Experience Level: ${state.context?.experienceLevel || "INTERMEDIATE"}

Current State (Turn ${state.turn}):
- Budget: $${state.budget}
- Social Impact: ${state.metrics?.socialImpact}/100
- Financial Sustainability: ${state.metrics?.financialSustainability}/100
- Risk Exposure: ${state.metrics?.riskExposure}/100
- Stakeholder Trust: ${state.metrics?.stakeholderTrust}/100

You MUST return ONLY this exact JSON structure:
{
  "narrative": "2-3 sentence consequence description of the decision",
  "budgetCost": 300,
  "metricShifts": {
    "socialImpact": 10,
    "financialSustainability": -5,
    "riskExposure": 5,
    "stakeholderTrust": 8
  },
  "newNodes": [],
  "updatedNodes": [],
  "isGameEnding": false
}

Rules:
- budgetCost is positive (spending money) or negative (earning revenue)
- metricShifts are integers between -30 and +30 per turn
- isGameEnding is true only if budget goes below $0
- newNodes is always an empty array unless a physical structure is being built
- Respond with ONLY the JSON. No other text.`;

    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      system: systemPrompt,
      prompt: `User's strategic decision: "${action}"`,
    });

    // Strip any accidental markdown code fences
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Groq returned non-JSON:", cleaned);
      return NextResponse.json({ error: "AI returned malformed JSON", raw: cleaned }, { status: 500 });
    }

    // Validate against our Zod contract
    const validated = AIConsequenceResponseSchema.parse(parsed);
    return NextResponse.json(validated);

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Consequence Engine Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
