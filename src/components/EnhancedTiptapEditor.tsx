"use client";

import { useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';

type TiptapDoc = any;

interface EnhancedTiptapEditorProps {
  value: TiptapDoc | null;
  onChange: (doc: TiptapDoc) => void;
  placeholder?: string;
  onAIAssistant?: () => void;
}

export default function EnhancedTiptapEditor({
  value,
  onChange,
  placeholder = "Start writing, or press '/' for commands...",
  onAIAssistant,
}: EnhancedTiptapEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: {
          HTMLAttributes: {
            class: 'bg-neutral-100 dark:bg-neutral-900 rounded-md p-4 font-mono text-sm',
          },
        },
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-blue-600 dark:text-blue-400 underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      TextStyle,
      Color,
    ],
    content: value ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    autofocus: true,
    editorProps: {
      attributes: {
        class: 'prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[60vh] px-12 py-8',
      },
    },
    // Avoid hydration mismatches in Next.js SSR
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      try {
        const json = editor.getJSON();
        onChange(json);
      } catch (error) {
        console.error('Failed to update editor:', error);
      }
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !editor) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-neutral-500">
        Loading editor...
      </div>
    );
  }

  const ToolbarButton = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      onClick={onClick}
      className={`
        p-2 rounded-md transition-colors
        ${active
          ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100'
          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
        }
      `}
      title={title}
      type="button"
    >
      {children}
    </button>
  );

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-sm">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex items-center gap-1 px-4 py-2 border-b border-neutral-200/50 dark:border-neutral-800/50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm overflow-x-auto">
        {/* AI Assistant */}
        {onAIAssistant && (
          <>
            <button
              onClick={onAIAssistant}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:opacity-90 transition-opacity text-sm font-medium"
              type="button"
            >
              <Sparkles className="w-4 h-4" />
              AI Assistant
            </button>
            <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-800 mx-1" />
          </>
        )}

        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="Code"
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-800 mx-1" />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-800 mx-1" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-800 mx-1" />

        {/* Insert */}
        <ToolbarButton onClick={addLink} title="Add Link">
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton onClick={addImage} title="Add Image">
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-800 mx-1" />

        {/* History */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Custom styles */}
      <style jsx global>{`
        .ProseMirror .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }

        .ProseMirror h1 {
          font-size: 2.5rem;
          font-weight: 700;
          line-height: 1.2;
          margin: 1.5rem 0 1rem;
        }

        .ProseMirror h2 {
          font-size: 2rem;
          font-weight: 600;
          line-height: 1.3;
          margin: 1.25rem 0 0.75rem;
        }

        .ProseMirror h3 {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1.4;
          margin: 1rem 0 0.5rem;
        }

        .ProseMirror p {
          margin: 0.75rem 0;
          line-height: 1.75;
        }

        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.75rem 0;
        }

        .ProseMirror li {
          margin: 0.25rem 0;
        }

        .ProseMirror code {
          background-color: rgba(0, 0, 0, 0.05);
          border-radius: 0.25rem;
          padding: 0.125rem 0.25rem;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.875em;
        }

        .ProseMirror blockquote {
          border-left: 4px solid #d1d5db;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
        }

        .ProseMirror hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 2rem 0;
        }

        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }

        @media (prefers-color-scheme: dark) {
          .ProseMirror code {
            background-color: rgba(255, 255, 255, 0.1);
          }

          .ProseMirror blockquote {
            border-left-color: #4b5563;
            color: #9ca3af;
          }

          .ProseMirror hr {
            border-top-color: #374151;
          }
        }
      `}</style>
    </div>
  );
}
