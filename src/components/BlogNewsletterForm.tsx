"use client";

import { FormEvent, useCallback, useState } from "react";
import Turnstile from "@/components/security/Turnstile";

export default function BlogNewsletterForm() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const onTurnstile = useCallback((token: string) => setTurnstileToken(token), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState("loading");
    setMessage("");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), source: "blog", turnstileToken }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not subscribe.");
      form.reset();
      setTurnstileToken("");
      setState("success");
      setMessage("Thank you. Your subscription has been saved.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Could not subscribe.");
    }
  }

  return (
    <form className="tso-journal-subscribe-form" onSubmit={submit}>
      <input type="email" name="email" required placeholder="Business email" aria-label="Business email" />
      <button type="submit" disabled={state === "loading"}>{state === "loading" ? "Subscribing…" : "Subscribe"}</button>
      <div className="tso-journal-turnstile"><Turnstile action="newsletter" onToken={onTurnstile} /></div>
      {message ? <small className={state === "error" ? "error" : "success"}>{message}</small> : null}
    </form>
  );
}
