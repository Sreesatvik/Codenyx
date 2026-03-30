import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { AIConsequenceResponseSchema } from "@/lib/contracts/schemas";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, state } = body;

    if (!action || !state) {
      return NextResponse.json({ error: "Missing action or simulation state" }, { status: 400 });
    }

    // Dev 1: Orchestrating the Master System Prompt leveraging current Zustand state
    const systemPrompt = `
You are the VentureSimulate Consequence Engine, an expert AI evaluating dynamic decisions in a social entrepreneurship simulation. You must evaluate the user's action and logically infer the consequences.

The user is playing a scenario with the following specific context:
- Domain: ${state.context?.domain || "Unknown"}
- Purpose: ${state.context?.purpose || "Unknown"}
- Game Mechanics Experience Level: ${state.context?.experienceLevel || "INTERMEDIATE"}

Current Game State (Turn ${state.turn}):
- Available Budget: $${state.budget.toLocaleString()}
- Social Impact: ${state.metrics.socialImpact}/100
- Financial Sustainability: ${state.metrics.financialSustainability}/100
- Risk Exposure: ${state.metrics.riskExposure}/100
- Stakeholder Trust: ${state.metrics.stakeholderTrust}/100

INSTRUCTIONS:
1. Provide a realistic narrative explaining the consequence of the action below.
2. Determine how much 'budgetCost' this action naturally consumes. Deduct realistic project costs (e.g. $200, $500, etc.). If the action generates revenue, 'budgetCost' should be negative!
3. Evaluate integer shifts between -100 and +100 for all four metrics ('metricShifts'). E.g. high-risk actions increase riskExposure significantly, while highly charitable logic increases socialImpact.
4. If relevant structures are constructed, append a new object to 'newNodes' (Pick types: "HQ" | "COMMUNITY_CENTER" | "RESEARCH_LAB" | "MARKETING_BILLBOARD" | "PRODUCTION_FACILITY").
5. The Zod Schema will force your exact mathematical response format. YOU MUST NOT deviate.
`;

    // Strict schema enforcement using Vercel AI SDK
    const { object } = await generateObject({
      model: google("gemini-1.5-flash"),
      system: systemPrompt,
      prompt: `User Decision/Action: "${action}"`,
      schema: AIConsequenceResponseSchema,
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("AI Generation Critical Error:", error);
    return NextResponse.json(
      { error: "Failed to logically evaluate the consequence." },
      { status: 500 }
    );
  }
}
