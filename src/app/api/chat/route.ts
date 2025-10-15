import { NextRequest } from "next/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { messages, prompt } = await req.json();
  
    // Normalize and validate messages
    console.log("Received /api/chat request:", { messages, prompt });
    let messageArray: any[] | undefined = undefined;
  
    if (Array.isArray(messages)) {
      messageArray = messages;
    } else if (messages && typeof messages === "object") {
      messageArray = [messages];
    }
  
    const result = await streamText({
      model: openai("gpt-4o-mini"),
      ...(messageArray && messageArray.length > 0
        ? { messages: messageArray.map((m) => ({
            role: m.role ?? "user",
            content: m.content ?? "",
          })) }
        : { prompt: String(prompt ?? "") }),
    });
  
    const response = result.toTextStreamResponse();
    return response;
  } catch (err) {
    console.error("Unhandled server error in /api/chat:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
