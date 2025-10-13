"use client";
import { useState } from "react";

export default function ResearchPage() {
  const [query, setQuery] = useState("Prepare for an initial coding round by focusing on practical coding skills…");
  const [tags, setTags] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/agents/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, tags: tags.split(",").map(t => t.trim()).filter(Boolean) })
      });
      const data = await res.json();
      setResult(data.text || "");
    } catch (e: any) {
      setResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Research Runner</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-3 space-y-3">
          <div>
            <label className="block text-sm mb-1">Query</label>
            <textarea className="textarea min-h-[220px]" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Tags (context)</label>
            <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. concepts,interview" />
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn" onClick={run} disabled={loading}>{loading ? "Running…" : "Run"}</button>
          </div>
        </div>
        <div className="card p-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">Result</h2>
            <span className="muted text-xs">JSON text → markdown</span>
          </div>
          <pre className="whitespace-pre-wrap text-sm">{result || (loading ? "Generating…" : "No output yet.")}</pre>
        </div>
      </div>
    </div>
  );
}

