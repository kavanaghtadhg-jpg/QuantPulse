"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { TierProvider } from "@/lib/tier";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TierProvider>{children}</TierProvider>
    </ThemeProvider>
  );
}
