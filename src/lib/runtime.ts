import { snapshotOf, simulateHistory, stepEngineAsync } from "./fund";
import { jevConfigured } from "./model";
import { TICK_MS } from "./universe";
import type { FundSnapshot } from "./types";

let lastStep = Date.now();
let stepping: Promise<void> | null = null;
const engine = simulateHistory();

async function catchUp() {
  const now = Date.now();
  while (now - lastStep >= TICK_MS) {
    lastStep += TICK_MS;
    await stepEngineAsync(engine);
  }
}

export async function currentSnapshot(): Promise<FundSnapshot> {
  if (!stepping) {
    stepping = catchUp().finally(() => {
      stepping = null;
    });
  }
  await stepping;
  const snap = snapshotOf(engine);
  snap.jevConfigured = jevConfigured();
  return snap;
}
