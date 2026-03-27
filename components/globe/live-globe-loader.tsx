"use client";

import { useEffect, useState } from "react";

import { LiveGlobe } from "@/components/globe/live-globe";
import { GlobeEvent, GlobeLayer } from "@/lib/transport";

export function LiveGlobeLoader() {
  const [layers, setLayers] = useState<Record<GlobeLayer, GlobeEvent[]> | null>(null);

  useEffect(() => {
    const run = async () => {
      const response = await fetch("/api/transport", { cache: "no-store" });
      const data = await response.json();
      setLayers(data.layers);
    };

    run();
    const id = setInterval(run, 45_000);
    return () => clearInterval(id);
  }, []);

  if (!layers) {
    return <div className="rounded-md border border-white/10 bg-white/[0.03] p-6">Loading globe...</div>;
  }

  return <LiveGlobe layers={layers} />;
}
