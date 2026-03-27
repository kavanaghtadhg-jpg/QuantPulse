import { NextRequest, NextResponse } from "next/server";

import {
  getStreamCounters,
  injectTestEvent,
  listTestEvents,
  requestReconnect,
} from "@/lib/transport-admin";

export async function GET() {
  return NextResponse.json({
    counters: getStreamCounters(),
    testEvents: listTestEvents(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const action = String(body?.action ?? "");

  if (action === "inject") {
    const layer = body?.layer === "whales" ? "whales" : "ships";
    const title = String(body?.title ?? `${layer} test event`);
    const lat = Number(body?.lat ?? 0);
    const lng = Number(body?.lng ?? 0);

    const event = injectTestEvent(layer, title, Number.isFinite(lat) ? lat : 0, Number.isFinite(lng) ? lng : 0);
    return NextResponse.json({ ok: true, event, counters: getStreamCounters() });
  }

  if (action === "reconnect") {
    requestReconnect();
    return NextResponse.json({ ok: true, message: "Reconnect triggered", counters: getStreamCounters() });
  }

  return NextResponse.json({ ok: false, message: "Unknown action" }, { status: 400 });
}
