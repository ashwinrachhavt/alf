import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirecrawlClient } from "@/lib/firecrawl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const Body = z.object({ url: z.string().url() });

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
    const res = await client.crawl(parsed.data.url);
    return NextResponse.json(res, { status: res.success ? 200 : 502 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}

