import { NextResponse } from "next/server";

import { getTransportSnapshot } from "@/lib/transport";

export async function GET() {
  const snapshot = await getTransportSnapshot();
  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
