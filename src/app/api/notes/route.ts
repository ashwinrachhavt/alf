import { NextResponse } from "next/server";
import { listItems, upsertNote } from "@/lib/store";

export async function GET() {
  const items = await listItems();
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const note = await upsertNote({
      title: String(body.title || "Untitled"),
      content: String(body.content || ""),
      parentId: body.parentId ?? "root",
      tags: Array.isArray(body.tags) ? body.tags : [],
    });
    return NextResponse.json(note);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

