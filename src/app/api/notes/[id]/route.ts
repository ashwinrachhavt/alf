import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/notes/:id
 * Fetch a single note including its markdown and Tiptap content.
 */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const note = await prisma.note.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        icon: true,
        category: true,
        tags: true,
        isFavorite: true,
        isArchived: true,
        contentMd: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!note) {
      return NextResponse.json({ success: false, error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: note });
  } catch (error: any) {
    console.error("Error fetching note:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/notes/:id
 * Update a note's title, markdown, and structured content.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    const updated = await prisma.note.update({
      where: { id: params.id },
      data: {
        title: body.title ?? undefined,
        icon: body.icon ?? undefined,
        category: body.category ?? undefined,
        tags: body.tags ?? undefined,
        contentMd: body.contentMd ?? "",
        content: body.content ?? {},
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating note:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}