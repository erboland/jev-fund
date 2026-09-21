import { NextResponse } from "next/server";
import { currentSnapshot } from "@/lib/runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await currentSnapshot();
  return NextResponse.json(snapshot);
}
