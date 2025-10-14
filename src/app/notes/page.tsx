"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Note = {
  id: string;
  title: string;
  icon?: string | null;
  updatedAt: string;
};

export default function NotesListPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/notes").then((r) => r.json());
        if (res?.success && Array.isArray(res.data)) {
          const minimal = res.data.map((n: any) => ({ id: n.id, title: n.title, icon: n.icon, updatedAt: n.updatedAt }));
          setNotes(minimal);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  async function createNote() {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Note" }),
      }).then((r) => r.json());
      const id = res?.data?.id;
      if (id) {
        router.push(`/notes/${id}`);
        return;
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notes</h1>
        <button
          onClick={createNote}
          disabled={creating}
          className="px-4 py-2 rounded-md bg-black dark:bg-white text-white dark:text-black disabled:opacity-50"
        >
          {creating ? "Creating…" : "New Note"}
        </button>
      </div>

      {loading ? (
        <div className="text-neutral-500">Loading…</div>
      ) : notes.length === 0 ? (
        <div className="text-neutral-500">No notes yet</div>
      ) : (
        <ul className="divide-y divide-neutral-200/70 dark:divide-neutral-800/70">
          {notes.map((n) => (
            <li key={n.id} className="py-3 flex items-center justify-between">
              <Link href={`/notes/${n.id}`} className="text-blue-600 dark:text-blue-400 underline">
                {n.icon ?? "📝"} {n.title || "Untitled"}
              </Link>
              <span className="text-xs text-neutral-500">{new Date(n.updatedAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

