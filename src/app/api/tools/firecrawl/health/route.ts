import { NextResponse } from "next/server";
import { getFirecrawlClient } from "@/lib/firecrawl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const client = getFirecrawlClient();
  const res = await client.health();
  return NextResponse.json(res, { status: res.success ? 200 : 502 });
}

