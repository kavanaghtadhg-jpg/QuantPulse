import { NextRequest, NextResponse } from "next/server";

import { getStockTable } from "@/lib/stocks";

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("symbols");
  const symbols = raw
    ? raw
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean)
    : undefined;

  const stocks = await getStockTable(symbols);
  return NextResponse.json({ stocks, source: "finnhub" });
}
