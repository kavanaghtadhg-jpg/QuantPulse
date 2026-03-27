"use client";

import { useEffect, useState } from "react";

import { LiveGlobe } from "@/components/globe/live-globe";
import { GlobeEvent, GlobeLayer, TransportLayerState } from "@/lib/transport";

export function LiveGlobeLoader() {
  const [layers, setLayers] = useState<Record<GlobeLayer, GlobeEvent[]> | null>(null);
  const [states, setStates] = useState<Partial<Record<GlobeLayer, TransportLayerState>>>({});

  useEffect(() => {
    const run = async () => {
      const response = await fetch("/api/transport", { cache: "no-store" });
      const data = await response.json();
      setLayers(data.layers);
      setStates(data.states ?? {});
    };

    run();
    const id = setInterval(run, 45_000);
    return () => clearInterval(id);
  }, []);

  if (!layers) {
    return <div className="rounded-md border border-white/10 bg-white/[0.03] p-6">Loading globe...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-2 md:grid-cols-2">
        {(Object.entries(states) as Array<[string, TransportLayerState]>).map(([layer, state]) => (
          <div key={layer} className="rounded-md border border-white/10 bg-white/[0.03] p-2 text-xs text-slate-300">
            <p className="font-semibold uppercase text-slate-100">{layer}</p>
            <p>connected: {state.connected ? "yes" : "no"} • msgs: {state.messages}</p>
            <p className="truncate">err: {state.lastError ?? "none"}</p>
          </div>
        ))}
      </div>
      <LiveGlobe layers={layers} />
    </div>
  );
}
