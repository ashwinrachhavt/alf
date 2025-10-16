import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const notes = await prisma.note.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ success: true, data: notes });
  } catch (error: any) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newNote = await prisma.note.create({
      data: {
        title: body.title ?? "Untitled Note",
        icon: body.icon ?? "📝",
        coverUrl: body.coverUrl ?? null,
        tags: body.tags ?? [],
        category: body.category ?? null,
        isFavorite: false,
        isArchived: false,
      },
    });
    return NextResponse.json({ success: true, data: newNote });
  } catch (error: any) {
    console.error("Error creating note:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}