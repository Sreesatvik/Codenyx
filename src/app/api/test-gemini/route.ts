import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const key = process.env.GROQ_API_KEY;

  if (!key || key === "") {
    return NextResponse.json({ status: "ERROR", reason: "GROQ_API_KEY is empty or missing" }, { status: 500 });
  }

  try {
    const groq = createGroq({ apiKey: key });

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: "Say exactly: GROQ_OK",
    });

    return NextResponse.json({ status: "SUCCESS", key_prefix: key.substring(0, 10) + "...", response: text });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ status: "ERROR", reason: msg }, { status: 500 });
  }
}
