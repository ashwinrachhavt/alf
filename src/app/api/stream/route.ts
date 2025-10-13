import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { prompt } = await req.json();
  if (!prompt || typeof prompt !== "string") {
    return new Response(JSON.stringify({ error: "Missing 'prompt'" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    prompt,
  });

  // AI SDK v5: use toTextStreamResponse()
  return result.toTextStreamResponse();
}
