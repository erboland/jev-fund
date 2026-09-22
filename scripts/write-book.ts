import { mkdirSync, writeFileSync } from "node:fs";
import {
  playbackFrameOf,
  snapshotOf,
  simulateHistory,
  stepEngineAsync,
} from "../src/lib/fund";
import { jevConfigured } from "../src/lib/model";
import { selectTape } from "../src/lib/playback";
import { loadDailySessions, loadLiveQuotes } from "../src/lib/quotes";
import { HISTORY_TICKS, PLAYBACK_FRAMES } from "../src/lib/universe";
import type { PlaybackFrame } from "../src/lib/types";

async function main() {
  const sessions = (await loadDailySessions()).slice(-HISTORY_TICKS);
  const frames: PlaybackFrame[] = [];
  const state = simulateHistory(sessions, "yahoo", (step) => {
    frames.push(playbackFrameOf(step));
  });
  const live = await loadLiveQuotes();
  await stepEngineAsync(state, live.prices, live.quoteTs);
  const configured = jevConfigured();
  const snap = snapshotOf(state);
  snap.playback = selectTape(frames, PLAYBACK_FRAMES);
  if (!configured) {
    console.warn(
      "jev not configured: set MODEL=jev and AI_GATEWAY_API_KEY (or TYPESAFE_AI_API_KEY) for live Jev"
    );
  }
  mkdirSync("public", { recursive: true });
  writeFileSync("public/book.json", JSON.stringify(snap));
  console.log(
    `wrote public/book.json nav=${snap.nav.toFixed(2)} model=${snap.model} jevConfigured=${snap.jevConfigured} tick=${snap.tick} playback=${snap.playback.length}`
  );
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
