import { ProGate } from "@/components/pro-gate";
import { TransportBoard } from "@/components/transport/transport-board";

export default function TransportPage() {
  return (
    <main className="mx-auto w-full max-w-[1400px] p-3 md:p-4">
      <h1 className="mb-3 text-xl font-semibold text-slate-100">/transport</h1>
      <ProGate
        title="/transport is Pro"
        subtitle="Ships, planes, weather, whales and cross-asset transport intelligence are Pro-only."
      >
        <TransportBoard />
      </ProGate>
    </main>
  );
}
