import { MACD, RSI } from "technicalindicators";

import { fetchJsonWithTimeout, fetchWithTimeout } from "@/lib/http";

export type StockExchange = "ALL" | "NYSE" | "NASDAQ" | "LSE" | "HKEX" | "NSE";

export type StockQuote = {
  symbol: string;
  exchange: StockExchange;
  name: string;
  price: number;
  change: number;
  percent: number;
  volume: number;
  signal: "up" | "down" | "flat";
  confidence: number;
  provider: "finnhub" | "yahoo" | "fallback";
};

type UniverseSymbol = {
  symbol: string;
  name: string;
  exchange: Exclude<StockExchange, "ALL">;
  yahooSymbol: string;
};

const FINNHUB_BASE = "https://finnhub.io/api/v1";
const DEFAULT_FINNHUB_KEY = "d73gedpr01qjjol2vefgd73gedpr01qjjol2veg0";
const YAHOO_QUOTE_BASE = "https://query1.finance.yahoo.com/v7/finance/quote";
const YAHOO_CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

const EXCHANGE_TO_FINNHUB: Record<Exclude<StockExchange, "ALL">, string> = {
  NYSE: "US",
  NASDAQ: "US",
  LSE: "LSE",
  HKEX: "HKEX",
  NSE: "NSE",
};

