"use client";
import { useEffect, useMemo, useState } from "react";
import KbTree from "@/components/KbTree";
import MarkdownEditor from "@/components/MarkdownEditor";
import { markdownToHtml, extractTOC, extractSources } from "@/lib/markdown";

type Hit = { path: string; score: number; snippet: string };

export default function KnowledgeBasePage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState<string>("\n# Welcome to ALF KB\n\nThis is a minimal, black & white knowledge base.\n\n- Create folders and notes under `content/`\n- Use the AI Edit box to improve drafts\n- Switch views: Reader / Editor / Outline / Sources\n");
  const [dirty, setDirty] = useState(false);
  const [view, setView] = useState<"reader" | "editor" | "outline" | "sources">("editor");
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);

  useEffect(() => {
    // pick a first file if any
    fetch("/api/kb/tree").then(async (r) => {
      const t = await r.json();
      const first = findFirstFile(t);
      if (first) load(first);
    });
  }, []);

  async function load(p: string) {
    const res = await fetch(`/api/kb/doc?path=${encodeURIComponent(p)}`).then((r) => r.json());
    setSelected(p);
    setText(res.text ?? "");
    setDirty(false);
  }

  async function save() {
    if (!selected) return;
    await fetch("/api/kb/doc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: selected, text }),
    });
    setDirty(false);
  }

  async function newNote() {
    const name = prompt("New note name (e.g. notes/idea.md)", "notes/untitled.md");
    if (!name) return;
    await fetch("/api/kb/doc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: name, text: "# New Note\n\n" }),
    });
    await load(name);
  }

  async function del() {
    if (!selected) return;
    if (!confirm(`Delete ${selected}?`)) return;
    await fetch(`/api/kb/doc?path=${encodeURIComponent(selected)}`, { method: "DELETE" });
    setSelected(null);
  }

  async function runSearch() {
    const res = await fetch("/api/kb/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q }),
    }).then((r) => r.json());
    setHits(res.hits ?? []);
  }

  const toc = useMemo(() => extractTOC(text), [text]);
  const sources = useMemo(() => extractSources(text), [text]);
  const readerHtml = useMemo(() => markdownToHtml(text), [text]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 grid grid-cols-[260px_1fr] gap-4">
      <aside className="border rounded-md p-2 h-[80vh] overflow-auto">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={newNote} className="h-8 px-2 text-xs rounded-md border hover:bg-accent/60">
            + New Note
          </button>
          <button onClick={del} disabled={!selected} className="h-8 px-2 text-xs rounded-md border hover:bg-accent/60 disabled:opacity-50">
            Delete
          </button>
        </div>
        <KbTree selected={selected} onSelect={load} />
        <div className="mt-3 border-t pt-2">
          <div className="text-xs font-medium mb-1">Search</div>
          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="query"
              className="h-8 px-2 text-xs rounded-md border bg-background w-full"
            />
            <button onClick={runSearch} className="h-8 px-2 text-xs rounded-md border hover:bg-accent/60">
              Go
            </button>
          </div>
          <div className="mt-2 space-y-1 max-h-40 overflow-auto">
            {hits.map((h) => (
              <div key={h.path} className="text-xs p-1 rounded hover:bg-accent/60 cursor-pointer" onClick={() => load(h.path)}>
                <div className="font-mono">{h.path}</div>
                <div className="text-muted-foreground truncate">{h.snippet}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className="min-w-0">
        <div className="flex items-center gap-2 mb-2">
          {(["editor", "reader", "outline", "sources"] as const).map((v) => (
            <button
              key={v}
              className={`h-8 px-2 text-xs rounded-md border ${view === v ? "bg-accent" : "hover:bg-accent/60"}`}
              onClick={() => setView(v)}
            >
              {v}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={save}
              disabled={!dirty}
              className="h-8 px-2 text-xs rounded-md border hover:bg-accent/60 disabled:opacity-50"
            >
              Save
            </button>
            <span className="text-xs text-muted-foreground">{selected}</span>
          </div>
        </div>

        {view === "editor" && (
          <MarkdownEditor
            value={text}
            onChange={(v) => {
              setText(v);
              setDirty(true);
            }}
          />
        )}
        {view === "reader" && (
          <div className="prose prose-sm max-w-none border rounded-md p-3 h-[80vh] overflow-auto" dangerouslySetInnerHTML={{ __html: readerHtml }} />
        )}
        {view === "outline" && (
          <div className="border rounded-md p-3 h-[80vh] overflow-auto text-sm">
            {toc.length === 0 && <div className="text-muted-foreground">No headings found.</div>}
            {toc.map((h, i) => (
              <div key={i} style={{ paddingLeft: (h.level - 1) * 12 }} className="leading-7">
                <span className="text-muted-foreground">{"#".repeat(h.level)} </span>
                {h.text}
              </div>
            ))}
          </div>
        )}
        {view === "sources" && (
          <div className="border rounded-md p-3 h-[80vh] overflow-auto text-sm">
            {sources.length === 0 && <div className="text-muted-foreground">No links found.</div>}
            <ul className="list-disc pl-6">
              {sources.map((s) => (
                <li key={s.url} className="my-1">
                  <a href={s.url} target="_blank" rel="noreferrer" className="underline">
                    {s.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function findFirstFile(node: any): string | null {
  if (!node) return null;
  if (node.type === "file") return node.path;
  for (const c of node.children || []) {
    const f = findFirstFile(c);
    if (f) return f;
  }
  return null;
}
