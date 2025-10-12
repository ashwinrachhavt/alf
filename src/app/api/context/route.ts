import { NextResponse } from "next/server";
import { findByTags } from "@/lib/store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tags = searchParams.get("tags")?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
  const notes = await findByTags(tags, 10);
  const context = notes.map(n => `# ${n.title}\n\n${n.content}`).join("\n\n---\n\n");
  return NextResponse.json({ tags, count: notes.length, context });
}

