"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Editor } from "@tiptap/react";
import {
  Sparkles,
  Wand2,
  Check,
  X,
  RefreshCw,
  ChevronRight,
  Languages,
  Loader2,
  Zap,
  MessageSquare,
  FileText,
  Edit3,
} from "lucide-react";

type AiAction = {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
  category: "edit" | "write";
};

const AI_ACTIONS: AiAction[] = [
  {
    id: "improve",
    label: "Improve Writing",
    icon: <Wand2 className="w-4 h-4" />,
    prompt: "Improve the clarity, grammar, and style of this text while keeping the same meaning",
    category: "edit",
  },
  {
    id: "fix-grammar",
    label: "Fix Grammar",
    icon: <Check className="w-4 h-4" />,
    prompt: "Fix any spelling and grammar errors in this text",
    category: "edit",
  },
  {
    id: "shorten",
    label: "Make Shorter",
    icon: <Zap className="w-4 h-4" />,
    prompt: "Make this text more concise while preserving the key points",
    category: "edit",
  },
  {
    id: "expand",
    label: "Make Longer",
    icon: <Edit3 className="w-4 h-4" />,
    prompt: "Expand on this text with more details and examples",
    category: "edit",
  },
  {
    id: "simplify",
    label: "Simplify Language",
    icon: <MessageSquare className="w-4 h-4" />,
    prompt: "Rewrite this text using simpler, easier to understand language",
    category: "edit",
  },
  {
    id: "continue",
    label: "Continue Writing",
    icon: <ChevronRight className="w-4 h-4" />,
    prompt: "Continue writing from where this text ends, maintaining the same style and tone",
    category: "write",
  },
  {
    id: "summarize",
    label: "Summarize",
    icon: <FileText className="w-4 h-4" />,
    prompt: "Create a concise summary of this text",
    category: "write",
  },
];

interface AiContextMenuProps {
  editor: Editor | null;
}

export function AiContextMenu({ editor }: AiContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAiContent, setHasAiContent] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [showLanguages, setShowLanguages] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Track selection changes
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, " ");

      if (text.trim().length > 0 && text.length < 5000) {
        // Get selection coordinates for positioning
        const { view } = editor;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);

        setSelectedText(text);
        setPosition({
          top: end.top - 60, // Position above selection
          left: (start.left + end.left) / 2, // Center horizontally
        });
        setIsOpen(true);
      } else {
        if (!hasAiContent) {
          setIsOpen(false);
        }
      }
    };

    editor.on("selectionUpdate", handleSelectionUpdate);
    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
    };
  }, [editor, hasAiContent]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        if (!hasAiContent) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [hasAiContent]);

  const handleAction = useCallback(
    async (action: AiAction) => {
      if (!editor || !selectedText) return;

      setIsProcessing(true);
      setHasAiContent(true);

      try {
        const { from, to } = editor.state.selection;

        const res = await fetch("/api/ai/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            html: editor.getHTML(),
            selection: selectedText,
            prompt: action.prompt,
            mode: action.category === "edit" ? "rewrite" : "continue",
          }),
        });

        if (!res.ok) throw new Error("AI request failed");

        const { text } = await res.json();
        setAiResponse(text);

        // Auto-accept after a moment (or user can manually accept)
        setTimeout(() => {
          if (text) {
            acceptAiContent(from, to, text);
          }
        }, 100);
      } catch (error) {
        console.error("AI error:", error);
        setHasAiContent(false);
      } finally {
        setIsProcessing(false);
      }
    },
    [editor, selectedText]
  );

  const acceptAiContent = (from: number, to: number, content: string) => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .deleteRange({ from, to })
      .insertContentAt(from, content)
      .run();
    resetMenu();
  };

  const rejectAiContent = () => {
    resetMenu();
  };

  const resetMenu = () => {
    setHasAiContent(false);
    setAiResponse("");
    setIsOpen(false);
    setIsProcessing(false);
  };

  if (!isOpen) return null;

  const editActions = AI_ACTIONS.filter((a) => a.category === "edit");
  const writeActions = AI_ACTIONS.filter((a) => a.category === "write");

  return (
    <div
      ref={menuRef}
      className="fixed z-50 animate-in fade-in slide-in-from-top-2 duration-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)",
      }}
    >
      {/* Main Menu */}
      {!hasAiContent ? (
        <div className="bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-xl shadow-2xl p-2 min-w-[280px]">
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[color:var(--color-border)] mb-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-[color:var(--color-foreground)]">
              AI Assistant
            </span>
          </div>

          {/* Edit Actions */}
          <div className="mb-1">
            <div className="px-3 py-1 text-xs font-medium text-[color:var(--color-muted)] uppercase">
              Edit
            </div>
            {editActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                disabled={isProcessing}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[color:var(--color-accent)] transition-colors text-left disabled:opacity-50"
              >
                <span className="text-[color:var(--color-muted)]">{action.icon}</span>
                <span className="text-sm text-[color:var(--color-foreground)]">
                  {action.label}
                </span>
              </button>
            ))}
          </div>

          {/* Write Actions */}
          <div>
            <div className="px-3 py-1 text-xs font-medium text-[color:var(--color-muted)] uppercase mt-2">
              Write
            </div>
            {writeActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                disabled={isProcessing}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[color:var(--color-accent)] transition-colors text-left disabled:opacity-50"
              >
                <span className="text-[color:var(--color-muted)]">{action.icon}</span>
                <span className="text-sm text-[color:var(--color-foreground)]">
                  {action.label}
                </span>
              </button>
            ))}
          </div>

          {isProcessing && (
            <div className="flex items-center justify-center gap-2 py-3 border-t border-[color:var(--color-border)] mt-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm text-[color:var(--color-muted)]">Processing...</span>
            </div>
          )}
        </div>
      ) : (
        /* AI Response Actions */
        <div className="bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-xl shadow-2xl p-3 flex items-center gap-2">
          <button
            onClick={rejectAiContent}
            className="p-2 rounded-lg hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors"
            title="Discard"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const { from, to } = editor?.state.selection || { from: 0, to: 0 };
              acceptAiContent(from, to, aiResponse);
            }}
            className="p-2 rounded-lg hover:bg-green-500/10 text-green-600 dark:text-green-400 transition-colors"
            title="Accept"
          >
            <Check className="w-4 h-4" />
          </button>
          <div className="h-6 w-px bg-[color:var(--color-border)]" />
          <button
            onClick={() => {
              const lastAction = AI_ACTIONS.find((a) => a.id === "improve");
              if (lastAction) handleAction(lastAction);
            }}
            className="p-2 rounded-lg hover:bg-[color:var(--color-accent)] transition-colors"
            title="Try Again"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
