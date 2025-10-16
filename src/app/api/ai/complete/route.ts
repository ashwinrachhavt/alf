import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

// Initialize OpenAI client with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { html, selection, prompt, mode } = await req.json();

    // Build system instruction
    const system =
      "You are an expert writing assistant for a Notion-like editor. " +
      "Write concise, clean, well-structured prose. " +
      "Maintain the user's writing style and tone. " +
      "Do not use markdown code fences unless explicitly writing code. " +
      "Return only the text to be inserted, without any meta-commentary or quotation marks.";

    // Build user prompt based on mode
    const userPrompt = buildUserPrompt({ html, selection, prompt, mode });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Fast and cost-effective, can upgrade to gpt-4o if needed
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const text = completion.choices[0]?.message?.content?.trim() || "";

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: error?.message || "AI request failed" },
      { status: 500 }
    );
  }
}

function buildUserPrompt({
  html,
  selection,
  prompt,
  mode,
}: {
  html: string;
  selection: string;
  prompt: string;
  mode: "rewrite" | "continue" | "summarize";
}): string {
  const focus = selection?.trim()?.length
    ? `\n\nSelected text:\n"""\n${selection}\n"""`
    : "";

  let task = "";
  if (mode === "rewrite") {
    task =
      "Rewrite the selected text to improve clarity, grammar, and style. " +
      (prompt ? `Apply these specific changes: ${prompt}` : "");
  } else if (mode === "summarize") {
    task =
      "Create a concise summary of the selected text, capturing the key points.";
  } else {
    // continue
    task =
      "Continue writing from where the user left off. " +
      "Write 2-3 sentences that naturally follow the context. " +
      "Be helpful and concrete. " +
      (prompt ? `User's guidance: ${prompt}` : "");
  }

  const contextSnippet = html.slice(0, 4000); // Keep context reasonable

  return [
    `Task: ${task}`,
    focus || `Context (current document):\n${contextSnippet}`,
    prompt && mode !== "rewrite"
      ? `Additional instructions: "${prompt}"`
      : "",
    "\nReturn only the text to insert or replace, without quotation marks or meta-commentary.",
  ]
    .filter(Boolean)
    .join("\n\n");
}
