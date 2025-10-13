import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h1 className="text-xl font-semibold mb-2">ALF — Markdown Research Console</h1>
        <p className="muted max-w-2xl">
          Unified AI research agent with real-time streaming, beautiful markdown display, and Supabase storage. Research any topic and save as organized markdown notes with tags.
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/research" className="btn">AI Research Agent</Link>
          <Link href="/notes" className="btn">Saved Notes</Link>
          <Link href="/knowledge" className="btn">Knowledge Base</Link>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-4">
          <h2 className="font-semibold">Streaming Research</h2>
          <p className="muted text-sm">Real-time AI research with live markdown streaming.</p>
        </div>
        <div className="card p-4">
          <h2 className="font-semibold">Supabase Storage</h2>
          <p className="muted text-sm">Save and organize research notes with tags and search.</p>
        </div>
        <div className="card p-4">
          <h2 className="font-semibold">Beautiful Markdown</h2>
          <p className="muted text-sm">Responsive markdown display with custom styling.</p>
        </div>
      </section>
    </div>
  );
}
