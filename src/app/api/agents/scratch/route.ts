import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const { prompt = "Say hi" } = await req.json();

  const result = await generateText({
    model: google('gemini-2.5-flash'),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Summarize this video',
          },
          {
            type: 'file',
            data: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            mediaType: 'video/mp4',
          },
        ],
      },
    ],
  });

  return result.toTextStreamResponse();
}
