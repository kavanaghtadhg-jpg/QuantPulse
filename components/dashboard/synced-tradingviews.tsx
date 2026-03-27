"use client";

import { useMemo } from "react";

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-slate-100">8 Synced TradingView Charts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {urls.map((item) => (
            <div key={item.symbol} className="overflow-hidden rounded-md border border-white/10 bg-slate-950">
              <div className="border-b border-white/10 px-2 py-1 text-[11px] text-slate-300">
                {item.symbol}
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
  );
}
