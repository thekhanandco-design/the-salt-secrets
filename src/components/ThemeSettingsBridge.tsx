"use client";

import { useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";

type BrandSettings = {
  themeOverridesEnabled?: unknown;
  primaryColor?: unknown;
  deepColor?: unknown;
  secondaryColor?: unknown;
  surfaceColor?: unknown;
  pageColor?: unknown;
  headingFont?: unknown;
  bodyFont?: unknown;
  containerWidth?: unknown;
};

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function color(value: unknown, fallback: string) {
  const candidate = text(value, fallback);
  return /^#[0-9a-fA-F]{6}$/.test(candidate) ? candidate : fallback;
}

function width(value: unknown) {
  const candidate = Number(value);
  return Number.isFinite(candidate) && candidate >= 1100 && candidate <= 1680 ? `${candidate}px` : "1380px";
}

function fontStack(value: unknown, fallback: string) {
  const name = text(value, fallback);
  if (name === "Inter") return 'var(--font-site-body), Inter, Arial, sans-serif';
  if (name === "Georgia") return 'Georgia, "Times New Roman", serif';
  if (name === "System UI") return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  return 'var(--font-site-heading), "Cormorant Garamond", Georgia, serif';
}

export default function ThemeSettingsBridge() {
  const apply = useCallback(async () => {
    const { data } = await supabase
      .from("public_site_settings")
      .select("brand_json")
      .limit(1)
      .maybeSingle();

    const brand = (data?.brand_json || {}) as BrandSettings;
    const root = document.documentElement;
    const enabled = brand.themeOverridesEnabled === true;

    root.style.setProperty("--tso-primary", enabled ? color(brand.primaryColor, "#c84f6c") : "#c84f6c");
    root.style.setProperty("--tso-deep", enabled ? color(brand.deepColor, "#8f1834") : "#8f1834");
    root.style.setProperty("--tso-dark", enabled ? color(brand.secondaryColor, "#17171a") : "#17171a");
    root.style.setProperty("--tso-surface", enabled ? color(brand.surfaceColor, "#fff7f9") : "#fff7f9");
    root.style.setProperty("--tso-page", enabled ? color(brand.pageColor, "#ffffff") : "#ffffff");
    root.style.setProperty("--tso-heading-font", enabled ? fontStack(brand.headingFont, "Cormorant Garamond") : 'var(--font-site-heading), "Cormorant Garamond", Georgia, serif');
    root.style.setProperty("--tso-body-font", enabled ? fontStack(brand.bodyFont, "Inter") : 'var(--font-site-body), Inter, Arial, sans-serif');
    root.style.setProperty("--tso-container", enabled ? width(brand.containerWidth) : "1380px");
  }, []);

  useEffect(() => {
    void apply();
    window.addEventListener("salt-cms-updated", apply);
    return () => window.removeEventListener("salt-cms-updated", apply);
  }, [apply]);

  return null;
}
