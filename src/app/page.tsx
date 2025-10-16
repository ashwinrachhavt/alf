import Link from "next/link";
import { Search, FileText, Sparkles, ArrowRight, BookOpen, Zap, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import DocumentGrid3D from "@/components/DocumentGrid3D";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Research Platform</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-foreground">
              Alf — the modern
              <br />
              <span className="text-primary">AI butler</span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              Plans research, searches the web, extracts quotes with citations, and helps you re-find what matters.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="text-base px-8 py-6 h-auto">
                <Link href="/research" className="inline-flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Start Research
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8 py-6 h-auto">
                <Link href="/notes" className="inline-flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Browse Notes
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Powerful Research Tools
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Everything you need to organize, analyze, and visualize your knowledge
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
              <CardHeader className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">AI Research Assistant</CardTitle>
                <CardDescription className="text-base">
                  Let AI help you plan and execute complex research tasks with intelligent suggestions and automated workflows
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
              <CardHeader className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                  <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                </div>
                <CardTitle className="text-xl">Smart Citations</CardTitle>
                <CardDescription className="text-base">
                  Automatically extract and organize quotes with proper citations, making research documentation effortless
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
              <CardHeader className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
                </div>
                <CardTitle className="text-xl">Knowledge Graph</CardTitle>
                <CardDescription className="text-base">
                  Visualize connections between your research in an interactive 3D knowledge graph for deeper insights
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* 3D Document Grid Visualization */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Your Knowledge, Visualized
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Experience your research documents in an immersive 3D space
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden border-2 border-border shadow-xl">
            <DocumentGrid3D />
          </div>
        </div>
      </section>
    </div>
  );
}
