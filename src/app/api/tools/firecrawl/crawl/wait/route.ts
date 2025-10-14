import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirecrawlClient } from "@/lib/firecrawl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const Body = z.object({
  url: z.string().url(),
  pollMs: z.number().int().min(200).max(5000).optional().default(1500),
  maxRetries: z.number().int().min(1).max(200).optional().default(60),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Missing or invalid 'url'" }, { status: 400 });
    }

    const { url, pollMs, maxRetries } = parsed.data;
    const client = getFirecrawlClient();
    const start = await client.crawl(url);
    if (!start.success || !start.data?.id) {
      return NextResponse.json(start, { status: 502 });
    }

    const id = start.data.id;
    let status = await client.crawlStatus(id);
    let tries = 0;
    while ((status as any)?.data?.status !== "completed" && tries < maxRetries) {
      await new Promise((r) => setTimeout(r, pollMs));
      status = await client.crawlStatus(id);
      tries++;
    }

    return NextResponse.json(status, { status: status.success ? 200 : 502 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Internal error" }, { status: 500 });
  }
}

