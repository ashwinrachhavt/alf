import Link from "next/link";
import { Search, FileText, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 space-y-16">
      {/* Hero Section */}
      <section className="relative">
        <Card className="relative overflow-hidden border-neutral-200/70 dark:border-neutral-800/70">
          <CardContent className="p-8 md:p-12">
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium mb-6">
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
                <Button asChild variant="primary" size="lg">
                  <Link href="/research">
                    <Search className="w-4 h-4 mr-2" />
                    Start Research
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/threads">
                    <FileText className="w-4 h-4 mr-2" />
                    View Threads
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

      {/* Features */}
      <section>
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-neutral-900 dark:text-neutral-100">
            Powerful Research Features
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Everything you need to conduct deep research and organize your knowledge effectively
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-neutral-900 dark:text-neutral-100" />
              </div>
              <CardTitle className="text-lg">Grounded Research</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Live web search with quotes, URLs, and dates. All information is sourced and verifiable.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-neutral-900 dark:text-neutral-100" />
              </div>
              <CardTitle className="text-lg">Nurtured Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Stream results in real-time, then refine and organize in the rich text editor.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-neutral-900 dark:text-neutral-100" />
              </div>
              <CardTitle className="text-lg">Minimal Aesthetic</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Clean black & white design with subtle shadows and seamless light/dark modes.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section>
        <Card className="bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 border-neutral-200/70 dark:border-neutral-700/70">
          <CardContent className="p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-neutral-900 dark:text-neutral-100">
              Ready to start researching?
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-xl mx-auto">
              Create your first research thread and let AI help you gather, organize, and understand information.
            </p>
            <Button asChild variant="primary" size="lg">
              <Link href="/research">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
