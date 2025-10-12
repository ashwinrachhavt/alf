"use client";
import { useEffect, useMemo, useState } from "react";
import type { TreeNode } from "@/lib/knowledge";

type Props = {
  selected?: string | null;
  onSelect: (path: string) => void;
};

export default function KbTree({ selected, onSelect }: Props) {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ "/": true });

  useEffect(() => {
    fetch("/api/kb/tree")
      .then((r) => r.json())
      .then(setTree)
      .catch(() => setTree({ type: "dir", name: "content", path: "/", children: [] } as any));
  }, []);

  useEffect(() => {
    if (!selected || !tree) return;
    // expand ancestors of selected
    const parts = selected.split("/").slice(0, -1);
    let acc = "/";
    const exp: Record<string, boolean> = { "/": true };
    for (const p of parts) {
      if (!p) continue;
      acc = acc === "/" ? p : `${acc}/${p}`;
      exp[acc] = true;
    }
    setExpanded((e) => ({ ...e, ...exp }));
  }, [selected, tree]);

  const items = useMemo(() => tree, [tree]);
  if (!items) return <div className="text-sm text-muted-foreground">Loading…</div>;
  return (
    <div className="text-sm">
      <RenderNode
        node={items}
        expanded={expanded}
        onToggle={(p) => setExpanded((e) => ({ ...e, [p]: !e[p] }))}
        selected={selected}
        onSelect={onSelect}
      />
    </div>
  );
}

function RenderNode({
  node,
  expanded,
  onToggle,
  selected,
  onSelect,
}: {
  node: TreeNode;
  expanded: Record<string, boolean>;
  onToggle: (p: string) => void;
  selected?: string | null;
  onSelect: (p: string) => void;
}) {
  if (node.type === "file") {
    const isSel = selected === node.path;
    return (
      <div
        className={`cursor-pointer px-2 py-1 rounded mb-0.5 ${isSel ? "bg-accent" : "hover:bg-accent/60"}`}
        onClick={() => onSelect(node.path)}
        title={node.path}
      >
        {node.name}
      </div>
    );
  }
  const isOpen = !!expanded[node.path || "/"];
  return (
    <div>
      <div
        className="cursor-pointer px-2 py-1 rounded mb-0.5 font-medium text-foreground/90 hover:bg-accent/60"
        onClick={() => onToggle(node.path || "/")}
      >
        {isOpen ? "▾" : "▸"} {node.name}
      </div>
      {isOpen && (
        <div className="pl-3 border-l border-border/60 ml-1">
          {node.children.map((c, i) => (
            <RenderNode
              key={(c as any).path + i}
              node={c}
              expanded={expanded}
              onToggle={onToggle}
              selected={selected}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

