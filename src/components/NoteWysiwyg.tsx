"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { AIPalette } from "./AIPalette";
import { AiContextMenu } from "./AiContextMenu";
import { Bold, Italic, List, ListOrdered, Quote, Code, Sparkles } from "lucide-react";
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
  const [aiOpen, setAiOpen] = useState(false);
  const lastSpaceRef = useRef<number>(0);
  useEffect(() => setMounted(true), []);
  const initializedRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noreferrer noopener" } }),
      Placeholder.configure({
        placeholder: "Start writing... Select text for AI assistance or press ⌘J",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "tiptap",
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

  // Double-space AI trigger
  useEffect(() => {
    if (!editor) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // ⌘J or Ctrl+J to open AI palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setAiOpen(true);
        return;
      }

      // Double-space detection in empty paragraph
      if (e.key === " " && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const now = Date.now();
        const interval = now - (lastSpaceRef.current || 0);
        lastSpaceRef.current = now;

        // Only trigger if cursor is in an empty paragraph
        const isEmptyPara =
          editor.isActive("paragraph") &&
          editor.state.selection.$from.parent.content.size === 0;

        if (isEmptyPara && interval < 300) {
          e.preventDefault();
          setAiOpen(true);
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [editor]);

  // Handle AI completion
  const handleAI = async (prompt: string, mode: "rewrite" | "continue" | "summarize") => {
    if (!editor) return;

    const html = editor.getHTML();
    const selection = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      "\n\n"
    );

    const res = await fetch("/api/ai/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html, selection, prompt, mode }),
    });

    if (!res.ok) {
      throw new Error(`AI request failed: ${res.statusText}`);
    }

    const { text } = await res.json();

    // Insert or replace based on mode
    if (mode === "rewrite" && selection) {
      editor.chain().focus().deleteSelection().insertContent(text).run();
    } else {
      editor.chain().focus().insertContent(text).run();
    }
  };

  const ToolbarButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button
      className={`p-2 rounded-lg transition-colors ${
        active
          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
          : "hover:bg-[color:var(--color-accent)] text-[color:var(--color-muted)]"
      }`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <>
      {/* Floating toolbar - minimal and clean */}
      {mounted && editor && (
        <div className="sticky top-16 z-10 mb-6 flex items-center gap-1 p-2 rounded-xl bg-[color:var(--color-surface)] border border-[color:var(--color-border)] shadow-sm w-fit">
          <ToolbarButton
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            icon={Bold}
            label="Bold (⌘B)"
          />
          <ToolbarButton
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            icon={Italic}
            label="Italic (⌘I)"
          />
          <div className="w-px h-6 bg-[color:var(--color-border)]" />
          <ToolbarButton
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            icon={List}
            label="Bullet List"
          />
          <ToolbarButton
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            icon={ListOrdered}
            label="Numbered List"
          />
          <div className="w-px h-6 bg-[color:var(--color-border)]" />
          <ToolbarButton
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            icon={Quote}
            label="Quote"
          />
          <ToolbarButton
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            icon={Code}
            label="Code Block"
          />
          <div className="w-px h-6 bg-[color:var(--color-border)]" />
          <button
            className="p-2 rounded-lg transition-colors bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90"
            onClick={() => setAiOpen(true)}
            aria-label="AI Assistant (⌘J)"
            title="AI Assistant (⌘J)"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Full-page editor - no boundaries */}
      <div className="min-h-[calc(100vh-12rem)] relative">
        {mounted && editor ? <EditorContent editor={editor} /> : <div className="min-h-[60vh]" />}

        {/* AI Context Menu - appears on text selection */}
        {mounted && editor && <AiContextMenu editor={editor} />}
      </div>

      {/* AI Palette - ⌘J or double-space trigger */}
      <AIPalette open={aiOpen} onClose={() => setAiOpen(false)} onRun={handleAI} />
    </>
  );
}
