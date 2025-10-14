import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId") || undefined;
  const pages = await prisma.page.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    orderBy: { updatedAt: "desc" },
    select: { id: true, workspaceId: true, title: true, icon: true, coverUrl: true, isArchived: true, updatedAt: true },
  });
  return NextResponse.json({ data: pages });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { workspaceId, title, icon, coverUrl } = body || {};
  if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  const page = await prisma.page.create({ data: { workspaceId, title: title ?? undefined, icon, coverUrl } });
  return NextResponse.json({ data: page });
}

