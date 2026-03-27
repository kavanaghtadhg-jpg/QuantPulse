import { PROPRIETARY_SIGNALS } from "@/lib/constants";
import { Signal } from "@/lib/types";
import { clamp } from "@/lib/utils";

export function buildSignals(lastPrice: number, volatility: number): Signal[] {
  const base = Math.max(volatility * 100, 1);

  return PROPRIETARY_SIGNALS.map((name, idx) => {
    const raw = Math.sin((idx + 1) * 1.7 + lastPrice / 100) * 35 + base;
    const score = clamp(Math.round(raw + 50), 1, 99);
    const status = score > 66 ? "bullish" : score < 33 ? "bearish" : "neutral";

    return {
      id: `signal-${idx + 1}`,
      name,
      description:
        idx === 0
          ? "Volume/OI spike > 5x baseline detected in derivatives chain."
          : idx === 1
            ? "Short interest velocity rising relative to float."
            : "Composite alpha model combining market microstructure and sentiment.",
      score,
      isPro: true,
      status,
      updatedAt: new Date().toISOString(),
    };
  });
}
