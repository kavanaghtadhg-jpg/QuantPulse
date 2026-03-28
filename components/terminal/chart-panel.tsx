"use client";

import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  LineSeries,
  LineData,
  UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useMemo, useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuantLineChart } from "@/components/ui/chart";
import { AssetQuote, TaSeries } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export function ChartPanel({
  quote,
  ta,
}: {
  quote: AssetQuote | null;
  ta: TaSeries | null;
}) {
  const chartWrapRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!chartWrapRef.current || chartRef.current) {
      return;
    }

    const chart = createChart(chartWrapRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#020617" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "rgba(148,163,184,0.08)" },
        horzLines: { color: "rgba(148,163,184,0.08)" },
      },
      rightPriceScale: {
        borderColor: "rgba(148,163,184,0.2)",
      },
      timeScale: {
        borderColor: "rgba(148,163,184,0.2)",
      },
      height: 360,
      autoSize: true,
    });

    const series = chart.addSeries(LineSeries, {
      color: "#10b981",
      lineWidth: 2,
      priceLineVisible: true,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const resizeObserver = new ResizeObserver(() => chart.timeScale().fitContent());
    resizeObserver.observe(chartWrapRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!quote || !seriesRef.current) {
      return;
    }

    const chartData: LineData[] = quote.candles.map((candle) => ({
      time: Math.floor(new Date(candle.time).getTime() / 1000) as UTCTimestamp,
      value: candle.close,
    }));

    seriesRef.current.setData(chartData);
    chartRef.current?.timeScale().fitContent();
  }, [quote]);

  const macdData = useMemo(() => {
    if (!ta) {
      return [];
    }
    return ta.macd.slice(-80).map((item) => ({
      time: item.time,
      macd: item.macd,
      signal: item.signal,
    }));
  }, [ta]);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="text-base text-slate-100">
            {quote?.name ?? "Loading chart"}
          </CardTitle>
          <p className="text-xs text-slate-400">
            TradingView Lightweight engine with custom TA overlays
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg text-slate-100">
            {formatMoney(quote?.price ?? 0)}
          </p>
          <Badge variant={(quote?.changePercent ?? 0) >= 0 ? "success" : "danger"}>
            {quote ? `${quote.changePercent.toFixed(2)}%` : "..."}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-white/10 bg-[#020617] p-1">
          <div ref={chartWrapRef} className="h-[360px] w-full" />
        </div>

        {ta ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Card className="bg-white/[0.02]">
              <CardContent className="p-3">
                <p className="text-xs text-slate-400">RSI(14)</p>
                <p className="font-mono text-sm text-slate-100">
                  {ta.rsi.at(-1)?.value.toFixed(2) ?? "--"}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/[0.02]">
              <CardContent className="p-3">
                <p className="text-xs text-slate-400">Fib 38.2%</p>
                <p className="font-mono text-sm text-slate-100">{ta.fibLevels.p382.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/[0.02]">
              <CardContent className="p-3">
                <p className="text-xs text-slate-400">Fib 61.8%</p>
                <p className="font-mono text-sm text-slate-100">{ta.fibLevels.p618.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {macdData.length ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
            <p className="mb-2 text-xs text-slate-400">MACD(12,26,9)</p>
            <QuantLineChart
              data={macdData}
              xKey="time"
              series={[
                { key: "macd", name: "MACD", color: "#10b981" },
                { key: "signal", name: "Signal", color: "#ef4444" },
              ]}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
