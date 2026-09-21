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

/** Momentum + inventory mock. Stand-in for Jev so the demo runs with no key. */
export function mockDecide(state: MarketState, tick: number): Decision {
  const t0 = performance.now();
  const rand = mulberry32(hashSeed(tick, state.ticker.length * 17, Math.round(state.price * 100)));
  const noise = (rand() - 0.5) * 1.4;
  const mom = state.ret5 * 8 + state.ret1 * 12;
  const meanRev = -state.ret20 * 3;
  const inventory = state.positionWeight > 0.16 ? 1.2 : state.positionWeight < 0.02 ? -0.4 : 0;
  const buyLogit = mom + meanRev + noise - inventory + (state.allowedBuy ? 0 : -8);
  const sellLogit =
    -mom * 0.8 + state.ret20 * 2 + (rand() - 0.4) + (state.positionShares > 0 ? 0.6 : -6);
  const holdLogit = 0.35 + (Math.abs(mom) < 0.004 ? 0.8 : 0);
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
          goal: "Grow NAV with controlled single-name risk. Do not concentrate. Selling realizes P&L, including losses.",
          constraints:
            "If allowedBuy is false you must not buy. If allowedSell is false you must not sell. Prefer hold when the edge is thin.",
        },
        criteria: {
          buy: "Add to or open a long: expected path is up and weight room remains.",
          sell: "Cut or exit: expected path is down, or the line is overweight, including taking a loss.",
          hold: "No edge, or constraints block a trade.",
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
    .replace(/\bsk-[A-Za-z0-9_-]+/g, "[redacted]")
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
