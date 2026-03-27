"use client";

import { ArrowRight, Gem } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tier } from "@/lib/types";

export function PricingStrip({ tier }: { tier: Tier }) {
  const goCheckout = async () => {
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.open(data.url, "_blank", "noopener,noreferrer");
    }
  };

  if (tier !== "free") {
    return null;
  }

  return (
    <Card className="border-emerald-500/30 bg-emerald-500/10">
      <CardContent className="flex flex-col gap-2 p-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-emerald-100">
          Upgrade to Pro for <strong>$25/year</strong>: Elliott Wave AI, full signal stack, alerts,
          backtesting, and agentic chat.
        </p>
        <Button size="sm" onClick={goCheckout}>
          <Gem className="size-4" />
          Start Pro Trial
          <ArrowRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
