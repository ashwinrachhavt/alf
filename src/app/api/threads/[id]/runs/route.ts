import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const runs = await prisma.researchRun.findMany({
    where: { threadId: params.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json({ data: runs });
}

export async function POST(req: Request, { params }: Ctx) {
  const { title, contentMd, contentDoc } = await req.json();
  if (!contentMd || typeof contentMd !== "string")
    return NextResponse.json({ error: "contentMd required" }, { status: 400 });
  const run = await prisma.researchRun.create({
    data: { threadId: params.id, title: title ?? null, contentMd, contentDoc: contentDoc ?? null },
  });
  return NextResponse.json({ data: run });
}

