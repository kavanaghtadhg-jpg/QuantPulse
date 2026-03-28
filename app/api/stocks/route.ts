import { NextRequest, NextResponse } from "next/server";

import { getStockTable, StockExchange } from "@/lib/stocks";

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("symbols");
  const exchangeRaw = request.nextUrl.searchParams.get("exchange")?.toUpperCase() ?? "ALL";
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "120");
  const exchange: StockExchange =
    exchangeRaw === "NYSE" ||
    exchangeRaw === "NASDAQ" ||
    exchangeRaw === "LSE" ||
    exchangeRaw === "HKEX" ||
    exchangeRaw === "NSE"
      ? exchangeRaw
      : "ALL";
  const limit = Number.isFinite(limitRaw) ? Math.min(200, Math.max(10, Math.round(limitRaw))) : 120;
  const symbols = raw
    ? raw
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean)
    : undefined;

  const stocks = await getStockTable({ symbols, exchange, limit });
  return NextResponse.json({ stocks, source: "finnhub+yahoo", exchange, count: stocks.length });
}
