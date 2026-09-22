import type { FundSnapshot, FundStats, PlaybackFrame, Trade } from "./types";

/** Prefer the recent window with the most paper fills, so a replay is not a string of holds. */
export function selectTape(frames: PlaybackFrame[], size: number): PlaybackFrame[] {
  if (frames.length <= size) return frames;
  let bestStart = frames.length - size;
  let bestScore = -1;
  for (let i = 0; i <= frames.length - size; i++) {
    let score = 0;
    for (let j = i; j < i + size; j++) {
      const decision = frames[j].latestDecision;
      if (!decision) continue;
      if (decision.executed) score += 3;
      else if (decision.action !== "hold") score += 1;
    }
    if (score >= bestScore) {
      bestScore = score;
      bestStart = i;
    }
  }
  return frames.slice(bestStart, bestStart + size);
}

function statsFor(
  trades: Trade[],
  holds: number,
  maxDrawdown: number,
  grossExposure: number
): FundStats {
  const sells = trades.filter((t) => t.side === "sell" && t.realizedPnl != null);
  const wins = sells.filter((t) => (t.realizedPnl ?? 0) > 0);
  const losses = sells.filter((t) => (t.realizedPnl ?? 0) < 0);
  const avg = (xs: Trade[]) =>
    xs.length ? xs.reduce((s, t) => s + (t.realizedPnl ?? 0), 0) / xs.length : 0;
  return {
    trades: trades.length,
    buys: trades.filter((t) => t.side === "buy").length,
    sells: sells.length,
    holds,
    wins: wins.length,
    losses: losses.length,
    winRate: sells.length ? wins.length / sells.length : 0,
    avgWin: avg(wins),
    avgLoss: avg(losses),
    maxDrawdown,
    grossExposure,
  };
}

/** Show the book as it stood at `frame`, with the equity line still drawing. */
export function projectSnapshot(full: FundSnapshot, frame: PlaybackFrame): FundSnapshot {
  const windowStart = full.playback?.[0]?.tick ?? frame.tick;
  const prior = [...full.equity].reverse().find((e) => e.tick < windowStart);
  const equity = [
    ...(prior ? [prior] : []),
    ...full.equity.filter((e) => e.tick >= windowStart && e.tick <= frame.tick),
  ];
  const trades = full.trades.filter((t) => t.tick <= frame.tick);
  const decisions = full.decisions.filter((d) => d.tick <= frame.tick);
  const gross =
    frame.nav > 0
      ? frame.holdings.reduce((s, h) => s + h.marketValue, 0) / frame.nav
      : 0;
  return {
    ...full,
    tick: frame.tick,
    ts: frame.ts,
    cash: frame.cash,
    nav: frame.nav,
    pnl: frame.pnl,
    pnlPct: frame.pnlPct,
    realizedPnl: frame.realizedPnl,
    unrealizedPnl: frame.unrealizedPnl,
    holdings: frame.holdings,
    latestDecision: frame.latestDecision,
    equity: equity.length >= 2 ? equity : full.equity.slice(0, 2),
    trades,
    decisions,
    stats: statsFor(
      trades,
      decisions.filter((d) => d.action === "hold" || !d.executed).length,
      frame.maxDrawdown,
      gross
    ),
  };
}
