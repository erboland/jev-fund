import { NextResponse } from "next/server";
import { redact } from "@/lib/model";
import { currentSnapshot } from "@/lib/runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await currentSnapshot();
    return NextResponse.json(snapshot);
  } catch (err) {
    return NextResponse.json(
      { error: redact(err instanceof Error ? err.message : "Yahoo quotes failed") },
      { status: 502 }
    );
  }
}
