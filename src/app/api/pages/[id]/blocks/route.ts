import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const pageId = params.id;
  const blocks = await prisma.block.findMany({
    where: { pageId },
    orderBy: [{ parentId: "asc" }, { order: "asc" }],
  });
  return NextResponse.json({ data: blocks });
}

export async function POST(req: Request, { params }: Params) {
  const pageId = params.id;
  const body = await req.json();
  const { parentId, order, type, text, props, collapsed } = body || {};
  if (typeof order !== "number" || !type) {
    return NextResponse.json({ error: "order:number and type are required" }, { status: 400 });
  }
  const block = await prisma.block.create({
    data: { pageId, parentId: parentId ?? undefined, order, type, text: text ?? undefined, props, collapsed: collapsed ?? undefined },
  });
  return NextResponse.json({ data: block });
}

