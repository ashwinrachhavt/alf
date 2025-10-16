import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Search, Bell } from "lucide-react";
import ArcanePyramid from "@/components/icons/ArcanePyramid";

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl shadow-sm">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <nav className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl group text-foreground">
            <ArcanePyramid className="w-7 h-7 transition-transform group-hover:scale-110 group-hover:rotate-12 duration-300" />
            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">ALF</span>
          </Link>
          <div className="hidden md:flex items-center gap-2 text-sm font-medium">
            <Link
              href="/research"
              className="px-4 py-2 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
            >
              Deep Research
            </Link>
            <Link
              href="/notes"
              className="px-4 py-2 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
            >
              Notes
            </Link>
          </div>
        </nav>

        <div className="flex items-center gap-2">
          <button
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>

          <ThemeToggle />

          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 text-sm font-medium rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg">
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
