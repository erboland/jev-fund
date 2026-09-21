import { mkdirSync, writeFileSync } from "node:fs";
import { snapshotOf, simulateHistory, stepEngineAsync } from "../src/lib/fund";
import { jevConfigured } from "../src/lib/model";
import { loadDailySessions, loadLiveQuotes } from "../src/lib/quotes";
import { HISTORY_TICKS } from "../src/lib/universe";

async function main() {
  const sessions = (await loadDailySessions()).slice(-HISTORY_TICKS);
  const state = simulateHistory(sessions, "yahoo");
  const live = await loadLiveQuotes();
  await stepEngineAsync(state, live.prices, live.quoteTs);
  const configured = jevConfigured();
  const snap = snapshotOf(state);
  if (!configured) {
    console.warn(
      "jev not configured: set MODEL=jev and AI_GATEWAY_API_KEY (or TYPESAFE_AI_API_KEY) for live Jev"
    );
  }
  mkdirSync("public", { recursive: true });
  writeFileSync("public/book.json", JSON.stringify(snap));
  console.log(
    `wrote public/book.json nav=${snap.nav.toFixed(2)} model=${snap.model} jevConfigured=${snap.jevConfigured} tick=${snap.tick}`
  );
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
