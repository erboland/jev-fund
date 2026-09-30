import { experimental_evaluate as evaluate } from "ai";
import { hashSeed, mulberry32 } from "./rng";
import type { Action, Decision, MarketState, Probabilities } from "./types";

export function jevConfigured() {
  return Boolean(
    process.env.MODEL === "jev" &&
      (process.env.AI_GATEWAY_API_KEY ||
        process.env.TYPESAFE_AI_API_KEY ||
        process.env.VERCEL_OIDC_TOKEN)
  );
}

export function softmax3(buy: number, sell: number, hold: number): Probabilities {
  const m = Math.max(buy, sell, hold);
  const eb = Math.exp(buy - m);
  const es = Math.exp(sell - m);
  const eh = Math.exp(hold - m);
  const z = eb + es + eh;
  return { buy: eb / z, sell: es / z, hold: eh / z };
}

export function argmax(p: Probabilities): Action {
  if (p.buy >= p.sell && p.buy >= p.hold) return "buy";
  if (p.sell >= p.hold) return "sell";
  return "hold";
}

/** Momentum mock that deploys cash. Stand-in for Jev so the demo runs with no key. */
export function mockDecide(state: MarketState, tick: number): Decision {
  const t0 = performance.now();
  const rand = mulberry32(hashSeed(tick, state.ticker.length * 17, Math.round(state.price * 100)));
  const noise = (rand() - 0.5) * 1.1;
  const mom = state.ret5 * 10 + state.ret1 * 14;
  const cashFrac = state.nav > 0 ? state.cash / state.nav : 1;
  // Keep adding until the line is large. Idle cash is a reason to buy, not to wait.
  const inventory =
    state.positionWeight > 0.26 ? 1.6 : state.positionWeight < 0.08 ? -0.55 : -0.15;
  const deploy = cashFrac > 0.5 ? 0.55 : cashFrac > 0.25 ? 0.2 : 0;
  const trend = mom > 0 ? 0.35 : mom < -0.01 ? -0.8 : 0;
  const buyLogit = mom * 1.2 + noise - inventory + deploy + trend + (state.allowedBuy ? 0.15 : -8);
  // Sell into weakness. Do not mean-revert winners back to cash.
  const sellLogit =
    -mom * 1.15 +
    (state.ret5 < -0.012 ? 0.9 : -0.55) +
    (rand() - 0.62) +
    (state.positionShares > 0 ? 0 : -6);
  const holdLogit = -0.2 + (Math.abs(mom) < 0.0015 ? 0.2 : 0);
  const probabilities = softmax3(buyLogit, sellLogit, holdLogit);
  let action = argmax(probabilities);
  if (action === "buy" && !state.allowedBuy) action = "hold";
  if (action === "sell" && !state.allowedSell) action = "hold";
  return {
    action,
    probabilities,
    latencyMs: Math.max(8, performance.now() - t0 + 70 + rand() * 40),
    model: "mock",
  };
}

export async function jevDecide(state: MarketState): Promise<Decision> {
  const t0 = performance.now();
  const result = await evaluate({
    model: "typesafe-ai/jev",
    state: {
      fund: "jev-fund paper book",
      ticker: state.ticker,
      name: state.name,
      price: Number(state.price.toFixed(2)),
      ret1Bps: Math.round(state.ret1 * 1e4),
      ret5Bps: Math.round(state.ret5 * 1e4),
      ret20Bps: Math.round(state.ret20 * 1e4),
      positionShares: state.positionShares,
      positionWeightPct: Math.round(state.positionWeight * 1000) / 10,
      cash: Math.round(state.cash),
      nav: Math.round(state.nav),
      allowedBuy: state.allowedBuy,
      allowedSell: state.allowedSell,
    },
    questions: {
      action: {
        type: "choice",
        instructions: {
          question:
            "For this ticker on a long-only paper hedge fund, should we buy, sell, or hold this tick?",
          goal: "Grow NAV by putting capital to work in meaningful longs. Do not sit in cash. A single name still has a weight cap — use the room up to it.",
          constraints:
            "If allowedBuy is false you must not buy. If allowedSell is false you must not sell. Prefer buy over hold when cash is large and the tape is not clearly down.",
        },
        criteria: {
          buy: "Open or add: path is flat-to-up, or the book is underinvested and this name is under its weight cap.",
          sell: "Cut only when the path is clearly down or the line is at its weight cap, including taking a loss. Do not sell just to get flat.",
          hold: "Already sized, or constraints block a trade.",
        },
      },
    },
    maxRetries: 0,
  });

  const answer = result.answers.action;
  const raw = (answer.probabilities ?? {
    buy: 0,
    sell: 0,
    hold: 0,
    [answer.choice]: 1,
  }) as Partial<Probabilities>;
  const probabilities = softmax3(raw.buy ?? 0.01, raw.sell ?? 0.01, raw.hold ?? 0.01);
  let action = (answer.choice as Action) ?? argmax(probabilities);
  if (action === "buy" && !state.allowedBuy) action = "hold";
  if (action === "sell" && !state.allowedSell) action = "hold";

  return {
    action,
    probabilities,
    latencyMs: performance.now() - t0,
    model: "jev",
  };
}

/** Strip credentials before a message is logged or returned to the client. */
export function redact(message: string) {
  return message
    .replace(/vck_[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/vcp_[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/\bsk-[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/\bgh[pousr]_[A-Za-z0-9_]+/g, "[redacted]")
    .replace(/\bgithub_pat_[A-Za-z0-9_]+/g, "[redacted]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]");
}

export async function decide(state: MarketState, tick: number): Promise<Decision> {
  if (!jevConfigured()) return mockDecide(state, tick);
  try {
    return await jevDecide(state);
  } catch (err) {
    const message = redact(err instanceof Error ? err.message : "jev evaluate failed");
    console.error("jev evaluate failed:", message);
    const fallback = mockDecide(state, tick);
    return { ...fallback, model: "mock (jev failed)" };
  }
}
