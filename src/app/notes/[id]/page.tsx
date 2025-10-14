"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ResponsiveMarkdown from "@/components/ResponsiveMarkdown";

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
  const noteId = params?.id as string;

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");

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

  const preview = useMemo(() => markdown, [markdown]);

  if (!note) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 text-neutral-500">Loading…</div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={backToList} className="text-sm underline">All Notes</button>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl md:text-2xl font-semibold bg-transparent outline-none border-b border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 px-1"
            placeholder="Untitled Note"
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded-md bg-black dark:bg-white text-white dark:text-black disabled:opacity-50"
        >
          {saving ? "Saving…" : status || "Save"}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-3 bg-white dark:bg-neutral-900">
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="w-full h-[70vh] font-mono text-sm outline-none"
            placeholder="Write markdown…"
          />
        </div>
        <div className="border rounded-lg p-3 bg-white dark:bg-neutral-900 overflow-auto">
          <ResponsiveMarkdown content={preview} />
        </div>
      </div>
    </div>
  );
}

