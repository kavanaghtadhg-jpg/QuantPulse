import { StreamConsole } from "@/components/admin/stream-console";
import { ProGate } from "@/components/pro-gate";

export default function AdminStreamsPage() {
  return (
    <main className="mx-auto w-full max-w-[1100px] p-3 md:p-4">
      <h1 className="mb-3 text-xl font-semibold text-slate-100">/admin/streams</h1>
      <ProGate title="Admin stream controls" subtitle="Realtime stream admin console is Pro-only.">
        <StreamConsole />
      </ProGate>
    </main>
  );
}
