import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { simulateHistory, snapshotOf } from "./fund";

describe("paper fund", () => {
  const snap = snapshotOf(simulateHistory(Date.UTC(2026, 8, 21, 16, 0, 0)));

  it("keeps a book of holdings", () => {
    assert.ok(snap.holdings.length >= 3, "expected several names in the book");
    assert.ok(snap.nav > 0);
    assert.ok(snap.cash >= 0);
  });

  it("records buys", () => {
    const buys = snap.trades.filter((t) => t.side === "buy");
    assert.ok(buys.length >= 5, "expected a buy blotter");
  });

  it("realizes losses as well as wins", () => {
    const sells = snap.trades.filter((t) => t.side === "sell" && t.realizedPnl != null);
    const losses = sells.filter((t) => (t.realizedPnl ?? 0) < 0);
    const wins = sells.filter((t) => (t.realizedPnl ?? 0) > 0);
    assert.ok(sells.length >= 3, "expected closed trades");
    assert.ok(losses.length >= 1, "losses must show up — this is a fund, not a highlight reel");
    assert.ok(wins.length >= 1, "some winners too");
  });
});
