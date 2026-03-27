"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GlobeEvent, GlobeLayer } from "@/lib/transport";

export function TransportBoard() {
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

  const rows = layers ? Object.entries(layers).flatMap(([_, events]) => events).slice(0, 40) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-slate-100">/transport live event board</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[540px] overflow-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Layer</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Lat</TableHead>
              <TableHead>Lng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="uppercase text-xs text-slate-300">{event.layer}</TableCell>
                <TableCell className="text-xs text-slate-100">{event.title}</TableCell>
                <TableCell className="font-mono text-xs text-slate-300">{event.lat.toFixed(2)}</TableCell>
                <TableCell className="font-mono text-xs text-slate-300">{event.lng.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
