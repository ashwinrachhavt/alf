import { NextResponse } from "next/server";
import { readDoc, writeDoc, deleteNode } from "@/lib/knowledge";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const p = searchParams.get("path");
  if (!p) return NextResponse.json({ error: "missing path" }, { status: 400 });
  const text = await readDoc(p);
  return NextResponse.json({ path: p, text });
}

export async function POST(req: Request) {
  const { path, text } = await req.json();
  if (!path || typeof text !== "string")
    return NextResponse.json({ error: "missing path/text" }, { status: 400 });
  await writeDoc(path, text);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const p = searchParams.get("path");
  if (!p) return NextResponse.json({ error: "missing path" }, { status: 400 });
  await deleteNode(p);
  return NextResponse.json({ ok: true });
}

