import OpenAI from "openai";
import { NextResponse } from "next/server";
import { Agent, run } from "@openai/agents";
import { webSearchTool } from "@openai/agents-openai";
import { findByTags } from "@/lib/store";

export const maxDuration = 300;

const client = new OpenAI();

const researcher = new Agent({
  name: "researcher",
  instructions:
    "You are a deep research agent. Plan 2–3 sub-queries, use web search to gather facts. For each key claim, extract a direct quote, URL, source/author, and ISO date. Return: TL;DR, bullets, short narrative, and a sources table.",
  tools: [webSearchTool()],
  model: "gpt-4o-mini",
});

export async function POST(req: Request) {
  const { query, tags = [] } = await req.json();
  const prior = await findByTags(Array.isArray(tags) ? tags : [], 6);
  const context = prior.map(n => `# ${n.title}\n\n${n.content}`).join("\n\n---\n\n");
  const input = context
    ? `Context (organization notes):\n\n${context}\n\n---\n\nResearch task: ${query}`
    : `Research task: ${query}`;
  const res = await run(researcher, { input }, client);
  return NextResponse.json({ text: res.output_text });
}

