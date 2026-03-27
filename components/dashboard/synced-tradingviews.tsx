"use client";

import { Maximize2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const symbols = [
  "TVC:GOLD",
  "NYMEX:CL1!",
  "BINANCE:ETHUSDT",
  "AMEX:SPY",
  "NASDAQ:AAPL",
  "NASDAQ:NVDA",
  "FX:EURUSD",
  "CBOE:VIX",
];

function chartUrl(symbol: string) {
  return `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_${encodeURIComponent(symbol)}&symbol=${encodeURIComponent(symbol)}&interval=60&hidesidetoolbar=1&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1`;
}

export function SyncedTradingViews() {
  const urls = useMemo(() => symbols.map((symbol) => ({ symbol, url: chartUrl(symbol) })), []);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const expandedChart = useMemo(
    () => urls.find((item) => item.symbol === expandedSymbol) ?? null,
    [expandedSymbol, urls],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpandedSymbol(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-slate-100">8 Synced TradingView Charts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 text-xs text-slate-400">
            Tip: click expand on any chart for a full-size view.
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {urls.map((item) => (
              <div key={item.symbol} className="overflow-hidden rounded-md border border-white/10 bg-slate-950">
                <div className="flex items-center justify-between border-b border-white/10 px-2 py-1">
                  <span className="text-[11px] text-slate-300">{item.symbol}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px] text-slate-300 hover:text-slate-100"
                    onClick={() => setExpandedSymbol(item.symbol)}
                  >
                    <Maximize2 className="size-3.5" />
                    Expand
                  </Button>
                </div>
                <iframe
                  title={item.symbol}
                  src={item.url}
                  className="h-44 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {expandedChart ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-3 backdrop-blur-sm md:p-6" onClick={() => setExpandedSymbol(null)}>
          <div
            className="mx-auto flex h-full w-full max-w-[1700px] flex-col overflow-hidden rounded-xl border border-white/15 bg-[#020617]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <p className="text-sm font-semibold text-slate-100">{expandedChart.symbol}</p>
              <Button variant="ghost" size="sm" className="text-slate-200" onClick={() => setExpandedSymbol(null)}>
                <X className="size-4" />
                Close
              </Button>
            </div>
            <iframe
              title={`${expandedChart.symbol} expanded`}
              src={expandedChart.url}
              className="h-full w-full"
              loading="eager"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
