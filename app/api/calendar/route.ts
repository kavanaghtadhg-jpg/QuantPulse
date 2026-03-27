import { NextResponse } from "next/server";

import { getEconCalendar } from "@/lib/calendar";

export async function GET() {
  const events = await getEconCalendar();
  return NextResponse.json({ events });
}
