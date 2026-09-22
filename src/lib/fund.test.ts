import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { playbackFrameOf, simulateHistory, snapshotOf } from "./fund";
import { projectSnapshot, selectTape } from "./playback";
import { alignSessions, sessionsFromFixture } from "./quotes";
import { PLAYBACK_FRAMES } from "./universe";

const fixture = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "quotes.fixture.json"), "utf8")
) as { ts: number[]; prices: Record<string, number[]> };

describe("paper fund on real Yahoo sessions", () => {
  const sessions = sessionsFromFixture(fixture);
  const snap = snapshotOf(simulateHistory(sessions, "fixture"));

  it("replays enough real sessions to hold a book", () => {
    assert.ok(sessions.length >= 60, "fixture should cover months of prints");
    assert.ok(snap.holdings.length >= 3, "expected several names in the book");
    assert.ok(snap.nav > 0);
    assert.ok(snap.cash >= 0);
    assert.equal(snap.dataSource, "fixture");
  });

  it("records buys at Yahoo closes", () => {
    const buys = snap.trades.filter((t) => t.side === "buy");
    assert.ok(buys.length >= 5, "expected a buy blotter");
    assert.ok(buys.every((t) => t.price > 0));
  });

  it("can replay a window where the book actually changes", () => {
    const frames = [];
    simulateHistory(sessions, "fixture", (state) => {
      frames.push(playbackFrameOf(state));
    });
    const tape = selectTape(frames, PLAYBACK_FRAMES);
    assert.equal(tape.length, PLAYBACK_FRAMES);
    assert.ok(tape.some((frame) => frame.latestDecision?.executed));
    const full = snapshotOf(simulateHistory(sessions, "fixture"));
    full.playback = tape;
    const mid = projectSnapshot(full, tape[8]);
    assert.equal(mid.tick, tape[8].tick);
    assert.equal(mid.nav, tape[8].nav);
    assert.ok(mid.equity.length >= 2);
    assert.ok(mid.equity.length < full.equity.length);
    assert.ok(mid.holdings.length >= 1);
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

describe("quote alignment", () => {
  it("keeps only days every name printed", () => {
    const sessions = alignSessions({
      AAPL: [
        { ts: 1, close: 10 },
        { ts: 2, close: 11 },
        { ts: 3, close: 12 },
      ],
      MSFT: [
        { ts: 2, close: 20 },
        { ts: 3, close: 21 },
      ],
    });
    assert.deepEqual(
      sessions.map((s) => s.ts),
      [2, 3]
    );
    assert.equal(sessions[0].prices.AAPL, 11);
    assert.equal(sessions[0].prices.MSFT, 20);
  });
});
