import { getRelevantDocs } from "@/lib/knowledge";
import OpenAI from "openai";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const client = new OpenAI();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query } = body;
    
    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'query' parameter" }), 
        { 
          status: 400, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    }

    // Get relevant knowledge base context
    const kb = await getRelevantDocs(query, 3);
    const kbContext = kb
      .map((d) => `# KB: ${d.path}\n\n${d.content.substring(0, 4000)}`)
      .join("\n\n---\n\n");

    const systemPrompt = `You are a Deep Research Agent specializing in comprehensive information gathering and analysis.

RESEARCH PROCESS:
1. Plan 2-3 targeted sub-queries based on the main research task
2. Use your knowledge to gather diverse, credible information
3. Extract key insights, facts, and relevant details
4. Synthesize findings into a structured report

OUTPUT FORMAT:
- **TL;DR**: 1-2 sentence summary
- **Key Findings**: 3-5 bullet points with key insights
- **Detailed Analysis**: 2-3 paragraph narrative with context and implications
- **Sources**: Include any relevant sources or references you can provide

QUALITY STANDARDS:
- Provide comprehensive and accurate information
- Structure your response clearly
- Include factual details and context
- Note any limitations or uncertainties`;

    const userPrompt = kbContext 
      ? `Knowledge Base Context:\n${kbContext}\n\n---\n\nResearch Task: ${query}`
      : `Research Task: ${query}`;

    const stream = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      stream: true,
    });

    const encoder = new TextEncoder();
    const ts = new TransformStream<Uint8Array, Uint8Array>();
    const writer = ts.writable.getWriter();

    (async () => {
      try {
        // Send initial status
        await writer.write(
          encoder.encode(`event: status\ndata: ${JSON.stringify({ message: "Research started", timestamp: new Date().toISOString() })}\n\n`)
        );

        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta?.content || "";
          if (delta) {
            await writer.write(
              encoder.encode(`event: text\ndata: ${JSON.stringify({ delta })}\n\n`)
            );
          }
        }

        // Send completion event
        await writer.write(
          encoder.encode(`event: done\ndata: ${JSON.stringify({ 
            message: "Research completed successfully",
            timestamp: new Date().toISOString()
          })}\n\n`)
        );

      } catch (streamError) {
        console.error("Stream processing error:", streamError);
        await writer.write(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ 
            message: `Stream error: ${String(streamError)}`,
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

    return new Response(ts.readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });

  } catch (error) {
    console.error("Research endpoint error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: String(error),
        timestamp: new Date().toISOString()
      }), 
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}
