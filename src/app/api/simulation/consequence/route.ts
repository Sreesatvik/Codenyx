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

    // Determine difficulty modifiers based on experience level
    const experience = state.context?.experienceLevel || "INTERMEDIATE";
    let difficultyNote = "";
    if (experience === "BEGINNER") {
      difficultyNote = "The user is an Explorer (beginner). Be somewhat forgiving with costs, but still impose realistic trade-offs. Provide slightly more narrative guidance about what happened and why.";
    } else if (experience === "INTERMEDIATE") {
      difficultyNote = "The user is an Experimenter (intermediate). Apply realistic costs and outcomes. Occasionally introduce unexpected complications from stakeholders or market conditions.";
    } else {
      difficultyNote = "The user is a Struggler (expert). Be demanding. Apply higher costs, introduce institutional delays, stakeholder conflicts, and market volatility. Every decision should have meaningful downsides. Crisis events should occur frequently.";
    }

    // Determine if this is a crisis turn (turns 3, 5, 7 have higher chance)
    const isCrisisTurn = state.turn >= 3 && (state.turn % 2 === 1);
    const crisisInstruction = isCrisisTurn 
      ? `IMPORTANT: This is a CRISIS TURN. Introduce an unexpected challenge: funding disruption, loss of stakeholder trust, regulatory setback, team conflict, or market shock. The crisis should compound the consequences of their action. Budget costs should be 20-40% higher than normal. At least two metrics must shift negatively.`
      : "";

    const systemPrompt = `You are the VentureSimulate Consequence Engine — a sophisticated simulation system for social entrepreneurship decision-making. You MUST respond with ONLY a valid JSON object. No markdown, no code blocks, no explanation.

## YOUR ROLE
You simulate realistic, multi-dimensional consequences of strategic decisions in social ventures. Every decision creates TRADE-OFFS. There are no purely good decisions. Your job is to model the complex, interdependent reality of running a social enterprise.

## SIMULATION CONTEXT
- Domain: ${state.context?.domain || "Unknown"}
- Mission: ${state.context?.purpose || "Unknown"}
- Experience Level: ${experience}
- Current Turn: ${state.turn} of 8
${difficultyNote}

## CURRENT STATE
- Budget: $${state.budget}
- Social Impact: ${state.metrics?.socialImpact}/100
- Financial Sustainability: ${state.metrics?.financialSustainability}/100
- Risk Exposure: ${state.metrics?.riskExposure}/100
- Stakeholder Trust: ${state.metrics?.stakeholderTrust}/100

## RECENT HISTORY
${(state.narrativeHistory || []).slice(-3).map((n: string, i: number) => `- ${n}`).join('\n')}

${crisisInstruction}

## RULES FOR GENERATING CONSEQUENCES

1. **Trade-Off Rule**: NEVER make all four metric shifts positive. If Social Impact increases significantly, Financial Sustainability or Risk Exposure MUST worsen. If the user invests heavily in growth, Stakeholder Trust among community members should be tested.

2. **Stakeholder Dynamics**: Model conflicting stakeholder interests:
   - Community members want affordability and access
   - Investors/funders want scalability and returns
   - Government bodies impose compliance costs and delays
   - Partner organizations have their own agendas
   The narrative must reference at least one stakeholder reaction.

3. **Budget Costs**: Must be realistic relative to the action. Building costs $200-800. Marketing costs $150-400. Community outreach costs $100-300. R&D costs $300-600. Government applications cost $50-200 but introduce delays.

4. **Metric Shifts**: Each shift must be between -20 and +20. Most shifts should be in the -10 to +15 range. Extreme values (±15 to ±20) should be rare and well-justified.
 
5. **Revenue Generation**: Social ventures generate revenue through fees, product sales, secondary service outcomes, or grants. Revenue should realistically scale with Turn number. Early revenue is small ($0-100), later revenue can be ($200-800).
 
6. **Risk Exposure**: Increases when: taking on debt, expanding too fast, entering new markets, ignoring compliance. Decreases when: diversifying revenue, building partnerships, securing insurance, conducting due diligence.

7. **newNodes**: When the action involves building physical infrastructure or establishing a new operational area, include a newNode. Choose from: HQ, COMMUNITY_CENTER, RESEARCH_LAB, MARKETING_BILLBOARD, PRODUCTION_FACILITY. Give it unique grid coordinates (x: 0-8, y: 0-5) that don't overlap with existing nodes. Status should be ACTIVE or UPGRADING.

8. **Map Node Management**: Current nodes are at: ${(state.mapNodes || []).map((n: any) => `(${n.x},${n.y})`).join(', ')}. Do NOT place new nodes at these coordinates. If the action damages or upgrades existing infrastructure, use updatedNodes to change a node's status.

9. **isGameEnding**: Only true if the budget would realistically drop to $0 or below from this action, or if the venture faces an irrecoverable crisis.

## REQUIRED JSON FORMAT
{
  "narrative": "2-4 sentence consequence description. Must reference a stakeholder reaction. Be specific about what happened, not generic.",
  "shortTitle": "2-4 word title of the outcome (e.g. 'Lab Built', 'Market Expansion')",
  "budgetCost": 300,
  "revenue": 50,
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

Respond with ONLY the JSON. No other text.`;

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      system: systemPrompt,
      prompt: `User's strategic decision: "${action}"`,
    });

    // --- Robust JSON Extraction ---
    let cleaned = text.trim();
    // 1. Find the first '{' and last '}'
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("AI returned unparseable text:", text);
      // Fallback: Return a safe default to keep the game playable
      parsed = {
        narrative: "The strategic impact of your decision is complex. Your team is still analyzing the full departmental consequences, but basic operations continue.",
        shortTitle: "Strategic Shift",
        budgetCost: 200,
        revenue: 50,
        metricShifts: {
          socialImpact: 2,
          financialSustainability: -2,
          riskExposure: 1,
          stakeholderTrust: 2
        },
        newNodes: [],
        updatedNodes: [],
        isGameEnding: false
      };
    }

    const VALID_TYPES = ["HQ", "COMMUNITY_CENTER", "RESEARCH_LAB", "MARKETING_BILLBOARD", "PRODUCTION_FACILITY", "EMPTY"];
    
    // Sanitize newNodes/updatedNodes — the LLM often omits required fields like id/status
    if (Array.isArray(parsed.newNodes)) {
      parsed.newNodes = parsed.newNodes.map((node: any, i: number) => ({
        id: node.id || `node-${Date.now()}-${i}`,
        x: typeof node.x === "number" ? node.x : i + 1,
        y: typeof node.y === "number" ? node.y : i + 1,
        type: (node.type && VALID_TYPES.includes(node.type)) ? node.type : "COMMUNITY_CENTER",
        status: node.status || "ACTIVE",
      }));
    }
    // Ensure revenue exists
    if (parsed.revenue === undefined) parsed.revenue = 0;
    // Ensure shortTitle exists
    if (!parsed.shortTitle) parsed.shortTitle = "Strategic Step";
 
    if (Array.isArray(parsed.updatedNodes)) {
      parsed.updatedNodes = parsed.updatedNodes.map((node: any, i: number) => ({
        id: node.id || `node-upd-${Date.now()}-${i}`,
        x: typeof node.x === "number" ? node.x : 0,
        y: typeof node.y === "number" ? node.y : 0,
        type: (node.type && VALID_TYPES.includes(node.type)) ? node.type : "HQ",
        status: node.status || "ACTIVE",
      }));
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
