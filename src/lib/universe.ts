import type { Name } from "./types";

export const STARTING_CASH = 100_000;
export const HISTORY_TICKS = 180;
export const TICK_MS = 4_000;
export const BUY_WEIGHT = 0.08;
export const MAX_WEIGHT = 0.22;
export const SEED = 42;

/** Liquid names a paper long/short-ish book can actually hold. */
export const UNIVERSE: Name[] = [
  { ticker: "AAPL", name: "Apple", start: 228.4, beta: 1.05, vol: 0.22 },
  { ticker: "MSFT", name: "Microsoft", start: 428.1, beta: 1.02, vol: 0.2 },
  { ticker: "NVDA", name: "NVIDIA", start: 124.6, beta: 1.55, vol: 0.42 },
  { ticker: "GOOGL", name: "Alphabet", start: 168.9, beta: 1.08, vol: 0.24 },
  { ticker: "AMZN", name: "Amazon", start: 191.2, beta: 1.18, vol: 0.28 },
  { ticker: "META", name: "Meta", start: 572.3, beta: 1.22, vol: 0.3 },
  { ticker: "TSLA", name: "Tesla", start: 248.7, beta: 1.65, vol: 0.55 },
  { ticker: "JPM", name: "JPMorgan", start: 212.4, beta: 0.95, vol: 0.22 },
  { ticker: "SPY", name: "S&P 500 ETF", start: 562.8, beta: 1, vol: 0.14 },
  { ticker: "TLT", name: "20Y Treasury", start: 91.4, beta: -0.35, vol: 0.18 },
];

export function nameOf(ticker: string) {
  return UNIVERSE.find((n) => n.ticker === ticker)?.name ?? ticker;
}
