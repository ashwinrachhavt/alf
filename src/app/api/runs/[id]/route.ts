import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const run = await prisma.researchRun.findUnique({ where: { id: params.id } });
  if (!run) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ data: run });
}

export async function PUT(req: Request, { params }: Ctx) {
  const { title, contentMd, contentDoc } = await req.json();
  const run = await prisma.researchRun.update({
    where: { id: params.id },
    data: {
      title: title ?? undefined,
      contentMd: typeof contentMd === "string" ? contentMd : undefined,
      contentDoc: contentDoc ?? undefined,
    },
  });
  return NextResponse.json({ data: run });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  await prisma.researchRun.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

