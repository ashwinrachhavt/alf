"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ResponsiveMarkdown from "@/components/ResponsiveMarkdown";
import { MessageSquare, Copy, Save } from "lucide-react";

type Note = {
  id: string;
  title: string;
  icon?: string | null;
  contentMd?: string | null;
  tags?: string[];
  category?: string | null;
  isFavorite?: boolean;
  isArchived?: boolean;
};

export default function NoteEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const noteId = (params?.id as string) || "";

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");

  // Embedded Research state
  const [query, setQuery] = useState("");
  const [researchMd, setResearchMd] = useState("");
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<{ type: string; message: string }[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!noteId) return;
    (async () => {
      try {
        const res = await fetch(`/api/notes/${noteId}`).then((r) => r.json());
        const n = res?.data;
        if (n) {
          setNote(n);
          setTitle(n.title || "Untitled Note");
          setMarkdown(n.contentMd || "");
        }
      } catch {}
    })();
  }, [noteId]);

  async function save() {
    if (!noteId) return;
    setSaving(true);
    setStatus("");
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, contentMd: markdown }),
      }).then((r) => r.json());
      if (res?.success) {
        setStatus("Saved");
        setTimeout(() => setStatus(""), 1200);
      } else {
        setStatus("Failed to save");
      }
    } finally {
      setSaving(false);
    }
  }

  function backToList() {
    router.push("/notes");
  }

  const preview = useMemo(() => markdown, [markdown]);

  // Embedded Research: start/stop streaming
  async function startResearch() {
    if (!query.trim() || running) return;
    setResearchMd("");
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
              if (delta) setResearchMd((m) => m + delta);
            } catch {
              setResearchMd((m) => m + data);
            }
          }
          if (type === "error" && data) {
            try {
              const obj = JSON.parse(data);
              setLogs((l) => [...l, { type: "error", message: obj.message ?? "error" }]);
            } catch {
              setLogs((l) => [...l, { type: "error", message: data }]);
            }
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

  function stopResearch() {
    abortRef.current?.abort();
  }

  function insertResearchAtEnd() {
    if (!researchMd) return;
    setMarkdown((m) => (m ? `${m}\n\n${researchMd}` : researchMd));
  }

  function copyResearch() {
    if (!researchMd) return;
    navigator.clipboard.writeText(researchMd);
  }

  if (!note) {
    return <div className="mx-auto max-w-6xl px-4 py-8 text-neutral-500">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={backToList} className="text-sm underline">All Notes</button>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl md:text-2xl font-semibold bg-transparent outline-none border-b border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 px-1"
            placeholder="Untitled Note"
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded-md bg-black dark:bg-white text-white dark:text-black disabled:opacity-50"
        >
          {saving ? "Saving…" : status || "Save"}
        </button>
      </div>

      {/* Editor + Research */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Editor */}
        <div className="space-y-3">
          <div className="border rounded-lg p-3 bg-white dark:bg-neutral-900">
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="w-full h-[70vh] font-mono text-sm outline-none"
              placeholder="Write markdown…"
            />
          </div>
          <div className="border rounded-lg p-3 bg-white dark:bg-neutral-900 overflow-auto">
            <ResponsiveMarkdown content={preview} />
          </div>
        </div>

        {/* Research Sidebar */}
        <aside className="space-y-4">
          <div className="border rounded-lg p-4 bg-white dark:bg-neutral-900">
            <div className="text-sm font-semibold mb-2">Deep Research</div>
            <textarea
              className="w-full h-24 font-mono text-sm border rounded p-2 bg-transparent"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you want to research?"
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={startResearch}
                disabled={running || !query.trim()}
                className="flex-1 px-3 py-1.5 rounded bg-black dark:bg-white text-white dark:text-black disabled:opacity-50"
              >
                {running ? "Researching…" : (<>Start</>)}
              </button>
              <button
                onClick={stopResearch}
                disabled={!running}
                className="px-3 py-1.5 rounded border"
              >
                Stop
              </button>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-white dark:bg-neutral-900">
            <div className="text-sm font-semibold mb-2">Live Output</div>
            <div className="h-56 overflow-auto border rounded p-2 bg-neutral-50 dark:bg-neutral-950">
              {researchMd ? (
                <ResponsiveMarkdown content={researchMd} />
              ) : (
                <div className="flex items-center justify-center h-full text-neutral-500">
                  <div className="text-center text-xs">
                    <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    Start a research to see results here
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button onClick={copyResearch} disabled={!researchMd} className="px-3 py-1.5 rounded border text-sm">
                <Copy className="w-4 h-4 inline-block mr-1" /> Copy
              </button>
              <button onClick={insertResearchAtEnd} disabled={!researchMd} className="px-3 py-1.5 rounded bg-black dark:bg-white text-white dark:text-black text-sm">
                <Save className="w-4 h-4 inline-block mr-1" /> Insert into Note
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

