"use client";

import { useMemo, useState } from "react";
import { markdownToHtml } from "@/lib/markdown";
import ResponsiveMarkdown from "@/components/ResponsiveMarkdown";
import { useRouter } from "next/navigation";
import { MessageSquare, Copy, Save, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

export default function ResearchStreamPage() {
  const router = useRouter();
  const [query, setQuery] = useState(
    "Do a deep research on the company Maxima AI, I had a recruiter screen with them and going to have an initial coding round where they're going to check problem solving (not LeetCode, but practical coding). Help me prepare: propose practice questions with solved examples. Finally, include a simple DB schema design with indexing."
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fcUrl, setFcUrl] = useState<string>("");
  const [fcStatus, setFcStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');

  const { messages, sendMessage, stop, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/research/ai",
    }),
  });
  const isLoading = status === 'submitted' || status === 'streaming';
  const [input, setInput] = useState("");

  const lastMessage = messages[messages.length - 1];
  const markdown = lastMessage?.role === 'assistant'
    ? lastMessage.parts.filter(p => p.type === 'text').map((p: any) => p.text).join('\n')
    : '';

  const html = useMemo(() => markdownToHtml(markdown), [markdown]);

  function copyMd() {
    navigator.clipboard.writeText(markdown);
  }

  async function saveAsNote() {
    if (!markdown) return;
    setSaving(true);
    setSaved(false);
    try {
      let title = query.slice(0, 100).trim();
      const titleMatch = markdown.match(/^#\s+(.+)$/m);
      if (titleMatch?.[1]) title = titleMatch[1].slice(0, 100);

      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          contentMd: markdown,
          tags: ['research'],
          category: 'Research',
        }),
      }).then((r) => r.json());
      const noteId = res?.data?.id;
      if (!noteId) throw new Error('Failed to create note');

      setSaved(true);
      setTimeout(() => router.push(`/notes/${noteId}` as any), 800);
    } catch (e) {
      // log error
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">Deep Research</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          AI-powered research with live streaming results
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Research Query</CardTitle>
          <CardDescription>Enter your research question or topic</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            className="font-mono min-h-32"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your research question..."
          />
          <div className="flex flex-col sm:flex-row items-center gap-2 mt-4">
            <Button
              onClick={() => sendMessage({ text: input })}
              disabled={isLoading}
              variant="primary"
              className="flex-1 sm:flex-initial"
            >
              {isLoading ? (
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
              disabled={!isLoading}
              variant="secondary"
            >
              Stop
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
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

        <aside className="space-y-4">
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

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Research Progress</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[80vh] overflow-auto">
              <div className="space-y-2">
                {messages.map((m, i) => (
                  <div key={i}>
                    {m.role === 'assistant' && (
                      <div className="space-y-2">
                        {m.parts.filter(p => p.type.startsWith('tool-')).map((part: any, j) => (
                          <div
                            key={j}
                            className="rounded-lg px-3 py-2 border text-xs border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200"
                          >
                            <span className="font-mono font-semibold">{part.type}</span>
                            <div className="text-xs mt-1 opacity-75">
                              {part.state === 'input-streaming' && 'Streaming input...'}
                              {part.state === 'input-available' && 'Executing...'}
                              {part.state === 'output-available' && 'Completed'}
                              {part.state === 'output-error' && `Error: ${part.errorText}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
