"use client";

import { useMemo, useState } from "react";

import { LiveStocksTable } from "@/components/dashboard/live-stocks-table";
import { VoiceSearch } from "@/components/dashboard/voice-search";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StocksPageClient() {
  const [portfolio, setPortfolio] = useState<string[]>(["AAPL", "MSFT", "SPY", "NVDA"]);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) {
      return portfolio;
    }
    return portfolio.filter((symbol) => symbol.toLowerCase().includes(search.toLowerCase()));
  }, [portfolio, search]);

  const add = () => {
    const symbol = search.trim().toUpperCase();
    if (!symbol || portfolio.includes(symbol)) {
      return;
    }
    setPortfolio((prev) => [...prev, symbol]);
  };

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-slate-100">Stocks Search + Portfolio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <VoiceSearch onSearch={setSearch} />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={add}>
              Add Symbol
            </Button>
            {portfolio.map((symbol) => (
              <button
                key={symbol}
                onClick={() => setSearch(symbol)}
                className="rounded-md border border-white/15 bg-white/[0.04] px-2 py-1 text-xs text-slate-200"
              >
                {symbol}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      <LiveStocksTable symbols={filtered} />
    </div>
  );
}
