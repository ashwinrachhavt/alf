import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { targetNoteId, linkType } = body;

    const link = await prisma.noteLink.create({
      data: {
        sourceNoteId: params.id,
        targetNoteId,
        linkType: linkType || 'related',
      },
    });

    return NextResponse.json({ success: true, data: link });
  } catch (error) {
    console.error('Failed to create link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create link' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const targetNoteId = searchParams.get('targetNoteId');

    if (!targetNoteId) {
      return NextResponse.json(
        { success: false, error: 'targetNoteId required' },
        { status: 400 }
      );
    }

    await prisma.noteLink.deleteMany({
      where: {
        sourceNoteId: params.id,
        targetNoteId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete link' },
      { status: 500 }
    );
  }
}
