"use client";

import Script from "next/script";
import { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export default function Turnstile({ onToken, action = "form_submit", theme = "light" }: { onToken: (token: string) => void; action?: string; theme?: "light" | "dark" | "auto" }) {
  const reactId = useId();
  const id = `turnstile-${reactId.replace(/:/g, "")}`;
  const widgetId = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) return;
    const render = () => {
      if (!window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(`#${id}`, {
        sitekey: siteKey,
        theme,
        action,
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    };
    const timer = window.setInterval(render, 250);
    render();
    return () => {
      window.clearInterval(timer);
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
    };
  }, [action, id, onToken, siteKey, theme]);

  if (!siteKey) return null;

  return <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" /><div id={id} className="min-h-[65px]" /></>;
}
