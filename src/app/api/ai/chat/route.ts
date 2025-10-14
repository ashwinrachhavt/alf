import { streamText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { convertToModelMessages, UIMessage } from 'ai';
import { getFirecrawlClient } from '@/lib/firecrawl';
import { env } from '@/lib/env';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages, editorContent }: { messages: UIMessage[]; editorContent?: any } =
      await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const firecrawl = getFirecrawlClient();

    // Lightweight retry helper
    async function withRetry<T>(fn: () => Promise<T>, tries = 3, baseMs = 400): Promise<T> {
      let lastErr: any;
      for (let i = 0; i < tries; i++) {
        try {
          return await fn();
        } catch (e) {
          lastErr = e;
          await new Promise(r => setTimeout(r, baseMs * Math.pow(2, i)));
        }
      }
      throw lastErr;
    }

    const systemPrompt = `You are an advanced AI writing assistant with deep research capabilities.

You have access to the following tools:
1. deepResearch - Conduct comprehensive research on any topic using web search, reranking, and content extraction
2. improveWriting - Improve existing text for clarity, grammar, and professionalism
3. generateContent - Generate new content based on user requirements

When the user asks you to research something:
1. Use the deepResearch tool to gather information
2. Synthesize the findings into a well-structured response with proper citations
3. Always include sources in your response

${editorContent ? `\n\nCurrent document context:\n${JSON.stringify(editorContent)}` : ''}

Be helpful, accurate, and cite your sources when providing information from research.`;

    const result = await streamText({
      model: openai(env.RESEARCH_MODEL || 'gpt-4-turbo-preview'),
      system: systemPrompt,
      messages: convertToModelMessages(messages),
      tools: {
        deepResearch: tool({
          description: `Conduct deep research on a topic. This tool:
1. Searches the web for 15-30 relevant sources
2. Reranks them by relevance and authority
3. Scrapes and extracts key content
4. Synthesizes findings with proper citations

Use this when the user asks questions requiring current information or comprehensive research.`,
          inputSchema: z.object({
            query: z
              .string()
              .min(1)
              .describe('The research query or topic to investigate'),
            topN: z
              .number()
              .int()
              .min(3)
              .max(15)
              .default(8)
              .describe('Number of top sources to analyze'),
          }),
          execute: async ({ query, topN }) => {
            try {
              // Step 1: Search web
              const searchRes = await withRetry(() => firecrawl.search(query));
              if (!searchRes?.success) {
                return JSON.stringify({
                  error: 'Search failed',
                  query,
                });
              }

              const raw = searchRes.data as any;
              const items: any[] = Array.isArray(raw)
                ? raw
                : Array.isArray(raw?.results)
                  ? raw.results
                  : Array.isArray(raw?.data)
                    ? raw.data
                    : [];

              const candidates = items
                .map(r => ({
                  url: r.url || r.link || r.href || r?.metadata?.url || '',
                  title: r.title || r.name || r?.metadata?.title || '',
                  snippet:
                    r.snippet ||
                    r.description ||
                    r.summary ||
                    r?.metadata?.description ||
                    '',
                }))
                .filter(r => r.url)
                .reduce((acc: any[], cur: any) => {
                  if (!acc.some(a => a.url === cur.url)) acc.push(cur);
                  return acc;
                }, [])
                .slice(0, 30);

              if (candidates.length === 0) {
                return JSON.stringify({
                  error: 'No sources found',
                  query,
                });
              }

              // Step 2: Rerank using AI
              const rerankPrompt = `Query: ${query}\n\nCandidates:\n${JSON.stringify(candidates, null, 2)}\n\nRank these by relevance, authority, and recency. Return JSON:\n{ "ranked": [ { "url": string, "score": number, "reason": string } ] }`;

              let rankedUrls: string[];
              try {
                const rerankResult = await streamText({
                  model: openai(env.RERANK_MODEL || 'gpt-4-turbo-preview'),
                  prompt: rerankPrompt,
                  temperature: 0,
                });

                // Wait for completion
                let fullText = '';
                for await (const chunk of rerankResult.textStream) {
                  fullText += chunk;
                }

                const parsed = JSON.parse(fullText.trim());
                rankedUrls =
                  parsed?.ranked
                    ?.slice(0, topN)
                    .map((r: any) => r.url)
                    .filter(Boolean) || candidates.slice(0, topN).map(c => c.url);
              } catch (e) {
                rankedUrls = candidates.slice(0, topN).map(c => c.url);
              }

              // Step 3: Scrape content
              const scrapedDocs: any[] = [];
              await Promise.allSettled(
                rankedUrls.map(async (url: string) => {
                  try {
                    const scrapeRes = await withRetry(() => firecrawl.scrape(url));
                    if (!scrapeRes?.success) return;

                    const d: any = scrapeRes.data;
                    const title = d?.title || d?.metadata?.title || url;
                    let text =
                      typeof d === 'string'
                        ? d
                        : d?.markdown ||
                          d?.content ||
                          d?.text ||
                          d?.article?.content ||
                          '';

                    if (typeof text !== 'string') text = JSON.stringify(text);

                    scrapedDocs.push({
                      url,
                      title,
                      text: text.slice(0, 4000),
                      date: d?.metadata?.publishedDate || d?.date || null,
                    });
                  } catch (e) {
                    // Skip failed scrapes
                  }
                }),
              );

              return JSON.stringify({
                query,
                sourceCount: scrapedDocs.length,
                sources: scrapedDocs,
              });
            } catch (error: any) {
              return JSON.stringify({
                error: error?.message || 'Research failed',
                query,
              });
            }
          },
        }),

        improveWriting: tool({
          description:
            'Improve existing text for clarity, grammar, professionalism, and readability',
          inputSchema: z.object({
            text: z.string().describe('The text to improve'),
            style: z
              .enum(['professional', 'casual', 'academic', 'concise'])
              .default('professional')
              .describe('The desired writing style'),
          }),
          execute: async ({ text, style }) => {
            const improveResult = await streamText({
              model: openai('gpt-4-turbo-preview'),
              prompt: `Improve the following text to be more ${style}. Fix grammar, improve clarity, and enhance readability:\n\n${text}`,
            });

            let fullText = '';
            for await (const chunk of improveResult.textStream) {
              fullText += chunk;
            }

            return fullText;
          },
        }),

        generateContent: tool({
          description: 'Generate new content based on user requirements',
          inputSchema: z.object({
            topic: z.string().describe('What to write about'),
            type: z
              .enum(['paragraph', 'outline', 'summary', 'expansion'])
              .default('paragraph')
              .describe('Type of content to generate'),
            length: z
              .enum(['short', 'medium', 'long'])
              .default('medium')
              .describe('Desired length'),
          }),
          execute: async ({ topic, type, length }) => {
            const lengthGuide = {
              short: '2-3 sentences',
              medium: '1-2 paragraphs',
              long: '3-4 paragraphs',
            };

            const generateResult = await streamText({
              model: openai('gpt-4-turbo-preview'),
              prompt: `Generate ${type} content about: ${topic}\n\nLength: ${lengthGuide[length]}`,
            });

            let fullText = '';
            for await (const chunk of generateResult.textStream) {
              fullText += chunk;
            }

            return fullText;
          },
        }),
      },
      stopWhen: ({ steps }) => steps.length >= 5,
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
