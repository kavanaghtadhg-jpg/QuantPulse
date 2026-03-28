import { NextRequest, NextResponse } from "next/server";

import { DEFAULT_SYMBOL } from "@/lib/constants";
import { getAssetQuote } from "@/lib/market";
import { MarketSymbol } from "@/lib/types";

const symbols: MarketSymbol[] = ["PAU0", "CL1!", "ETH-USD", "SPY"];

export async function GET(request: NextRequest) {
  const symbol = (request.nextUrl.searchParams.get("symbol") as MarketSymbol) ?? DEFAULT_SYMBOL;
  const selected = symbols.includes(symbol) ? symbol : DEFAULT_SYMBOL;
  const quote = await getAssetQuote(selected);

  return NextResponse.json({
    quote,
    source: quote.meta.source,
    provider: quote.meta.provider,
    warnings: quote.meta.warnings,
  });
}
