"use client";

import { Crown, Lock } from "lucide-react";

import { UpgradePopup } from "@/components/upgrade-popup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTier } from "@/lib/tier";

export function ProGate({
  children,
  title = "Pro feature",
  subtitle = "Upgrade to Pro to unlock this capability.",
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const { tier, setTier } = useTier();

  if (tier !== "free") {
    return <>{children}</>;
  }

  return (
    <Card className="border-amber-500/30 bg-amber-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm text-amber-100">
          <Lock className="size-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-amber-200">{subtitle}</p>
        <Button size="sm" onClick={() => setTier("pro")}>
          <Crown className="size-4" />
          Upgrade to Pro ($25/yr)
        </Button>
        <UpgradePopup forceVisible />
      </CardContent>
    </Card>
  );
}
