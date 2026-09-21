import { snapshotOf, simulateHistory, stepEngineAsync } from "./fund";
import { jevConfigured, redact } from "./model";
import { loadDailySessions, loadLiveQuotes } from "./quotes";
import { HISTORY_TICKS, TICK_MS } from "./universe";
import type { EngineState, FundSnapshot } from "./types";

type Slot = {
  engine: EngineState | null;
  boot: Promise<EngineState> | null;
  lastStep: number;
  stepping: Promise<void> | null;
  timer: ReturnType<typeof setInterval> | null;
};

const g = globalThis as typeof globalThis & { __jevFund?: Slot };

function slot(): Slot {
  g.__jevFund ??=
    {
      engine: null,
      boot: null,
      lastStep: 0,
      stepping: null,
      timer: null,
    };
  return g.__jevFund;
}

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
  const s = slot();
  s.lastStep = Date.now();
  s.engine = state;
  return state;
}

async function ensureEngine() {
  const s = slot();
  if (s.engine) return s.engine;
  if (!s.boot) s.boot = bootEngine();
  return s.boot;
}

async function catchUp() {
  const state = await ensureEngine();
  const s = slot();
  const now = Date.now();
  if (now - s.lastStep < TICK_MS) return;
  s.lastStep = now;
  const live = await loadLiveQuotes();
  await stepEngineAsync(state, live.prices, live.quoteTs);
}

export async function currentSnapshot(): Promise<FundSnapshot> {
  const s = slot();
  if (!s.stepping) {
    s.stepping = catchUp().finally(() => {
      slot().stepping = null;
    });
  }
  await s.stepping;
  const state = slot().engine ?? (await ensureEngine());
  const snap = snapshotOf(state);
  snap.jevConfigured = jevConfigured();
  return snap;
}

/** Keep asking Jev on the tape interval even when nobody is polling the page. */
function startTape() {
  const phase = process.env.NEXT_PHASE ?? "";
  if (phase.includes("build") || phase.includes("export")) return;
  if (process.env.GITHUB_PAGES === "1") return;
  const s = slot();
  if (s.timer) return;
  s.timer = setInterval(() => {
    void currentSnapshot().catch((err) => {
      const message = redact(err instanceof Error ? err.message : "tick failed");
      console.error("fund tick failed:", message);
    });
  }, 1_000);
}

startTape();
