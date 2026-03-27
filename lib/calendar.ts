import Parser from "rss-parser";

import { EconEvent } from "@/lib/types";

const parser = new Parser();

export async function getEconCalendar(): Promise<EconEvent[]> {
  const events: EconEvent[] = [];

  try {
    const fred = await fetch("https://fred.stlouisfed.org/graph/fredgraph.csv?id=DFF", {
      next: { revalidate: 900 },
    });
    if (fred.ok) {
      const csv = await fred.text();
      const lines = csv.split("\n").slice(-6).filter(Boolean);
      for (const line of lines) {
        const [date, value] = line.split(",");
        if (!date || !value || value === ".") {
          continue;
        }
        events.push({
          id: `fred-${date}`,
          timestamp: new Date(`${date}T14:00:00Z`).toISOString(),
          source: "fred",
          title: "US Effective Fed Funds Rate Update",
          country: "US",
          actual: value,
          impact: "high",
        });
      }
    }
  } catch {
    // no-op fallback
  }

  try {
    const fxstreet = await parser.parseURL("https://www.fxstreet.com/rss/news");
    for (const entry of fxstreet.items.slice(0, 10)) {
      if (!entry.title) {
        continue;
      }
      events.push({
        id: `fx-${entry.guid ?? entry.link ?? entry.title}`,
        timestamp: entry.pubDate
          ? new Date(entry.pubDate).toISOString()
          : new Date().toISOString(),
        source: "fxstreet",
        title: entry.title,
        impact: /cpi|nfp|powell|inflation|fed/i.test(entry.title) ? "high" : "medium",
        url: entry.link,
      });
    }
  } catch {
    // no-op fallback
  }

  if (!events.length) {
    return [
      {
        id: "fallback-calendar",
        timestamp: new Date().toISOString(),
        source: "fred",
        title: "US CPI (Fallback)",
        country: "US",
        actual: "3.1%",
        forecast: "3.2%",
        previous: "3.4%",
        impact: "high",
      },
    ];
  }

  return events
    .sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp))
    .slice(0, 30);
}
