"use client";

import { ArrowDownRight, ArrowUpRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StockExchange } from "@/lib/stocks";
import { formatCompact, formatMoney } from "@/lib/utils";

type StockRow = {
  symbol: string;
  exchange: Exclude<StockExchange, "ALL">;
  name: string;
  price: number;
  change: number;
  percent: number;
  volume: number;
  signal: "up" | "down" | "flat";
  confidence: number;
  provider: "finnhub" | "yahoo" | "fallback";
};

const exchanges: StockExchange[] = ["ALL", "NYSE", "NASDAQ", "LSE", "HKEX", "NSE"];

export function LiveStocksTable({
  symbols,
  exchange = "ALL",
}: {
  symbols?: string[];
  exchange?: StockExchange;
}) {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [query, setQuery] = useState("");
  const [activeExchange, setActiveExchange] = useState<StockExchange>(exchange);

  useEffect(() => {
    setActiveExchange(exchange);
  }, [exchange]);

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams();
      if (symbols?.length) {
        params.set("symbols", symbols.join(","));
      }
      params.set("exchange", activeExchange);
      params.set("limit", activeExchange === "ALL" ? "120" : "100");
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const response = await fetch(`/api/stocks${suffix}`, { cache: "no-store" });
      const data = await response.json();
      setRows(data.stocks ?? []);
    };

    run();
    const id = setInterval(run, 30_000);
    return () => clearInterval(id);
  }, [symbols, activeExchange]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter((row) =>
      `${row.symbol} ${row.name} ${row.exchange} ${row.provider}`.toLowerCase().includes(q),
    );
  }, [query, rows]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-slate-100">Live Stocks (Global Exchanges)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {exchanges.map((item) => (
            <button
              key={item}
              onClick={() => setActiveExchange(item)}
              className={`rounded-md border px-2 py-1 text-xs ${
                activeExchange === item
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                  : "border-white/15 bg-white/5 text-slate-300"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search stocks"
            className="pl-9"
          />
        </div>

        <div className="max-h-[360px] overflow-auto rounded-md border border-white/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Move</TableHead>
                <TableHead>Signal</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Vol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const up = row.percent >= 0;
                const signalVariant =
                  row.signal === "up" ? "success" : row.signal === "down" ? "danger" : "muted";
                return (
                  <TableRow key={`${row.exchange}:${row.symbol}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-100">{row.symbol}</p>
                        <p className="text-[11px] text-slate-400">{row.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-slate-100">{formatMoney(row.price)}</TableCell>
                    <TableCell>
                      <div className={up ? "text-emerald-300" : "text-red-300"}>
                        <p className="flex items-center gap-1 text-xs">
                          {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                          {row.percent.toFixed(2)}%
                        </p>
                        <p className="text-[11px]">{row.change.toFixed(2)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={signalVariant}>{row.confidence}%</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-300">{row.exchange}</TableCell>
                    <TableCell className="text-xs text-slate-300">{formatCompact(row.volume)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
