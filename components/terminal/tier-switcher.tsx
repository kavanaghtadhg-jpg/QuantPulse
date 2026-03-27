"use client";

import { Crown, Sparkles } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tier } from "@/lib/types";

export function TierSwitcher({
  tier,
  onTier,
}: {
  tier: Tier;
  onTier: (tier: Tier) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="size-4" />
          {tier.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onTier("free")}>Free Tier</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onTier("pro")}>Pro ($25/yr)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onTier("enterprise")}>
          <Crown className="mr-2 size-4" />
          Enterprise ($99/mo)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
