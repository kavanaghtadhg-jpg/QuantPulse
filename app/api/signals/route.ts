import { NextRequest, NextResponse } from "next/server";

import { getAssetQuote } from "@/lib/market";
import { buildSignals } from "@/lib/signals";
import { MarketSymbol } from "@/lib/types";

const symbols: MarketSymbol[] = ["PAU0", "CL1!", "ETH-USD", "SPY"];

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") as MarketSymbol;
  const selected = symbols.includes(symbol) ? symbol : "PAU0";

  const quote = await getAssetQuote(selected);
  const closes = quote.candles.map((candle) => candle.close);
  const mean = closes.reduce((acc, value) => acc + value, 0) / closes.length;
  const variance = closes.reduce((acc, value) => acc + (value - mean) ** 2, 0) / closes.length;
  const volatility = Math.sqrt(variance) / Math.max(mean, 1);

  return NextResponse.json({
    symbol: selected,
    signals: buildSignals(quote.price, volatility),
  });
}
