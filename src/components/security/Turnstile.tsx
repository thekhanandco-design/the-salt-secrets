"use client";

import { useEffect, useRef, useState } from "react";

type TurnstileStatus = "loading" | "ready" | "verified" | "error" | "unconfigured";

type TurnstileProps = {
  onToken: (token: string) => void;
  onStatusChange?: (status: TurnstileStatus) => void;
  action?: string;
  theme?: "light" | "dark" | "auto";
  resetSignal?: number;
};

type TurnstileApi = {
  render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-tso-turnstile="true"]');

    const waitForApi = () => {
      const started = Date.now();
      const timer = window.setInterval(() => {
        if (window.turnstile) {
          window.clearInterval(timer);
          resolve();
          return;
        }
        if (Date.now() - started > 10_000) {
          window.clearInterval(timer);
          reject(new Error("Turnstile API did not become available."));
        }
      }, 100);
    };

    if (existing) {
      if (window.turnstile) resolve();
      else {
        existing.addEventListener("load", waitForApi, { once: true });
        existing.addEventListener("error", () => reject(new Error("Turnstile script failed to load.")), { once: true });
        waitForApi();
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.tsoTurnstile = "true";
    script.onload = waitForApi;
    script.onerror = () => reject(new Error("Turnstile script failed to load."));
    document.head.appendChild(script);
  }).catch((error) => {
    scriptPromise = null;
    throw error;
  });

  return scriptPromise;
}

export default function Turnstile({
  onToken,
  onStatusChange,
  action = "form_submit",
  theme = "light",
  resetSignal = 0,
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);
  const [siteKey, setSiteKey] = useState("");
  const [status, setStatus] = useState<TurnstileStatus>("loading");
  const [detail, setDetail] = useState("Loading secure verification…");

  function updateStatus(next: TurnstileStatus, message: string) {
    setStatus(next);
    setDetail(message);
    onStatusChange?.(next);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadConfig() {
      try {
        const response = await fetch("/api/security/turnstile-config", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const result = (await response.json().catch(() => ({}))) as { configured?: boolean; siteKey?: string | null };
        if (cancelled) return;

        const key = typeof result.siteKey === "string" ? result.siteKey.trim() : "";
        if (!response.ok || !result.configured || !key) {
          onToken("");
          updateStatus("unconfigured", "Security widget Site Key is missing in the deployed environment.");
          return;
        }

        setSiteKey(key);
      } catch {
        if (cancelled) return;
        onToken("");
        updateStatus("error", "Security widget configuration could not be loaded. Please refresh this page.");
      }
    }

    void loadConfig();
    return () => {
      cancelled = true;
    };
  }, [onToken]);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;

    async function renderWidget() {
      updateStatus("loading", "Loading secure verification…");
      try {
        await loadTurnstileScript();
        if (cancelled || !window.turnstile || !containerRef.current) return;

        if (widgetId.current) {
          try {
            window.turnstile.remove(widgetId.current);
          } catch {
            // Widget may already have been removed by a prior render.
          }
          widgetId.current = null;
        }
        containerRef.current.innerHTML = "";

        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          action,
          appearance: "always",
          execution: "render",
          size: "flexible",
          retry: "auto",
          "refresh-expired": "auto",
          callback: (token: string) => {
            onToken(token);
            updateStatus("verified", "Security check complete.");
          },
          "expired-callback": () => {
            onToken("");
            updateStatus("ready", "Security check expired. Verifying again…");
          },
          "timeout-callback": () => {
            onToken("");
            updateStatus("ready", "Security check timed out. Please complete the widget below.");
          },
          "error-callback": (code: string) => {
            onToken("");
            updateStatus("error", `Security check could not load (${code || "unknown"}). Refresh the page and try again.`);
            return true;
          },
        });

        updateStatus("ready", "Complete the security check below if Cloudflare asks for interaction.");
      } catch {
        if (cancelled) return;
        onToken("");
        updateStatus("error", "Security verification could not load. Disable blocking extensions for this site and refresh.");
      }
    }

    void renderWidget();

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          // Ignore cleanup races during navigation/hot reload.
        }
      }
      widgetId.current = null;
    };
  }, [action, onToken, siteKey, theme]);

  useEffect(() => {
    if (!resetSignal || !widgetId.current || !window.turnstile) return;
    onToken("");
    try {
      window.turnstile.reset(widgetId.current);
      updateStatus("ready", "Security check refreshed.");
    } catch {
      // A navigation/remount will render a fresh widget automatically.
    }
  }, [onToken, resetSignal]);

  const badge = status === "verified"
    ? "Verified"
    : status === "error" || status === "unconfigured"
      ? "Needs attention"
      : "Security check";

  return (
    <div
      style={{
        width: "100%",
        border: "1px solid #eadde2",
        borderRadius: 14,
        background: "#fff9fb",
        padding: "12px 14px",
      }}
      aria-live="polite"
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 8 }}>
        <strong style={{ fontSize: 11, color: "#4a3c42", letterSpacing: ".04em" }}>Cloudflare Turnstile</strong>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: status === "verified" ? "#27795d" : status === "error" || status === "unconfigured" ? "#9f1636" : "#8f1834",
          }}
        >
          {badge}
        </span>
      </div>
      <div ref={containerRef} style={{ width: "100%", minHeight: 70, display: "flex", justifyContent: "center", alignItems: "center" }} />
      <div style={{ marginTop: 7, fontSize: 10, lineHeight: 1.45, color: status === "error" || status === "unconfigured" ? "#9f1636" : "#75656c" }}>
        {detail}
      </div>
    </div>
  );
}
