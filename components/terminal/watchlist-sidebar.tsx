"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SYMBOL_META } from "@/lib/constants";
import { MarketSymbol } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export function WatchlistSidebar({
  prices,
  activeSymbol,
  onSelect,
}: {
  prices: Record<string, { price: number; changePercent: number }>;
  activeSymbol: MarketSymbol;
  onSelect: (symbol: MarketSymbol) => void;
}) {
  const [query, setQuery] = useState("");

  const symbols = useMemo(
    () =>
      (Object.keys(SYMBOL_META) as MarketSymbol[]).filter((symbol) => {
        const text = `${symbol} ${SYMBOL_META[symbol].name}`.toLowerCase();
        return text.includes(query.toLowerCase());
      }),
    [query],
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-slate-100">
          Watchlist
          <Badge variant="muted">Free Tier</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search assets"
            className="pl-9"
          />
        </div>

        <div className="space-y-2">
          {symbols.map((symbol) => {
            const quote = prices[symbol];
            const isUp = (quote?.changePercent ?? 0) >= 0;
            const selected = activeSymbol === symbol;

            return (
              <motion.button
                whileHover={{ y: -1, scale: 1.01 }}
                key={symbol}
                onClick={() => onSelect(symbol)}
                className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                  selected
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-100">{symbol}</span>
                  <Badge variant={isUp ? "success" : "danger"}>
                    {quote ? `${quote.changePercent.toFixed(2)}%` : "..."}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">{SYMBOL_META[symbol].name}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-200">
                  <ArrowUpRight className="size-3" />
                  {formatMoney(quote?.price ?? 0)}
                </p>
              </motion.button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
