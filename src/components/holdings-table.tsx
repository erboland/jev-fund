import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPct, formatShares, formatUsd, formatWeight, signedClass } from "@/lib/format";
import type { Holding } from "@/lib/types";

export function HoldingsTable({ holdings }: { holdings: Holding[] }) {
  if (holdings.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl bg-muted/50 px-4 text-center text-sm text-muted-foreground">
        Flat. The fund is in cash until the next buy fills.
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-2 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
        Holdings
      </h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Shares</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead className="text-right">Unrl. P&L</TableHead>
            <TableHead className="text-right">Wt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map((h) => (
            <TableRow key={h.ticker}>
              <TableCell>
                <div className="font-medium">{h.ticker}</div>
                <div className="text-xs text-muted-foreground">{h.name}</div>
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatShares(h.shares)}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatUsd(h.price)}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatUsd(h.marketValue)}
              </TableCell>
              <TableCell
                className={`text-right font-mono tabular-nums ${signedClass(h.unrealizedPnl)}`}
              >
                <div>{formatUsd(h.unrealizedPnl)}</div>
                <div className="text-[11px]">{formatPct(h.unrealizedPnlPct)}</div>
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatWeight(h.weight)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
