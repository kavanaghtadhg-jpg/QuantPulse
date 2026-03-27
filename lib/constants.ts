import { MarketSymbol } from "@/lib/types";

export const APP_NAME = "QuantPulse v4";
export const APP_DESCRIPTION =
  "Ultimate zero-cost Bloomberg-style terminal for macro, commodities, crypto and equities.";

export const DEFAULT_SYMBOL: MarketSymbol = "PAU0";

export const SYMBOL_META: Record<
  MarketSymbol,
  { name: string; yahooTicker?: string; commodityCode?: string }
> = {
  PAU0: { name: "Palladium Futures", yahooTicker: "PA=F", commodityCode: "XPD" },
  "CL1!": { name: "Crude Oil Futures", yahooTicker: "CL=F", commodityCode: "WTI" },
  "ETH-USD": { name: "Ethereum", yahooTicker: "ETH-USD", commodityCode: "ETH" },
  SPY: { name: "SPDR S&P 500 ETF", yahooTicker: "SPY", commodityCode: "SPY" },
};

export const FREE_FEATURES = [
  "Live economic calendar (FRED + FXStreet RSS)",
  "Multi-asset charts with Yahoo fallback",
  "RSI, MACD, Bollinger, Fibonacci overlays",
  "Embeddable widgets and share links",
  "Global RSS news ticker",
];

export const PRO_FEATURES = [
  "Elliott Wave auto-detection + Wave 3 targets",
  "13 proprietary alpha signals",
  "Portfolio tracker with P/L heatmaps",
  "Backtesting engine + custom alerts",
  "AI Agent Chat powered by Perplexity",
];

export const ENTERPRISE_FEATURES = [
  "Custom dashboards and white-labeled views",
  "Dedicated API access",
  "Private data connectors",
  "Priority support and onboarding",
];

export const PROPRIETARY_SIGNALS = [
  "Options Flow Shock",
  "Short Interest Squeeze",
  "Insider Cluster Accumulation",
  "Earnings Whisper Drift",
  "Volume Anomaly Breakout",
  "Dealer Gamma Flip",
  "Dark Pool Delta",
  "Volatility Regime Shift",
  "Cross-Asset Correlation Crack",
  "Liquidity Vacuum Alert",
  "Momentum Exhaustion",
  "Macro Surprise Pulse",
  "Sentiment Divergence",
];
