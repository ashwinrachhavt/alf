// runtime: Next.js App Router API (Node runtime for community tools)
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";

// LangChain + LangGraph
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { AIMessageChunk } from "@langchain/core/messages";
import { z } from "zod";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

// Tools
import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";

// --- Minimal schema for request body
const BodySchema = z.object({
  query: z.string().min(1, "query is required"),
  // optional toggles
  maxIterations: z.number().int().min(1).max(12).optional(),
});

const SYSTEM = `
You are a deep-research analyst. Your goal is to provide comprehensive, well-sourced answers efficiently.

RESEARCH STRATEGY:
1. Perform 1-3 focused web searches to gather current information
2. Synthesize the information from search results
3. Write your final answer with proper citations
4. STOP after providing your answer - do not continue searching

IMPORTANT: After gathering information and writing your response, you MUST stop. Do not perform additional searches or iterations.

OUTPUT FORMAT:
- **TL;DR**: 1-2 sentence summary at the top
- **Key Findings**: 3-5 bullet points with key insights
- **Detailed Analysis**: 2-3 paragraph narrative with context and implications
- **Sources**: Numbered list of all sources cited with titles and URLs

When you make an assertion, add inline citations like [1], [2]. Be concise and efficient.
`.trim();

// Helper: make a text encoder once
const encoder = new TextEncoder();

export async function POST(req: NextRequest) {
  try {
    // Parse input
    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'query' parameter" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const { query, maxIterations = 15 } = parsed.data;

    // ---- Create tools
    const ddg = new DuckDuckGoSearch({
      maxResults: 3, // Reduced to prevent overwhelming the agent
    });

    // ---- Create model with better stopping
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.1, // Lower temperature for more focused responses
      streaming: true,
      maxTokens: 2000, // Limit response length to encourage completion
    });

    // ---- Build agent WITHOUT checkpointer to avoid thread_id issues
    // For stateless research, we don't need conversation history
    const agent = createReactAgent({
      llm,
      tools: [ddg],
      messageModifier: new SystemMessage(SYSTEM),
      // Remove checkpointer for stateless operation
    });

    // We'll stream out using SSE format to match existing client expectations
    const stream = new TransformStream<Uint8Array, Uint8Array>();
    const writer = stream.writable.getWriter();

    // Run agent in background
    (async () => {
      try {
        // Send initial status
        await writer.write(
          encoder.encode(`event: status\ndata: ${JSON.stringify({ message: "Research started with AI agent and web search", timestamp: new Date().toISOString() })}\n\n`)
        );

        // Seed with the user prompt
        const input = { messages: [new HumanMessage(query)] };

        // Stream the graph as events (no config needed without checkpointer)
        const agentStream = await agent.stream(input, {
          streamMode: "events",
          recursionLimit: maxIterations,
        });

        let toolCallCount = 0;
        let isFirstToken = true;

        for await (const event of agentStream) {
          // Model token stream
          if (event.event === "on_chat_model_stream" && event.data?.chunk) {
            const chunk = event.data.chunk as AIMessageChunk;

            // Handle both string content and content array
            let text = "";
            if (typeof chunk.content === "string") {
              text = chunk.content;
            } else if (Array.isArray(chunk.content) && chunk.content.length > 0) {
              const firstContent = chunk.content[0];
              if (typeof firstContent === "object" && "text" in firstContent) {
                text = firstContent.text || "";
              }
            }

            if (text) {
              // Send a newline before first token for better formatting
              if (isFirstToken) {
                await writer.write(
                  encoder.encode(`event: text\ndata: ${JSON.stringify({ delta: "\n\n" })}\n\n`)
                );
                isFirstToken = false;
              }

              await writer.write(
                encoder.encode(`event: text\ndata: ${JSON.stringify({ delta: text })}\n\n`)
              );
            }
          }

          // Tool start: show what we're searching
          if (event.event === "on_tool_start") {
            const toolName = event.name;
            if (toolName === "duckduckgo_search") {
              toolCallCount++;
              const query = event.data?.input;
              if (typeof query === "string" && query.trim()) {
                await writer.write(
                  encoder.encode(`event: tool\ndata: ${JSON.stringify({
                    phase: "call",
                    name: toolName,
                    args: query,
                    message: `Searching: ${query}`
                  })}\n\n`)
                );
              }
            }
          }

          // Tool end: show brief result summary
          if (event.event === "on_tool_end") {
            const toolName = event.name;
            if (toolName === "duckduckgo_search") {
              try {
                const output = event.data?.output;
                let resultSummary = "No results";

                if (Array.isArray(output) && output.length > 0) {
                  const top = output[0];
                  const title = top.title ?? "result";
                  const url = top.link ?? top.url ?? "";
                  resultSummary = `Found: ${title}${url ? ` (${url})` : ""}`;
                }

                await writer.write(
                  encoder.encode(`event: tool\ndata: ${JSON.stringify({
                    phase: "result",
                    name: toolName,
                    output: resultSummary,
                    message: resultSummary
                  })}\n\n`)
                );
              } catch (err) {
                // ignore parsing issues
              }
            }
          }

          // Status updates for agent thinking
          if (event.event === "on_chain_start") {
            if (event.name === "agent") {
              await writer.write(
                encoder.encode(`event: status\ndata: ${JSON.stringify({
                  message: "Agent analyzing information...",
                  timestamp: new Date().toISOString()
                })}\n\n`)
              );
            }
          }
        }

        // Send completion event
        await writer.write(
          encoder.encode(`event: done\ndata: ${JSON.stringify({
            message: `Research completed with ${toolCallCount} web searches`,
            timestamp: new Date().toISOString()
          })}\n\n`)
        );

      } catch (streamError: any) {
        console.error("Stream processing error:", streamError);
        await writer.write(
          encoder.encode(`event: error\ndata: ${JSON.stringify({
            message: streamError?.message || String(streamError),
            timestamp: new Date().toISOString()
          })}\n\n`)
        );
      } finally {
        try {
          await writer.close();
        } catch (closeError) {
          console.error("Error closing writer:", closeError);
        }
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });

  } catch (error: any) {
    console.error("Research endpoint error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error?.message || String(error),
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
