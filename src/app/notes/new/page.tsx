"use client";
import { useState } from "react";
import MarkdownEditor from "@/components/MarkdownEditor";
import { useRouter } from "next/navigation";

export default function NewNotePage() {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string>("");
  const [content, setContent] = useState("# New Research\n\n## TL;DR\n\n- ...\n");
  const router = useRouter();

  async function save() {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, tags: tags.split(",").map(t => t.trim()).filter(Boolean) })
    });
    const data = await res.json();
    if (res.ok) {
      router.push(`/notes/${data.id}`);
    } else {
      alert(data.error || "Failed to save");
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-3 space-y-2">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief title" />
        </div>
        <div>
          <label className="block text-sm mb-1">Tags</label>
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma,separated,tags" />
        </div>
        <div className="flex justify-end">
          <button className="btn" onClick={save} disabled={!title.trim()}>Save</button>
        </div>
      </div>
      <MarkdownEditor initial={content} onChange={setContent} />
    </div>
  );
}

