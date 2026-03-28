import { ContactForm } from "@/components/contact/contact-form";
import { ProGate } from "@/components/pro-gate";

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-[900px] p-3 md:p-4">
      <h1 className="mb-3 text-xl font-semibold text-slate-100">/contact</h1>
      <ProGate title="Pro support" subtitle="Contact support is available for Pro subscribers.">
        <ContactForm />
      </ProGate>
    </main>
  );
}
