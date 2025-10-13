import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h1 className="text-xl font-semibold mb-2">ALF — Markdown Research Console</h1>
        <p className="muted max-w-2xl">
          Minimal, black-and-white UI with light/dark modes and subtle shadows. Organize research as markdown notes in folders, browse concepts by tags, and stream agentic research with citations.
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/notes" className="btn">Open Notes</Link>
          <Link href="/knowledge" className="btn">Browse Concepts</Link>
          <Link href="/research/stream" className="btn">Streaming Research</Link>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <h2 className="font-semibold">Markdown blocks</h2>
          <p className="muted text-sm">Editor + GitHub-flavored preview, split view.</p>
        </div>
        <div className="card p-4">
          <h2 className="font-semibold">Agents + Web Search</h2>
          <p className="muted text-sm">Run deep research with citations and context.</p>
        </div>
      </section>
    </div>
  );
}
