import { NextResponse } from "next/server";

import { getRssNews } from "@/lib/news";

export async function GET() {
  const items = await getRssNews();
  return NextResponse.json(
    { items, source: "rss", fallback: items.length === 1 && items[0].source === "QuantPulse Wire" },
    { headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=300" } },
  );
}
