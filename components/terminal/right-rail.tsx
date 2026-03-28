"use client";

import Editor from "@monaco-editor/react";
import { Activity, BellRing, Bot, CalendarDays, LockKeyhole } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EconEvent, MarketSymbol, NewsItem, Signal, WaveSignal } from "@/lib/types";
import { useTier } from "@/lib/tier";

export function RightRail({
  symbol,
  wave,
}: {
  symbol: MarketSymbol;
  wave: WaveSignal | null;
}) {
  const { tier } = useTier();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [calendar, setCalendar] = useState<EconEvent[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [prompt, setPrompt] = useState("Analyze palladium Fibs and Elliott structure");
  const [chat, setChat] = useState<string>("");
  const [alertCode, setAlertCode] = useState(
    `if (rsi(14) < 30 && priceCrosses(fib618)) {
  notify("Palladium rebound setup");
}`,
  );

  useEffect(() => {
    const hydrate = async () => {
      const [newsRes, calRes, signalRes] = await Promise.all([
        fetch("/api/news", { cache: "no-store" }),
        fetch("/api/calendar", { cache: "no-store" }),
        fetch(`/api/signals?symbol=${symbol}`, { cache: "no-store" }),
      ]);

      const newsData = await newsRes.json();
      const calData = await calRes.json();
      const signalData = await signalRes.json();

      setNews(newsData.items ?? []);
      setCalendar(calData.events ?? []);
      setSignals(signalData.signals ?? []);
    };

    hydrate();
  }, [symbol]);

  const visibleSignals = useMemo(
    () => (tier === "free" ? signals.slice(0, 3) : signals),
    [signals, tier],
  );

  const askAgent = async () => {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, symbol }),
    });
    const data = await res.json();
    setChat(data.answer ?? "No answer.");
  };

  const saveAlert = async () => {
    await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, rule: alertCode }),
    });
  };

  return (
    <div className="space-y-3">
      <Tabs defaultValue="news">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="news">News</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="signals">Signals</TabsTrigger>
        </TabsList>

        <TabsContent value="news">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-slate-100">
                <Activity className="size-4" />
                News Ticker Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 space-y-2 overflow-auto">
              {news.slice(0, 8).map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-md border border-white/10 bg-white/[0.03] p-2 hover:bg-white/[0.06]"
                >
                  <p className="text-xs text-slate-100">{item.title}</p>
                  <p className="text-[11px] text-slate-400">{item.source}</p>
                </a>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-slate-100">
                <CalendarDays className="size-4" />
                Macro Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 overflow-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Impact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calendar.slice(0, 12).map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-mono text-[11px] text-slate-300">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="text-xs text-slate-100">{event.title}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            event.impact === "high"
                              ? "danger"
                              : event.impact === "medium"
                                ? "default"
                                : "muted"
                          }
                        >
                          {event.impact ?? "low"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signals">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-100">13 Proprietary Signals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {visibleSignals.map((signal) => (
                <div
                  key={signal.id}
                  className="rounded-md border border-white/10 bg-white/[0.03] p-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-100">{signal.name}</p>
                    <Badge
                      variant={
                        signal.status === "bullish"
                          ? "success"
                          : signal.status === "bearish"
                            ? "danger"
                            : "muted"
                      }
                    >
                      {signal.score}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400">{signal.description}</p>
                </div>
              ))}
              {tier === "free" ? (
                <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-2 text-xs text-amber-200">
                  Unlock all 13 signals + backtesting with Pro.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-slate-100">
            <Bot className="size-4 text-emerald-400" />
            AI Agent Chat
            {tier === "free" ? <LockKeyhole className="size-4 text-amber-300" /> : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            disabled={tier === "free"}
          />
          <Button onClick={askAgent} disabled={tier === "free"}>
            Run Analysis
          </Button>
          <div className="rounded-md border border-white/10 bg-slate-950/70 p-2 text-xs text-slate-300">
            {chat || "Agent output will appear here."}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-slate-100">
            <BellRing className="size-4" />
            Custom Alert DSL (Monaco)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="h-40 overflow-hidden rounded-md border border-white/10">
            <Editor
              language="javascript"
              theme="vs-dark"
              value={alertCode}
              onChange={(value) => setAlertCode(value ?? "")}
              options={{ minimap: { enabled: false }, fontSize: 12 }}
            />
          </div>
          <Button variant="secondary" onClick={saveAlert}>
            Save Alert Rule
          </Button>
        </CardContent>
      </Card>

      {tier !== "free" && wave ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-100">Elliott Wave Engine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs text-slate-300">
            <p>
              Pattern: <span className="font-semibold capitalize text-slate-100">{wave.waveType}</span>
            </p>
            <p>Confidence: {wave.confidence.toFixed(1)}%</p>
            <p>Wave 3 target: {wave.wave3Target.toFixed(2)}</p>
            <p>Fib 1.618 extension: {wave.fibExtension1618.toFixed(2)}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
