"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, MessageSquare, Clock } from "lucide-react";

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">Research Threads</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Organize your research into threads with AI-powered analysis
        </p>
      </div>

      <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-6 bg-white dark:bg-neutral-900 shadow-sm">
        <div className="text-sm font-medium mb-3 text-neutral-900 dark:text-neutral-100">New Research Thread</div>
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && create()}
            placeholder="Enter thread title..."
            className="flex-1 h-10 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100"
          />
          <button
            onClick={create}
            disabled={busy || !title.trim()}
            className="h-10 px-4 bg-black dark:bg-white text-white dark:text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>
      </div>

      <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-medium">All Threads</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">({threads.length})</span>
          </div>
        </div>
        <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {threads.map((t) => (
            <Link
              key={t.id}
              href={`/threads/${t.id}`}
              className="block px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group"
            >
              <div className="font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {t.title}
              </div>
              <div className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                <Clock className="w-3 h-3" />
                Updated {new Date(t.updatedAt).toLocaleDateString()} at {new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </Link>
          ))}
          {threads.length === 0 && (
            <div className="px-4 py-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">No research threads yet</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500">Create your first thread to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

