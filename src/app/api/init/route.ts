import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Check if a workspace already exists
    const existingWorkspace = await prisma.workspace.findFirst();

    if (existingWorkspace) {
      return NextResponse.json({
        success: true,
        message: 'Workspace already exists',
        data: existingWorkspace,
      });
    }

    // Create a default workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: 'My Workspace',
        icon: '📁',
        pages: {
          create: [
            {
              title: 'Welcome to ALF',
              icon: '👋',
              content: {
                type: 'doc',
                content: [
                  {
                    type: 'heading',
                    attrs: { level: 1 },
                    content: [{ type: 'text', text: 'Welcome to ALF' }],
                  },
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'ALF is your AI-powered knowledge management system. Start writing, organizing, and let AI help you improve your content.',
                      },
                    ],
                  },
                  {
                    type: 'heading',
                    attrs: { level: 2 },
                    content: [{ type: 'text', text: 'Features' }],
                  },
                  {
                    type: 'bulletList',
                    content: [
                      {
                        type: 'listItem',
                        content: [
                          {
                            type: 'paragraph',
                            content: [
                              { type: 'text', text: 'Beautiful Notion-like editor' },
                            ],
                          },
                        ],
                      },
                      {
                        type: 'listItem',
                        content: [
                          {
                            type: 'paragraph',
                            content: [
                              { type: 'text', text: 'AI-powered writing assistant' },
                            ],
                          },
                        ],
                      },
                      {
                        type: 'listItem',
                        content: [
                          {
                            type: 'paragraph',
                            content: [
                              { type: 'text', text: 'Organized workspace with folders' },
                            ],
                          },
                        ],
                      },
                      {
                        type: 'listItem',
                        content: [
                          {
                            type: 'paragraph',
                            content: [
                              { type: 'text', text: 'Multiple view modes (Grid, List, Shelf)' },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
            {
              title: 'Getting Started',
              icon: '🚀',
              content: {
                type: 'doc',
                content: [
                  {
                    type: 'heading',
                    attrs: { level: 1 },
                    content: [{ type: 'text', text: 'Getting Started' }],
                  },
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Click the AI Assistant button to get help with your writing. Try asking it to improve your text, fix grammar, or generate new content.',
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      },
      include: {
        pages: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Workspace initialized',
      data: workspace,
    });
  } catch (error) {
    console.error('Failed to initialize workspace:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize workspace' },
      { status: 500 }
    );
  }
}
