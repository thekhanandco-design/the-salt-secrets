import type { NextConfig } from "next";

const isProductionBuild = process.env.NODE_ENV === "production";
const isProductionDeployment = process.env.VERCEL_ENV
  ? process.env.VERCEL_ENV === "production"
  : isProductionBuild && process.env.APP_ENV !== "staging" && process.env.APP_ENV !== "preview";
const reportOnlyCsp = process.env.CSP_REPORT_ONLY === "true" || !isProductionDeployment;

function originFrom(value: string | undefined) {
  if (!value) return "";
  try { return new URL(value).origin; } catch { return ""; }
}

const supabaseOrigin = originFrom(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseHostname = (() => {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) return "";
  try { return new URL(value).hostname; } catch { return ""; }
})();
const connectSources = [
  "'self'",
  supabaseOrigin,
  supabaseOrigin ? supabaseOrigin.replace(/^https:/, "wss:") : "",
  "https://www.google-analytics.com",
  "https://*.google-analytics.com",
  "https://www.googletagmanager.com",
  "https://www.clarity.ms",
  "https://*.clarity.ms",
  "https://challenges.cloudflare.com",
].filter(Boolean).join(" ");

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${isProductionDeployment ? "" : " 'unsafe-eval'"} https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  `connect-src ${connectSources}`,
  "frame-src 'self' https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'self' blob: https:",
  ...(isProductionDeployment ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: reportOnlyCsp ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy", value: csp },
  ...(isProductionDeployment ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }] : []),
  ...(!isProductionDeployment ? [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] : []),
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            port: "",
            pathname: "/storage/v1/object/**",
          },
        ]
      : [],
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      { source: "/api/(.*)", headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }] },
      { source: "/admin/(.*)", headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }, { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] },
    ];
  },
};

export default nextConfig;
