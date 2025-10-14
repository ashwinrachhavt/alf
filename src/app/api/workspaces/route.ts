import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const workspaces = await prisma.workspace.findMany({
      include: {
        pages: {
          where: { isArchived: false, parentId: null },
          orderBy: { updatedAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: workspaces });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch workspaces' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, icon } = body;

    const workspace = await prisma.workspace.create({
      data: { name, icon },
    });

    return NextResponse.json({ success: true, data: workspace });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create workspace' }, { status: 500 });
  }
}
