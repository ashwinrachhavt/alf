import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const Body = z.object({
  sources: z.array(
    z.object({
      url: z.string().url(),
      title: z.string().optional(),
      author: z.string().optional(),
      publishedAt: z.string().datetime().optional(),
      rank: z.number().int().optional(),
      score: z.number().optional(),
      content: z.string().optional(),
      quotes: z
        .array(
          z.object({
            quote: z.string(),
            claim: z.string().optional(),
          })
        )
        .optional(),
    })
  ),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id: runId } = await ctx.params;
    const json = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    const data = parsed.data.sources.map((s) => ({
      runId,
      url: s.url,
      title: s.title ?? null,
      author: s.author ?? null,
      publishedAt: s.publishedAt ? new Date(s.publishedAt) : null,
      rank: s.rank ?? null,
      score: s.score ?? null,
      content: s.content ? s.content.slice(0, 12000) : null,
    }));

    // Insert sources, then quotes linked to them
    const created: { id: string; url: string }[] = [];
    for (let i = 0; i < data.length; i++) {
      const s = await prisma.researchSource.create({ data: data[i] });
      created.push({ id: s.id, url: s.url });
      const reqSrc = parsed.data.sources[i];
      if (reqSrc.quotes && reqSrc.quotes.length) {
        await prisma.researchQuote.createMany({
          data: reqSrc.quotes.map((q) => ({ sourceId: s.id, quote: q.quote, claim: q.claim ?? null })),
        });
      }
    }

    return NextResponse.json({ ok: true, count: created.length });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}

