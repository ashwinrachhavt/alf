"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Save } from "lucide-react";
import NoteWysiwyg from "@/components/NoteWysiwyg";

type Note = {
  id: string;
  title: string;
  icon?: string | null;
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
        body: JSON.stringify({ title, contentMd: markdown }),
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
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-14 z-30 bg-[color:var(--color-background)]/80 backdrop-blur border-b border-[color:var(--color-border)]/60">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <button onClick={backToList} className="text-sm text-[color:var(--color-muted)] hover:underline">All Notes</button>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl md:text-2xl font-semibold bg-transparent outline-none border-b border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 px-1 text-[color:var(--color-foreground)]"
              placeholder="Untitled Note"
            />
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black disabled:opacity-50 shadow-sm"
          >
            {saving ? "Saving…" : status || "Save"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 py-4">
        <NoteWysiwyg
          initialMarkdown={markdown}
          onChangeMarkdown={(md) => setMarkdown(md)}
        />
      </div>
    </div>
  );
}
