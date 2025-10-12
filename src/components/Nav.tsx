import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:underline">ALF</Link>
          <Link href="/kb" className="hover:underline">Knowledge</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
