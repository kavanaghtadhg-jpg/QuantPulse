"use client";

import Globe from "react-globe.gl";
import { useMemo, useRef, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlobeEvent, GlobeLayer } from "@/lib/transport";

const layerLabels: Record<GlobeLayer, string> = {
  news: "News🔴",
  ships: "Ships🚢",
  planes: "Planes✈️",
  weather: "Weather🌪️",
  whales: "Whales🐋",
  sentiment: "Sentiment📱",
  econ: "Econ📅",
  forex: "Forex💱",
  options: "Options📈",
  quakes: "Quakes⚡",
};

export function LiveGlobe({ layers }: { layers: Record<GlobeLayer, GlobeEvent[]> }) {
  const globeRef = useRef<any>(null);
  const [enabled, setEnabled] = useState<Record<GlobeLayer, boolean>>({
    news: true,
    ships: true,
    planes: true,
    weather: true,
    whales: true,
    sentiment: true,
    econ: true,
    forex: true,
    options: true,
    quakes: true,
  });

  const points = useMemo(() => {
    const all = Object.entries(layers).flatMap(([layer, events]) =>
      enabled[layer as GlobeLayer] ? events : [],
    );
    return all;
  }, [enabled, layers]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-slate-100">Global Intelligence Globe</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(layerLabels) as GlobeLayer[]).map((layer) => (
            <button
              key={layer}
              onClick={() => setEnabled((prev) => ({ ...prev, [layer]: !prev[layer] }))}
              className={`rounded-md border px-2 py-1 text-xs ${
                enabled[layer]
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                  : "border-white/15 bg-white/5 text-slate-300"
              }`}
            >
              {layerLabels[layer]}
            </button>
          ))}
        </div>

        <div className="h-[520px] overflow-hidden rounded-md border border-white/10 bg-slate-950">
          <Globe
            ref={globeRef}
            globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
            bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
            backgroundColor="#020617"
            pointsData={points}
            pointLat={(d: any) => d.lat}
            pointLng={(d: any) => d.lng}
            pointColor={(d: any) =>
              d.layer === "quakes"
                ? "#ef4444"
                : d.layer === "weather"
                  ? "#38bdf8"
                  : d.layer === "whales"
                    ? "#a78bfa"
                    : "#10b981"
            }
            pointAltitude={0.01}
            pointRadius={0.35}
            pointLabel={(d: any) => `${d.layer}: ${d.title}`}
            enablePointerInteraction
            onGlobeReady={() => {
              const controls = globeRef.current?.controls?.();
              if (controls) {
                controls.autoRotate = true;
                controls.autoRotateSpeed = 0.4;
                controls.enableZoom = true;
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
