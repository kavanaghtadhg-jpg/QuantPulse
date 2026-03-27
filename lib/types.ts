export type Tier = "free" | "pro" | "enterprise";

export type MarketSymbol = "PAU0" | "CL1!" | "ETH-USD" | "SPY";

export type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type AssetQuote = {
  symbol: MarketSymbol;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  candles: Candle[];
};

export type EconEvent = {
  id: string;
  timestamp: string;
  source: "fred" | "fxstreet";
  title: string;
  country?: string;
  actual?: string;
  forecast?: string;
  previous?: string;
  impact?: "low" | "medium" | "high";
  url?: string;
};

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  summary?: string;
};

export type TaSeries = {
  rsi: Array<{ time: string; value: number }>;
  macd: Array<{ time: string; macd: number; signal: number; histogram: number }>;
  bollinger: Array<{ time: string; upper: number; middle: number; lower: number }>;
  fibLevels: {
    p382: number;
    p618: number;
  };
};

export type Signal = {
  id: string;
  name: string;
  description: string;
  score: number;
  isPro: boolean;
  status: "bullish" | "bearish" | "neutral";
  updatedAt: string;
};

export type WaveSignal = {
  waveType: "impulse" | "corrective";
  confidence: number;
  wave3Target: number;
  channelUpper: number;
  channelLower: number;
  fibExtension1618: number;
};
