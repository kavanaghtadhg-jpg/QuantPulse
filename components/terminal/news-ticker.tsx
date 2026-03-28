"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { NewsItem } from "@/lib/types";

export function NewsTicker() {
  const [items, setItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    const run = async () => {
      const res = await fetch("/api/news", { cache: "no-store" });
      const data = await res.json();
      setItems(data.items ?? []);
    };

    run();
    const id = setInterval(run, 120_000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
          <Badge variant="success">LIVE</Badge>
          <span className="text-xs font-medium text-slate-300">Global News Wire</span>
        </div>
        <div className="ticker-wrap">
          <div className="ticker-track">
            {(items.length
              ? items
              : [
                  {
                    id: "fallback",
                    title: "Loading macro headlines...",
                    source: "QuantPulse",
                    url: "#",
                    publishedAt: new Date().toISOString(),
                  },
                ]
            ).map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="ticker-item"
              >
                <span className="ticker-source">{item.source}</span>
                <span>{item.title}</span>
              </a>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
