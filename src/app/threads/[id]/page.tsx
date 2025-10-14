"use client";

import { useEffect, useMemo, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Play, Square } from "lucide-react";
import TiptapEditor from "@/components/TiptapEditor";
import { docToMarkdown } from "@/lib/docToMarkdown";
import { JSONContent } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/* ------------------------------------------------------------------ */
/* types                                                              */
/* ------------------------------------------------------------------ */
type Run = {
  id: string;
  title?: string | null;
  createdAt: string;
  updatedAt: string;
};

/* ------------------------------------------------------------------ */
/* component                                                          */
/* ------------------------------------------------------------------ */
export default function ThreadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  /* -------------- local state ------------------------------------- */
  const [threadTitle, setThreadTitle] = useState("");
  const [runs, setRuns] = useState<Run[]>([]);

  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [doc, setDoc] = useState<JSONContent>({
    type: "doc",
    content: [{ type: "paragraph" }],
  });

  const [query, setQuery] = useState("");
  const [log, setLog] = useState<string[]>([]);

  /* streaming */
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  /* -------------- data fetching ----------------------------------- */
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/threads/${id}`)
      .then((r) => r.json())
      .then((r) => {
        if (cancelled) return;
        setThreadTitle(r?.data?.title ?? "");
        setRuns(r?.data?.runs ?? []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [id]);

  /* load a single run into the editor */
  useEffect(() => {
    if (!selectedRunId) return;
    let cancelled = false;
    fetch(`/api/runs/${selectedRunId}`)
      .then((r) => r.json())
      .then((r) => {
        if (cancelled) return;
        setDoc(r?.data?.contentDoc ?? { type: "doc", content: [{ type: "paragraph" }] });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [selectedRunId]);

  /* -------------- actions ----------------------------------------- */
  const saveRun = async () => {
    if (!doc) return;
    const md = docToMarkdown(doc);
    const payload = { contentDoc: doc, contentMd: md };

    if (selectedRunId) {
      await fetch(`/api/runs/${selectedRunId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      const r = await fetch(`/api/threads/${id}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((x) => x.json());
      setSelectedRunId(r?.data?.id ?? null);
    }
    /* refresh list */
    fetch(`/api/threads/${id}`)
      .then((r) => r.json())
      .then((r) => setRuns(r?.data?.runs ?? []));
  };

  const deleteRun = async () => {
    if (!selectedRunId) return;
    await fetch(`/api/runs/${selectedRunId}`, { method: "DELETE" });
    setSelectedRunId(null);
    setDoc({ type: "doc", content: [{ type: "paragraph" }] });
    fetch(`/api/threads/${id}`)
      .then((r) => r.json())
      .then((r) => setRuns(r?.data?.runs ?? []));
  };

  /* -------------- streaming --------------------------------------- */
  const startStream = async () => {
    if (!query.trim() || isStreaming) return;
    setIsStreaming(true);
    setLog(["started"]);
    abortRef.current = new AbortController();

    /* empty editor while streaming */
    setDoc({ type: "doc", content: [{ type: "paragraph" }] });

    try {
      const res = await fetch("/api/agents/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: abortRef.current.signal,
      });
      if (!res.body) throw new Error("No stream body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullMarkdown = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
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
              if (obj.delta) fullMarkdown += obj.delta;
            } catch {
              fullMarkdown += data;
            }
            /* live-update editor */
            setDoc({
              type: "doc",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: fullMarkdown }],
                },
              ],
            });
          }
          if (type === "status" && data) setLog((l) => [...l, data]);
          if (type === "error" && data) setLog((l) => [...l, data]);
        }
      }

      /* stream finished – create a run */
      const finalDoc = {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: fullMarkdown }] }],
      };
      setDoc(finalDoc);

      const created = await fetch(`/api/threads/${id}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentMd: fullMarkdown, contentDoc: finalDoc }),
      }).then((x) => x.json());

      setSelectedRunId(created?.data?.id ?? null);
      fetch(`/api/threads/${id}`)
        .then((r) => r.json())
        .then((r) => setRuns(r?.data?.runs ?? []));
    } catch (e: any) {
      setLog((l) => [...l, String(e)]);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const stopStream = () => abortRef.current?.abort();

  /* -------------- render ------------------------------------------ */
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* ---------- left sidebar ---------- */}
        <aside className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/threads")}
                className="w-full justify-start -ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                All Threads
              </Button>
              <Separator className="my-3" />
              <CardTitle className="text-base">{threadTitle || "Untitled Thread"}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Runs</h3>
                <Badge variant="outline" className="text-xs">{runs.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-[60vh] overflow-auto space-y-2">
                {runs.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRunId(r.id)}
                    className={`block w-full text-left p-3 rounded-lg border transition-all ${
                      selectedRunId === r.id
                        ? "border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-800"
                        : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    }`}
                  >
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1 truncate">
                      {r.title || r.id.slice(0, 8)}
                    </div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">
                      {new Date(r.updatedAt).toLocaleString()}
                    </div>
                  </button>
                ))}
                {runs.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">No runs yet</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                      Create your first run
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* ---------- main area ---------- */}
        <section className="space-y-4 min-w-0">
          {/* controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter research query..."
                  className="flex-1"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={startStream}
                    disabled={isStreaming || !query.trim()}
                    variant="primary"
                    className="flex-1 sm:flex-initial"
                  >
                    {isStreaming ? (
                      <>
                        <Square className="w-4 h-4 mr-2" />
                        Streaming...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        New Run
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={stopStream}
                    disabled={!isStreaming}
                    variant="secondary"
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={saveRun}
                  disabled={!doc}
                  variant="secondary"
                  size="sm"
                  className="flex-1 sm:flex-initial"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button
                  onClick={deleteRun}
                  disabled={!selectedRunId}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* editor */}
          <Card>
            <CardContent className="pt-6">
              <TiptapEditor
                value={doc}
                onChange={setDoc}
                placeholder="Write or edit the run content..."
              />
            </CardContent>
          </Card>

          {/* log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Stream Log</CardTitle>
            </CardHeader>
            <CardContent className="max-h-48 overflow-auto">
              <div className="space-y-2">
                {log.map((l, i) => (
                  <div
                    key={i}
                    className="text-xs font-mono p-2 rounded-md bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  >
                    {l}
                  </div>
                ))}
                {log.length === 0 && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center py-4">
                    No log entries yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}