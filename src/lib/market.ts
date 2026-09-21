import { gauss, hashSeed, mulberry32 } from "./rng";
import type { Name } from "./types";
import { SEED, UNIVERSE } from "./universe";

const DT = 1 / (252 * 26);

export function initialPrices() {
  return Object.fromEntries(UNIVERSE.map((n) => [n.ticker, n.start])) as Record<
    string,
    number
  >;
}

export function stepPrices(
  prices: Record<string, number>,
  factor: number,
  tick: number
) {
  const next = { ...prices };
  const randF = mulberry32(hashSeed(SEED, 99, tick));
  const dFactor = 0.04 * DT + 0.16 * Math.sqrt(DT) * gauss(randF);
  const newFactor = factor + dFactor;

  for (const name of UNIVERSE) {
    const rand = mulberry32(hashSeed(SEED, tickerCode(name.ticker), tick));
    const idio = name.vol * Math.sqrt(DT) * gauss(rand);
    const drift = 0.06 * DT;
    const r = drift + name.beta * dFactor + idio;
    next[name.ticker] = Math.max(1, prices[name.ticker] * (1 + r));
  }

  return { prices: next, factor: newFactor };
}

export function returns(history: number[], n: number) {
  if (history.length < n + 1) return 0;
  const a = history[history.length - 1 - n];
  const b = history[history.length - 1];
  if (!a) return 0;
  return b / a - 1;
}

function tickerCode(ticker: string) {
  let h = 0;
  for (let i = 0; i < ticker.length; i++) h = (h * 33 + ticker.charCodeAt(i)) | 0;
  return h >>> 0;
}

export function pickTicker(tick: number, names: Name[]) {
  return names[tick % names.length];
}
