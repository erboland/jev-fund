import { pickTicker, returns } from "./market";
import { decide, mockDecide } from "./model";
import { quotesChanged, type Session } from "./quotes";
import type {
  Decision,
  DecisionEvent,
  EngineState,
  FundSnapshot,
  FundStats,
  Holding,
  MarketState,
  Trade,
} from "./types";
import {
  BUY_WEIGHT,
  MAX_WEIGHT,
  STARTING_CASH,
  UNIVERSE,
  nameOf,
} from "./universe";

function pushHistory(state: EngineState) {
  for (const n of UNIVERSE) {
    const series = state.series[n.ticker] ?? [];
    series.push(state.prices[n.ticker]);
    if (series.length > 40) series.shift();
    state.series[n.ticker] = series;
  }
}

export function marketValue(state: EngineState) {
  let mv = 0;
  for (const [ticker, pos] of Object.entries(state.positions)) {
    mv += pos.shares * state.prices[ticker];
  }
  return mv;
}

export function navOf(state: EngineState) {
  return state.cash + marketValue(state);
}

function marketFor(state: EngineState, ticker: string): MarketState {
  const name = nameOf(ticker);
  const series = state.series[ticker] ?? [state.prices[ticker]];
  const pos = state.positions[ticker];
  const nav = navOf(state);
  const price = state.prices[ticker];
  const shares = pos?.shares ?? 0;
  const weight = nav > 0 ? (shares * price) / nav : 0;
  const room = Math.max(0, MAX_WEIGHT * nav - shares * price);
  return {
    ticker,
    name,
    price,
    ret1: returns(series, 1),
    ret5: returns(series, 5),
    ret20: returns(series, 20),
    positionShares: shares,
    positionWeight: weight,
    cash: state.cash,
    nav,
    allowedBuy: state.cash > price && room > price,
    allowedSell: shares > 0,
  };
}

function applyTrade(state: EngineState, trade: Trade) {
  const pos = state.positions[trade.ticker] ?? { shares: 0, avgCost: 0 };
  if (trade.side === "buy") {
    const newShares = pos.shares + trade.shares;
    pos.avgCost =
      newShares > 0
        ? (pos.avgCost * pos.shares + trade.price * trade.shares) / newShares
        : 0;
    pos.shares = newShares;
    state.cash -= trade.notional;
    trade.realizedPnl = null;
  } else {
    const sold = Math.min(pos.shares, trade.shares);
    const realized = (trade.price - pos.avgCost) * sold;
    pos.shares -= sold;
    if (pos.shares <= 1e-9) {
      pos.shares = 0;
      pos.avgCost = 0;
    }
    state.cash += sold * trade.price;
    trade.shares = sold;
    trade.notional = sold * trade.price;
    trade.realizedPnl = realized;
    state.realizedPnl += realized;
    if (pos.shares === 0) delete state.positions[trade.ticker];
    else state.positions[trade.ticker] = pos;
    state.trades.push(trade);
    return;
  }
  state.positions[trade.ticker] = pos;
  state.trades.push(trade);
}

export function execute(
  state: EngineState,
  ticker: string,
  decision: Decision
): { trade: Trade | null; note: string; executed: boolean } {
  const mkt = marketFor(state, ticker);
  const price = mkt.price;
  const nav = mkt.nav;

  if (decision.action === "hold") {
    return { trade: null, note: "no edge — hold", executed: false };
  }

  if (decision.action === "buy") {
    const room = Math.max(0, MAX_WEIGHT * nav - mkt.positionShares * price);
    const budget = Math.min(state.cash * 0.98, nav * BUY_WEIGHT, room);
    const shares = Math.floor((budget / price) * 100) / 100;
    if (shares * price < 25) {
      return { trade: null, note: "size too small — hold", executed: false };
    }
    const trade: Trade = {
      id: state.nextTradeId++,
      tick: state.tick,
      ts: state.ts,
      ticker,
      name: mkt.name,
      side: "buy",
      shares,
      price,
      notional: shares * price,
      realizedPnl: null,
      probabilities: decision.probabilities,
      latencyMs: decision.latencyMs,
      model: decision.model,
    };
    applyTrade(state, trade);
    return { trade, note: `bought ${shares} ${ticker}`, executed: true };
  }

  const fraction = decision.probabilities.sell > 0.62 ? 1 : 0.5;
  const shares =
    Math.ceil(mkt.positionShares * fraction * 100) / 100 || mkt.positionShares;
  if (shares <= 0) {
    return { trade: null, note: "flat — cannot sell", executed: false };
  }
  const trade: Trade = {
    id: state.nextTradeId++,
    tick: state.tick,
    ts: state.ts,
    ticker,
    name: mkt.name,
    side: "sell",
    shares,
    price,
    notional: shares * price,
    realizedPnl: 0,
    probabilities: decision.probabilities,
    latencyMs: decision.latencyMs,
    model: decision.model,
  };
  applyTrade(state, trade);
  const pnl = trade.realizedPnl ?? 0;
  const note =
    pnl < 0
      ? `sold ${trade.shares} ${ticker} at a loss`
      : `sold ${trade.shares} ${ticker}`;
  return { trade, note, executed: true };
}

