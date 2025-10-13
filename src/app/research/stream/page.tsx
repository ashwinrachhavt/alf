"use client";
import { useState } from "react";

export default function ResearchStreamPage() {
  const [prompt, setPrompt] = useState("Prepare for an initial coding round by focusing on practical coding skills…");
  const [streaming, setStreaming] = useState(false);
  const [output, setOutput] = useState("");

  async function run() {
    setStreaming(true);
    setOutput("");
    try {
      const res = await fetch("/api/research/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.body) throw new Error("No stream body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setOutput((prev) => prev + chunk);
      }
    } catch (e: any) {
      setOutput(`Error: ${e.message}`);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Research (Streaming)</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-3 space-y-3">
          <div>
            <label className="block text-sm mb-1">Prompt</label>
            <textarea className="textarea min-h-[220px]" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn" onClick={run} disabled={streaming}>{streaming ? "Streaming…" : "Run"}</button>
          </div>
        </div>
        <div className="card p-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">Output</h2>
            <span className="muted text-xs">live</span>
          </div>
          <pre className="whitespace-pre-wrap text-sm">{output || (streaming ? "Starting…" : "No output yet.")}</pre>
        </div>
      </div>
    </div>
  );
}

