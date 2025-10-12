import { NextResponse } from "next/server";

export const maxDuration = 300;

export async function GET() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  const url = `${base}/api/agents/research`;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "GraphRAG vs LazyGraphRAG — latest differences with citations",
      }),
    });
  } catch (e) {
    // swallow on cron
  }
  return NextResponse.json({ ok: true });
}

