import { snapshotOf, simulateHistory, stepEngineAsync } from "./fund";
import { jevConfigured } from "./model";
import { loadDailySessions, loadLiveQuotes } from "./quotes";
import { HISTORY_TICKS, TICK_MS } from "./universe";
import type { EngineState, FundSnapshot } from "./types";

let engine: EngineState | null = null;
let boot: Promise<EngineState> | null = null;
let lastStep = 0;
let stepping: Promise<void> | null = null;

async function bootEngine(): Promise<EngineState> {
  const sessions = await loadDailySessions();
  const slice = sessions.slice(-HISTORY_TICKS);
  const state = simulateHistory(slice, "yahoo");
  try {
    const live = await loadLiveQuotes();
    await stepEngineAsync(state, live.prices, live.quoteTs);
  } catch {
    // Keep last Yahoo session marks if the 1-minute tape is quiet.
  }
  lastStep = Date.now();
  engine = state;
  return state;
}

async function ensureEngine() {
  if (engine) return engine;
  if (!boot) boot = bootEngine();
  return boot;
}

async function catchUp() {
  const state = await ensureEngine();
  const now = Date.now();
  if (now - lastStep < TICK_MS) return;
  lastStep = now;
  const live = await loadLiveQuotes();
  await stepEngineAsync(state, live.prices, live.quoteTs);
}

export async function currentSnapshot(): Promise<FundSnapshot> {
  if (!stepping) {
    stepping = catchUp().finally(() => {
      stepping = null;
    });
  }
  await stepping;
  const state = engine ?? (await ensureEngine());
  const snap = snapshotOf(state);
  snap.jevConfigured = jevConfigured();
  return snap;
}
