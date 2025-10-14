import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/notes/[id] - Get single note
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const note = await prisma.note.findUnique({
      where: { id },
      include: {
        linkedNotes: {
          include: {
            targetNote: {
              select: {
                id: true,
                title: true,
                icon: true,
              },
            },
          },
        },
        linkedFrom: {
          include: {
            sourceNote: {
              select: {
                id: true,
                title: true,
                icon: true,
              },
            },
          },
        },
      },
    });

    if (!note) {
      return NextResponse.json(
        { success: false, error: "Note not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: note });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/notes/[id] - Update note
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      icon,
      coverUrl,
      content,
      contentMd,
      tags,
      category,
      isFavorite,
      isArchived,
    } = body;

    const note = await prisma.note.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(icon !== undefined && { icon }),
        ...(coverUrl !== undefined && { coverUrl }),
        ...(content !== undefined && { content }),
        ...(contentMd !== undefined && { contentMd }),
        ...(tags !== undefined && { tags }),
        ...(category !== undefined && { category }),
        ...(isFavorite !== undefined && { isFavorite }),
        ...(isArchived !== undefined && { isArchived }),
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

// DELETE /api/notes/[id] - Delete note
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.note.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
