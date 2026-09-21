"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clock, formatUsd, signedClass } from "@/lib/format";
import type { DecisionEvent, Trade } from "@/lib/types";
import { cn } from "cn";

function TradeRows({ trades }: { trades: Trade[] }) {
  if (trades.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No prints in this tape yet.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time</TableHead>
          <TableHead>Side</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">Shares</TableHead>
          <TableHead className="text-right">Px</TableHead>
          <TableHead className="text-right">Realized</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.slice(0, 40).map((t) => (
          <TableRow key={t.id}>
            <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
              {clock(t.ts)}
            </TableCell>
            <TableCell>
              <Badge
                variant="secondary"
                className={cn(
                  "uppercase",
                  t.side === "buy"
                    ? "bg-[#D9EEE3] text-buy-ink"
                    : "bg-[#F9DED6] text-sell-ink"
                )}
              >
                {t.side}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">{t.ticker}</TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {t.shares}
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {formatUsd(t.price)}
            </TableCell>
            <TableCell
              className={`text-right font-mono tabular-nums ${
                t.realizedPnl == null ? "text-muted-foreground" : signedClass(t.realizedPnl)
              }`}
            >
              {t.realizedPnl == null ? "—" : formatUsd(t.realizedPnl)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function TradesPanel({
  trades,
  decisions,
}: {
  trades: Trade[];
  decisions: DecisionEvent[];
}) {
  const buys = trades.filter((t) => t.side === "buy");
  const losses = trades.filter(
    (t) => t.side === "sell" && (t.realizedPnl ?? 0) < 0
  );

  return (
    <Tabs defaultValue="losses">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
          Tape
        </h2>
        <TabsList variant="line" className="h-8">
          <TabsTrigger value="losses">Losses</TabsTrigger>
          <TabsTrigger value="buys">Buys</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="feed">Feed</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="losses">
        <TradeRows trades={losses} />
      </TabsContent>
      <TabsContent value="buys">
        <TradeRows trades={buys} />
      </TabsContent>
      <TabsContent value="all">
        <TradeRows trades={trades} />
      </TabsContent>
      <TabsContent value="feed">
        <ol className="max-h-[360px] space-y-1 overflow-auto font-mono text-[12px] leading-5">
          {decisions.slice(0, 60).map((d) => (
            <li key={`${d.tick}-${d.ticker}`} className="flex gap-2">
              <span className="text-muted-foreground">{clock(d.ts)}</span>
              <span
                className={cn(
                  "w-10 uppercase",
                  d.action === "buy" && "text-buy",
                  d.action === "sell" && "text-sell"
                )}
              >
                {d.action}
              </span>
              <span>{d.ticker}</span>
              <span className="text-muted-foreground">{d.note}</span>
            </li>
          ))}
        </ol>
      </TabsContent>
    </Tabs>
  );
}
