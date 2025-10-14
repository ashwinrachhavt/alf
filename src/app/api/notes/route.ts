import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/notes - List all notes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const favorite = searchParams.get("favorite");
    const archived = searchParams.get("archived");

    const where: any = {};

    if (category) where.category = category;
    if (tag) where.tags = { has: tag };
    if (favorite === "true") where.isFavorite = true;
    if (archived === "true") where.isArchived = true;
    else where.isArchived = false; // Default: don't show archived

    const notes = await prisma.note.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        icon: true,
        coverUrl: true,
        tags: true,
        category: true,
        isFavorite: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        contentMd: false,
        content: false,
      },
    });

    return NextResponse.json({ success: true, data: notes });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/notes - Create new note
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title = "Untitled Note",
      icon = "📝",
      coverUrl,
      content,
      contentMd,
      tags = [],
      category,
      sourceType,
      sourceId,
    } = body;

    const note = await prisma.note.create({
      data: {
        title,
        icon,
        coverUrl,
        content,
        contentMd,
        tags,
        category,
        sourceType,
        sourceId,
      },
    });

    return NextResponse.json({ success: true, data: note });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
