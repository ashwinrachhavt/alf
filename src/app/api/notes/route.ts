import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const favorites = searchParams.get('favorites') === 'true';
    const archived = searchParams.get('archived') === 'true';
    const search = searchParams.get('search');

    const where: any = {
      isArchived: archived,
    };

    if (favorites) where.isFavorite = true;
    if (category) where.category = category;
    if (tag) where.tags = { has: tag };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { contentMd: { contains: search, mode: 'insensitive' } },
      ];
    }

    const notes = await prisma.note.findMany({
      where,
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
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, icon, content, contentMd, tags, category, sourceType, sourceId } = body;

    const note = await prisma.note.create({
      data: {
        title: title || 'Untitled Note',
        icon: icon || '📝',
        content: content || null,
        contentMd: contentMd || '',
        tags: tags || [],
        category: category || null,
        sourceType: sourceType || 'manual',
        sourceId: sourceId || null,
      },
    });

    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    console.error('Failed to create note:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create note' },
      { status: 500 }
    );
  }
}
