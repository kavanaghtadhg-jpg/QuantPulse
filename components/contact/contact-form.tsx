"use client";

import emailjs from "@emailjs/browser";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "PASTE_YOUR_PUBLIC_KEY";
const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "PASTE_YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "PASTE_YOUR_TEMPLATE_ID";

export function ContactForm() {
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");

    const form = new FormData(event.currentTarget);
    const payload = {
      from_name: String(form.get("name") ?? ""),
      from_email: String(form.get("email") ?? ""),
      subject: String(form.get("subject") ?? ""),
      message: String(form.get("message") ?? ""),
      to_email: "quantpulse@proton.me",
    };

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, payload, EMAILJS_PUBLIC_KEY);
      setStatus("Message sent.");
      event.currentTarget.reset();
    } catch {
      setStatus("Unable to send message. Check EmailJS config.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-slate-100">Pro Support Contact</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={submit}>
          <Input name="name" placeholder="Name" required />
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="subject" placeholder="Subject" required />
          <Textarea name="message" placeholder="How can we help?" required />
          <Button type="submit" disabled={busy}>
            {busy ? "Sending..." : "Send Support Request"}
          </Button>
          {status ? <p className="text-xs text-slate-300">{status}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
