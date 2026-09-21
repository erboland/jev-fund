import { Badge } from "@/components/ui/badge";
import { formatLatency, formatProb, formatUsd } from "@/lib/format";
import type { DecisionEvent } from "@/lib/types";
import { cn } from "cn";

export function DecisionPanel({ latest }: { latest: DecisionEvent | null }) {
  if (!latest) {
    return (
      <div className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
        Waiting for the first tick…
      </div>
    );
  }

  const side = latest.action;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
          This tick
        </h2>
        <span className="font-mono text-[11px] text-muted-foreground">
          #{latest.tick} · {formatLatency(latest.latencyMs)}
        </span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="font-mono text-xs text-muted-foreground">
            {latest.ticker}
          </div>
          <div
            className={cn(
              "font-heading text-4xl font-semibold tracking-tight uppercase",
              side === "buy" && "text-buy",
              side === "sell" && "text-sell",
              side === "hold" && "text-muted-foreground"
            )}
          >
            {side}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm tabular-nums">
            {formatUsd(latest.price)}
          </div>
          <Badge variant="outline" className="mt-1 font-mono text-[10px]">
            {latest.executed ? "filled paper" : "no order"}
          </Badge>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{latest.note}</p>
      <div className="grid grid-cols-3 gap-2">
        {(["buy", "sell", "hold"] as const).map((k) => (
          <div key={k} className="rounded-lg bg-muted/70 px-2 py-1.5">
            <div className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              {k}
            </div>
            <div
              className={cn(
                "font-mono text-sm tabular-nums",
                k === "buy" && "text-buy",
                k === "sell" && "text-sell"
              )}
            >
              {formatProb(latest.probabilities[k])}
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-white">
              <div
                className={cn(
                  "h-full",
                  k === "buy" && "bg-buy",
                  k === "sell" && "bg-sell",
                  k === "hold" && "bg-[#C8C5BB]"
                )}
                style={{ width: `${Math.round(latest.probabilities[k] * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
