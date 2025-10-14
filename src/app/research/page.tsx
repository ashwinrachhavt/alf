"use client";

import { useMemo, useRef, useState } from "react";
import { markdownToHtml } from "@/lib/markdown";
import ResponsiveMarkdown from "@/components/ResponsiveMarkdown";

export default function ResearchStreamPage() {
  const [query, setQuery] = useState(
    "Do a deep research on the company Maxima AI, I had a recruiter screen with them and going to have an initial coding round where they’re going to check problem solving (not LeetCode, but practical coding). Help me prepare: propose practice questions with solved examples. Finally, include a simple DB schema design with indexing."
  );
  const [markdown, setMarkdown] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<{ type: string; message: string }[]>([]);
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
      const res = await fetch("/api/agents/research", {
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
              if (obj.delta) setMarkdown((m) => m + obj.delta);
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 space-y-4">
      <div className="border rounded-md p-3 grid gap-2">
        <label className="text-sm font-medium">Query</label>
        <textarea
          className="font-mono text-sm border rounded-md p-2 min-h-24 bg-background"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <button onClick={start} disabled={running} className="h-8 px-2 text-xs rounded-md border hover:bg-accent/60 disabled:opacity-50">
            {running ? "Streaming…" : "Start Streaming"}
          </button>
          <button onClick={stop} disabled={!running} className="h-8 px-2 text-xs rounded-md border hover:bg-accent/60 disabled:opacity-50">
            Stop
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-4">
        <div className="border rounded-lg p-6 min-h-[60vh] bg-background/50">
          <ResponsiveMarkdown content={markdown} />
        </div>
        <aside className="border rounded-lg p-4 h-full min-h-[60vh] bg-background/30">
          {/* Actions */}
          <div className="flex items-center gap-2 mb-3">
            <button onClick={copyMd} disabled={!markdown} className="h-8 px-3 text-xs rounded-md border hover:bg-accent/60 disabled:opacity-50 bg-background">
              📋 Copy
            </button>
          </div>

          {/* Progress Log */}
          <div className="text-xs font-medium mb-2">Research Progress</div>
          <div className="text-xs space-y-1 max-h-[50vh] overflow-auto">
            {logs.map((l, i) => (
              <div key={i} className={`rounded px-2 py-1 border text-xs ${
                l.type === 'error' ? 'border-red-400 bg-red-50 dark:bg-red-950/30' : 
                l.type === 'tool' ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30' :
                'border-border bg-background/50'
              }`}>
                <span className="font-mono font-medium">{l.type}</span>: {l.message}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
