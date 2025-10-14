import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:underline">ALF</Link>
          <Link href="/research" className="hover:underline">Research</Link>
          <Link href="/threads" className="hover:underline">Threads</Link>
        </nav>
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal" />
            <SignUpButton mode="modal" />
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
