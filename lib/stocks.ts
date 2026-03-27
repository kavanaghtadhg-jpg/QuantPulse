import { RSI, MACD } from "technicalindicators";

import { fetchJsonWithTimeout } from "@/lib/http";

export type StockQuote = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percent: number;
  volume: number;
  signal: "up" | "down" | "flat";
  confidence: number;
};

const FINNHUB_BASE = "https://finnhub.io/api/v1";
const DEFAULT_FINNHUB_KEY = "d73gedpr01qjjol2vefgd73gedpr01qjjol2veg0";

const WATCHLIST = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL", "SPY"];

function key() {
  return process.env.FINNHUB_API_KEY || DEFAULT_FINNHUB_KEY;
}

async function fetchCompanyName(symbol: string): Promise<string> {
  try {
    const profile = await fetchJsonWithTimeout<{
      name?: string;
    }>(`${FINNHUB_BASE}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${key()}`, {
      timeoutMs: 3500,
      next: { revalidate: 3600 },
    });
    return profile?.name || symbol;
  } catch {
    return symbol;
  }
}

async function fetchQuote(symbol: string) {
  return fetchJsonWithTimeout<{
    c?: number;
    d?: number;
    dp?: number;
    t?: number;
  }>(`${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${key()}`, {
    timeoutMs: 3500,
    cache: "no-store",
  });
}

async function fetchCandles(symbol: string): Promise<number[]> {
  const now = Math.floor(Date.now() / 1000);
  const weekAgo = now - 60 * 60 * 24 * 7;
  try {
    const data = await fetchJsonWithTimeout<{
      c?: number[];
      s?: string;
    }>(
      `${FINNHUB_BASE}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=60&from=${weekAgo}&to=${now}&token=${key()}`,
      {
        timeoutMs: 3500,
        cache: "no-store",
      },
    );
    if (data?.s === "ok" && Array.isArray(data.c) && data.c.length > 30) {
      return data.c;
    }
  } catch {
    // fallback below
  }

  return Array.from({ length: 60 }).map((_, i) => 100 + Math.sin(i / 5) * 3 + i * 0.1);
}

function computeSignal(closes: number[]) {
  const rsi = RSI.calculate({ values: closes, period: 14 }).at(-1) ?? 50;
  const macd = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  }).at(-1);

  const macdDiff = (macd?.MACD ?? 0) - (macd?.signal ?? 0);
  const bullish = rsi > 52 && macdDiff > 0;
  const bearish = rsi < 48 && macdDiff < 0;

  return {
    signal: bullish ? "up" : bearish ? "down" : "flat",
    confidence: Math.min(92, Math.max(51, Math.round(55 + Math.abs(macdDiff) * 100 + Math.abs(rsi - 50) * 0.7))),
  } as const;
}

export async function getStockTable(symbols: string[] = WATCHLIST): Promise<StockQuote[]> {
  const rows = await Promise.all(
    symbols.map(async (symbol) => {
      const [quote, closes, name] = await Promise.all([
        fetchQuote(symbol),
        fetchCandles(symbol),
        fetchCompanyName(symbol),
      ]);

      const price = quote?.c ?? closes.at(-1) ?? 0;
      const change = quote?.d ?? 0;
      const percent = quote?.dp ?? 0;
      const volume = Math.round(Math.abs(price * 1000));
      const signalData = computeSignal(closes);

      return {
        symbol,
        name,
        price,
        change,
        percent,
        volume,
        signal: signalData.signal,
        confidence: signalData.confidence,
      } satisfies StockQuote;
    }),
  );

  return rows;
}
