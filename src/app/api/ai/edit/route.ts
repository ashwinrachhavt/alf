import { NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 120;

export async function POST(req: Request) {
  const { markdown, instruction } = await req.json();
  if (typeof markdown !== "string")
    return NextResponse.json({ error: "missing markdown" }, { status: 400 });
  const client = new OpenAI();
  const sys =
    "You are an expert technical editor working with Markdown. Keep structure. " +
    "Respond with raw Markdown only, without code fences.";
  const user = `${instruction ? instruction + "\n\n" : ""}${markdown}`;
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    temperature: 0.3,
  });
  const out = res.choices?.[0]?.message?.content ?? "";
  return NextResponse.json({ markdown: out });
}

