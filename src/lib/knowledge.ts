import fs from "fs/promises";
import fssync from "fs";
import path from "path";

export type TreeNode =
  | { type: "dir"; name: string; path: string; children: TreeNode[] }
  | { type: "file"; name: string; path: string };

const root = path.join(process.cwd(), "content");

export async function ensureContentRoot() {
  if (!fssync.existsSync(root)) {
    await fs.mkdir(root, { recursive: true });
  }
}

export function getContentRoot() {
  return root;
}

export async function readTree(dir = root, rel = ""): Promise<TreeNode> {
  await ensureContentRoot();
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const children: TreeNode[] = [];
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    const rp = path.join(rel, e.name);
    if (e.isDirectory()) {
      children.push(await readTree(p, rp));
    } else if (e.isFile() && e.name.toLowerCase().endsWith(".md")) {
      children.push({ type: "file", name: e.name, path: rp });
    }
  }
  // sort dirs first, then files alphabetically
  children.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  const name = rel === "" ? "content" : path.basename(dir);
  return { type: "dir", name, path: rel || "/", children };
}

export async function readDoc(relPath: string) {
  await ensureContentRoot();
  const fp = path.join(root, relPath);
  const text = await fs.readFile(fp, "utf8");
  return text;
}

export async function writeDoc(relPath: string, content: string) {
  await ensureContentRoot();
  const fp = path.join(root, relPath);
  await fs.mkdir(path.dirname(fp), { recursive: true });
  await fs.writeFile(fp, content, "utf8");
}

export async function deleteNode(relPath: string) {
  const fp = path.join(root, relPath);
  const stat = await fs.stat(fp);
  if (stat.isDirectory()) {
    await fs.rm(fp, { recursive: true, force: true });
  } else {
    await fs.unlink(fp);
  }
}

export type SearchHit = { path: string; score: number; snippet: string };

export async function searchDocs(q: string, max = 10): Promise<SearchHit[]> {
  await ensureContentRoot();
  const terms = tokenize(q);
  const files = await listFiles(root);
  const hits: SearchHit[] = [];
  for (const fp of files) {
    const text = await fs.readFile(fp, "utf8");
    const score = scoreDoc(text, terms);
    if (score > 0) {
      hits.push({ path: path.relative(root, fp), score, snippet: makeSnippet(text, terms) });
    }
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, max);
}

async function listFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await listFiles(p)));
    } else if (e.isFile() && e.name.toLowerCase().endsWith(".md")) {
      out.push(p);
    }
  }
  return out;
}

function tokenize(s: string) {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function scoreDoc(text: string, terms: string[]) {
  const body = text.toLowerCase();
  let score = 0;
  for (const t of terms) {
    const matches = body.match(new RegExp(`\\b${escapeRegExp(t)}\\b`, "g"));
    score += matches ? matches.length : 0;
  }
  return score;
}

function makeSnippet(text: string, terms: string[]) {
  const idx = terms
    .map((t) => text.toLowerCase().indexOf(t.toLowerCase()))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, idx - 80);
  const end = Math.min(text.length, start + 200);
  return text.slice(start, end).replace(/\s+/g, " ");
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getRelevantDocs(query: string, limit = 3) {
  const hits = await searchDocs(query, limit);
  const docs: { path: string; content: string }[] = [];
  for (const h of hits) {
    try {
      const content = await readDoc(h.path);
      docs.push({ path: h.path, content });
    } catch {}
  }
  return docs;
}
