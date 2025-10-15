import { openai } from "@ai-sdk/openai";
import { streamText, type UIMessage, stepCountIs } from "ai";
import { duckDuckGoInstant } from "@/lib/tools/duckduckgo";
import { getFirecrawlClient } from "@/lib/firecrawl/client";

/**
 * 🔍 Hybrid Research Agent
 * Uses DuckDuckGo to retrieve URLs, then Firecrawl to crawl and scrape them.
 * Finally, feeds the aggregated markdown into GPT-4.1 for comprehensive synthesis.
 */
export const maxDuration = 600;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Extract messages array from request body (compatible with useChat)
  let query: string | undefined;

  try {
    const body = await req.json();

    // Support both direct query and messages array format
    if (Array.isArray(body?.messages)) {
      // Extract query from the last user message
      const lastUserMessage = body.messages.filter((m: any) => m.role === 'user').pop();
      query = lastUserMessage?.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('\n') || "GraphRAG vs LazyGraphRAG";
    } else if (body?.query) {
      query = body.query;
    } else {
      query = "GraphRAG vs LazyGraphRAG";
    }
  } catch {
    query = "GraphRAG vs LazyGraphRAG";
  }

  const client = getFirecrawlClient();

  // Step 1: Search via DuckDuckGo Instant API (broaden URLs from related topics)
  // Sanitize and normalize the query for DuckDuckGo Instant API (avoid runtime and caching issues)
  const cleanQuery = query?.trim().replace(/\s+/g, " ") ?? "web research";

  // Add timestamp param to avoid cached results from DDG API
  // Use the timestamp only to bust cache, not part of the actual search keywords
  const ddgResult = await duckDuckGoInstant.execute({ query: cleanQuery });

  // Fallback: if DuckDuckGo returned nothing, retry with direct HTML search scraping
  let urls: string[] = [];
  if (ddgResult?.url || (ddgResult?.related ?? []).length > 0) {
    urls = [
      ddgResult.url,
      ...(ddgResult.related || []).map((r: { url?: string }) => r.url),
    ]
      .filter((u): u is string => !!u && u.startsWith("http"))
      .slice(0, 5);
  } else {
    console.warn("⚠️ DuckDuckGo Instant returned nothing; using fallback web search.");
    const ddgHtml = await fetch(
      `https://duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`
    ).then((r) => r.text());
    const matches = ddgHtml.match(/https:\/\/[^\s"']+/g) || [];
    urls = matches
      .filter((u) => !u.includes("duckduckgo.com"))
      .slice(0, 5);
  }

  console.log("✅ URLs from DuckDuckGo:", urls);

  // Step 2: Crawl/Extract each URL via Firecrawl
  const crawledMarkdown: string[] = [];
  for (const url of urls) {
    try {
      const data = await client.scrape(url);
      const markdown = (data as any)?.data?.markdown ?? (data as any)?.markdown;
      if (markdown) {
        crawledMarkdown.push(`# ${url}\n\n${markdown}`);
      }
    } catch (err) {
      console.error(`❌ Firecrawl scrape failed for ${url}:`, err);
    }
  }

  // Step 3: Summarize + Synthesize the crawled content
  const aggregated = crawledMarkdown.join("\n\n---\n\n");
  const modelMessages: UIMessage[] = [
    {
      id: crypto.randomUUID(),
      role: "user",
      parts: [
        {
          type: "text",
          text: `Synthesize a detailed yet concise research comparison from the following crawled markdown content for query "${query}". Include citations to URLs inline like [^n].\n\n${aggregated}`,
        },
      ],
    },
  ];

  const result = streamText({
    model: openai("gpt-4.1"),
    system: [
      "You are an advanced multi-source web researcher agent.",
      "Aggregate and summarize factual knowledge across crawled sources.",
      "Cite URLs inline like [^1] and finish with a SOURCES section listing them cleanly.",
    ].join(" "),
    // Normalize message format for model compatibility
    messages: modelMessages.map((m) => ({
      role: m.role,
      content:
        Array.isArray(m.parts) && m.parts.length
          ? m.parts
              .map((p) =>
                typeof p === "object" && "text" in p && typeof p.text === "string" ? p.text : ""
              )
              .join("\n")
          : "",
    })),
    stopWhen: stepCountIs(8),
    onStepFinish({ text, toolCalls, toolResults }) {
      console.log("📡 Step finished", { textLength: text?.length ?? 0, toolCalls, toolResults });
    },
  });

  return result.toUIMessageStreamResponse({
    onError: (err) => (err instanceof Error ? err.message : String(err ?? "error")),
    messageMetadata: ({ part }) => (part.type === "finish" ? { totalUsage: part.totalUsage } : undefined),
  });
}