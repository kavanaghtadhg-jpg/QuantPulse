"use client";

import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AiSignalStrip() {
  const signals = [
    { name: "RSI Pulse", state: "up", confidence: 92 },
    { name: "MACD Cross", state: "up", confidence: 92 },
    { name: "Flow Momentum", state: "down", confidence: 88 },
    { name: "Volatility Regime", state: "flat", confidence: 84 },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-slate-100">AI Signals (RSI/MACD)</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {signals.map((signal) => (
          <div key={signal.name} className="rounded-md border border-white/10 bg-white/[0.03] p-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-100">{signal.name}</p>
              <Badge
                variant={
                  signal.state === "up" ? "success" : signal.state === "down" ? "danger" : "muted"
                }
              >
                {signal.confidence}%
              </Badge>
            </div>
            <p className="mt-2 flex items-center gap-1 text-xs text-slate-300">
              {signal.state === "up" ? (
                <ArrowUp className="size-3 text-emerald-300" />
              ) : signal.state === "down" ? (
                <ArrowDown className="size-3 text-red-300" />
              ) : (
                <ArrowRight className="size-3 text-slate-300" />
              )}
              {signal.state.toUpperCase()}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
