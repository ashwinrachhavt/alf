"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">Research Threads</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Organize your research into threads with AI-powered analysis
        </p>
      </div>

      {/* Create Thread */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New Research Thread</CardTitle>
          <CardDescription>Create a thread to organize your research</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && create()}
              placeholder="Enter thread title..."
              className="flex-1"
            />
            <Button
              onClick={create}
              disabled={busy || !title.trim()}
              variant="primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Threads List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
              <CardTitle className="text-base">All Threads</CardTitle>
            </div>
            <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {threads.length} {threads.length === 1 ? 'thread' : 'threads'}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {threads.map((t) => (
              <Link
                key={t.id}
                href={`/threads/${t.id}`}
                className="block px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all group"
              >
                <div className="font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                  {t.title}
                </div>
                <div className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400">
                  <Clock className="w-3 h-3" />
                  Updated {new Date(t.updatedAt).toLocaleDateString()} at {new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </Link>
            ))}
            {threads.length === 0 && (
              <div className="px-6 py-16 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-neutral-400 dark:text-neutral-600" />
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">No research threads yet</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Create your first thread to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

