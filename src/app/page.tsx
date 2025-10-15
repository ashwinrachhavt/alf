import Link from "next/link";
import { Search, FileText, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import DocumentGrid3D from "@/components/DocumentGrid3D";

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Hero Section */}
      <section className="relative">
        <Card className="relative overflow-hidden rounded-3xl bg-[color:var(--color-surface)]/90 dark:bg-[color:var(--color-surface)]/90 backdrop-blur border border-[color:var(--color-border)]/60 shadow-lg">
          <CardContent className="p-8 md:p-10">
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium mb-6 text-[color:var(--color-foreground)]">
                <Sparkles className="w-3 h-3" />
                AI-Powered Research Platform
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-neutral-900 dark:text-neutral-100">
                Alf — the modern AI butler
              </h1>
              <p className="text-base md:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mb-8">
                For today’s knowledge workers: plans research, searches the web, extracts quotes with citations, and helps you re-find what matters.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="shadow-md hover:shadow-lg transition-shadow ring-1 ring-black/10 text-neutral-900 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 dark:ring-neutral-700"
                >
                  <Link href="/research" className="inline-flex items-center">
                    <Search className="w-4 h-4 mr-2" />
                    Start Research
                  </Link>
                </Button>
                
              </div>
            </div>
            {/* Background decoration */}
            <div className="pointer-events-none absolute inset-0 opacity-40">
              <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl bg-neutral-200/50 dark:bg-neutral-700/30" />
              <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-3xl bg-neutral-200/50 dark:bg-neutral-700/30" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3D Document Grid Visualization */}
      <section>
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-neutral-900 dark:text-neutral-100">
            Your Knowledge, Visualized
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Experience your research documents in an immersive 3D space
          </p>
        </div>
        <DocumentGrid3D />
      </section>

    </div>
  );
}
