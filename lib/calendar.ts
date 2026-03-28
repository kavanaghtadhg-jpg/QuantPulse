import Parser from "rss-parser";

import { fetchWithTimeout } from "@/lib/http";
import { EconEvent } from "@/lib/types";

const parser = new Parser();

async function fetchFredEvents(events: EconEvent[]) {
  const fredCsv = await fetchWithTimeout("https://fred.stlouisfed.org/graph/fredgraph.csv?id=DFF", {
    timeoutMs: 3500,
    next: { revalidate: 900 },
  });
  if (!fredCsv.ok) {
    return;
  }

  const csv = await fredCsv.text();
  const lines = csv.split("\n").slice(-8).filter(Boolean);
  for (const line of lines) {
    const [date, value] = line.split(",");
    if (!date || !value || value === ".") {
      continue;
    }
    events.push({
      id: `fred-dff-${date}`,
      timestamp: new Date(`${date}T14:00:00Z`).toISOString(),
      source: "fred",
      title: "US Effective Fed Funds Rate",
      country: "US",
      actual: value,
      impact: "high",
    });
  }
}

async function fetchFxstreetEvents(events: EconEvent[]) {
  const response = await fetchWithTimeout("https://www.fxstreet.com/rss/news", {
    timeoutMs: 3500,
    next: { revalidate: 180 },
    headers: {
      Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.1",
    },
  });
  if (!response.ok) {
    return;
  }

  const xml = await response.text();
  const fxstreet = await parser.parseString(xml);
  for (const entry of fxstreet.items.slice(0, 12)) {
    if (!entry.title) {
      continue;
    }
    events.push({
      id: `fx-${entry.guid ?? entry.link ?? entry.title}`,
      timestamp: entry.pubDate ? new Date(entry.pubDate).toISOString() : new Date().toISOString(),
      source: "fxstreet",
      title: entry.title,
      impact: /cpi|nfp|powell|inflation|fed|ecb|rates|gdp|employment/i.test(entry.title)
        ? "high"
        : "medium",
      url: entry.link,
    });
  }
}

export async function getEconCalendar(): Promise<EconEvent[]> {
  const events: EconEvent[] = [];

  await Promise.allSettled([fetchFredEvents(events), fetchFxstreetEvents(events)]);

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

  const deduped = Array.from(new Map(events.map((event) => [event.id, event])).values());
  return deduped
    .sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp))
    .slice(0, 30);
}