export function createEngine(
  prices: Record<string, number>,
  ts: number,
  dataSource: EngineState["dataSource"] = "yahoo"
): EngineState {
  return {
    tick: 0,
    ts,
    cash: STARTING_CASH,
    positions: {},
    prices: { ...prices },
    series: Object.fromEntries(UNIVERSE.map((n) => [n.ticker, [prices[n.ticker]]])),
    trades: [],
    decisions: [],
    equity: [{ tick: 0, ts, nav: STARTING_CASH }],
    realizedPnl: 0,
    peakNav: STARTING_CASH,
    maxDrawdown: 0,
    modelName: "mock",
    nextTradeId: 1,
    dataSource,
    quoteTs: ts,
  };
}

export function stepEngine(
  state: EngineState,
  prices: Record<string, number>,
  ts: number,
  decisionFn = mockDecide
) {
  const prev = { ...state.prices };
  const mkt = advanceMarket(state, prices, ts);
  if (!quotesChanged(prev, state.prices, mkt.ticker)) {
    finishTick(
      state,
      mkt,
      {
        action: "hold",
        probabilities: { buy: 0.1, sell: 0.1, hold: 0.8 },
        latencyMs: 4,
        model: decisionFn(mkt, state.tick).model,
      },
      "last print unchanged"
    );
    return state;
  }
  finishTick(state, mkt, decisionFn(mkt, state.tick));
  return state;
}

export async function stepEngineAsync(
  state: EngineState,
  prices: Record<string, number>,
  ts: number
) {
  const prev = { ...state.prices };
  const mkt = advanceMarket(state, prices, ts);
  if (!quotesChanged(prev, state.prices, mkt.ticker)) {
    finishTick(
      state,
      mkt,
      {
        action: "hold",
        probabilities: { buy: 0.1, sell: 0.1, hold: 0.8 },
        latencyMs: 4,
        model: state.modelName,
      },
      "last print unchanged"
    );
    return state;
  }
  finishTick(state, mkt, await decide(mkt, state.tick));
  return state;
}

function advanceMarket(
  state: EngineState,
  prices: Record<string, number>,
  ts: number
): MarketState {
  state.tick += 1;
  state.ts = ts;
  state.quoteTs = ts;
  state.prices = { ...state.prices, ...prices };
  pushHistory(state);
  const name = pickTicker(state.tick, UNIVERSE);
  return marketFor(state, name.ticker);
}

function finishTick(
  state: EngineState,
  mkt: MarketState,
  decision: Decision,
  forcedNote?: string
) {
  const { note, executed } = execute(state, mkt.ticker, decision);

  const event: DecisionEvent = {
    tick: state.tick,
    ts: state.ts,
    ticker: mkt.ticker,
    name: mkt.name,
    action: decision.action,
    probabilities: decision.probabilities,
    latencyMs: decision.latencyMs,
    late: false,
    executed,
    price: state.prices[mkt.ticker],
    note: forcedNote ?? note,
    model: decision.model,
  };
  state.decisions.push(event);
  if (state.decisions.length > 400) state.decisions.splice(0, state.decisions.length - 400);
  if (state.trades.length > 250) state.trades.splice(0, state.trades.length - 250);

  const nav = navOf(state);
  state.peakNav = Math.max(state.peakNav, nav);
  const dd = state.peakNav > 0 ? (state.peakNav - nav) / state.peakNav : 0;
  state.maxDrawdown = Math.max(state.maxDrawdown, dd);
  state.equity.push({ tick: state.tick, ts: state.ts, nav });
  if (state.equity.length > 240) state.equity.splice(0, state.equity.length - 240);
  state.modelName = decision.model;
}

