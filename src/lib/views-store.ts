import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  createViewStore,
  recordOpen,
  serializeViewStore,
  statsOf,
  type ViewStats,
  type ViewStore,
} from "./views";

const DATA_PATH = join(process.cwd(), "data", "views.json");

type Slot = {
  store: ViewStore;
  loaded: boolean;
  dirty: boolean;
};

const g = globalThis as typeof globalThis & { __jevViews?: Slot };

function slot(): Slot {
  g.__jevViews ??= {
    store: createViewStore(),
    loaded: false,
    dirty: false,
  };
  return g.__jevViews;
}

function loadFromDisk() {
  const s = slot();
  if (s.loaded) return;
  s.loaded = true;
  if (!existsSync(DATA_PATH)) return;
  try {
    const raw = JSON.parse(readFileSync(DATA_PATH, "utf8")) as {
      opens?: number;
      visitorIds?: string[];
    };
    s.store = createViewStore(raw);
  } catch {
    // Keep the in-memory counter if the file is missing or corrupt.
  }
}

function persist() {
  const s = slot();
  if (!s.dirty) return;
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(DATA_PATH, JSON.stringify(serializeViewStore(s.store)));
    s.dirty = false;
  } catch {
    // Read-only filesystem (e.g. some serverless hosts): count stays in memory.
  }
}

export function currentViewStats(): ViewStats {
  loadFromDisk();
  return statsOf(slot().store);
}

export function trackSiteOpen(visitorId?: string): ViewStats {
  loadFromDisk();
  const s = slot();
  const stats = recordOpen(s.store, visitorId);
  s.dirty = true;
  persist();
  return stats;
}
