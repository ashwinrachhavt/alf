import { NextResponse } from "next/server";
import { readTree } from "@/lib/knowledge";

export const dynamic = "force-dynamic";

export async function GET() {
  const tree = await readTree();
  return NextResponse.json(tree);
}

