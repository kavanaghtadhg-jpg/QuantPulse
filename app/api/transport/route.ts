import { NextResponse } from "next/server";

import { getTransportIntel } from "@/lib/transport";

export async function GET() {
  const layers = await getTransportIntel();
  return NextResponse.json({ layers });
}
