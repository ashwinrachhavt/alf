import OpenAI from "openai";
import { streamText } from "ai";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const client = new OpenAI();

  const result = await streamText({
    model: client.chat.completions,
    prompt: `Act as a deep researcher. ${prompt}\nReturn TL;DR, bullets, narrative, and sources.`,
  });

  return result.toDataStreamResponse();
}

