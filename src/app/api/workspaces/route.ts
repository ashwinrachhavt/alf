import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const workspaces = await prisma.workspace.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data: workspaces });
}

export async function POST(req: Request) {
  const { name } = await req.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const ws = await prisma.workspace.create({ data: { name } });
  return NextResponse.json({ data: ws });
}

