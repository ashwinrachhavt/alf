import OpenAI from "openai";
import { NextResponse } from "next/server";
import { Agent, run } from "@openai/agents";
import { webSearchTool } from "@openai/agents-openai";

export const maxDuration = 180;

const client = new OpenAI();
const critic = new Agent({
  name: "critic",
  instructions:
    "Re-check the draft using web search. Flag contradictions, stale sources (>12mo), and propose better citations. " +
    "Return a brief list of corrections + confidence 0–1.",
  tools: [webSearchTool()],
  model: "gpt-4o-mini",
});

export async function POST(req: Request) {
  const { draft } = await req.json();
  if (!draft) return NextResponse.json({ error: "missing draft" }, { status: 400 });
  const res = await run(critic, { input: `Review this draft:\n\n${draft}` }, client);
  return NextResponse.json({ text: res.output_text });
}

