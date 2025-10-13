import OpenAI from "openai";
import { NextResponse } from "next/server";
import { findByTags } from "@/lib/store";

export const maxDuration = 300;

const client = new OpenAI();

export async function POST(req: Request) {
  try {
    const { query, tags = [] } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'query' string parameter." },
        { status: 400 }
      );
    }

    const prior = await findByTags(Array.isArray(tags) ? tags : [], 6);
    const context = prior.map((n) => `# ${n.title}\n\n${n.content}`).join("\n\n---\n\n");
    const input = context
      ? `Context (organization notes):\n\n${context}\n\n---\n\nResearch task: ${query}`
      : `Research task: ${query}`;

    const completion = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "You are a deep research agent. Plan 2–3 sub‑queries, use factual reasoning, and produce a concise report with TL;DR, bullet points, narrative, and sources.",
        },
        { role: "user", content: input },
      ],
    });

    const textOutput = (
      completion.output_text ||
      (Array.isArray(completion.output)
        ? completion.output
            .filter((o: any) => o.type === "message")
            .map((o: any) =>
              Array.isArray(o.content)
                ? o.content.map((c: any) => c.text ?? "").join(" ")
                : ""
            )
            .join(" ")
        : "")
    ).trim();

    return NextResponse.json({ text: textOutput });
  } catch (err: any) {
    console.error("Agent route error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err?.message ?? err },
      { status: 500 }
    );
  }
}

