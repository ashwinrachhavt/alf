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
          <Link href="/editor" className="btn">✨ Notion Editor</Link>
          <Link href="/research" className="btn">AI Research Agent</Link>
          <Link href="/notes" className="btn">Saved Notes</Link>
          <Link href="/knowledge" className="btn">Knowledge Base</Link>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-4">
        <div className="card p-4">
          <h2 className="font-semibold">✨ Notion-like Editor</h2>
          <p className="muted text-sm">Block-based markdown editor with auto-save and sharing.</p>
        </div>
        <div className="card p-4">
          <h2 className="font-semibold">🔄 Auto-updating Blocks</h2>
          <p className="muted text-sm">Real-time collaborative editing with live block updates.</p>
        </div>
        <div className="card p-4">
          <h2 className="font-semibold">🎨 Minimalistic Design</h2>
          <p className="muted text-sm">Clean, dark theme with beautiful animations and gradients.</p>
        </div>
        <div className="card p-4">
          <h2 className="font-semibold">🚀 AI Research</h2>
          <p className="muted text-sm">Integrated AI research agent with streaming responses.</p>
        </div>
      </section>
    </div>
  );
}
