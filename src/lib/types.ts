export type Action = "buy" | "sell" | "hold";

export interface Name {
  ticker: string;
  name: string;
  start: number;
  beta: number;
  vol: number;
}

export interface Position {
  shares: number;
  avgCost: number;
}

export interface Holding {
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
  price: number;
  marketValue: number;
  weight: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
}

export interface Probabilities {
  buy: number;
  sell: number;
  hold: number;
}

export interface Trade {
  id: number;
  tick: number;
  ts: number;
  ticker: string;
  name: string;
  side: "buy" | "sell";
  shares: number;
  price: number;
  notional: number;
  realizedPnl: number | null;
  probabilities: Probabilities;
  latencyMs: number;
  model: string;
}

export interface DecisionEvent {
  tick: number;
  ts: number;
  ticker: string;
  name: string;
  action: Action;
  probabilities: Probabilities;
  latencyMs: number;
  late: boolean;
  executed: boolean;
  price: number;
  note: string;
  model: string;
}

export interface EquityPoint {
  tick: number;
  ts: number;
  nav: number;
}

export interface FundStats {
  trades: number;
  buys: number;
  sells: number;
  holds: number;
  wins: number;
  losses: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  grossExposure: number;
}

export interface EngineState {
  tick: number;
  ts: number;
  cash: number;
  positions: Record<string, Position>;
  prices: Record<string, number>;
  series: Record<string, number[]>;
  factor: number;
  trades: Trade[];
  decisions: DecisionEvent[];
  equity: EquityPoint[];
  realizedPnl: number;
  peakNav: number;
  maxDrawdown: number;
  modelName: string;
  nextTradeId: number;
}

export interface FundSnapshot {
  model: string;
  jevConfigured: boolean;
  dryRun: true;
  tick: number;
  ts: number;
  cash: number;
  nav: number;
  startingCash: number;
  pnl: number;
  pnlPct: number;
  realizedPnl: number;
  unrealizedPnl: number;
  holdings: Holding[];
  trades: Trade[];
  decisions: DecisionEvent[];
  equity: EquityPoint[];
  latestDecision: DecisionEvent | null;
  stats: FundStats;
}

export interface Decision {
  action: Action;
  probabilities: Probabilities;
  latencyMs: number;
  model: string;
}

export interface MarketState {
  ticker: string;
  name: string;
  price: number;
  ret1: number;
  ret5: number;
  ret20: number;
  positionShares: number;
  positionWeight: number;
  cash: number;
  nav: number;
  allowedBuy: boolean;
  allowedSell: boolean;
}
