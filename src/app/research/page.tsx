"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { markdownToHtml } from "@/lib/markdown";
import ResponsiveMarkdown from "@/components/ResponsiveMarkdown";
import { useRouter } from "next/navigation";
import { MessageSquare, Copy, Save, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
  const [fcUrl, setFcUrl] = useState<string>("");
  const [fcStatus, setFcStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const [sources, setSources] = useState<{ url: string; title?: string; text?: string }[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const html = useMemo(() => markdownToHtml(markdown), [markdown]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const r = await fetch('/api/tools/firecrawl/health').then((x) => x.json());
        if (!ignore) setFcStatus(r?.success ? 'online' : 'offline');
      } catch {
        if (!ignore) setFcStatus('offline');
      }
    })();
    return () => { ignore = true; };
  }, []);

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

              // Capture sources from scrapeMany output when available
              const name = obj.name || obj.tool || "";
              const output = obj.output || obj.result || obj.data;
              if (name === 'scrapeMany' && output) {
                try {
                  const out = typeof output === 'string' ? JSON.parse(output) : output;
                  const docs = Array.isArray(out?.docs) ? out.docs : [];
                  if (docs.length) {
                    const mapped = docs.map((d: any) => ({ url: d.url, title: d.title, text: d.text }));
                    setSources(mapped);
                  }
                } catch {}
              }
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

  async function saveAsNote() {
    if (!markdown) return;
    setSaving(true);
    setSaved(false);
    try {
      // Extract a reasonable title
      let title = query.slice(0, 100).trim();
      const titleMatch = markdown.match(/^#\s+(.+)$/m);
      if (titleMatch?.[1]) title = titleMatch[1].slice(0, 100);

      // Create a Note with markdown content
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          contentMd: markdown,
          tags: ['research'],
          category: 'Research',
          sourceType: 'research',
          sourceId: null,
        }),
      }).then((r) => r.json());
      const noteId = res?.data?.id;
      if (!noteId) throw new Error('Failed to create note');

      setSaved(true);
      setLogs((l) => [...l, { type: 'status', message: `saved to note ${noteId}` }]);
      setTimeout(() => router.push(`/notes/${noteId}`), 800);
    } catch (e) {
      setLogs((l) => [...l, { type: 'error', message: 'failed to save note' }]);
    } finally {
      setSaving(false);
    }
  }

  async function firecrawlSearch() {
    try {
      setLogs((l) => [...l, { type: "status", message: "Firecrawl: searching index…" }]);
      const res = await fetch("/api/tools/firecrawl/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      }).then((r) => r.json());
      if (!res?.success) throw new Error(res?.error || "search failed");
      const data = res.data;
      let items: any[] = [];
      if (Array.isArray(data)) items = data;
      else if (Array.isArray(data?.results)) items = data.results;
      const top = items.slice(0, 3).map((x: any) => `- ${x.title || x.name || 'result'} ${x.url ? `(${x.url})` : ''}`).join("\n");
      setLogs((l) => [...l, { type: "tool", message: top || "No results" }]);
    } catch (e: any) {
      setLogs((l) => [...l, { type: "error", message: e?.message || "search error" }]);
    }
  }

  async function firecrawlScrape() {
    if (!fcUrl.trim()) return;
    try {
      setLogs((l) => [...l, { type: "status", message: `Firecrawl: scraping ${fcUrl}` }]);
      const res = await fetch("/api/tools/firecrawl/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fcUrl }),
      }).then((r) => r.json());
      if (!res?.success) throw new Error(res?.error || "scrape failed");
      const json = typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
      setMarkdown((m) => `${m}\n\n## Firecrawl Scrape\nURL: ${fcUrl}\n\n\`\`\`json\n${json.slice(0, 4000)}\n\`\`\``);
      setLogs((l) => [...l, { type: "tool", message: `scraped ${fcUrl}` }]);
    } catch (e: any) {
      setLogs((l) => [...l, { type: "error", message: e?.message || "scrape error" }]);
    }
  }

  async function firecrawlExtract() {
    if (!fcUrl.trim()) return;
    try {
      setLogs((l) => [...l, { type: "status", message: `Firecrawl: extracting ${fcUrl}` }]);
      const res = await fetch("/api/tools/firecrawl/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fcUrl }),
      }).then((r) => r.json());
      if (!res?.success) throw new Error(res?.error || "extract failed");
      const json = typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
      setMarkdown((m) => `${m}\n\n## Firecrawl Extract\nURL: ${fcUrl}\n\n\`\`\`json\n${json.slice(0, 4000)}\n\`\`\``);
      setLogs((l) => [...l, { type: "tool", message: `extracted ${fcUrl}` }]);
    } catch (e: any) {
      setLogs((l) => [...l, { type: "error", message: e?.message || "extract error" }]);
    }
  }

  async function firecrawlCrawlWait() {
    if (!fcUrl.trim()) return;
    try {
      setLogs((l) => [...l, { type: "status", message: `Firecrawl: crawl+wait ${fcUrl}` }]);
      const res = await fetch("/api/tools/firecrawl/crawl/wait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fcUrl, pollMs: 1500, maxRetries: 60 }),
      }).then((r) => r.json());
      if (!res?.success) throw new Error(res?.error || "crawl failed");
      const json = typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
      setMarkdown((m) => `${m}\n\n## Firecrawl Crawl (completed)\nURL: ${fcUrl}\n\n\`\`\`json\n${json.slice(0, 4000)}\n\`\`\``);
      setLogs((l) => [...l, { type: "tool", message: `crawled ${fcUrl}` }]);
    } catch (e: any) {
      setLogs((l) => [...l, { type: "error", message: e?.message || "crawl error" }]);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">Deep Research</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          AI-powered research with live streaming results
        </p>
      </div>

      {/* Query Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Research Query</CardTitle>
          <CardDescription>Enter your research question or topic</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            className="font-mono min-h-32"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your research question..."
          />
          <div className="flex flex-col sm:flex-row items-center gap-2 mt-4">
            <Button
              onClick={start}
              disabled={running}
              variant="primary"
              className="flex-1 sm:flex-initial"
            >
              {running ? (
                <>
                  <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin mr-2" />
                  Researching...
                </>
              ) : (
                <>
                  <SearchIcon className="w-4 h-4 mr-2" />
                  Start Research
                </>
              )}
            </Button>
            <Button
              onClick={stop}
              disabled={!running}
              variant="secondary"
            >
              Stop
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results & Sidebar */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Results */}
        <Card className="min-h-[60vh]">
          <CardContent className="pt-6">
            {markdown ? (
              <ResponsiveMarkdown content={markdown} />
            ) : (
              <div className="flex items-center justify-center h-[50vh] text-neutral-500 dark:text-neutral-400">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Research results will appear here</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={copyMd}
                disabled={!markdown}
                variant="secondary"
                size="sm"
                className="w-full justify-start"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Markdown
              </Button>
              <Button
                onClick={saveAsNote}
                disabled={!markdown || saving || saved}
                variant="primary"
                size="sm"
                className="w-full justify-start"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save as Note'}
              </Button>
            </CardContent>
          </Card>

          {/* Sources (from scrapeMany) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[30vh] overflow-auto">
              {sources.length === 0 ? (
                <p className="text-xs text-neutral-500">No sources captured yet</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {sources.map((s, i) => (
                    <li key={s.url + i} className="truncate">
                      <span className="text-xs text-neutral-500 mr-1">[{i + 1}]</span>
                      <a href={s.url} target="_blank" rel="noreferrer" className="underline">
                        {s.title || s.url}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Firecrawl */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Firecrawl</CardTitle>
                <Badge variant={fcStatus === 'online' ? 'success' : fcStatus === 'offline' ? 'error' : 'default'}>
                  {fcStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-xs mb-1 text-neutral-600 dark:text-neutral-400">Target URL</label>
                <Input
                  value={fcUrl}
                  onChange={(e) => setFcUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  className="h-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={firecrawlScrape} disabled={!fcUrl} variant="secondary" size="sm">
                  Scrape
                </Button>
                <Button onClick={firecrawlExtract} disabled={!fcUrl} variant="secondary" size="sm">
                  Extract
                </Button>
                <Button onClick={firecrawlCrawlWait} disabled={!fcUrl} variant="secondary" size="sm">
                  Crawl
                </Button>
                <Button onClick={firecrawlSearch} disabled={!query.trim()} variant="primary" size="sm">
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress Log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Research Progress</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[40vh] overflow-auto">
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center py-4">
                    No activity yet
                  </p>
                ) : (
                  logs.map((l, i) => (
                    <div
                      key={i}
                      className={`rounded-lg px-3 py-2 border text-xs ${
                        l.type === 'error'
                          ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200'
                          : l.type === 'tool'
                          ? 'border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/30 text-neutral-900 dark:text-neutral-100'
                      }`}
                    >
                      <span className="font-mono font-semibold">{l.type}</span>: {l.message}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
