"use client";
import { useEffect, useMemo, useState } from "react";
import { markdownToHtml } from "@/lib/markdown";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function MarkdownEditor({ value, onChange }: Props) {
  const [mode, setMode] = useState<"editor" | "preview" | "split">("split");
  const [busy, setBusy] = useState(false);
  const [instruction, setInstruction] = useState("");
  const html = useMemo(() => markdownToHtml(value), [value]);

  async function runEdit() {
    if (!value) return;
    setBusy(true);
    try {
      const res = await fetch("/api/ai/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: value, instruction }),
      }).then((r) => r.json());
      if (res.markdown) onChange(res.markdown);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-md border border-border overflow-hidden">
          {(["editor", "split", "preview"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2 h-8 text-xs font-medium ${mode === m ? "bg-accent" : "hover:bg-accent/60"}`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <input
            placeholder="AI: e.g. tighten, summarize, extract sources"
            className="h-8 px-2 text-xs rounded-md border bg-background w-72"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
          />
          <button
            onClick={runEdit}
            disabled={busy}
            className="h-8 px-2 text-xs rounded-md border hover:bg-accent/60 disabled:opacity-50"
          >
            {busy ? "Editing…" : "Run AI Edit"}
          </button>
        </div>
      </div>

      {mode === "editor" && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-sm border rounded-md p-2 h-[70vh] w-full bg-background"
          spellCheck={false}
        />
      )}
      {mode === "preview" && (
        <div
          className="prose prose-sm max-w-none h-[70vh] overflow-auto pr-2"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
      {mode === "split" && (
        <div className="grid grid-cols-2 gap-2 h-[70vh]">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="font-mono text-sm border rounded-md p-2 w-full h-full bg-background"
            spellCheck={false}
          />
          <div
            className="prose prose-sm max-w-none h-full overflow-auto pr-2 border rounded-md p-2"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      )}
    </div>
  );
}

