import { NextResponse } from "next/server";
import { searchDocs } from "@/lib/knowledge";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { q, max } = await req.json();
  if (!q) return NextResponse.json({ error: "missing q" }, { status: 400 });
  const hits = await searchDocs(q, max ?? 10);
  return NextResponse.json({ hits });
}

