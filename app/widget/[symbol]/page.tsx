import { notFound } from "next/navigation";

import { APP_NAME, SYMBOL_META } from "@/lib/constants";
import { MarketSymbol } from "@/lib/types";

const symbols = Object.keys(SYMBOL_META) as MarketSymbol[];

export const dynamic = "force-dynamic";

export default async function WidgetPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;

  if (!symbols.includes(symbol as MarketSymbol)) {
    notFound();
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/market?symbol=${symbol}`,
    { cache: "no-store" },
  );
  const data = await response.json();
  const quote = data.quote;
  const up = quote.changePercent >= 0;

  return (
    <main className="min-h-screen bg-[#020617] p-4 text-slate-100">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs text-slate-400">{APP_NAME} Widget</p>
        <h1 className="text-lg font-semibold">{quote.symbol}</h1>
        <p className="text-2xl font-mono">${quote.price.toFixed(2)}</p>
        <p className={up ? "text-emerald-400" : "text-red-400"}>
          {quote.changePercent.toFixed(2)}%
        </p>
        <p className="mt-3 text-xs text-slate-400">Powered by QuantPulse embeddable iframe.</p>
      </div>
    </main>
  );
}
