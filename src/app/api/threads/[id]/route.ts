import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const thread = await prisma.researchThread.findUnique({
    where: { id: params.id },
    include: { runs: { orderBy: { createdAt: "desc" }, select: { id: true, title: true, createdAt: true, updatedAt: true } } },
  });
  if (!thread) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ data: thread });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  // delete runs then thread to avoid FK errors
  await prisma.researchRun.deleteMany({ where: { threadId: params.id } });
  await prisma.researchThread.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

