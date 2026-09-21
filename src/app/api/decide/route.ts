import { NextResponse } from "next/server";
import { decide, jevConfigured } from "@/lib/model";
import type { MarketState } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const state = (await req.json()) as MarketState;
  const tick = Number(req.headers.get("x-tick") ?? 0);
  const decision = await decide(state, tick);
  return NextResponse.json({
    ...decision,
    jevConfigured: jevConfigured(),
  });
}
