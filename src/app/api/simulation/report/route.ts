import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const state = await req.json();

    const key = process.env.GROQ_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 500 });
    }

    const groq = createGroq({ apiKey: key });

    const systemPrompt = `You are a Senior Strategic Analyst specializing in social entrepreneurship evaluation. You are generating the final analytical report for a completed VentureSimulate simulation run.

Write a comprehensive, professional Markdown report. Address the user as "you" throughout. Be specific about events from their narrative history and how each decision cascaded into their final metrics.

## REQUIRED SECTIONS

# Executive Summary
A 3-4 sentence overview of the entire run: what domain they operated in, how many turns they completed, their ending budget, and the overall trajectory of their venture.

# Decision Patterns
Analyze how the user consistently approached trade-offs, risk, and priorities across their turns. Did they favor Social Impact over Financial Sustainability? Did they neglect Risk Exposure? Were they reactive or proactive?

# Strength Indicators
Identify 2-3 areas where the user demonstrated effective judgment. Be specific — reference particular decisions from the narrative history that showed strategic thinking, stakeholder awareness, or resource management.

# Weakness Indicators
Identify 2-3 recurring issues. Examples: poor financial planning, short-term bias, inability to manage complexity, overlooking compliance/institutional requirements, failure to build stakeholder trust. Reference specific decisions.

# System-Level Understanding
Evaluate how well the user understood interconnected systems — financial, social, and institutional. Did they recognize that boosting one metric would hurt another? Did they adapt when facing crises?

# Final Verdict
A brief concluding paragraph with an overall competency rating (Emerging / Developing / Competent / Distinguished) and one specific recommendation for what they should practice next.

## STATE DATA
${JSON.stringify(state, null, 2)}
`;

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      system: systemPrompt,
      prompt: "Generate the final evaluation report based on the simulation data provided.",
    });

    return NextResponse.json({ report: text });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Report Engine Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
