import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirecrawlClient } from "@/lib/firecrawl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const Body = z.object({
  url: z.string().url(),
  schema: z.unknown().optional(),
  prompt: z.string().optional(),
}).passthrough();

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid 'url'" },
        { status: 400 }
      );
    }

    const client = getFirecrawlClient();
    const payload = parsed.data as any;
    const res = await client.extract(payload);

    // Fallback: some Firecrawl variants require schema for extract; try scrape on 422-like errors
    if (!res.success && (res.error || "").includes("422")) {
      const scraped = await client.scrape({ url: parsed.data.url });
      return NextResponse.json(scraped, { status: scraped.success ? 200 : 502 });
    }

    return NextResponse.json(res, { status: res.success ? 200 : 502 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}
