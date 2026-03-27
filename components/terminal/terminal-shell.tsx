"use client";

import { motion } from "framer-motion";
import { LineChart, Rocket } from "lucide-react";
import Split from "react-split";
import { useEffect, useMemo, useState } from "react";

import { ChartPanel } from "@/components/terminal/chart-panel";
import { NewsTicker } from "@/components/terminal/news-ticker";
import { PricingStrip } from "@/components/terminal/pricing-strip";
import { RightRail } from "@/components/terminal/right-rail";
import { TierSwitcher } from "@/components/terminal/tier-switcher";
import { WatchlistSidebar } from "@/components/terminal/watchlist-sidebar";
import { WidgetShareCard } from "@/components/terminal/widget-share-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_SYMBOL } from "@/lib/constants";
import { computeTa, detectElliottWave } from "@/lib/ta";
import { AssetQuote, MarketSymbol, Tier } from "@/lib/types";

export function TerminalShell() {
  const [tier, setTier] = useState<Tier>("free");
  const [symbol, setSymbol] = useState<MarketSymbol>(DEFAULT_SYMBOL);
  const [quotes, setQuotes] = useState<Record<string, AssetQuote>>({});

  useEffect(() => {
    const run = async () => {
      const targets: MarketSymbol[] = ["PAU0", "CL1!", "ETH-USD", "SPY"];
      const entries = await Promise.all(
        targets.map(async (target) => {
          const res = await fetch(`/api/market?symbol=${target}`, { cache: "no-store" });
          const data = await res.json();
          return [target, data.quote] as const;
        }),
      );
      setQuotes(Object.fromEntries(entries));
    };

    run();
    const id = setInterval(run, 45_000);
    return () => clearInterval(id);
  }, []);

  const activeQuote = quotes[symbol] ?? null;
  const ta = useMemo(() => (activeQuote ? computeTa(activeQuote.candles) : null), [activeQuote]);
  const wave = useMemo(
    () => (activeQuote && tier !== "free" ? detectElliottWave(activeQuote.candles) : null),
    [activeQuote, tier],
  );

  return (
    <div className="space-y-3">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card flex flex-wrap items-center justify-between gap-3 p-3"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-emerald-500/20 p-2 text-emerald-300">
            <LineChart className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">QuantPulse v4 Terminal</h1>
            <p className="text-xs text-slate-400">Bloomberg power, retail price, cloud-native.</p>
          </div>
          <Badge variant="success">LIVE</Badge>
        </div>

        <div className="flex items-center gap-2">
          <TierSwitcher tier={tier} onTier={setTier} />
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={() => setTier("pro")}>
            <Rocket className="size-4" />
            Unlock Pro
          </Button>
        </div>
      </motion.header>

      <NewsTicker />
      <PricingStrip tier={tier} />

      <div className="hidden h-[calc(100vh-270px)] min-h-[640px] lg:block">
        <Split
          className="flex h-full gap-3"
          sizes={[20, 52, 28]}
          minSize={[200, 420, 280]}
          gutterSize={6}
          snapOffset={8}
        >
          <WatchlistSidebar
            prices={Object.fromEntries(
              Object.entries(quotes).map(([key, value]) => [
                key,
                { price: value.price, changePercent: value.changePercent },
              ]),
            )}
            activeSymbol={symbol}
            onSelect={setSymbol}
          />

          <div className="space-y-3">
            <ChartPanel quote={activeQuote} ta={ta} />
            <WidgetShareCard symbol={symbol} />
          </div>

          <RightRail tier={tier} symbol={symbol} wave={wave} />
        </Split>
      </div>

      <div className="space-y-3 lg:hidden">
        <WatchlistSidebar
          prices={Object.fromEntries(
            Object.entries(quotes).map(([key, value]) => [
              key,
              { price: value.price, changePercent: value.changePercent },
            ]),
          )}
          activeSymbol={symbol}
          onSelect={setSymbol}
        />
        <ChartPanel quote={activeQuote} ta={ta} />
        <RightRail tier={tier} symbol={symbol} wave={wave} />
        <WidgetShareCard symbol={symbol} />
      </div>

      <Card>
        <CardContent className="grid gap-3 p-3 md:grid-cols-3">
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-2 text-xs text-slate-300">
            <p className="font-semibold text-slate-100">Referral Growth Loop</p>
            <p>5 successful signups unlock 1 free month of Pro.</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-2 text-xs text-slate-300">
            <p className="font-semibold text-slate-100">Enterprise Tier</p>
            <p>Custom screens, API access, and managed onboarding at $99/mo.</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-2 text-xs text-slate-300">
            <p className="font-semibold text-slate-100">PWA Ready</p>
            <p>Install QuantPulse on desktop/mobile for app-like trading workflows.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