export function holdingsOf(state: EngineState): Holding[] {
  const nav = navOf(state);
  return Object.entries(state.positions)
    .filter(([, p]) => p.shares > 0)
    .map(([ticker, pos]) => {
      const price = state.prices[ticker];
      const marketVal = pos.shares * price;
      const unrealized = (price - pos.avgCost) * pos.shares;
      return {
        ticker,
        name: nameOf(ticker),
        shares: pos.shares,
        avgCost: pos.avgCost,
        price,
        marketValue: marketVal,
        weight: nav > 0 ? marketVal / nav : 0,
        unrealizedPnl: unrealized,
        unrealizedPnlPct: pos.avgCost > 0 ? price / pos.avgCost - 1 : 0,
      };
    })
    .sort((a, b) => b.marketValue - a.marketValue);
}

export function statsOf(state: EngineState): FundStats {
  const sells = state.trades.filter((t) => t.side === "sell" && t.realizedPnl != null);
  const wins = sells.filter((t) => (t.realizedPnl ?? 0) > 0);
  const losses = sells.filter((t) => (t.realizedPnl ?? 0) < 0);
  const avg = (xs: Trade[]) =>
    xs.length ? xs.reduce((s, t) => s + (t.realizedPnl ?? 0), 0) / xs.length : 0;
  const nav = navOf(state);
  return {
    trades: state.trades.length,
    buys: state.trades.filter((t) => t.side === "buy").length,
    sells: sells.length,
    holds: state.decisions.filter((d) => d.action === "hold" || !d.executed).length,
    wins: wins.length,
    losses: losses.length,
    winRate: sells.length ? wins.length / sells.length : 0,
    avgWin: avg(wins),
    avgLoss: avg(losses),
    maxDrawdown: state.maxDrawdown,
    grossExposure: nav > 0 ? marketValue(state) / nav : 0,
  };
}

export function snapshotOf(state: EngineState): FundSnapshot {
  const holdings = holdingsOf(state);
  const nav = navOf(state);
  const unrealizedPnl = holdings.reduce((s, h) => s + h.unrealizedPnl, 0);
  const pnl = nav - STARTING_CASH;
  return {
    model: state.modelName,
    jevConfigured: false,
    dryRun: true,
    dataSource: state.dataSource,
    quoteTs: state.quoteTs,
    tick: state.tick,
    ts: state.ts,
    cash: state.cash,
    nav,
    startingCash: STARTING_CASH,
    pnl,
    pnlPct: pnl / STARTING_CASH,
    realizedPnl: state.realizedPnl,
    unrealizedPnl,
    holdings,
    trades: [...state.trades].reverse(),
    decisions: [...state.decisions].reverse(),
    equity: state.equity,
    latestDecision: state.decisions.at(-1) ?? null,
    stats: statsOf(state),
  };
}

export function simulateHistory(
  sessions: Session[],
  dataSource: EngineState["dataSource"] = "yahoo"
): EngineState {
  if (sessions.length < 2) {
    throw new Error("Need at least two market sessions to build a book");
  }
  const state = createEngine(sessions[0].prices, sessions[0].ts, dataSource);
  for (let i = 1; i < sessions.length; i++) {
    stepEngine(state, sessions[i].prices, sessions[i].ts);
  }
  return state;
}

export function cloneEngine(state: EngineState): EngineState {
  return {
    ...state,
    positions: Object.fromEntries(
      Object.entries(state.positions).map(([k, v]) => [k, { ...v }])
    ),
    prices: { ...state.prices },
    series: Object.fromEntries(
      Object.entries(state.series).map(([k, v]) => [k, [...v]])
    ),
    trades: state.trades.map((t) => ({ ...t, probabilities: { ...t.probabilities } })),
    decisions: state.decisions.map((d) => ({
      ...d,
      probabilities: { ...d.probabilities },
    })),
    equity: state.equity.map((e) => ({ ...e })),
  };
}
