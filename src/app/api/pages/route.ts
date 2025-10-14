import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const favorites = searchParams.get('favorites') === 'true';
    const archived = searchParams.get('archived') === 'true';

    const where: any = {};
    if (workspaceId) where.workspaceId = workspaceId;
    if (favorites) where.isFavorite = true;
    where.isArchived = archived;
    where.parentId = null; // Only top-level pages

    const pages = await prisma.page.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: pages });
  } catch (error) {
    console.error('Failed to fetch pages:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch pages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workspaceId, title, icon, content } = body;

    // Get or create a default workspace if not provided
    let finalWorkspaceId = workspaceId;
    if (!finalWorkspaceId) {
      let workspace = await prisma.workspace.findFirst();
      if (!workspace) {
        workspace = await prisma.workspace.create({
          data: {
            name: 'My Workspace',
            icon: '📁',
          },
        });
      }
      finalWorkspaceId = workspace.id;
    }

    const page = await prisma.page.create({
      data: {
        workspaceId: finalWorkspaceId,
        title: title || 'Untitled',
        icon: icon || '📄',
        content: content || null,
      },
    });

    return NextResponse.json({ success: true, data: page });
  } catch (error) {
    console.error('Failed to create page:', error);
    return NextResponse.json({ success: false, error: 'Failed to create page' }, { status: 500 });
  }
}
