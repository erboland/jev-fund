import type { Name } from "./types";

export const STARTING_CASH = 100_000;
export const HISTORY_TICKS = 180;
export const TICK_MS = 4_000;
export const BUY_WEIGHT = 0.08;
export const MAX_WEIGHT = 0.22;

/** Liquid names a paper long-only book can actually hold. */
export const UNIVERSE: Name[] = [
  { ticker: "AAPL", name: "Apple" },
  { ticker: "MSFT", name: "Microsoft" },
  { ticker: "NVDA", name: "NVIDIA" },
  { ticker: "GOOGL", name: "Alphabet" },
  { ticker: "AMZN", name: "Amazon" },
  { ticker: "META", name: "Meta" },
  { ticker: "TSLA", name: "Tesla" },
  { ticker: "JPM", name: "JPMorgan" },
  { ticker: "SPY", name: "S&P 500 ETF" },
  { ticker: "TLT", name: "20Y Treasury" },
];

export function nameOf(ticker: string) {
  return UNIVERSE.find((n) => n.ticker === ticker)?.name ?? ticker;
}
