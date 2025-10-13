"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import TypewriterMarkdown from "@/components/TypewriterMarkdown";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_PROMPT =
  "Map the 3 most urgent subtopics I should cover in an onboarding brief about multimodal AI agents for product leaders.";

type StreamStatus = "idle" | "streaming" | "completed" | "error";

export default function ResearchStreamPage() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const examples = useMemo(
    () => [
      "Outline a due diligence memo on frontier AI governance with citations.",
      "Summarize the 5 latest breakthroughs in small language models with a TL;DR.",
      "Draft a competitive brief comparing ReAct vs Graph-based research agents.",
    ],
    []
  );

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [output]);

  const appendText = useCallback((text: string | undefined | null) => {
    if (!text) return;
    setOutput((prev) => prev + text);
  }, []);

  const handleSseEvent = useCallback(
    (eventName: string, data: string) => {
      if (eventName === "error") {
        setError(data || "Streaming error");
        setStatus("error");
        return;
      }

      if (!data || data === "[DONE]") {
        return;
      }

      let payload: unknown = data;
      try {
        payload = JSON.parse(data);
      } catch (error_) {
        payload = data;
      }

      if (typeof payload === "string") {
        appendText(payload);
        return;
      }

      if (typeof payload !== "object" || payload === null) {
        return;
      }

      const typed = payload as Record<string, any>;
      const type = typed.type as string | undefined;

      if (type === "text" || type === "response.message" || type === "message") {
        appendText((typed.text as string) ?? extractContentFromMessage(typed));
        return;
      }

      if (type === "text-delta" || type === "response.delta" || type === "delta") {
        appendText(
          (typed.text as string) ?? (typed.textDelta as string) ?? (typed.delta as string) ?? extractContentFromMessage(typed)
        );
        return;
      }

      if (type === "response.completed" || type === "completion") {
        setStatus("completed");
        return;
      }

      if (type === "response.error") {
        setError((typed.error?.message as string) ?? "Streaming error");
        setStatus("error");
        return;
      }

      appendText(
        (typed.text as string) ??
          (typed.content as string) ??
          (typed.output_text as string) ??
          extractContentFromMessage(typed)
      );
    },
    [appendText]
  );

  const runStream = useCallback(async () => {
    if (status === "streaming") {
      controllerRef.current?.abort();
      return;
    }

    setStatus("streaming");
    setOutput("");
    setError(null);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await fetch("/api/research/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Request failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body to stream.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const rawEvent = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 2);

          if (rawEvent) {
            let eventName = "message";
            const dataLines: string[] = [];

            for (const line of rawEvent.split("\n")) {
              if (line.startsWith("event:")) {
                eventName = line.slice(6).trim();
              } else if (line.startsWith("data:")) {
                dataLines.push(line.slice(5).trim());
              }
            }

            handleSseEvent(eventName, dataLines.join("\n"));
          }

          boundary = buffer.indexOf("\n\n");
        }
      }

      const remaining = buffer.trim();
      if (remaining) {
        let eventName = "message";
        const dataLines: string[] = [];

        for (const line of remaining.split("\n")) {
          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trim());
          }
        }

        if (dataLines.length) {
          handleSseEvent(eventName, dataLines.join("\n"));
        }
      }

      setStatus((current) => (current === "streaming" ? "completed" : current));
    } catch (error_) {
      if ((error_ as Error).name === "AbortError") {
        setStatus("idle");
        return;
      }

      setError((error_ as Error).message || "Unable to stream response.");
      setStatus("error");
    } finally {
      controllerRef.current = null;
    }
  }, [handleSseEvent, prompt, status]);

  const statusLabel = useMemo(() => {
    if (status === "streaming") return "Streaming";
    if (status === "completed") return "Completed";
    if (status === "error") return "Error";
    return "Idle";
  }, [status]);

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 110, damping: 18 }}
        className="space-y-8"
      >
        <Card className="border border-foreground/10 bg-background/90 shadow-typewriter">
          <CardHeader className="gap-4">
            <CardTitle className="text-2xl uppercase tracking-[0.35em] text-foreground">
              Streamed Research Console
            </CardTitle>
            <CardDescription className="max-w-2xl text-muted-foreground">
              Compose a focused brief request and watch the markdown narrative stream in real time. Responses keep the monochrome
              aesthetic and stay citation-ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <motion.div layout className="flex flex-col gap-4">
                <label className="text-xs uppercase tracking-[0.35em] text-foreground/70">Prompt</label>
                <Textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  className="min-h-40 border-foreground/20 bg-background/60 text-sm leading-relaxed"
                  placeholder="Describe the research briefing you need..."
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <motion.span
                    key={statusLabel}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs uppercase tracking-[0.35em] text-foreground/60"
                  >
                    {statusLabel}
                  </motion.span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={runStream}
                      variant={status === "streaming" ? "destructive" : "default"}
                      className="rounded-full px-6"
                    >
                      {status === "streaming" ? "Stop" : "Stream Brief"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        controllerRef.current?.abort();
                        setPrompt(DEFAULT_PROMPT);
                        setOutput("");
                        setError(null);
                        setStatus("idle");
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </motion.div>
              <motion.div layout className="flex flex-col gap-3 rounded-xl border border-dashed border-foreground/15 bg-background/60 p-4">
                <span className="text-xs uppercase tracking-[0.35em] text-foreground/60">Templates</span>
                <div className="flex flex-wrap gap-2">
                  {examples.map((example) => (
                    <Button
                      key={example}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full border-foreground/20 bg-transparent text-foreground/80 hover:bg-foreground/5"
                      onClick={() => setPrompt(example)}
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </motion.div>
            </div>
            {error ? (
              <motion.p
                role="alert"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </motion.p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border border-foreground/10 bg-background/95 shadow-typewriter">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-xl uppercase tracking-[0.35em] text-foreground">Live Markdown Feed</CardTitle>
            <CardDescription className="text-xs uppercase tracking-[0.35em] text-foreground/60">
              {status === "streaming" ? "Rendering in progress" : "Ready"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div
              layout
              ref={scrollRef}
              className="max-h-[70vh] overflow-y-auto rounded-xl border border-foreground/10 bg-background/70 p-6"
            >
              {output ? (
                <TypewriterMarkdown content={output} />
              ) : (
                <motion.p
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: 0.9 }}
                  className="text-sm uppercase tracking-[0.3em] text-foreground/40"
                >
                  {status === "streaming" ? "Awaiting first tokens" : "Your streamed brief will appear here"}
                </motion.p>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}

function extractContentFromMessage(payload: Record<string, any>) {
  const content = payload?.message?.content ?? payload?.data?.content ?? payload?.content;
  if (!content) {
    return "";
  }

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((entry) => {
        if (!entry) return "";
        if (typeof entry === "string") return entry;
        if (typeof entry.text === "string") return entry.text;
        if (typeof entry.delta === "string") return entry.delta;
        if (typeof entry.content === "string") return entry.content;
        return "";
      })
      .join("");
  }

  if (typeof content === "object" && content !== null) {
    if (typeof (content as Record<string, any>).text === "string") {
      return (content as Record<string, any>).text as string;
    }
    if (typeof (content as Record<string, any>).value === "string") {
      return (content as Record<string, any>).value as string;
    }
  }

  return "";
}

