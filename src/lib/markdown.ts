// Very small, GitHub-lite Markdown to HTML renderer
// Not complete; handles headings, emphasis, code, lists, links, paragraphs.

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export function markdownToHtml(md: string) {
  // code fences
  const codeFenceRe = /```([\s\S]*?)```/g;
  let placeholders: string[] = [];
  md = md.replace(codeFenceRe, (_, code) => {
    const i = placeholders.push(`<pre class=\"rounded-md border p-3 bg-muted overflow-auto\"><code>${escapeHtml(code.trim())}</code></pre>`) - 1;
    return `@@CODE_${i}@@`;
  });

  // inline code
  md = md.replace(/`([^`]+)`/g, (_, code) => `<code class=\"bg-muted rounded px-1\">${escapeHtml(code)}</code>`);

  // headings
  md = md.replace(/^######\s+(.*)$/gm, '<h6 class="text-sm font-semibold mt-4">$1</h6>');
  md = md.replace(/^#####\s+(.*)$/gm, '<h5 class="text-sm font-semibold mt-5">$1</h5>');
  md = md.replace(/^####\s+(.*)$/gm, '<h4 class="text-base font-semibold mt-6">$1</h4>');
  md = md.replace(/^###\s+(.*)$/gm, '<h3 class="text-lg font-semibold mt-6">$1</h3>');
  md = md.replace(/^##\s+(.*)$/gm, '<h2 class="text-xl font-semibold mt-7">$1</h2>');
  md = md.replace(/^#\s+(.*)$/gm, '<h1 class="text-2xl font-bold mt-8">$1</h1>');

  // bold/italic
  md = md.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  md = md.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // links
  md = md.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a class="underline" target="_blank" rel="noreferrer" href="$2">$1</a>');

  // unordered lists
  md = md.replace(/^(?:-\s+.*(?:\n|$))+?/gm, (block) => {
    const items = block
      .trim()
      .split(/\n/)
      .map((l) => l.replace(/^-\s+/, "").trim())
      .map((i) => `<li class=\"my-1\">${i}</li>`) 
      .join("");
    return `<ul class=\"list-disc pl-6 my-2\">${items}</ul>`;
  });

  // paragraphs (lines with text not part of other blocks)
  md = md
    .split(/\n{2,}/)
    .map((para) => {
      if (/^\s*<h\d|^\s*<ul|^\s*@@CODE_/.test(para)) return para;
      const trimmed = para.trim();
      if (!trimmed) return "";
      return `<p class=\"leading-7 my-2\">${trimmed}</p>`;
    })
    .join("\n");

  // restore code
  md = md.replace(/@@CODE_(\d+)@@/g, (_, i) => placeholders[Number(i)] ?? "");
  return md;
}

export function extractTOC(md: string) {
  const lines = md.split(/\r?\n/);
  const toc: { level: number; text: string }[] = [];
  for (const line of lines) {
    const m = line.match(/^(#{1,6})\s+(.*)$/);
    if (m) toc.push({ level: m[1].length, text: m[2].trim() });
  }
  return toc;
}

export function extractSources(md: string) {
  const links: { text: string; url: string }[] = [];
  const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(md))) {
    links.push({ text: m[1], url: m[2] });
  }
  const urlRe = /(?<!\()\bhttps?:\/\/[^\s)]+/g;
  while ((m = urlRe.exec(md))) {
    links.push({ text: m[0], url: m[0] });
  }
  const seen = new Set<string>();
  return links.filter((l) => (seen.has(l.url) ? false : (seen.add(l.url), true)));
}
