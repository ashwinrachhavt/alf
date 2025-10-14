import { NextResponse } from "next/server";
import { getFirecrawlClient } from "@/lib/firecrawl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Next.js 15: `params` is async; await it before use
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const crawlId = id;
  if (!crawlId || typeof crawlId !== "string") {
    return NextResponse.json(
      { success: false, error: "Missing crawl id" },
      { status: 400 }
    );
  }

  const client = getFirecrawlClient();
  const res = await client.crawlStatus(crawlId);
  return NextResponse.json(res, { status: res.success ? 200 : 502 });
}
