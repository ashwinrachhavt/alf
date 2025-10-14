import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const threads = await prisma.researchThread.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json({ data: threads });
}

export async function POST(req: Request) {
  const { title } = await req.json();
  const t = await prisma.researchThread.create({ data: { title: title || "Untitled Thread" } });
  return NextResponse.json({ data: t });
}

