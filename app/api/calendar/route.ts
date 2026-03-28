import { NextResponse } from "next/server";

import { getEconCalendar } from "@/lib/calendar";

export async function GET() {
  const events = await getEconCalendar();
  const fallback = events.length === 1 && events[0]?.id === "fallback-calendar";
  return NextResponse.json({
    events,
    source: fallback ? "fallback" : "live",
    count: events.length,
  });
}
