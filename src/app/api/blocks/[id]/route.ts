import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  const id = params.id;
  const body = await req.json();
  const { text, props, order, type, parentId, collapsed } = body || {};
  const block = await prisma.block.update({
    where: { id },
    data: {
      text: typeof text === "string" ? text : undefined,
      props: props ?? undefined,
      order: typeof order === "number" ? order : undefined,
      type: type ?? undefined,
      parentId: parentId ?? undefined,
      collapsed: typeof collapsed === "boolean" ? collapsed : undefined,
    },
  });
  return NextResponse.json({ data: block });
}

export async function DELETE(_req: Request, { params }: Params) {
  const id = params.id;
  await prisma.block.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

