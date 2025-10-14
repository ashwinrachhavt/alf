import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const run = await prisma.researchRun.findUnique({ where: { id } });
  if (!run) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ data: run });
}

export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { title, contentMd, contentDoc } = await req.json();
  const run = await prisma.researchRun.update({
    where: { id },
    data: {
      title: title ?? undefined,
      contentMd: typeof contentMd === "string" ? contentMd : undefined,
      contentDoc: contentDoc ?? undefined,
    },
  });
  return NextResponse.json({ data: run });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await prisma.researchRun.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