const EXCHANGE_UNIVERSE: Record<Exclude<StockExchange, "ALL">, UniverseSymbol[]> = {
  NYSE: [
    { symbol: "BRK.B", name: "Berkshire Hathaway", exchange: "NYSE", yahooSymbol: "BRK-B" },
    { symbol: "JPM", name: "JPMorgan Chase", exchange: "NYSE", yahooSymbol: "JPM" },
    { symbol: "V", name: "Visa", exchange: "NYSE", yahooSymbol: "V" },
    { symbol: "MA", name: "Mastercard", exchange: "NYSE", yahooSymbol: "MA" },
    { symbol: "UNH", name: "UnitedHealth", exchange: "NYSE", yahooSymbol: "UNH" },
    { symbol: "XOM", name: "Exxon Mobil", exchange: "NYSE", yahooSymbol: "XOM" },
    { symbol: "JNJ", name: "Johnson & Johnson", exchange: "NYSE", yahooSymbol: "JNJ" },
    { symbol: "WMT", name: "Walmart", exchange: "NYSE", yahooSymbol: "WMT" },
    { symbol: "PG", name: "Procter & Gamble", exchange: "NYSE", yahooSymbol: "PG" },
    { symbol: "HD", name: "Home Depot", exchange: "NYSE", yahooSymbol: "HD" },
    { symbol: "KO", name: "Coca-Cola", exchange: "NYSE", yahooSymbol: "KO" },
    { symbol: "DIS", name: "Walt Disney", exchange: "NYSE", yahooSymbol: "DIS" },
    { symbol: "NKE", name: "Nike", exchange: "NYSE", yahooSymbol: "NKE" },
    { symbol: "BAC", name: "Bank of America", exchange: "NYSE", yahooSymbol: "BAC" },
    { symbol: "PFE", name: "Pfizer", exchange: "NYSE", yahooSymbol: "PFE" },
    { symbol: "ABBV", name: "AbbVie", exchange: "NYSE", yahooSymbol: "ABBV" },
    { symbol: "MRK", name: "Merck", exchange: "NYSE", yahooSymbol: "MRK" },
    { symbol: "CVX", name: "Chevron", exchange: "NYSE", yahooSymbol: "CVX" },
    { symbol: "MCD", name: "McDonald's", exchange: "NYSE", yahooSymbol: "MCD" },
    { symbol: "IBM", name: "IBM", exchange: "NYSE", yahooSymbol: "IBM" },
    { symbol: "ORCL", name: "Oracle", exchange: "NYSE", yahooSymbol: "ORCL" },
    { symbol: "CRM", name: "Salesforce", exchange: "NYSE", yahooSymbol: "CRM" },
    { symbol: "T", name: "AT&T", exchange: "NYSE", yahooSymbol: "T" },
    { symbol: "VZ", name: "Verizon", exchange: "NYSE", yahooSymbol: "VZ" },
    { symbol: "CAT", name: "Caterpillar", exchange: "NYSE", yahooSymbol: "CAT" },
  ],
  NASDAQ: [
    { symbol: "AAPL", name: "Apple", exchange: "NASDAQ", yahooSymbol: "AAPL" },
    { symbol: "MSFT", name: "Microsoft", exchange: "NASDAQ", yahooSymbol: "MSFT" },
    { symbol: "NVDA", name: "NVIDIA", exchange: "NASDAQ", yahooSymbol: "NVDA" },
    { symbol: "TSLA", name: "Tesla", exchange: "NASDAQ", yahooSymbol: "TSLA" },
    { symbol: "AMZN", name: "Amazon", exchange: "NASDAQ", yahooSymbol: "AMZN" },
    { symbol: "GOOGL", name: "Alphabet", exchange: "NASDAQ", yahooSymbol: "GOOGL" },
    { symbol: "META", name: "Meta Platforms", exchange: "NASDAQ", yahooSymbol: "META" },
    { symbol: "NFLX", name: "Netflix", exchange: "NASDAQ", yahooSymbol: "NFLX" },
    { symbol: "ADBE", name: "Adobe", exchange: "NASDAQ", yahooSymbol: "ADBE" },
    { symbol: "AVGO", name: "Broadcom", exchange: "NASDAQ", yahooSymbol: "AVGO" },
    { symbol: "AMD", name: "AMD", exchange: "NASDAQ", yahooSymbol: "AMD" },
    { symbol: "INTC", name: "Intel", exchange: "NASDAQ", yahooSymbol: "INTC" },
    { symbol: "CSCO", name: "Cisco", exchange: "NASDAQ", yahooSymbol: "CSCO" },
    { symbol: "QCOM", name: "Qualcomm", exchange: "NASDAQ", yahooSymbol: "QCOM" },
    { symbol: "PEP", name: "PepsiCo", exchange: "NASDAQ", yahooSymbol: "PEP" },
    { symbol: "COST", name: "Costco", exchange: "NASDAQ", yahooSymbol: "COST" },
    { symbol: "AMGN", name: "Amgen", exchange: "NASDAQ", yahooSymbol: "AMGN" },
    { symbol: "TXN", name: "Texas Instruments", exchange: "NASDAQ", yahooSymbol: "TXN" },
    { symbol: "INTU", name: "Intuit", exchange: "NASDAQ", yahooSymbol: "INTU" },
    { symbol: "PYPL", name: "PayPal", exchange: "NASDAQ", yahooSymbol: "PYPL" },
    { symbol: "SBUX", name: "Starbucks", exchange: "NASDAQ", yahooSymbol: "SBUX" },
    { symbol: "BKNG", name: "Booking Holdings", exchange: "NASDAQ", yahooSymbol: "BKNG" },
    { symbol: "GILD", name: "Gilead Sciences", exchange: "NASDAQ", yahooSymbol: "GILD" },
    { symbol: "ISRG", name: "Intuitive Surgical", exchange: "NASDAQ", yahooSymbol: "ISRG" },
    { symbol: "MU", name: "Micron", exchange: "NASDAQ", yahooSymbol: "MU" },
  ],
  LSE: [
    { symbol: "HSBA.L", name: "HSBC Holdings", exchange: "LSE", yahooSymbol: "HSBA.L" },
    { symbol: "SHEL.L", name: "Shell", exchange: "LSE", yahooSymbol: "SHEL.L" },
    { symbol: "AZN.L", name: "AstraZeneca", exchange: "LSE", yahooSymbol: "AZN.L" },
    { symbol: "BP.L", name: "BP", exchange: "LSE", yahooSymbol: "BP.L" },
    { symbol: "GSK.L", name: "GSK", exchange: "LSE", yahooSymbol: "GSK.L" },
    { symbol: "ULVR.L", name: "Unilever", exchange: "LSE", yahooSymbol: "ULVR.L" },
    { symbol: "RIO.L", name: "Rio Tinto", exchange: "LSE", yahooSymbol: "RIO.L" },
    { symbol: "VOD.L", name: "Vodafone", exchange: "LSE", yahooSymbol: "VOD.L" },
    { symbol: "BARC.L", name: "Barclays", exchange: "LSE", yahooSymbol: "BARC.L" },
    { symbol: "LLOY.L", name: "Lloyds Banking", exchange: "LSE", yahooSymbol: "LLOY.L" },
    { symbol: "DGE.L", name: "Diageo", exchange: "LSE", yahooSymbol: "DGE.L" },
    { symbol: "NG.L", name: "National Grid", exchange: "LSE", yahooSymbol: "NG.L" },
    { symbol: "REL.L", name: "RELX", exchange: "LSE", yahooSymbol: "REL.L" },
    { symbol: "BATS.L", name: "British American Tobacco", exchange: "LSE", yahooSymbol: "BATS.L" },
    { symbol: "GLEN.L", name: "Glencore", exchange: "LSE", yahooSymbol: "GLEN.L" },
    { symbol: "PRU.L", name: "Prudential", exchange: "LSE", yahooSymbol: "PRU.L" },
    { symbol: "BA.L", name: "BAE Systems", exchange: "LSE", yahooSymbol: "BA.L" },
    { symbol: "SMT.L", name: "Scottish Mortgage", exchange: "LSE", yahooSymbol: "SMT.L" },
    { symbol: "AAL.L", name: "Anglo American", exchange: "LSE", yahooSymbol: "AAL.L" },
    { symbol: "STAN.L", name: "Standard Chartered", exchange: "LSE", yahooSymbol: "STAN.L" },
    { symbol: "IMB.L", name: "Imperial Brands", exchange: "LSE", yahooSymbol: "IMB.L" },
    { symbol: "TSCO.L", name: "Tesco", exchange: "LSE", yahooSymbol: "TSCO.L" },
    { symbol: "INF.L", name: "Informa", exchange: "LSE", yahooSymbol: "INF.L" },
    { symbol: "CRH.L", name: "CRH", exchange: "LSE", yahooSymbol: "CRH.L" },
    { symbol: "TSLA.L", name: "Tesla (LSE line)", exchange: "LSE", yahooSymbol: "TSLA.L" },
  ],
  HKEX: [
    { symbol: "0700.HK", name: "Tencent", exchange: "HKEX", yahooSymbol: "0700.HK" },
    { symbol: "9988.HK", name: "Alibaba HK", exchange: "HKEX", yahooSymbol: "9988.HK" },
    { symbol: "0939.HK", name: "CCB", exchange: "HKEX", yahooSymbol: "0939.HK" },
    { symbol: "1299.HK", name: "AIA", exchange: "HKEX", yahooSymbol: "1299.HK" },
    { symbol: "2318.HK", name: "Ping An", exchange: "HKEX", yahooSymbol: "2318.HK" },
    { symbol: "1398.HK", name: "ICBC", exchange: "HKEX", yahooSymbol: "1398.HK" },
    { symbol: "0005.HK", name: "HSBC HK", exchange: "HKEX", yahooSymbol: "0005.HK" },
    { symbol: "1211.HK", name: "BYD", exchange: "HKEX", yahooSymbol: "1211.HK" },
    { symbol: "3690.HK", name: "Meituan", exchange: "HKEX", yahooSymbol: "3690.HK" },
    { symbol: "1810.HK", name: "Xiaomi", exchange: "HKEX", yahooSymbol: "1810.HK" },
    { symbol: "9618.HK", name: "JD.com HK", exchange: "HKEX", yahooSymbol: "9618.HK" },
    { symbol: "9888.HK", name: "Baidu HK", exchange: "HKEX", yahooSymbol: "9888.HK" },
    { symbol: "2269.HK", name: "WuXi Biologics", exchange: "HKEX", yahooSymbol: "2269.HK" },
    { symbol: "2388.HK", name: "BOC Hong Kong", exchange: "HKEX", yahooSymbol: "2388.HK" },
    { symbol: "0388.HK", name: "HK Exchanges", exchange: "HKEX", yahooSymbol: "0388.HK" },
    { symbol: "1928.HK", name: "Sands China", exchange: "HKEX", yahooSymbol: "1928.HK" },
    { symbol: "0688.HK", name: "China Overseas", exchange: "HKEX", yahooSymbol: "0688.HK" },
    { symbol: "1093.HK", name: "CSPC Pharma", exchange: "HKEX", yahooSymbol: "1093.HK" },
    { symbol: "0175.HK", name: "Geely", exchange: "HKEX", yahooSymbol: "0175.HK" },
    { symbol: "2015.HK", name: "Li Auto HK", exchange: "HKEX", yahooSymbol: "2015.HK" },
    { symbol: "2601.HK", name: "Cinda", exchange: "HKEX", yahooSymbol: "2601.HK" },
    { symbol: "0669.HK", name: "Techtronic", exchange: "HKEX", yahooSymbol: "0669.HK" },
    { symbol: "1113.HK", name: "CK Asset", exchange: "HKEX", yahooSymbol: "1113.HK" },
    { symbol: "0883.HK", name: "CNOOC", exchange: "HKEX", yahooSymbol: "0883.HK" },
    { symbol: "2628.HK", name: "China Life", exchange: "HKEX", yahooSymbol: "2628.HK" },
  ],
  NSE: [
    { symbol: "RELIANCE.NS", name: "Reliance", exchange: "NSE", yahooSymbol: "RELIANCE.NS" },
    { symbol: "TCS.NS", name: "TCS", exchange: "NSE", yahooSymbol: "TCS.NS" },
    { symbol: "INFY.NS", name: "Infosys", exchange: "NSE", yahooSymbol: "INFY.NS" },
    { symbol: "HDFCBANK.NS", name: "HDFC Bank", exchange: "NSE", yahooSymbol: "HDFCBANK.NS" },
    { symbol: "ICICIBANK.NS", name: "ICICI Bank", exchange: "NSE", yahooSymbol: "ICICIBANK.NS" },
    { symbol: "SBIN.NS", name: "State Bank of India", exchange: "NSE", yahooSymbol: "SBIN.NS" },
    { symbol: "LT.NS", name: "Larsen & Toubro", exchange: "NSE", yahooSymbol: "LT.NS" },
    { symbol: "ITC.NS", name: "ITC", exchange: "NSE", yahooSymbol: "ITC.NS" },
    { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", exchange: "NSE", yahooSymbol: "BHARTIARTL.NS" },
    { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra", exchange: "NSE", yahooSymbol: "KOTAKBANK.NS" },
    { symbol: "AXISBANK.NS", name: "Axis Bank", exchange: "NSE", yahooSymbol: "AXISBANK.NS" },
    { symbol: "ASIANPAINT.NS", name: "Asian Paints", exchange: "NSE", yahooSymbol: "ASIANPAINT.NS" },
    { symbol: "MARUTI.NS", name: "Maruti Suzuki", exchange: "NSE", yahooSymbol: "MARUTI.NS" },
    { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", exchange: "NSE", yahooSymbol: "HINDUNILVR.NS" },
    { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", exchange: "NSE", yahooSymbol: "BAJFINANCE.NS" },
    { symbol: "WIPRO.NS", name: "Wipro", exchange: "NSE", yahooSymbol: "WIPRO.NS" },
    { symbol: "SUNPHARMA.NS", name: "Sun Pharma", exchange: "NSE", yahooSymbol: "SUNPHARMA.NS" },
    { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement", exchange: "NSE", yahooSymbol: "ULTRACEMCO.NS" },
    { symbol: "TATAMOTORS.NS", name: "Tata Motors", exchange: "NSE", yahooSymbol: "TATAMOTORS.NS" },
    { symbol: "M&M.NS", name: "Mahindra & Mahindra", exchange: "NSE", yahooSymbol: "M&M.NS" },
    { symbol: "POWERGRID.NS", name: "Power Grid", exchange: "NSE", yahooSymbol: "POWERGRID.NS" },
    { symbol: "NTPC.NS", name: "NTPC", exchange: "NSE", yahooSymbol: "NTPC.NS" },
    { symbol: "TITAN.NS", name: "Titan", exchange: "NSE", yahooSymbol: "TITAN.NS" },
    { symbol: "ADANIENT.NS", name: "Adani Enterprises", exchange: "NSE", yahooSymbol: "ADANIENT.NS" },
    { symbol: "ONGC.NS", name: "ONGC", exchange: "NSE", yahooSymbol: "ONGC.NS" },
  ],
};

function key() {
  return process.env.FINNHUB_API_KEY || DEFAULT_FINNHUB_KEY;
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function resolveUniverse(exchange: StockExchange, limit: number): UniverseSymbol[] {
  if (exchange === "ALL") {
    return Object.values(EXCHANGE_UNIVERSE).flat().slice(0, limit);
  }
  return (EXCHANGE_UNIVERSE[exchange] ?? []).slice(0, limit);
}

function findUniverseSymbol(symbol: string): UniverseSymbol | null {
  const normalized = normalizeSymbol(symbol);
  return (
    Object.values(EXCHANGE_UNIVERSE)
      .flat()
      .find((row) => normalizeSymbol(row.symbol) === normalized) ?? null
  );
}

function syntheticSeries(anchor: number): number[] {
  return Array.from({ length: 80 }).map((_, idx) => anchor + Math.sin(idx / 6) * 1.6 + idx * 0.04);
}

async function fetchCompanyName(symbol: string, fallbackName: string): Promise<string> {
  try {
    const profile = await fetchJsonWithTimeout<{ name?: string }>(
      `${FINNHUB_BASE}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${key()}`,
      {
        timeoutMs: 2500,
        next: { revalidate: 3600 },
      },
    );
    return profile?.name || fallbackName;
  } catch {
    return fallbackName;
  }
}

type QuotePayload = {
  c?: number;
  d?: number;
  dp?: number;
  t?: number;
  v?: number;
};

async function fetchFinnhubQuote(symbol: string): Promise<QuotePayload | null> {
  try {
    const res = await fetchWithTimeout(
      `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${key()}`,
      {
        timeoutMs: 3000,
        cache: "no-store",
      },
    );
    if (!res.ok) {
      return null;
    }
    const payload = (await res.json()) as QuotePayload;
    if (!Number.isFinite(payload?.c) || Number(payload.c) <= 0) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

async function fetchYahooQuote(yahooSymbol: string): Promise<QuotePayload | null> {
  try {
    const data = await fetchJsonWithTimeout<{
      quoteResponse?: {
        result?: Array<{
          regularMarketPrice?: number;
          regularMarketChange?: number;
          regularMarketChangePercent?: number;
          regularMarketVolume?: number;
          regularMarketTime?: number;
        }>;
      };
    }>(`${YAHOO_QUOTE_BASE}?symbols=${encodeURIComponent(yahooSymbol)}`, {
      timeoutMs: 3200,
      cache: "no-store",
    });

    const row = data?.quoteResponse?.result?.[0];
    if (!Number.isFinite(row?.regularMarketPrice)) {
      return null;
    }

    return {
      c: row?.regularMarketPrice,
      d: row?.regularMarketChange ?? 0,
      dp: row?.regularMarketChangePercent ?? 0,
      t: row?.regularMarketTime,
      v: row?.regularMarketVolume ?? 0,
    };
  } catch {
    return null;
  }
}

async function fetchCandles(symbol: string, exchange: Exclude<StockExchange, "ALL">, yahooSymbol: string): Promise<number[]> {
  const now = Math.floor(Date.now() / 1000);
  const from = now - 60 * 60 * 18;

  try {
    const data = await fetchJsonWithTimeout<{
      c?: number[];
      s?: string;
    }>(
      `${FINNHUB_BASE}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=1&from=${from}&to=${now}&exchange=${encodeURIComponent(EXCHANGE_TO_FINNHUB[exchange])}&token=${key()}`,
      {
        timeoutMs: 3200,
        cache: "no-store",
      },
    );

    if (data?.s === "ok" && Array.isArray(data.c) && data.c.length > 20) {
      return data.c;
    }
  } catch {
    // fallback below
  }

  try {
    const chart = await fetchJsonWithTimeout<{
      chart?: {
        result?: Array<{
          indicators?: { quote?: Array<{ close?: Array<number | null> }> };
        }>;
      };
    }>(`${YAHOO_CHART_BASE}/${encodeURIComponent(yahooSymbol)}?range=5d&interval=15m`, {
      timeoutMs: 3200,
      cache: "no-store",
    });

    const closes = chart?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
    const clean = closes.filter((value): value is number => Number.isFinite(value));
    if (clean.length > 20) {
      return clean;
    }
  } catch {
    // fallback below
  }

  return [];
}

async function runPool<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) {
        return;
      }
      out[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }).map(async () => {
      await worker();
    }),
  );

  return out;
}

function quoteFromSynthetic(anchor = 100): QuotePayload {
  const swing = Math.sin(Date.now() / 30_000) * 1.2;
  const change = swing / 2;
  return {
    c: anchor + swing,
    d: change,
    dp: (change / Math.max(anchor, 1)) * 100,
    t: Math.floor(Date.now() / 1000),
    v: Math.round(anchor * 1000),
  };
}

function inferExchangeFromSymbol(symbol: string): Exclude<StockExchange, "ALL"> {
  if (symbol.endsWith(".L")) return "LSE";
  if (symbol.endsWith(".HK")) return "HKEX";
  if (symbol.endsWith(".NS")) return "NSE";
  return "NASDAQ";
}

export async function getStockTable({
  symbols,
  exchange = "ALL",
  limit = 120,
}: {
  symbols?: string[];
  exchange?: StockExchange;
  limit?: number;
} = {}): Promise<StockQuote[]> {
  const scopedUniverse: UniverseSymbol[] = symbols?.length
    ? symbols.map((symbol) => {
        const fromUniverse = findUniverseSymbol(symbol);
        const normalized = normalizeSymbol(symbol);
        return (
          fromUniverse ?? {
            symbol: normalized,
            name: normalized,
            exchange: inferExchangeFromSymbol(normalized),
            yahooSymbol: normalized,
          }
        );
      })
    : resolveUniverse(exchange, limit);

  const rows = await runPool(scopedUniverse, 14, async (item, index) => {
    const [finnhubQuote, fallbackName] = await Promise.all([
      fetchFinnhubQuote(item.symbol),
      index < 30 ? fetchCompanyName(item.symbol, item.name) : Promise.resolve(item.name),
    ]);

    const yahooQuote = finnhubQuote ? null : await fetchYahooQuote(item.yahooSymbol);
    const quote = finnhubQuote ?? yahooQuote ?? quoteFromSynthetic(80 + (index % 40) * 5);
    const provider: StockQuote["provider"] = finnhubQuote ? "finnhub" : yahooQuote ? "yahoo" : "fallback";

    let closes: number[] = [];
    if (index < 36) {
      closes = await fetchCandles(item.symbol, item.exchange, item.yahooSymbol);
    }
    if (closes.length < 25) {
      closes = syntheticSeries(Number(quote.c ?? 100));
    }

    const signalData = computeSignal(closes);
    const price = Number(quote.c ?? closes.at(-1) ?? 0);
    const change = Number(quote.d ?? 0);
    const percent = Number(quote.dp ?? 0);
    const volume = Math.round(
      Number.isFinite(Number(quote.v)) ? Number(quote.v) : Math.max(1_000, Math.abs(price * 1000)),
    );

    return {
      symbol: item.symbol,
      exchange: item.exchange,
      name: fallbackName || item.name,
      price,
      change,
      percent,
      volume,
      signal: signalData.signal,
      confidence: signalData.confidence,
      provider,
    } satisfies StockQuote;
  });

  return rows.sort((a, b) => a.symbol.localeCompare(b.symbol));
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
