import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { messages, state } = await req.json();

    const key = process.env.GROQ_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 500 });
    }

    const groq = createGroq({ apiKey: key });

    const systemPrompt = `You are a VentureSimulate Mentor and Strategic Analyst.
You are helping the user interpret and understand their just-concluded simulation run.
They will ask you questions about their decisions, metrics, and outcomes.

Use the following Context to answer their questions. Only answer questions related to their strategy, social entrepreneurship, their metrics, or their narrative history. Be concise, direct, and constructive.

--- SIMULATION CONTEXT ---
Domain: ${state?.context?.domain}
Purpose: ${state?.context?.purpose}
Experience Level: ${state?.context?.experienceLevel}
Final Budget: $${state?.budget}
Final Social Impact: ${state?.metrics?.socialImpact}/100
Final Financial Sustainability: ${state?.metrics?.financialSustainability}/100
Final Risk Exposure: ${state?.metrics?.riskExposure}/100
Final Stakeholder Trust: ${state?.metrics?.stakeholderTrust}/100

Event History:
\${state?.narrativeHistory?.map((n: string, i: number) => \`Turn \${i}: \${n}\`).join('\\n')}
--------------------------
`;

    const result = streamText({
      model: groq("llama-3.1-8b-instant"),
      system: systemPrompt,
      messages: messages as any,
    });

    return result.toTextStreamResponse();

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Chat Engine Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
