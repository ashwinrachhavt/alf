import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const note = await prisma.note.findUnique({
      where: { id },
      include: {
        linkedNotes: {
          include: {
            targetNote: true,
          },
        },
        linkedFrom: {
          include: {
            sourceNote: true,
          },
        },
      },
    });

    if (!note) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    console.error('Failed to fetch note:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch note' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const {
      title,
      icon,
      content,
      contentMd,
      tags,
      category,
      coverUrl,
      isFavorite,
      isArchived,
    } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (icon !== undefined) updateData.icon = icon;
    if (content !== undefined) updateData.content = content;
    if (contentMd !== undefined) updateData.contentMd = contentMd;
    if (tags !== undefined) updateData.tags = tags;
    if (category !== undefined) updateData.category = category;
    if (coverUrl !== undefined) updateData.coverUrl = coverUrl;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
    if (isArchived !== undefined) updateData.isArchived = isArchived;

    const note = await prisma.note.update({
      where: { id },
      data: updateData,
    });

    console.log('Note updated:', note.id, 'Title:', note.title);

    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    console.error('Failed to update note:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    await prisma.note.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete note:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
