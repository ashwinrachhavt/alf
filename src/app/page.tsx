import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 p-8 md:p-10 bg-gradient-to-b from-transparent to-neutral-50 dark:to-neutral-950">
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">Information Repository</h1>
          <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-300 max-w-2xl">
            An AI agent that nurtures your notes — collects, refines, and helps you re‑find knowledge when it matters.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/research" className="inline-flex items-center rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900">
              Start Research
            </Link>
            <Link href="/threads" className="inline-flex items-center rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900">
              Threads
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl bg-neutral-200/40 dark:bg-neutral-800/40" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-3xl bg-neutral-200/40 dark:bg-neutral-800/40" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 p-4">
          <h2 className="font-medium">Grounded Research</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Live web search with quotes, URLs, and dates.</p>
        </div>
        <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 p-4">
          <h2 className="font-medium">Nurtured Notes</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Stream results, then refine in the editor.</p>
        </div>
        <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 p-4">
          <h2 className="font-medium">Minimal Aesthetic</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Black & white, subtle shadows, light/dark modes.</p>
        </div>
      </section>
    </div>
  );
}

