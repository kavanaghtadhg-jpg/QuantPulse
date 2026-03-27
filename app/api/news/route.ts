import { NextResponse } from "next/server";

import { getRssNews } from "@/lib/news";

export async function GET() {
  const items = await getRssNews();
  return NextResponse.json({ items });
}
