import { getItem } from "@/lib/store";
import MarkdownViewer from "@/components/MarkdownViewer";
import Link from "next/link";

export default async function NoteView({ params }: { params: { id: string } }) {
  const note = await getItem(params.id);
  if (!note || note.type !== "note") {
    return (
      <div className="space-y-4">
        <p className="muted">Note not found.</p>
        <Link className="btn" href="/notes">Back to Notes</Link>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{note.title}</h1>
        <Link className="btn" href="/notes">Back</Link>
      </div>
      <MarkdownViewer markdown={note.content} />
    </div>
  );
}

