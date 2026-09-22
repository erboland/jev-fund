"use client";

import { useEffect, useRef, useState } from "react";
import { DecisionPanel } from "@/components/decision-panel";
import { EquityChart } from "@/components/equity-chart";
import { FundHeader } from "@/components/fund-header";
import { HoldingsTable } from "@/components/holdings-table";
import { PromoFooter } from "@/components/promo-footer";
import { SiteViewBeacon } from "@/components/site-view-beacon";
import { StatsRow } from "@/components/stats-row";
import { TradesPanel } from "@/components/trades-panel";
import { Button } from "@/components/ui/button";
import { projectSnapshot } from "@/lib/playback";
import { TICK_MS } from "@/lib/universe";
import type { FundSnapshot, PlaybackFrame } from "@/lib/types";

type Conn = "connecting" | "live" | "error";

const staticSite = process.env.NEXT_PUBLIC_STATIC === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function tapePaceMs() {
  const mode = new URLSearchParams(window.location.search).get("tape");
  if (mode === "demo") return 55;
  if (mode === "fast") return 80;
  return 110;
}

async function loadFund(): Promise<FundSnapshot> {
  const url = staticSite ? `${basePath}/book.json` : "/api/fund";
  const res = await fetch(url, { cache: "no-store" });
  const body = (await res.json()) as FundSnapshot & { error?: string };
  if (!res.ok) {
    throw new Error(body.error ?? `Yahoo feed ${res.status}`);
  }
  return body;
}

export function Dashboard({
  initial,
  bootError,
}: {
  initial: FundSnapshot | null;
  bootError?: string;
}) {
  const [snapshot, setSnapshot] = useState<FundSnapshot | null>(initial);
  const [tape, setTape] = useState<{ frames: PlaybackFrame[]; index: number } | null>(
    null
  );
  const played = useRef(false);
  const [connection, setConnection] = useState<Conn>(
    initial ? "live" : bootError ? "error" : "connecting"
  );
  const [error, setError] = useState<string | null>(bootError ?? null);

  function adopt(data: FundSnapshot) {
    setSnapshot(data);
    if (played.current || !data.playback || data.playback.length < 2) return;
    played.current = true;
    setTape({ frames: data.playback, index: 0 });
  }

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const data = await loadFund();
        if (cancelled) return;
        adopt(data);
        setConnection("live");
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setConnection("error");
        setError(err instanceof Error ? err.message : "Could not load Yahoo quotes");
      }
    }

    void refresh();
    const id = setInterval(refresh, staticSite ? 5 * 60_000 : TICK_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!tape) return;
    const pace = tapePaceMs();
    if (tape.index >= tape.frames.length - 1) {
      const id = window.setTimeout(() => setTape(null), 240);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => {
      setTape((current) =>
        current ? { ...current, index: current.index + 1 } : current
      );
    }, pace);
    return () => window.clearTimeout(id);
  }, [tape]);

  const shown =
    snapshot && tape ? projectSnapshot(snapshot, tape.frames[tape.index]) : snapshot;

  return (
    <div
      className="card flex min-h-[calc(100vh-32px)] flex-col"
      data-tape={tape ? String(tape.index) : "live"}
      data-tick={shown?.tick ?? ""}
    >
      <SiteViewBeacon />
      <FundHeader snapshot={snapshot} connection={connection} />
      {shown ? <StatsRow snapshot={shown} /> : null}
      {error ? (
        <div className="flex items-center justify-between gap-3 border-b px-4 py-2 text-sm">
          <span className="text-sell">
            {error}
            {snapshot ? " — showing last book" : ""}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setConnection("connecting");
              loadFund()
                .then((data) => {
                  adopt(data);
                  setConnection("live");
                  setError(null);
                })
                .catch((err: unknown) => {
                  setConnection("error");
                  setError(
                    err instanceof Error ? err.message : "Could not load Yahoo quotes"
                  );
                });
            }}
          >
            Retry quotes
          </Button>
        </div>
      ) : null}
      {shown ? (
        <div className="grid flex-1 gap-6 p-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:p-5">
          <EquityChart equity={shown.equity} />
          <DecisionPanel latest={shown.latestDecision} />
          <HoldingsTable holdings={shown.holdings} />
          <TradesPanel trades={shown.trades} decisions={shown.decisions} />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
          Loading Yahoo prints for the paper book…
        </div>
      )}
      <PromoFooter />
    </div>
  );
}
