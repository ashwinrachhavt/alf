import { NextResponse } from "next/server";
import { deleteItem, getItem, upsertNote } from "@/lib/store";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const item = await getItem(params.id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updated = await upsertNote({ id: params.id, title: body.title, content: body.content, tags: body.tags });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await deleteItem(params.id);
  return NextResponse.json({ ok: true });
}

