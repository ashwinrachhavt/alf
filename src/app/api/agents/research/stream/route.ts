import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getRelevantDocs } from "@/lib/knowledge";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const client = new OpenAI();

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // no body or invalid JSON
      body = {};
    }
    const { query } = body;
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid 'query'." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kb = await getRelevantDocs(query, 3);
    const kbContext = kb
      .map((d) => `# KB: ${d.path}\n\n${d.content.substring(0, 4000)}`)
      .join("\n\n---\n\n");

    const input = [
      {
        role: "system",
        content:
          "You are a Deep Research Agent. Use factual reasoning to perform multi-source synthesis. For each key claim, provide quotes, URLs, authors/sources, and dates. Return TL;DR, bullet points, narrative, and a sources table.",
      },
      {
        role: "user",
        content: (kbContext ? `KB Context:\n${kbContext}\n\n` : "") + `Research task: ${query}`,
      },
    ];

    const stream = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: input as any, // Cast to satisfy ChatCompletionMessageParam[] type
      stream: true,
    });

    const encoder = new TextEncoder();
    const streamBody = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta?.content || "";
            if (delta) controller.enqueue(encoder.encode(delta));
          }
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(encoder.encode(`[Error: ${err}]`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(streamBody, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (err: any) {
    console.error("Stream route error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error", details: err?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
