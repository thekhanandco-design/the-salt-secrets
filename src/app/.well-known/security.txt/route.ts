export function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  return new Response(`Contact: mailto:${process.env.SECURITY_CONTACT_EMAIL || "security@example.com"}\nCanonical: ${base}/.well-known/security.txt\nPreferred-Languages: en\nPolicy: ${base}/privacy\nExpires: 2027-12-31T23:59:59.000Z\n`, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" } });
}
