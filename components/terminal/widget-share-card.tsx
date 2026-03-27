"use client";

import { Copy, ExternalLink } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketSymbol } from "@/lib/types";

export function WidgetShareCard({ symbol }: { symbol: MarketSymbol }) {
  const embedCode = useMemo(
    () =>
      `<iframe src="${typeof window !== "undefined" ? window.location.origin : "https://quantpulse.vercel.app"}/widget/${symbol}" width="420" height="280" style="border:1px solid #1e293b;border-radius:12px;background:#020617"></iframe>`,
    [symbol],
  );

  const shareLink =
    typeof window !== "undefined" ? `${window.location.origin}/share/${symbol}` : `/share/${symbol}`;

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-slate-100">Viral Growth Widgets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs text-slate-300">
        <p>Embed your live market widget and drive referral traffic.</p>
        <div className="rounded-md border border-white/10 bg-slate-950/80 p-2 font-mono text-[11px] text-slate-300">
          {embedCode}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => copy(embedCode)}>
            <Copy className="size-3.5" />
            Copy iframe
          </Button>
          <Button variant="outline" size="sm" onClick={() => copy(shareLink)}>
            <Copy className="size-3.5" />
            Copy share link
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={shareLink} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5" />
              Preview
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
