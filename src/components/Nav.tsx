import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Search, Bell } from "lucide-react";
import ArcanePyramid from "@/components/icons/ArcanePyramid";

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/50 dark:border-neutral-800/50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
        <nav className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg group">
            <ArcanePyramid className="w-6 h-6 transition-transform group-hover:scale-110" />
            <span>ALF</span>
          </Link>
          <div className="hidden md:flex items-center gap-4 text-sm text-neutral-900 dark:text-neutral-100">
            
            <Link
              href="/research"
              className="px-3 py-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Deep Research
            </Link>
            <Link
              href="/notes"
              className="px-3 py-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Notes
            </Link>
          </div>
        </nav>

        <div className="flex items-center gap-3">
          <button
            className="p-2 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            className="p-2 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>

          <ThemeToggle />

          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 text-sm font-medium rounded-md text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-4 py-2 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-md hover:opacity-90 transition-opacity">
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
