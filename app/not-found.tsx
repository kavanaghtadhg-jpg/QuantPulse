import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#020617] p-6 text-slate-100">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-sm text-slate-400">The requested QuantPulse route does not exist.</p>
      <Link
        href="/"
        className="rounded-md border border-white/20 px-3 py-2 text-sm hover:bg-white/10"
      >
        Return to terminal
      </Link>
    </main>
  );
}
