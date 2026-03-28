import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabase";

const referralSchema = z.object({
  referrerEmail: z.string().email(),
  referredEmail: z.string().email(),
});

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = referralSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid referral payload" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      message: "Referral received. Configure Supabase keys to persist tracking.",
    });
  }

  await supabase.from("referrals").insert({
    referrer_email: parsed.data.referrerEmail,
    referred_email: parsed.data.referredEmail,
    created_at: new Date().toISOString(),
  });

  const { count } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_email", parsed.data.referrerEmail);

  return NextResponse.json({
    ok: true,
    referralCount: count ?? 0,
    proRewardUnlocked: (count ?? 0) >= 5,
  });
}
