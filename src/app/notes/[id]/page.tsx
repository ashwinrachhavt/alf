"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Save } from "lucide-react";
import NoteWysiwyg from "@/components/NoteWysiwyg";

type Note = {
  id: string;
  title: string;
  icon?: string | null;
  content?: any; // Tiptap JSON
  contentMd?: string | null;
  tags?: string[];
  category?: string | null;
  isFavorite?: boolean;
  isArchived?: boolean;
};

export default function NoteEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const noteId = (params?.id as string) || "";

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [tiptapContent, setTiptapContent] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");

  // No inline AI on notes page per request

  useEffect(() => {
    if (!noteId) return;
    (async () => {
      try {
        const res = await fetch(`/api/notes/${noteId}`).then((r) => r.json());
        const n = res?.data;
        if (n) {
          setNote(n);
          setTitle(n.title || "Untitled Note");
          // Prefer Tiptap JSON content if available, otherwise fall back to markdown
          if (n.content) {
            setTiptapContent(n.content);
          }
          setMarkdown(n.contentMd || "");
        }
      } catch {}
    })();
  }, [noteId]);

  async function save() {
    if (!noteId) return;
    setSaving(true);
    setStatus("");
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          contentMd: markdown,
          content: tiptapContent, // Save the Tiptap JSON content
        }),
      }).then((r) => r.json());
      if (res?.success) {
        setStatus("Saved");
        setTimeout(() => setStatus(""), 1200);
      } else {
        setStatus("Failed to save");
      }
    } finally {
      setSaving(false);
    }
  }

  function backToList() {
    router.push("/notes");
  }

  

  if (!note) {
    return <div className="mx-auto max-w-6xl px-4 py-8 text-neutral-500">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-[color:var(--color-background)]/95 backdrop-blur-md border-b border-[color:var(--color-border)]">
        <div className="mx-auto max-w-5xl px-6 md:px-10 lg:px-16">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={backToList}
                className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] transition-colors"
              >
                ← All Notes
              </button>
              <div className="h-4 w-px bg-[color:var(--color-border)]" />
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl md:text-2xl font-bold bg-transparent outline-none flex-1 min-w-0 text-[color:var(--color-foreground)] placeholder:text-[color:var(--color-muted)]"
                placeholder="Untitled Note"
              />
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="ml-4 px-6 py-2 rounded-lg bg-[color:var(--color-foreground)] text-[color:var(--color-background)] disabled:opacity-50 hover:opacity-90 transition-all font-medium flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving…" : status || "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content - Full page, no boundaries */}
      <div className="mx-auto max-w-5xl px-6 md:px-10 lg:px-16 py-8">
        <NoteWysiwyg
          initialMarkdown={markdown}
          initialContent={tiptapContent}
          onChangeMarkdown={(md) => setMarkdown(md)}
          onChangeContent={(content) => setTiptapContent(content)}
        />
      </div>
    </div>
  );
}
