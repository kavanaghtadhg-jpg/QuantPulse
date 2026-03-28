"use client";

import { Crown, Sparkles } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTier } from "@/lib/tier";

export function TierSwitcher() {
  const { tier, setTier } = useTier();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="size-4" />
          {tier.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTier("free")}>Free Tier</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTier("pro")}>Pro ($25/yr)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTier("enterprise")}>
          <Crown className="mr-2 size-4" />
          Enterprise ($99/mo)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
