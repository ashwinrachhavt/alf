"use client";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

export function AIPalette({
  open,
  onClose,
  onRun,
}: {
  open: boolean;
  onClose: () => void;
  onRun: (prompt: string, mode: "rewrite" | "continue" | "summarize") => Promise<void>;
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
      setPrompt("");
    }
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const handleRun = async (mode: "rewrite" | "continue" | "summarize") => {
    setLoading(true);
    try {
      await onRun(prompt, mode);
      setPrompt("");
      onClose();
    } catch (error) {
      console.error("AI error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleRun("continue");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-start justify-center pt-32"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-[color:var(--color-surface)] border border-[color:var(--color-border)] p-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-lg">Ask AI</h3>
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI to continue writing, rewrite selection, or summarize... (Press Enter)"
          className="w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-4 py-3 outline-none focus:border-blue-500 transition-colors text-base"
          disabled={loading}
        />

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <button
            className="px-4 py-2 rounded-lg border border-[color:var(--color-border)] hover:bg-[color:var(--color-accent)] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={() => handleRun("continue")}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Continue Writing
          </button>
          <button
            className="px-4 py-2 rounded-lg border border-[color:var(--color-border)] hover:bg-[color:var(--color-accent)] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleRun("rewrite")}
            disabled={loading}
          >
            Rewrite Selection
          </button>
          <button
            className="px-4 py-2 rounded-lg border border-[color:var(--color-border)] hover:bg-[color:var(--color-accent)] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleRun("summarize")}
            disabled={loading}
          >
            Summarize
          </button>
          <button
            className="ml-auto px-4 py-2 rounded-lg text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] transition-colors"
            onClick={onClose}
          >
            Cancel (Esc)
          </button>
        </div>

        {/* Hint text */}
        <p className="mt-4 text-xs text-[color:var(--color-muted)]">
          Tip: Double-tap space in an empty line or press ⌘J to open this palette
        </p>
      </div>
    </div>
  );
}
