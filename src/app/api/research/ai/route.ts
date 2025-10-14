import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid 'query'" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prompt = `You are a Deep Research Agent.
Use web knowledge you already have and reason step by step. Write:
- TL;DR (1–2 sentences)
- Key findings (3–5 bullets)
- Narrative (2–3 short paragraphs)
- Sources table (URL, source/author, date, key claim)

Research task: ${query}`;

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      prompt,
    });

    return result.toTextStreamResponse();
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

