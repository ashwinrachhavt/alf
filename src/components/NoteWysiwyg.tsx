"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";

async function markdownToHtml(md: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(md || "");
  return String(file);
}

async function htmlToMarkdown(html: string): Promise<string> {
  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeRemark)
    .use(remarkStringify)
    .process(html || "");
  return String(file);
}

type Props = {
  initialMarkdown?: string;
  initialContent?: any; // Tiptap JSON
  onChangeMarkdown: (md: string) => void;
  onChangeContent?: (content: any) => void;
};

export default function NoteWysiwyg({ initialMarkdown, initialContent, onChangeMarkdown, onChangeContent }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const initializedRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noreferrer noopener" } }),
      Placeholder.configure({ placeholder: "Write your note…" }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert max-w-none focus:outline-none min-h-[40vh] text-[color:var(--color-foreground)]",
      },
    },
    onUpdate: async ({ editor }) => {
      const html = editor.getHTML();
      const md = await htmlToMarkdown(html);
      const json = editor.getJSON();
      onChangeMarkdown(md);
      onChangeContent?.(json);
    },
  });

  // Initialize from Tiptap JSON or markdown
  useEffect(() => {
    if (!editor || initializedRef.current) return;

    (async () => {
      if (initialContent) {
        // Use Tiptap JSON content directly
        editor.commands.setContent(initialContent);
        initializedRef.current = true;
      } else if (initialMarkdown) {
        // Convert markdown to HTML first
        const html = await markdownToHtml(initialMarkdown);
        editor.commands.setContent(html);
        initializedRef.current = true;
      }
    })();
  }, [editor, initialMarkdown, initialContent]);

  return (
    <div>
      {/* Simple toolbar */}
      <div className="mb-2 flex flex-wrap gap-1 text-sm">
        <button className="px-2 py-1 rounded border" onClick={() => editor?.chain().focus().toggleBold().run()} aria-label="Bold">
          B
        </button>
        <button className="px-2 py-1 rounded border" onClick={() => editor?.chain().focus().toggleItalic().run()} aria-label="Italic">
          I
        </button>
        <button className="px-2 py-1 rounded border" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} aria-label="H1">
          H1
        </button>
        <button className="px-2 py-1 rounded border" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="H2">
          H2
        </button>
        <button className="px-2 py-1 rounded border" onClick={() => editor?.chain().focus().toggleBulletList().run()} aria-label="Bulleted list">
          • List
        </button>
        <button className="px-2 py-1 rounded border" onClick={() => editor?.chain().focus().toggleOrderedList().run()} aria-label="Numbered list">
          1. List
        </button>
        <button className="px-2 py-1 rounded border" onClick={() => editor?.chain().focus().toggleBlockquote().run()} aria-label="Quote">
          " "
        </button>
        <button className="px-2 py-1 rounded border" onClick={() => editor?.chain().focus().toggleCodeBlock().run()} aria-label="Code block">
          {'</>'}
        </button>
        <button
          className="px-2 py-1 rounded border"
          onClick={() => {
            const url = prompt("Enter URL");
            if (!url || !editor) return;
            editor.chain().focus().setLink({ href: url }).run();
          }}
          aria-label="Link"
        >
          Link
        </button>
      </div>

      <div className="rounded-3xl bg-[color:var(--color-surface)]/90 border border-[color:var(--color-border)]/60 shadow-lg p-4 sm:p-6 lg:p-8 min-h-[60vh]">
        {mounted && editor ? <EditorContent editor={editor} /> : <div className="min-h-[40vh]" />}
      </div>
    </div>
  );
}
