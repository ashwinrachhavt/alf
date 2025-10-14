import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const thread = await prisma.researchThread.findUnique({
    where: { id },
    include: { runs: { orderBy: { createdAt: "desc" }, select: { id: true, title: true, createdAt: true, updatedAt: true } } },
  });
  if (!thread) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ data: thread });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  // delete runs then thread to avoid FK errors
  await prisma.researchRun.deleteMany({ where: { threadId: id } });
  await prisma.researchThread.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
