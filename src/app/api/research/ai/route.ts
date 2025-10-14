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
          description: "Scrape multiple URLs via Firecrawl. Returns [{url,title,text,quotes?}] with truncated text per doc.",
          inputSchema: z.object({
            urls: z.array(z.string().url()),
            maxChars: z.number().int().min(500).max(12000).default(4000),
            extractQuotes: z.boolean().optional().default(true),
          }),
          execute: async ({ urls, maxChars, extractQuotes }) => {
            const results: any[] = [];
            await Promise.allSettled(
              urls.map(async (u: string) => {
                const r = await withRetry(() => firecrawl.scrape(u));
                if (!r?.success) return results.push({ url: u, title: "", text: "" });
                const d: any = r.data;
                const title = d?.title || d?.metadata?.title || "";
                let text = typeof d === "string" ? d : (d?.markdown || d?.content || d?.text || d?.article?.content || d?.raw || JSON.stringify(d));
                if (typeof text !== "string") text = JSON.stringify(text);
                results.push({ url: u, title, text: text.slice(0, maxChars) });
              })
            );

            // Optional per-doc quote extraction (limit to first 5 docs)
            if (extractQuotes) {
              const subset = results.slice(0, 5);
              for (const doc of subset) {
                if (!doc.text || doc.text.length < 400) continue;
                try {
                  const qPrompt = `From the following article text, extract up to 2 short direct quotes (verbatim) that support key claims relevant to the research query. Return strict JSON like:\n{ "quotes": [ { "quote": string, "claim": string } ] }\n\nText:\n${doc.text}`;
                  const out = await generateText({ model: openai(env.RESEARCH_MODEL), prompt: qPrompt, temperature: 0 });
                  const parsed = JSON.parse(out.text.trim());
                  if (parsed?.quotes && Array.isArray(parsed.quotes)) {
                    doc.quotes = parsed.quotes.slice(0, 2);
                  }
                } catch {}
              }
            }

            return JSON.stringify({ docs: results });
          },
        },
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
