import { formatPct, formatUsd, formatWeight, signedClass } from "@/lib/format";
import type { FundSnapshot } from "@/lib/types";
import { cn } from "cn";

function Stat({
  label,
  value,
  hint,
  valueClass,
}: {
  label: string;
  value: string;
  hint?: string;
  valueClass?: string;
}) {
  return (
    <div className="min-w-0 px-3 py-2 sm:px-4">
      <div className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
        {label}
      </div>
      <div className={cn("font-mono text-sm font-medium tabular-nums", valueClass)}>
        {value}
      </div>
      {hint ? (
        <div className="font-mono text-[10px] text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}

export function StatsRow({ snapshot }: { snapshot: FundSnapshot }) {
  const { stats } = snapshot;
  return (
    <div className="grid grid-cols-2 divide-y border-b sm:grid-cols-4 lg:grid-cols-8 lg:divide-x lg:divide-y-0">
      <Stat
        label="NAV"
        value={formatUsd(snapshot.nav)}
        hint={`${formatUsd(snapshot.cash)} cash`}
      />
      <Stat
        label="P&L"
        value={formatUsd(snapshot.pnl)}
        hint={formatPct(snapshot.pnlPct)}
        valueClass={signedClass(snapshot.pnl)}
      />
      <Stat
        label="Realized"
        value={formatUsd(snapshot.realizedPnl)}
        valueClass={signedClass(snapshot.realizedPnl)}
      />
      <Stat
        label="Unrealized"
        value={formatUsd(snapshot.unrealizedPnl)}
        valueClass={signedClass(snapshot.unrealizedPnl)}
      />
      <Stat label="Buys" value={String(stats.buys)} hint={`${stats.sells} sells`} />
      <Stat
        label="Losses"
        value={String(stats.losses)}
        hint={`${stats.wins} wins`}
        valueClass={stats.losses ? "text-sell" : undefined}
      />
      <Stat
        label="Win rate"
        value={stats.sells ? formatPct(stats.winRate) : "—"}
      />
      <Stat
        label="Max DD"
        value={formatPct(-stats.maxDrawdown || 0)}
        hint={`${formatWeight(stats.grossExposure)} invested`}
        valueClass="text-sell"
      />
    </div>
  );
}
