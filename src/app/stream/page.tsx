"use client";
import { useMemo, useRef, useState } from "react";
import { markdownToHtml } from "@/lib/markdown";

export default function StreamTextPage() {
  const [prompt, setPrompt] = useState(
    "You are a Deep Research Agent. Use web knowledge you already have to outline a prep plan for an initial coding round that is not LeetCode-heavy. Include: TL;DR, bullets, narrative, and a simple DB schema design with indexing tips."
  );
  const [markdown, setMarkdown] = useState("");
  const [running, setRunning] = useState(false);
  const acRef = useRef<AbortController | null>(null);

  const html = useMemo(() => markdownToHtml(markdown), [markdown]);

  async function start() {
    if (running) return;
    setMarkdown("");
    setRunning(true);
    const ac = new AbortController();
    acRef.current = ac;
    try {
      const res = await fetch("/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: ac.signal,
      });
      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // The AI SDK DataStream uses SSE frames separated by \n\n
        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const raw = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          // Parse minimal SSE: event: <type> and data: <json|string>
          let eventType: string | null = null;
          let dataStr = "";
          for (const line of raw.split(/\n/)) {
            if (line.startsWith("event:")) eventType = line.slice(6).trim();
            if (line.startsWith("data:")) dataStr += line.slice(5).trim();
          }
          if (eventType === "text") {
            try {
              const obj = JSON.parse(dataStr);
              // AI SDK variations: { delta }, { text }, { content }, { value }
              const delta = obj?.delta ?? obj?.text ?? obj?.content ?? obj?.value ?? "";
              if (delta) setMarkdown((m) => m + delta);
            } catch {
              if (dataStr) setMarkdown((m) => m + dataStr);
            }
          }
        }
      }
    } catch (e) {
      // ignore aborts
    } finally {
      setRunning(false);
      acRef.current = null;
    }
  }

  function stop() {
    acRef.current?.abort();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 space-y-4">
      <div className="border rounded-md p-3 grid gap-2">
        <label className="text-sm font-medium">Prompt</label>
        <textarea
          className="font-mono text-sm border rounded-md p-2 min-h-24 bg-background"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
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

      <div className="border rounded-md p-3 min-h-[50vh]">
        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}

