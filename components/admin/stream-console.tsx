"use client";

import { RefreshCcw, FlaskConical } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CounterState = {
  ships: {
    connected: boolean;
    messages: number;
    reconnects: number;
    lastError: string | null;
  };
  whales: {
    connected: boolean;
    messages: number;
    reconnects: number;
    lastError: string | null;
  };
  testEvents: number;
};

export function StreamConsole() {
  const [state, setState] = useState<CounterState | null>(null);

  const refresh = async () => {
    const response = await fetch("/api/transport/admin", { cache: "no-store" });
    const data = await response.json();
    setState(data.counters ?? null);
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, []);

  const inject = async (layer: "ships" | "whales") => {
    await fetch("/api/transport/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "inject",
        layer,
        title: `${layer} admin test`,
        lat: 37.77,
        lng: -122.41,
      }),
    });
    refresh();
  };

  const reconnect = async () => {
    await fetch("/api/transport/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reconnect" }),
    });
    refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-slate-100">Admin Stream Console</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-slate-300">
        {!state ? (
          <p>Loading counters...</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-2">
              <p className="font-semibold text-slate-100">Ships</p>
              <p>connected: {state.ships.connected ? "yes" : "no"}</p>
              <p>messages: {state.ships.messages}</p>
              <p>reconnects: {state.ships.reconnects}</p>
              <p className="truncate">error: {state.ships.lastError ?? "none"}</p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-2">
              <p className="font-semibold text-slate-100">Whales</p>
              <p>connected: {state.whales.connected ? "yes" : "no"}</p>
              <p>messages: {state.whales.messages}</p>
              <p>reconnects: {state.whales.reconnects}</p>
              <p className="truncate">error: {state.whales.lastError ?? "none"}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={refresh}>
            <RefreshCcw className="size-4" />
            Refresh counters
          </Button>
          <Button size="sm" variant="outline" onClick={reconnect}>
            <RefreshCcw className="size-4" />
            Reconnect request
          </Button>
          <Button size="sm" variant="secondary" onClick={() => inject("ships")}>
            <FlaskConical className="size-4" />
            Inject ship test
          </Button>
          <Button size="sm" variant="secondary" onClick={() => inject("whales")}>
            <FlaskConical className="size-4" />
            Inject whale test
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
