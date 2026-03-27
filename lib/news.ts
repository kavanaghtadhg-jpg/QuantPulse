import Parser from "rss-parser";

import { NewsItem } from "@/lib/types";
import { fetchWithTimeout } from "@/lib/http";

const parser = new Parser();

const DEFAULT_FEEDS = [
  "https://feeds.bloomberg.com/markets/news.rss",
  "https://www.fxstreet.com/rss/news",
  "https://www.investing.com/rss/news.rss",
];

export async function getRssNews(): Promise<NewsItem[]> {
  const items: NewsItem[] = [];

  for (const feed of DEFAULT_FEEDS) {
    try {
      const xmlResponse = await fetchWithTimeout(feed, {
        timeoutMs: 4500,
        next: { revalidate: 180 },
        headers: {
          "User-Agent": "QuantPulse/1.0 (+https://quantpulse.vercel.app)",
          Accept: "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.1",
        },
      });

      if (!xmlResponse.ok) {
        continue;
      }

      const xml = await xmlResponse.text();
      const res = await parser.parseString(xml);
      for (const entry of res.items.slice(0, 8)) {
        if (!entry.title || !entry.link) {
          continue;
        }
        items.push({
          id: `${feed}:${entry.guid ?? entry.link}`,
          title: entry.title,
          source: res.title ?? "RSS",
          url: entry.link,
          summary: entry.contentSnippet,
          publishedAt: entry.pubDate
            ? new Date(entry.pubDate).toISOString()
            : new Date().toISOString(),
        });
      }
    } catch {
      continue;
    }
  }

  if (!items.length) {
    return [
      {
        id: "fallback-1",
        title: "Risk assets mixed as bond yields cool into close",
        source: "QuantPulse Wire",
        url: "https://quantpulse.vercel.app",
        publishedAt: new Date().toISOString(),
        summary: "Fallback headline for offline environments.",
      },
    ];
  }

  return items
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, 25);
}
