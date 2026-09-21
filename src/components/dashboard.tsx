"use client";

import { useEffect, useState } from "react";
import { DecisionPanel } from "@/components/decision-panel";
import { EquityChart } from "@/components/equity-chart";
import { FundHeader } from "@/components/fund-header";
import { HoldingsTable } from "@/components/holdings-table";
import { PromoFooter } from "@/components/promo-footer";
import { StatsRow } from "@/components/stats-row";
import { TradesPanel } from "@/components/trades-panel";
import { Button } from "@/components/ui/button";
import { TICK_MS } from "@/lib/universe";
import type { FundSnapshot } from "@/lib/types";

type Conn = "connecting" | "live" | "error";

export function Dashboard({ initial }: { initial: FundSnapshot }) {
  const [snapshot, setSnapshot] = useState<FundSnapshot>(initial);
  const [connection, setConnection] = useState<Conn>("live");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch("/api/fund", { cache: "no-store" });
        if (!res.ok) throw new Error(`Fund feed ${res.status}`);
        const data = (await res.json()) as FundSnapshot;
        if (cancelled) return;
        setSnapshot(data);
        setConnection("live");
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setConnection("error");
        setError(err instanceof Error ? err.message : "Could not load the fund");
      }
    }

    const id = setInterval(refresh, TICK_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="card flex min-h-[calc(100vh-32px)] flex-col">
      <FundHeader snapshot={snapshot} connection={connection} />
      <StatsRow snapshot={snapshot} />
      {error ? (
        <div className="flex items-center justify-between gap-3 border-b px-4 py-2 text-sm">
          <span className="text-sell">{error} — showing last book</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setConnection("connecting");
              fetch("/api/fund", { cache: "no-store" })
                .then((res) => {
                  if (!res.ok) throw new Error(`Fund feed ${res.status}`);
                  return res.json();
                })
                .then((data: FundSnapshot) => {
                  setSnapshot(data);
                  setConnection("live");
                  setError(null);
                })
                .catch((err: unknown) => {
                  setConnection("error");
                  setError(
                    err instanceof Error ? err.message : "Could not load the fund"
                  );
                });
            }}
          >
            Retry feed
          </Button>
        </div>
      ) : null}
      <div className="grid flex-1 gap-6 p-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:p-5">
        <EquityChart equity={snapshot.equity} />
        <DecisionPanel latest={snapshot.latestDecision} />
        <HoldingsTable holdings={snapshot.holdings} />
        <TradesPanel trades={snapshot.trades} decisions={snapshot.decisions} />
      </div>
      <PromoFooter />
    </div>
  );
}
