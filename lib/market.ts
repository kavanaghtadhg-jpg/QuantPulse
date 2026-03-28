import { addMinutes, subDays } from "date-fns";

import { SYMBOL_META } from "@/lib/constants";
import { fetchWithTimeout } from "@/lib/http";
import { AssetQuote, Candle, MarketDataProvider, MarketSymbol } from "@/lib/types";
import { safeNumber } from "@/lib/utils";

function buildSyntheticCandles(base: number): Candle[] {
  const start = subDays(new Date(), 2);
  const candles: Candle[] = [];
  let previous = base;

  for (let i = 0; i < 96; i++) {
    const t = addMinutes(start, i * 30);
    const drift = Math.sin(i / 7) * 0.3 + (Math.random() - 0.5) * 0.4;
    const open = previous;
    const close = Math.max(0.01, open + drift);
    const high = Math.max(open, close) + Math.random() * 0.6;
    const low = Math.min(open, close) - Math.random() * 0.6;
    const volume = Math.floor(1000 + Math.random() * 3000);
    candles.push({
      time: t.toISOString(),
      open,
      high,
      low,
      close,
      volume,
    });
    previous = close;
  }

  return candles;
}

async function fetchYahooChart(symbol: MarketSymbol): Promise<Candle[] | null> {
  const yahoo = SYMBOL_META[symbol].yahooTicker;
  if (!yahoo) {
    return null;
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      yahoo,
    )}?interval=30m&range=5d`;
    const res = await fetchWithTimeout(url, {
      next: { revalidate: 120 },
      timeoutMs: 4000,
    });
    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    const timestamps: number[] = result?.timestamp ?? [];
    const quote = result?.indicators?.quote?.[0];
    const opens: number[] = quote?.open ?? [];
    const highs: number[] = quote?.high ?? [];
    const lows: number[] = quote?.low ?? [];
    const closes: number[] = quote?.close ?? [];
    const volumes: number[] = quote?.volume ?? [];

    if (!timestamps.length) {
      return null;
    }

    const candles: Candle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (
        !Number.isFinite(opens[i]) ||
        !Number.isFinite(highs[i]) ||
        !Number.isFinite(lows[i]) ||
        !Number.isFinite(closes[i])
      ) {
        continue;
      }

      candles.push({
        time: new Date(timestamps[i] * 1000).toISOString(),
        open: safeNumber(opens[i]),
        high: safeNumber(highs[i]),
        low: safeNumber(lows[i]),
        close: safeNumber(closes[i]),
        volume: safeNumber(volumes[i], 0),
      });
    }

    return candles.length ? candles : null;
  } catch {
    return null;
  }
}

async function fetchCommoditySnapshot(symbol: MarketSymbol): Promise<number | null> {
  const key = process.env.COMMODITY_KEY;
  const commodityCode = SYMBOL_META[symbol].commodityCode;
  if (!key || !commodityCode) {
    return null;
  }

  try {
    const url = `https://api.commoditypriceapi.com/v1/latest?api_key=${encodeURIComponent(
      key,
    )}&base=${encodeURIComponent(commodityCode)}&currencies=USD`;
    const res = await fetchWithTimeout(url, {
      cache: "no-store",
      timeoutMs: 4500,
    });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    const rate = data?.data?.rates?.USD;
    if (!Number.isFinite(rate)) {
      return null;
    }
    return 1 / Number(rate);
  } catch {
    return null;
  }
}

export async function getAssetQuote(symbol: MarketSymbol): Promise<AssetQuote> {
  const warnings: string[] = [];
  let provider: MarketDataProvider = "synthetic";

  const yahooCandles = await fetchYahooChart(symbol);
  if (yahooCandles) {
    provider = "yahoo";
  } else {
    warnings.push("Yahoo data unavailable; using synthetic candles");
  }

  const candles =
    yahooCandles ??
    buildSyntheticCandles(
      symbol === "PAU0" ? 998 : symbol === "CL1!" ? 79 : symbol === "ETH-USD" ? 3250 : 522,
    );

  const last = candles.at(-1)?.close ?? 0;
  const prev = candles.at(-2)?.close ?? last;
  const commodityOverride = await fetchCommoditySnapshot(symbol);
  if (commodityOverride !== null) {
    provider = "commoditypriceapi+yahoo";
    if (!yahooCandles) {
      warnings.push("Commodity snapshot available but chart candles are synthetic");
    }
  }
  const price = commodityOverride ?? last;
  const change = price - prev;

  return {
    symbol,
    name: SYMBOL_META[symbol].name,
    price,
    change,
    changePercent: prev ? (change / prev) * 100 : 0,
    currency: "USD",
    candles,
    meta: {
      source: provider === "synthetic" ? "fallback" : "live",
      provider,
      warnings,
    },
  };
}
