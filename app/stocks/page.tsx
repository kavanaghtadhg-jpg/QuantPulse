import { ProGate } from "@/components/pro-gate";
import { StocksPageClient } from "@/components/stocks/stocks-page-client";

export default function StocksPage() {
  return (
    <main className="mx-auto w-full max-w-[1400px] p-3 md:p-4">
      <h1 className="mb-3 text-xl font-semibold text-slate-100">/stocks</h1>
      <ProGate title="/stocks is Pro" subtitle="Live stock scanner, portfolio, and voice search are Pro-only.">
        <StocksPageClient />
      </ProGate>
    </main>
  );
}
