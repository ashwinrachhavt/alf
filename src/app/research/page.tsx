"use client";

import { useMemo, useRef, useState } from "react";
import { markdownToHtml } from "@/lib/markdown";
import ResponsiveMarkdown from "@/components/ResponsiveMarkdown";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";

export default function ResearchStreamPage() {
  const router = useRouter();
  const [query, setQuery] = useState(
    "Do a deep research on the company Maxima AI, I had a recruiter screen with them and going to have an initial coding round where they're going to check problem solving (not LeetCode, but practical coding). Help me prepare: propose practice questions with solved examples. Finally, include a simple DB schema design with indexing."
  );
  const [markdown, setMarkdown] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<{ type: string; message: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const html = useMemo(() => markdownToHtml(markdown), [markdown]);

  async function start() {
    if (running) return;
    setMarkdown("");
    setLogs([]);
    setRunning(true);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/research/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: ac.signal,
      });
      if (!res.body) throw new Error("No body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const rawEvent = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const lines = rawEvent.split(/\n/);
          let type = "message";
          let data = "";
          for (const line of lines) {
            if (line.startsWith("event:")) type = line.slice(6).trim();
            if (line.startsWith("data:")) data += line.slice(5).trim();
          }
          if (type === "text" && data) {
            try {
              const obj = JSON.parse(data);
              const delta = obj?.delta ?? obj?.text ?? obj?.content ?? obj?.value ?? "";
              if (delta) setMarkdown((m) => m + delta);
            } catch {
              setMarkdown((m) => m + data);
            }
          }
          if (type === "tool" && data) {
            try {
              const obj = JSON.parse(data);
              const msg = obj.phase === "call"
                ? `tool:${obj.name} args:${obj.args ?? ''}`
                : `tool:${obj.name} output:${obj.output ?? ''}`;
              setLogs((l) => [...l, { type: "tool", message: msg.slice(0, 200) }]);
            } catch {}
          }
          if (type === "status" && data) {
            try {
              const obj = JSON.parse(data);
              setLogs((l) => [...l, { type: "status", message: obj.message + (obj.name ? `:${obj.name}` : "") }]);
            } catch {}
          }
          if (type === "error" && data) {
            try {
              const obj = JSON.parse(data);
              setLogs((l) => [...l, { type: "error", message: obj.message ?? "error" }]);
            } catch { setLogs((l) => [...l, { type: "error", message: data }]); }
          }
          if (type === "done") {
            setLogs((l) => [...l, { type: "status", message: "done" }]);
          }
        }
      }
    } catch (e) {
      // ignore abort errors
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  function copyMd() {
    navigator.clipboard.writeText(markdown);
    setLogs((l) => [...l, { type: "status", message: "copied markdown" }]);
  }

  async function saveToDB() {
    if (!markdown) return;
    setSaving(true);
    setSaved(false);
    try {
      // Extract a reasonable title
      let title = query.slice(0, 100).trim();
      const titleMatch = markdown.match(/^#\s+(.+)$/m);
      if (titleMatch?.[1]) title = titleMatch[1].slice(0, 100);

      // 1) Create a thread
      const t = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Research: ${title}` }),
      }).then((r) => r.json());
      const threadId = t?.data?.id;
      if (!threadId) throw new Error('Failed to create thread');

      // 2) Save a run under the thread (Markdown + basic Doc)
      const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: markdown }] }] };
      const saved = await fetch(`/api/threads/${threadId}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, contentMd: markdown, contentDoc: doc }),
      }).then((r) => r.json());
      if (!saved?.data?.id) throw new Error('Failed to save run');

      setSaved(true);
      setLogs((l) => [...l, { type: 'status', message: `saved to thread ${threadId}` }]);
      setTimeout(() => router.push(`/threads/${threadId}`), 800);
    } catch (e) {
      setLogs((l) => [...l, { type: 'error', message: 'failed to save to DB' }]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">Deep Research</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          AI-powered research with live streaming results
        </p>
      </div>

      <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-6 bg-white dark:bg-neutral-900 shadow-sm">
        <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2 block">Research Query</label>
        <textarea
          className="w-full font-mono text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 min-h-32 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your research question..."
        />
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={start}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {running ? (
              <>
                <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                Researching...
              </>
            ) : (
              <>
                🔎 Start Research
              </>
            )}
          </button>
          <button
            onClick={stop}
            disabled={!running}
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Stop
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-4">
        <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-6 min-h-[60vh] bg-white dark:bg-neutral-900 shadow-sm">
          {markdown ? (
            <ResponsiveMarkdown content={markdown} />
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-500 dark:text-neutral-400">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Research results will appear here</p>
              </div>
            </div>
          )}
        </div>
        <aside className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-4 h-full min-h-[60vh] bg-white dark:bg-neutral-900 shadow-sm">
          {/* Actions */}
          <div className="flex flex-col gap-2 mb-4">
            <button
              onClick={copyMd}
              disabled={!markdown}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-neutral-900 dark:text-neutral-100"
            >
              📋 Copy Markdown
            </button>
            <button onClick={saveToDB} disabled={!markdown || saving || saved} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-black dark:bg-white text-white dark:text-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save to DB'}
            </button>
          </div>

          {/* Progress Log */}
          <div className="text-sm font-semibold mb-3 text-neutral-900 dark:text-neutral-100">Research Progress</div>
          <div className="space-y-2 max-h-[50vh] overflow-auto">
            {logs.length === 0 ? (
              <div className="text-xs text-neutral-500 dark:text-neutral-400 p-2">
                No activity yet
              </div>
            ) : (
              logs.map((l, i) => (
                <div key={i} className={`rounded-lg px-3 py-2 border text-xs ${
                  l.type === 'error'
                    ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200'
                    : l.type === 'tool'
                    ? 'border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/30 text-neutral-900 dark:text-neutral-100'
                }`}>
                  <span className="font-mono font-semibold">{l.type}</span>: {l.message}
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
