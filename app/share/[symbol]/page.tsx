import Link from "next/link";
import { notFound } from "next/navigation";

import { SYMBOL_META } from "@/lib/constants";
import { MarketSymbol } from "@/lib/types";

const symbols = Object.keys(SYMBOL_META) as MarketSymbol[];

export default async function SharePage({
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
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center bg-[#020617] p-4 text-slate-100">
      <div className="w-full rounded-2xl border border-white/15 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
        <p className="text-xs text-slate-400">Shared from QuantPulse v4</p>
        <h1 className="mt-1 text-2xl font-semibold">{quote.name}</h1>
        <p className="mt-3 font-mono text-3xl">${quote.price.toFixed(2)}</p>
        <p className={up ? "mt-1 text-emerald-400" : "mt-1 text-red-400"}>
          {up ? "+" : ""}
          {quote.changePercent.toFixed(2)}%
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-md border border-white/20 px-3 py-2 text-sm hover:bg-white/10"
        >
          Open QuantPulse Terminal
        </Link>
      </div>
    </main>
  );
}
