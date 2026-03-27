import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

const bodySchema = z.object({
  prompt: z.string().min(2),
  symbol: z.string().optional(),
});

async function fallbackAgent(prompt: string, symbol?: string) {
  return `QuantPulse AI (fallback) on ${symbol ?? "asset"}:

${prompt}

- Fibs: watch 38.2% reclaim before adding risk.
- Wave setup: probable impulsive continuation if momentum confirms.
- Risk: invalidate on close below 61.8% zone.`;
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = bodySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { prompt, symbol } = parsed.data;
  const key = process.env.PERPLEXITY_API_KEY;

  if (!key) {
    return NextResponse.json({ answer: await fallbackAgent(prompt, symbol), provider: "fallback" });
  }

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content:
              "You are QuantPulse AI analyst. Give concise macro + technical analysis with actionable levels.",
          },
          {
            role: "user",
            content: `Symbol: ${symbol ?? "PAU0"}. Request: ${prompt}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ answer: await fallbackAgent(prompt, symbol), provider: "fallback" });
    }

    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content ?? (await fallbackAgent(prompt, symbol));
    return NextResponse.json({ answer, provider: "perplexity" });
  } catch {
    return NextResponse.json({ answer: await fallbackAgent(prompt, symbol), provider: "fallback" });
  }
}
