"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { Tier } from "@/lib/types";

const STORAGE_KEY = "quantpulse-tier";

type TierContextValue = {
  tier: Tier;
  setTier: (tier: Tier) => void;
};

const TierContext = createContext<TierContextValue | null>(null);

export function TierProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTierState] = useState<Tier>("free");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "free" || saved === "pro" || saved === "enterprise") {
      setTierState(saved);
    }
  }, []);

  const setTier = (nextTier: Tier) => {
    setTierState(nextTier);
    window.localStorage.setItem(STORAGE_KEY, nextTier);
  };

  const value = useMemo(() => ({ tier, setTier }), [tier]);

  return <TierContext.Provider value={value}>{children}</TierContext.Provider>;
}

export function useTier() {
  const context = useContext(TierContext);
  if (!context) {
    throw new Error("useTier must be used within TierProvider");
  }
  return context;
}
