import { ProGate } from "@/components/pro-gate";
import { LiveGlobeLoader } from "@/components/globe/live-globe-loader";

export default function GlobePage() {
  return (
    <main className="mx-auto w-full max-w-[1600px] p-3 md:p-4">
      <h1 className="mb-3 text-xl font-semibold text-slate-100">/globe</h1>
      <ProGate title="/globe is Pro" subtitle="Global transport, whales, weather, and macro overlays are Pro-only.">
        <LiveGlobeLoader />
      </ProGate>
    </main>
  );
}
