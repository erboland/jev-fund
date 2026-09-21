import { formatUsd } from "@/lib/format";
import type { EquityPoint } from "@/lib/types";
import { STARTING_CASH } from "@/lib/universe";

export function EquityChart({
  equity,
  className,
}: {
  equity: EquityPoint[];
  className?: string;
}) {
  if (equity.length < 2) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Equity curve appears after the first ticks.
      </div>
    );
  }

  const width = 640;
  const height = 220;
  const pad = 8;
  const values = equity.map((p) => p.nav);
  const min = Math.min(STARTING_CASH, ...values) * 0.997;
  const max = Math.max(STARTING_CASH, ...values) * 1.003;
  const span = Math.max(1, max - min);
  const x = (i: number) => pad + (i / (values.length - 1)) * (width - pad * 2);
  const y = (v: number) =>
    height - pad - ((v - min) / span) * (height - pad * 2);

  const d = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(" ");
  const last = values[values.length - 1];
  const up = last >= STARTING_CASH;
  const color = up ? "#0FA968" : "#E4573D";
  const baseY = y(STARTING_CASH);

  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
          Equity
        </h2>
        <span className="font-mono text-[11px] text-muted-foreground">
          start {formatUsd(STARTING_CASH, true)} · Yahoo closes
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[200px] w-full sm:h-[240px]"
        role="img"
        aria-label="Fund equity curve"
      >
        <line
          x1={pad}
          x2={width - pad}
          y1={baseY}
          y2={baseY}
          stroke="#ECECEA"
          strokeDasharray="4 4"
        />
        <path d={d} fill="none" stroke={color} strokeWidth="2" />
      </svg>
    </div>
  );
}
