"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Thread = { id: string; title: string; createdAt: string; updatedAt: string };

export default function ThreadsPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch("/api/threads").then((x) => x.json());
    setThreads(r.data || []);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      setTitle("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <div className="border rounded-lg p-4">
        <div className="text-sm font-medium mb-2">New Thread</div>
        <div className="flex gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="flex-1 h-9 border rounded px-2 bg-background" />
          <button onClick={create} disabled={busy || !title.trim()} className="h-9 px-3 border rounded disabled:opacity-50">Create</button>
        </div>
      </div>

      <div className="border rounded-lg">
        <div className="p-3 border-b text-sm font-medium">Threads</div>
        <div className="divide-y">
          {threads.map((t) => (
            <Link key={t.id} href={`/threads/${t.id}`} className="block px-3 py-2 hover:bg-accent/50">
              <div className="font-medium">{t.title}</div>
              <div className="text-xs text-muted-foreground">Updated {new Date(t.updatedAt).toLocaleString()}</div>
            </Link>
          ))}
          {threads.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground">No threads yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

