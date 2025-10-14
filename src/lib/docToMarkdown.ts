// Minimal Tiptap/PM JSON -> Markdown converter covering common nodes
// Not exhaustive, but good for headings, paragraphs, lists, code blocks, blockquotes, bold/italic.

type PMNode = { type?: string; content?: PMNode[]; text?: string; marks?: { type: string }[]; attrs?: any };

export function docToMarkdown(doc: PMNode | null | undefined): string {
  if (!doc) return "";
  return (doc.content || []).map(renderNode).join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

function renderNode(n: PMNode): string {
  switch (n.type) {
    case "paragraph":
      return inline((n.content || []).map(renderInline).join(""));
    case "heading": {
      const level = Math.min(Math.max(n.attrs?.level || 1, 1), 6);
      return `${"#".repeat(level)} ${inline((n.content || []).map(renderInline).join(""))}`;
    }
    case "bulletList":
      return (n.content || []).map((li) => `- ${inline((li.content || []).map(renderListItem).join(""))}`).join("\n");
    case "orderedList": {
      let i = 1;
      return (n.content || []).map((li) => `${i++}. ${inline((li.content || []).map(renderListItem).join(""))}`).join("\n");
    }
    case "blockquote":
      return (n.content || []).map((c) => "> " + renderNode(c).replace(/\n/g, "\n> ")).join("\n");
    case "codeBlock":
      return "```\n" + (n.content || []).map((c) => c.text || "").join("") + "\n```";
    case "horizontalRule":
      return "---";
    default:
      // try inline fallback
      if (n.text) return inline(renderInline(n));
      if (n.content) return (n.content || []).map(renderNode).join("\n\n");
      return "";
  }
}

function renderListItem(n: PMNode): string {
  if (n.type === "paragraph") return (n.content || []).map(renderInline).join("");
  return renderNode(n);
}

function renderInline(n: PMNode): string {
  if (n.text != null) {
    let t = escapeMd(n.text);
    const marks = n.marks || [];
    // wrap marks (bold+italic nesting)
    for (const m of marks) {
      if (m.type === "bold") t = `**${t}**`;
      if (m.type === "italic") t = `*${t}*`;
      if (m.type === "code") t = `\`${t}\``;
      if (m.type === "strike") t = `~~${t}~~`;
      if (m.type === "link") {
        const href = m as any;
        const url = href?.attrs?.href || "";
        t = url ? `[${t}](${url})` : t;
      }
    }
    return t;
  }
  if (n.content) return (n.content || []).map(renderInline).join("");
  return "";
}

function inline(s: string) {
  return s.replace(/\s+/g, (m) => (m.length > 2 ? "  " : " ")).trim();
}

function escapeMd(s: string) {
  return s.replace(/[\*_`~]/g, (c) => `\\${c}`);
}

