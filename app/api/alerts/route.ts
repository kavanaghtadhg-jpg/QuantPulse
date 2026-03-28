import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabase";

const alertSchema = z.object({
  symbol: z.string().min(2),
  rule: z.string().min(4),
});

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = alertSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid alert payload" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      message: "Alert saved locally. Configure Supabase for edge email delivery.",
    });
  }

  await supabase.from("alert_rules").insert({
    symbol: parsed.data.symbol,
    rule: parsed.data.rule,
    channel: "email",
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, mode: "supabase" });
}
