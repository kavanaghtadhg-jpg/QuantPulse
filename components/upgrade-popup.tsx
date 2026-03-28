"use client";

import { X, Gem, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTier } from "@/lib/tier";

const DISMISS_KEY = "quantpulse-upgrade-dismissed";
const DISMISS_TTL_MS = 1000 * 60 * 60 * 8;

export function UpgradePopup({ forceVisible = false }: { forceVisible?: boolean }) {
  const { tier } = useTier();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (tier !== "free") {
      setVisible(false);
      return;
    }

    if (forceVisible) {
      setVisible(true);
      return;
    }

    const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0);
    const isDismissed = dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS;
    setVisible(!isDismissed);
  }, [forceVisible, tier]);

  const checkout = async () => {
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data?.url) {
      window.open(data.url, "_blank", "noopener,noreferrer");
    }
  };

  const close = () => {
    window.localStorage.setItem(DISMISS_KEY, `${Date.now()}`);
    setVisible(false);
  };

  const shouldRender = useMemo(() => tier === "free" && visible, [tier, visible]);
  if (!shouldRender) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)]">
      <Card className="pointer-events-auto border-emerald-500/30 bg-[#071b14]/95 shadow-2xl">
        <CardContent className="p-3">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-emerald-200">Unlock QuantPulse Pro</p>
              <p className="text-xs text-emerald-100/80">Elliott AI, globe intelligence, synced charts</p>
            </div>
            <button
              type="button"
              onClick={close}
              className="rounded-md p-1 text-emerald-100/80 hover:bg-white/10"
              aria-label="Close upgrade popup"
            >
              <X className="size-4" />
            </button>
          </div>
          <Button className="w-full" size="sm" onClick={checkout}>
            <Gem className="size-4" />
            Upgrade for $25/yr
            <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
