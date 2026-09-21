import { UNIVERSE } from "./universe";

const SPARK_URL = "https://query1.finance.yahoo.com/v8/finance/spark";
const UA =
  "Mozilla/5.0 (compatible; jev-fund/0.1; +https://github.com/erboland/jev-fund)";

export type Session = {
  ts: number;
  prices: Record<string, number>;
};

export type QuoteBoard = {
  source: "yahoo";
  quoteTs: number;
  prices: Record<string, number>;
};

export class QuoteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuoteError";
  }
}

type SparkRow = {
  symbol?: string;
  timestamp?: number[];
  close?: Array<number | null>;
  fulldayPrice?: number | null;
  chartPreviousClose?: number | null;
};

function tickers() {
  return UNIVERSE.map((n) => n.ticker);
}

function asSparkMap(payload: unknown): Record<string, SparkRow> {
  if (!payload || typeof payload !== "object") return {};
  const root = payload as Record<string, unknown>;
  const spark = root.spark as { result?: SparkRow[] } | undefined;
  if (spark?.result && Array.isArray(spark.result)) {
    return Object.fromEntries(
      spark.result
        .filter((row) => row.symbol)
        .map((row) => [row.symbol as string, row])
    );
  }
  return root as Record<string, SparkRow>;
}

function lastNumber(values: Array<number | null | undefined> | undefined) {
  if (!values) return null;
  for (let i = values.length - 1; i >= 0; i--) {
    const v = values[i];
    if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
  }
  return null;
}

async function fetchSpark(range: string, interval: string) {
  const symbols = tickers().join(",");
  const url = `${SPARK_URL}?symbols=${encodeURIComponent(symbols)}&range=${range}&interval=${interval}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": UA },
      cache: "no-store",
      signal: ctrl.signal,
    });
    if (!res.ok) {
      throw new QuoteError(`Yahoo spark ${res.status}`);
    }
    return asSparkMap(await res.json());
  } catch (err) {
    if (err instanceof QuoteError) throw err;
    throw new QuoteError(
      err instanceof Error ? err.message : "Yahoo spark failed"
    );
  } finally {
    clearTimeout(timer);
  }
}

export function alignSessions(
  series: Record<string, Array<{ ts: number; close: number }>>
): Session[] {
  const names = Object.keys(series);
  if (!names.length) return [];
  const maps = Object.fromEntries(
    names.map((t) => [t, new Map(series[t].map((b) => [b.ts, b.close]))])
  );
  const counts = new Map<number, number>();
  for (const t of names) {
    for (const b of series[t]) {
      counts.set(b.ts, (counts.get(b.ts) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, n]) => n === names.length)
    .map(([ts]) => ts)
    .sort((a, b) => a - b)
    .map((ts) => ({
      ts,
      prices: Object.fromEntries(names.map((t) => [t, maps[t].get(ts) as number])),
    }));
}

export function sessionsFromFixture(raw: {
  ts: number[];
  prices: Record<string, number[]>;
}): Session[] {
  return raw.ts.map((ts, i) => ({
    ts: ts * 1000,
    prices: Object.fromEntries(
      Object.entries(raw.prices).map(([ticker, closes]) => [ticker, closes[i]])
    ),
  }));
}

let dailyCache: { at: number; sessions: Session[] } | null = null;
const DAILY_TTL_MS = 30 * 60 * 1000;

export async function loadDailySessions(): Promise<Session[]> {
  const now = Date.now();
  if (dailyCache && now - dailyCache.at < DAILY_TTL_MS) return dailyCache.sessions;
  const spark = await fetchSpark("1y", "1d");
  const series: Record<string, Array<{ ts: number; close: number }>> = {};
  for (const ticker of tickers()) {
    const row = spark[ticker];
    if (!row) throw new QuoteError(`Yahoo missing ${ticker}`);
    const bars: Array<{ ts: number; close: number }> = [];
    const stamps = row.timestamp ?? [];
    const closes = row.close ?? [];
    for (let i = 0; i < stamps.length; i++) {
      const close = closes[i];
      if (typeof close === "number" && close > 0) {
        bars.push({ ts: stamps[i] * 1000, close });
      }
    }
    if (bars.length < 30) {
      throw new QuoteError(`Yahoo short history for ${ticker}`);
    }
    series[ticker] = bars;
  }
  const sessions = alignSessions(series);
  if (sessions.length < 30) {
    throw new QuoteError("Yahoo calendar could not be aligned");
  }
  dailyCache = { at: now, sessions };
  return sessions;
}

let liveCache: { at: number; board: QuoteBoard } | null = null;
const LIVE_TTL_MS = 15_000;

export async function loadLiveQuotes(): Promise<QuoteBoard> {
  const now = Date.now();
  if (liveCache && now - liveCache.at < LIVE_TTL_MS) return liveCache.board;
  try {
    const spark = await fetchSpark("1d", "1m");
    const prices: Record<string, number> = {};
    let quoteTs = now;
    for (const ticker of tickers()) {
      const row = spark[ticker];
      const last = lastNumber(row?.close) ?? row?.fulldayPrice ?? null;
      if (typeof last !== "number" || last <= 0) {
        throw new QuoteError(`Yahoo live print missing for ${ticker}`);
      }
      prices[ticker] = last;
      const stamps = row?.timestamp ?? [];
      if (stamps.length) quoteTs = Math.max(quoteTs, stamps[stamps.length - 1] * 1000);
    }
    const board: QuoteBoard = { source: "yahoo", quoteTs, prices };
    liveCache = { at: now, board };
    return board;
  } catch {
    const sessions = await loadDailySessions();
    const last = sessions[sessions.length - 1];
    const board: QuoteBoard = {
      source: "yahoo",
      quoteTs: last.ts,
      prices: last.prices,
    };
    liveCache = { at: now, board };
    return board;
  }
}

export function quotesChanged(
  prev: Record<string, number>,
  next: Record<string, number>,
  ticker: string
) {
  const a = prev[ticker];
  const b = next[ticker];
  if (!a || !b) return true;
  return Math.abs(b / a - 1) > 0.0001;
}
