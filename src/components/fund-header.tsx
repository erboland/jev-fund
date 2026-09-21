"use client";

import { Badge } from "@/components/ui/badge";
import { SITE } from "@/lib/site";
import type { FundSnapshot } from "@/lib/types";
import { cn } from "cn";

export function FundHeader({
  snapshot,
  connection,
}: {
  snapshot: FundSnapshot | null;
  connection: "live" | "connecting" | "error";
}) {
  const jev = snapshot?.jevConfigured;
  const model = jev ? "jev" : (snapshot?.model ?? "mock");

  return (
    <header className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <h1 className="font-heading text-lg font-semibold tracking-tight">
          {SITE.name}
        </h1>
        <Badge variant="outline" className="font-mono text-[11px] uppercase">
          paper
        </Badge>
        <Badge variant="outline" className="font-mono text-[11px] uppercase">
          {snapshot?.dataSource === "fixture" ? "fixture" : "yahoo"}
        </Badge>
        <Badge
          variant="secondary"
          className={cn(
            "font-mono text-[11px] uppercase",
            jev ? "bg-[#EBE7FC] text-[#4C3EBB]" : "bg-[#FBEED3] text-[#8A5B0E]"
          )}
        >
          {model}
        </Badge>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          <span
            className={cn(
              "size-1.5 rounded-full",
              connection === "live" && "bg-[#4ADE80]",
              connection === "connecting" && "bg-amber-400",
              connection === "error" && "bg-sell"
            )}
          />
          {connection === "live"
            ? "yahoo last print"
            : connection === "connecting"
              ? "connecting"
              : "quote error"}
        </span>
      </div>
      <p className="max-w-xl text-sm text-muted-foreground">
        {process.env.NEXT_PUBLIC_STATIC === "1"
          ? "Yahoo snapshot published to GitHub Pages. Run it locally for the live tape."
          : "Real Yahoo prices on a $100k long-only paper book. Holdings, buys, and losses in public."}
      </p>
    </header>
  );
}
