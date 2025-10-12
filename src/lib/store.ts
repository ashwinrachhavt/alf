import fs from "fs/promises";
import path from "path";

export type ItemType = "folder" | "note";

export interface ItemBase {
  id: string;
  type: ItemType;
  title: string;
  parentId?: string | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Note extends ItemBase {
  type: "note";
  content: string;
}

export interface Folder extends ItemBase {
  type: "folder";
}

export type Item = Note | Folder;

const DATA_PATH = path.join(process.cwd(), "data", "notes.json");

async function ensureDataFile() {
  try {
    await fs.access(DATA_PATH);
  } catch {
    const initial: Item[] = [
      {
        id: "root",
        type: "folder",
        title: "Knowledge",
        parentId: null,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "quickstart",
        type: "note",
        title: "ALF Research Template",
        parentId: "root",
        tags: ["template", "research"],
        content: `# Research Brief\n\n## TL;DR\n\n- Summarize findings in 3 bullets.\n\n## Bullets\n\n- Key point 1\n- Key point 2\n\n## Narrative\n\nShort narrative with citations inline.\n\n## Sources\n\n| URL | Quote | Author | Date |\n| --- | --- | --- | --- |\n| https://example.com | "quote" | Doe | 2024-09-01 |`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readAll(): Promise<Item[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_PATH, "utf8");
  return JSON.parse(raw) as Item[];
}

async function writeAll(items: Item[]): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(items, null, 2), "utf8");
}

export async function listItems(): Promise<Item[]> {
  return readAll();
}

export async function getItem(id: string): Promise<Item | undefined> {
  const items = await readAll();
  return items.find((i) => i.id === id);
}

export async function upsertNote(note: Partial<Note> & { title: string; content: string; id?: string; parentId?: string | null; tags?: string[]; }): Promise<Note> {
  const items = await readAll();
  const now = new Date().toISOString();
  if (!note.id) {
    const id = `n_${Math.random().toString(36).slice(2, 10)}`;
    const newNote: Note = {
      id,
      type: "note",
      title: note.title,
      content: note.content,
      parentId: note.parentId ?? "root",
      tags: note.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    items.push(newNote);
    await writeAll(items);
    return newNote;
  } else {
    const idx = items.findIndex((i) => i.id === note.id);
    if (idx === -1) throw new Error("Note not found");
    const prev = items[idx] as Note;
    const updated: Note = {
      ...prev,
      title: note.title ?? prev.title,
      content: note.content ?? prev.content,
      parentId: note.parentId ?? prev.parentId,
      tags: note.tags ?? prev.tags,
      updatedAt: now,
    };
    items[idx] = updated;
    await writeAll(items);
    return updated;
  }
}

export async function createFolder(title: string, parentId: string | null = "root"): Promise<Folder> {
  const items = await readAll();
  const now = new Date().toISOString();
  const folder: Folder = {
    id: `f_${Math.random().toString(36).slice(2, 10)}`,
    type: "folder",
    title,
    parentId,
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
  items.push(folder);
  await writeAll(items);
  return folder;
}

export async function deleteItem(id: string): Promise<void> {
  const items = await readAll();
  const remaining = items.filter((i) => i.id !== id && i.parentId !== id);
  await writeAll(remaining);
}

export type TreeNode = (Folder & { children: TreeNode[] }) | Note;

export async function getTree(): Promise<TreeNode[]> {
  const items = await readAll();
  const map = new Map<string, TreeNode>();
  items.forEach((i) => {
    if (i.type === "folder") {
      map.set(i.id, { ...(i as Folder), children: [] });
    } else {
      map.set(i.id, i as Note);
    }
  });
  const roots: TreeNode[] = [];
  for (const item of map.values()) {
    if (!item.parentId || item.parentId === "root") {
      if (item.id !== "root") roots.push(item);
      continue;
    }
    const parent = map.get(item.parentId);
    if (parent && (parent as any).children) {
      (parent as any).children.push(item);
    } else {
      roots.push(item);
    }
  }
  // Always show root folders first
  const rootFolder = map.get("root") as TreeNode | undefined;
  const children = (rootFolder && (rootFolder as any).children) || [];
  return [...children, ...roots.filter((r) => r.parentId && r.parentId !== "root")];
}

export async function findByTags(tags: string[], limit = 5): Promise<Note[]> {
  const items = await readAll();
  const notes = items.filter((i): i is Note => i.type === "note");
  const filtered = tags.length
    ? notes.filter((n) => n.tags?.some((t) => tags.includes(t)))
    : notes;
  return filtered
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, limit);
}

