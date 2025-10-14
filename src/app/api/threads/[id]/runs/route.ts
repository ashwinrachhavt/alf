import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const runs = await prisma.researchRun.findMany({
    where: { threadId: id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json({ data: runs });
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { title, contentMd, contentDoc } = await req.json();
  if (!contentMd || typeof contentMd !== "string")
    return NextResponse.json({ error: "contentMd required" }, { status: 400 });
  const run = await prisma.researchRun.create({
    data: { threadId: id, title: title ?? null, contentMd, contentDoc: contentDoc ?? null },
  });
  return NextResponse.json({ data: run });
}
