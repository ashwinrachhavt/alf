import { streamText, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { getFirecrawlClient } from "@/lib/firecrawl";
import { env } from "@/lib/env";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid 'query'" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const system = `You are a Deep Research Agent.
Follow this explicit workflow and use the provided tools:
1) Use searchWeb to gather a broad set of candidate URLs for the user query (aim 15–30 diverse, recent sources).
2) Use rerank to select the most relevant and authoritative ~8 URLs for the query.
3) Use scrapeMany on the top URLs to pull content (include title/date when available). Keep each document extract concise.
4) Synthesize a rigorous markdown brief with inline bracketed citations like [1], [2] that map to a final Sources table.

Output format:
- TL;DR (1–2 sentences)
- Key Findings (3–7 bullets)
- Narrative (2–4 short paragraphs)
- Sources (table with index, title/source, URL, date, note)`;

    const firecrawl = getFirecrawlClient();

    // lightweight retry helper for flaky upstreams
    async function withRetry<T>(fn: () => Promise<T>, tries = 3, baseMs = 400): Promise<T> {
      let lastErr: any;
      for (let i = 0; i < tries; i++) {
        try {
          return await fn();
        } catch (e) {
          lastErr = e;
          await new Promise((r) => setTimeout(r, baseMs * Math.pow(2, i)));
        }
      }
      throw lastErr;
    }

    const result = await streamText({
      model: openai(env.RESEARCH_MODEL),
      system,
      prompt: `Research task: ${query}`,
      tools: {
        searchWeb: {
          description: "Gather 15–30 candidate results for a query. Returns a normalized array of {url,title,snippet}.",
          inputSchema: z.object({ query: z.string().min(1) }),
          execute: async ({ query }) => {
            const res = await withRetry(() => firecrawl.search(query));
            if (!res?.success) return JSON.stringify({ results: [] });
            const raw = res.data as any;
            const items: any[] = Array.isArray(raw)
              ? raw
              : Array.isArray(raw?.results)
                ? raw.results
                : Array.isArray(raw?.data)
                  ? raw.data
                  : [];
            const normalized = items.map((r) => ({
              url: r.url || r.link || r.href || r?.metadata?.url || "",
              title: r.title || r.name || r?.metadata?.title || "",
              snippet: r.snippet || r.description || r.summary || r?.metadata?.description || "",
            }))
            // filter basic validity and de-duplicate by url
            .filter((r) => r.url)
            .reduce((acc: any[], cur: any) => {
              if (!acc.some((a) => a.url === cur.url)) acc.push(cur);
              return acc;
            }, []);
            return JSON.stringify({ results: normalized.slice(0, 30) });
          },
        },
        rerank: {
          description: "Rerank candidate URLs using OpenAI for this query. Returns topN with scores and reasons.",
          inputSchema: z.object({
            query: z.string(),
            candidates: z.array(z.object({ url: z.string().url(), title: z.string().optional(), snippet: z.string().optional() })),
            topN: z.number().int().min(1).max(20).default(8),
          }),
          execute: async ({ query, candidates, topN }) => {
            const prompt = `Query: ${query}\n\nCandidates (JSON):\n${JSON.stringify(candidates, null, 2)}\n\nTask: Rank candidates by (1) relevance to the query, (2) likely authority/quality, and (3) recency if known.\nReturn strictly the following JSON with at most ${topN} entries, sorted by score desc:\n{ "ranked": [ { "url": string, "score": number, "reason": string } ] }`;
            try {
              const out = await generateText({ model: openai(env.RERANK_MODEL), prompt, temperature: 0 });
              const text = out.text.trim();
              const json = JSON.parse(text);
              if (json?.ranked && Array.isArray(json.ranked)) {
                return JSON.stringify({ ranked: json.ranked.slice(0, topN) });
              }
              // fallback: best-effort heuristic
              const simple = candidates.slice(0, topN).map((c: any) => ({ url: c.url, score: 0.5, reason: "baseline" }));
              return JSON.stringify({ ranked: simple });
            } catch (e) {
              const simple = candidates.slice(0, topN).map((c: any) => ({ url: c.url, score: 0.5, reason: "baseline" }));
              return JSON.stringify({ ranked: simple });
            }
          },
        },
        scrapeMany: {
          description: "Scrape multiple URLs via Firecrawl. Returns [{url,title,text}] with truncated text per doc.",
          inputSchema: z.object({ urls: z.array(z.string().url()), maxChars: z.number().int().min(500).max(12000).default(4000) }),
          execute: async ({ urls, maxChars }) => {
            const results: any[] = [];
            const jobs = urls.map(async (u: string) => {
              const r = await withRetry(() => firecrawl.scrape(u));
              if (!r?.success) {
                results.push({ url: u, title: "", text: "" });
                return;
              }
              const d: any = r.data;
              let title = d?.title || d?.metadata?.title || "";
              let text = "";
              if (typeof d === "string") text = d;
              else text = d?.markdown || d?.content || d?.text || d?.article?.content || d?.raw || JSON.stringify(d);
              if (typeof text !== "string") text = JSON.stringify(text);
              text = text.slice(0, maxChars);
              results.push({ url: u, title, text });
            });
            await Promise.allSettled(jobs);
            return JSON.stringify({ docs: results });
          },
        },
      },
    });

    return result.toTextStreamResponse();
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
