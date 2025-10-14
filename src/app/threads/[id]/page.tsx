"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TiptapEditor from "@/components/TiptapEditor";
import { docToMarkdown } from "@/lib/docToMarkdown";

type Run = { id: string; title?: string | null; createdAt: string; updatedAt: string };
export default function ThreadDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [threadTitle, setThreadTitle] = useState<string>("");
  const [runs, setRuns] = useState<Run[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");
  const [doc, setDoc] = useState<any>(null);
  const [streaming, setStreaming] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  async function load() {
    const r = await fetch(`/api/threads/${params.id}`).then((x) => x.json());
    setThreadTitle(r?.data?.title || "");
    setRuns(r?.data?.runs || []);
  }
  useEffect(() => { load(); }, [params.id]);

  async function loadRun(id: string) {
    const r = await fetch(`/api/runs/${id}`).then((x) => x.json());
    setSelected(id);
    setDoc(r?.data?.contentDoc || { type: "doc", content: [{ type: "paragraph" }] });
  }

  async function saveRun() {
    if (!doc) return;
    const md = docToMarkdown(doc);
    if (selected) {
      await fetch(`/api/runs/${selected}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentDoc: doc, contentMd: md }),
      });
    } else {
      const r = await fetch(`/api/threads/${params.id}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentDoc: doc, contentMd: md }),
      }).then((x) => x.json());
      setSelected(r?.data?.id);
    }
    await load();
  }

  async function delRun() {
    if (!selected) return;
    await fetch(`/api/runs/${selected}`, { method: "DELETE" });
    setSelected(null);
    setDoc({ type: "doc", content: [{ type: "paragraph" }] });
    await load();
  }

  async function startStream() {
    if (!query.trim()) return;
    setStreaming(true);
    setDoc({ type: "doc", content: [{ type: "paragraph" }] });
    setLog(["started"]);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/agents/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: ac.signal,
      });
      if (!res.body) throw new Error("No stream body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let markdown = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const raw = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const lines = raw.split(/\n/);
          let type = "message";
          let data = "";
          for (const line of lines) {
            if (line.startsWith("event:")) type = line.slice(6).trim();
            if (line.startsWith("data:")) data += line.slice(5).trim();
          }
          if (type === "text" && data) {
            try {
              const obj = JSON.parse(data);
              if (obj.delta) {
                markdown += obj.delta;
              }
            } catch {
              markdown += data;
            }
          }
          if (type === "status" && data) setLog((l) => l.concat([data]));
          if (type === "error" && data) setLog((l) => l.concat([data]));
        }
      }
      // After stream ends, store as a new run
      const docAfter = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: markdown }] }] };
      setDoc(docAfter);
      const created = await fetch(`/api/threads/${params.id}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentMd: markdown, contentDoc: docAfter }),
      }).then((x) => x.json());
      setSelected(created?.data?.id || null);
      await load();
    } catch (e) {
      setLog((l) => l.concat([String(e)]));
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stopStream() { abortRef.current?.abort(); }

  return (
    <div className="grid gap-4 md:grid-cols-[260px_1fr] px-4 py-4">
      <aside className="border rounded-md p-3 space-y-3">
        <div className="text-sm font-medium">{threadTitle}</div>
        <button onClick={() => router.push("/threads")} className="h-8 px-2 text-xs border rounded">← All Threads</button>
        <div className="text-xs font-medium mt-2">Runs</div>
        <div className="max-h-[50vh] overflow-auto space-y-1">
          {runs.map((r) => (
            <button key={r.id} onClick={() => loadRun(r.id)} className={`block w-full text-left p-2 rounded border ${selected === r.id ? 'bg-accent' : 'hover:bg-accent/60'}`}>
              {r.title || r.id.slice(0, 8)}
              <div className="text-[10px] text-muted-foreground">{new Date(r.updatedAt).toLocaleString()}</div>
            </button>
          ))}
          {runs.length === 0 && (
            <div className="text-xs text-muted-foreground">No runs yet.</div>
          )}
        </div>
      </aside>

      <section className="space-y-3 min-w-0">
        <div className="border rounded-md p-3 flex items-center gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Research query…" className="flex-1 h-9 border rounded px-2 bg-background" />
          <button onClick={startStream} disabled={streaming || !query.trim()} className="h-9 px-3 border rounded disabled:opacity-50">{streaming ? 'Streaming…' : 'New Run'}</button>
          <button onClick={stopStream} disabled={!streaming} className="h-9 px-3 border rounded disabled:opacity-50">Stop</button>
          <button onClick={saveRun} disabled={!doc} className="h-9 px-3 border rounded">Save</button>
          <button onClick={delRun} disabled={!selected} className="h-9 px-3 border rounded">Delete</button>
        </div>

        <div className="border rounded-md p-2">
          <TiptapEditor value={doc} onChange={setDoc} placeholder="Write or edit the run…" />
        </div>
        <div className="border rounded-md p-2 text-xs max-h-40 overflow-auto">
          <div className="font-medium mb-1">Stream Log</div>
          {log.map((l, i) => (
            <div key={i} className="border-b border-dashed border-border/70 py-1">{l}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
