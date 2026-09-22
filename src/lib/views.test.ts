import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createViewStore, recordOpen, statsOf } from "./views";

describe("site view counter", () => {
  it("counts opens and unique visitor ids", () => {
    const store = createViewStore();
    recordOpen(store, "visitor-a");
    recordOpen(store, "visitor-a");
    recordOpen(store, "visitor-b");
    assert.deepEqual(statsOf(store), { opens: 3, visitors: 2 });
  });

  it("ignores malformed visitor ids", () => {
    const store = createViewStore();
    recordOpen(store, "bad id!");
    assert.deepEqual(statsOf(store), { opens: 1, visitors: 0 });
  });
});
