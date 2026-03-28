import { Candle, TaSeries, WaveSignal } from "@/lib/types";
import { clamp } from "@/lib/utils";

function sma(values: number[], period: number, idx: number) {
  if (idx + 1 < period) {
    return null;
  }
  const start = idx + 1 - period;
  const slice = values.slice(start, idx + 1);
  return slice.reduce((acc, item) => acc + item, 0) / period;
}

function stddev(values: number[], period: number, idx: number, mean: number) {
  const start = idx + 1 - period;
  const slice = values.slice(start, idx + 1);
  const variance =
    slice.reduce((acc, item) => acc + (item - mean) * (item - mean), 0) / period;
  return Math.sqrt(variance);
}

function ema(values: number[], period: number) {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev = values[0] ?? 0;
  for (const value of values) {
    prev = value * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

export function computeTa(candles: Candle[]): TaSeries {
  const closes = candles.map((c) => c.close);

  const rsi: Array<{ time: string; value: number }> = [];
  const period = 14;
  for (let i = 1; i < closes.length; i++) {
    if (i < period) {
      continue;
    }
    let gain = 0;
    let loss = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = closes[j] - closes[j - 1];
      if (diff >= 0) {
        gain += diff;
      } else {
        loss += Math.abs(diff);
      }
    }
    const rs = loss === 0 ? 100 : gain / loss;
    const value = clamp(100 - 100 / (1 + rs), 0, 100);
    rsi.push({ time: candles[i].time, value });
  }

  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = closes.map((_, i) => ema12[i] - ema26[i]);
  const signalLine = ema(macdLine, 9);
  const macd = macdLine.map((value, i) => ({
    time: candles[i].time,
    macd: value,
    signal: signalLine[i],
    histogram: value - signalLine[i],
  }));

  const bollinger: Array<{ time: string; upper: number; middle: number; lower: number }> = [];
  const bbPeriod = 20;
  for (let i = 0; i < closes.length; i++) {
    const middle = sma(closes, bbPeriod, i);
    if (middle === null) {
      continue;
    }
    const deviation = stddev(closes, bbPeriod, i, middle);
    bollinger.push({
      time: candles[i].time,
      upper: middle + deviation * 2,
      middle,
      lower: middle - deviation * 2,
    });
  }

  const high = Math.max(...candles.map((c) => c.high));
  const low = Math.min(...candles.map((c) => c.low));
  const range = high - low || 1;

  return {
    rsi,
    macd,
    bollinger,
    fibLevels: {
      p382: high - range * 0.382,
      p618: high - range * 0.618,
    },
  };
}

export function detectElliottWave(candles: Candle[]): WaveSignal {
  const closes = candles.map((c) => c.close);
  const trend = (closes.at(-1) ?? 0) - (closes[0] ?? 0);
  const waveType = trend >= 0 ? "impulse" : "corrective";

  const swingHigh = Math.max(...candles.slice(-40).map((c) => c.high));
  const swingLow = Math.min(...candles.slice(-40).map((c) => c.low));
  const span = Math.max(swingHigh - swingLow, 0.01);
  const last = closes.at(-1) ?? swingHigh;

  const fibExtension1618 = last + span * 1.618 * (waveType === "impulse" ? 1 : -1);
  const wave3Target = last + span * 0.85 * (waveType === "impulse" ? 1 : -1);

  return {
    waveType,
    confidence: clamp(55 + (Math.abs(trend) / Math.max(last, 1)) * 100, 50, 95),
    wave3Target,
    channelUpper: last + span * 0.35,
    channelLower: last - span * 0.35,
    fibExtension1618,
  };
}
