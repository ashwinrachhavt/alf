import { Agent, run } from "@openai/agents";
import { webSearchTool } from "@openai/agents-openai";
import { getRelevantDocs } from "@/lib/knowledge";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const researcher = new Agent({
  name: "researcher",
  instructions:
    "You are a Deep Research Agent. Use web search to gather sources. For each key claim, include a direct quote, URL, author/source, and ISO date. Return TL;DR, bullets, a short narrative, and a sources table (URL, author/source, date, key claim).",
  tools: [webSearchTool()],
  model: "gpt-4o-mini",
});

export async function POST(req: Request) {
  const { query } = await req.json();
  if (!query) return new Response("Missing query", { status: 400 });

  const kb = await getRelevantDocs(query, 3);
  const kbContext = kb
    .map((d) => `# KB: ${d.path}\n\n${d.content.substring(0, 4000)}`)
    .join("\n\n---\n\n");

  const prompt =
    `You are a Deep Research Agent.\n` +
    `Use web_search to gather sources, extract quotes, URLs, and publish dates.\n` +
    `Return a concise TL;DR, bullets, a short narrative, and a sources table with (URL, author/source, date, key claim).\n\n` +
    (kbContext ? `KB Context (optional):\n${kbContext}\n\n` : "") +
    `${query}`;

  const streamed = await run(researcher, { input: prompt }, { stream: true });
  const eventStream = streamed.toStream();

  const encoder = new TextEncoder();
  const ts = new TransformStream<Uint8Array, Uint8Array>();
  const writer = ts.writable.getWriter();

  (async () => {
    // Early flush to show progress in the client
    writer.write(encoder.encode("event: status\n" + `data: {"message":"started"}` + "\n\n"));
    try {
      const reader = (eventStream as ReadableStream<any>).getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const ev = value as any;
        // Text deltas
        if (ev?.type === "raw_model_stream_event" && ev?.data?.type === "output_text_delta") {
          const delta = (ev as any).data.delta || "";
          if (delta) writer.write(encoder.encode("event: text\n" + `data: ${JSON.stringify({ delta })}` + "\n\n"));
          continue;
        }
        // Tool and run items
        if (ev?.type === "run_item_stream_event") {
          const item = ev?.data?.item;
          if (!item) continue;
          // Tool call started
          if (item.type === "tool_call") {
            const name = item.tool?.name || item.name || "tool";
            const args = item.arguments ? JSON.stringify(item.arguments).slice(0, 300) : undefined;
            writer.write(
              encoder.encode(
                "event: tool\n" + `data: ${JSON.stringify({ phase: "call", name, args })}` + "\n\n"
              )
            );
            continue;
          }
          // Tool call output
          if (item.type === "tool_call_output") {
            const name = item.tool?.name || item.name || "tool";
            const out = item.output ? String(item.output).slice(0, 300) : undefined;
            writer.write(
              encoder.encode(
                "event: tool\n" + `data: ${JSON.stringify({ phase: "output", name, output: out })}` + "\n\n"
              )
            );
            continue;
          }
        }
        // Agent updates (handoffs or state changes)
        if (ev?.type === "agent_updated_stream_event") {
          const name = ev?.data?.agent?.name || "agent";
          writer.write(encoder.encode("event: status\n" + `data: ${JSON.stringify({ message: "agent", name })}` + "\n\n"));
          continue;
        }
      }
      writer.write(encoder.encode("event: done\n" + "data: {}\n\n"));
    } catch (err) {
      writer.write(
        encoder.encode("event: error\n" + `data: ${JSON.stringify({ message: String(err) })}` + "\n\n")
      );
    } finally {
      try { await writer.close(); } catch {}
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
}
