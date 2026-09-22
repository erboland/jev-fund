import { NextRequest, NextResponse } from "next/server";
import { SITE } from "@/lib/site";
import { currentViewStats, trackSiteOpen } from "@/lib/views-store";

export const dynamic = "force-dynamic";

const ALLOWED_ORIGINS = new Set([
  SITE.customDomainUrl.replace(/\/$/, ""),
  new URL(SITE.pagesUrl).origin,
  "http://127.0.0.1:43147",
  "http://localhost:43147",
]);

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin && ALLOWED_ORIGINS.has(origin.replace(/\/$/, "")) ? origin : null;
  if (!allowed) return {};
  return {
    "access-control-allow-origin": allowed,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    vary: "Origin",
  };
}

function json(
  body: unknown,
  init: ResponseInit & { origin?: string | null } = {}
) {
  const { origin = null, ...rest } = init;
  return NextResponse.json(body, {
    ...rest,
    headers: {
      ...corsHeaders(origin),
      ...(rest.headers ?? {}),
    },
  });
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

export async function GET(req: NextRequest) {
  return json(currentViewStats(), { origin: req.headers.get("origin") });
}

export async function POST(req: NextRequest) {
  let visitorId: string | undefined;
  try {
    const body = (await req.json()) as { visitorId?: string };
    visitorId = body.visitorId;
  } catch {
    visitorId = undefined;
  }
  return json(trackSiteOpen(visitorId), { origin: req.headers.get("origin") });
}
