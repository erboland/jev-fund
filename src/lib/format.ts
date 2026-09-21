const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const pct = new Intl.NumberFormat("en-US", {
  style: "percent",
  signDisplay: "exceptZero",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatUsd(n: number, compact = false) {
  return (compact ? usdCompact : usd).format(n);
}

export function formatPct(n: number) {
  return pct.format(n);
}

export function formatWeight(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export function formatShares(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function formatProb(n: number) {
  return `${Math.round(n * 100)}%`;
}

export function formatLatency(ms: number) {
  return `${Math.round(ms)} ms`;
}

export function signedClass(n: number) {
  if (n > 0.0001) return "text-buy";
  if (n < -0.0001) return "text-sell";
  return "text-muted-foreground";
}

export function clock(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
