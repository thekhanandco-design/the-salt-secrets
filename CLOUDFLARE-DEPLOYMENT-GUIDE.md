# Cloudflare domain, Turnstile and production security setup

This project is already prepared for Cloudflare Turnstile, hardened HTTP headers, API rate limiting, payload limits, origin checks, bot honeypots, input cleaning, secure error responses and a public `/.well-known/security.txt` endpoint.

## Before deployment

1. Deploy the application to Vercel or another HTTPS-capable host.
2. Copy `.env.example` to the host's environment settings. Never upload `.env.local`.
3. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS address, for example `https://yourdomain.com`.
4. Add all Supabase, Resend, GA4 and other production secrets only in the hosting dashboard.
5. Run `npm ci`, `npm run build`, and then deploy.

## 1. Add the domain to Cloudflare

1. Create or sign in to your Cloudflare account.
2. Open **Domains** and choose **Onboard a domain / Add a site**.
3. Enter only the root domain, such as `yourdomain.com`, not `https://` and not a page path.
4. Select the plan.
5. Let Cloudflare scan the current DNS zone.
6. Review every DNS record carefully before continuing.

Important DNS records normally include:

- Root website record: `A`, `AAAA`, or `CNAME` supplied by your host.
- `www` record supplied by your host.
- Email records: `MX`, SPF `TXT`, DKIM `TXT/CNAME`, and DMARC `TXT`.
- Any verification records used by Google, Microsoft, Resend or other services.

Keep mail-related records **DNS only**. Proxy only supported web records by enabling the orange cloud.

## 2. Change nameservers at the registrar

1. Cloudflare will display two assigned nameservers.
2. Sign in where the domain was purchased.
3. Open the domain's nameserver settings.
4. Remove the old authoritative nameservers and enter both Cloudflare nameservers exactly.
5. Save the change.
6. Return to Cloudflare and wait until the domain status becomes **Active**.

Do not delete DNS records from the old provider until the Cloudflare zone has been checked. Nameserver propagation can take time.

## 3. Connect the domain to the hosting provider

For Vercel:

1. Open the Vercel project.
2. Go to **Settings > Domains**.
3. Add `yourdomain.com` and `www.yourdomain.com`.
4. Copy the DNS values Vercel displays into Cloudflare DNS.
5. Keep the website records proxied unless Vercel specifically asks for DNS-only during verification.
6. Select one canonical domain and redirect the other to it.

For another host, use the exact A/CNAME values provided by that host.

## 4. Configure SSL/TLS

1. In Cloudflare open **SSL/TLS > Overview**.
2. Select **Full (strict)** after the origin has a valid certificate.
3. Under **Edge Certificates**, enable **Always Use HTTPS**.
4. Enable **Automatic HTTPS Rewrites**.
5. Keep **Universal SSL** enabled.
6. Enable TLS 1.3 where available.

Never use Flexible mode for this application.

## 5. Create Cloudflare Turnstile keys

1. Open **Turnstile** in the Cloudflare dashboard.
2. Select **Add widget**.
3. Name it, for example `The Salt Origin Production`.
4. Add the production hostnames: `yourdomain.com` and `www.yourdomain.com`.
5. Choose **Managed** mode.
6. Create the widget.
7. Copy the site key and secret key.
8. Add them to the hosting environment variables:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_public_site_key
TURNSTILE_SECRET_KEY=your_private_secret_key
```

9. Redeploy the application.
10. Test the contact and product inquiry forms on the live domain.

The secret key must never be placed in client-side code, source control or a public screenshot.

## 6. Enable WAF and bot protection

1. Open **Security > WAF > Managed rules**.
2. Enable the Cloudflare Managed Ruleset available on the selected plan.
3. Enable the OWASP Core Ruleset if available.
4. Begin with the default actions or Managed Challenge to reduce false positives.
5. Review Security Events after launch before making rules stricter.
6. Enable **Bot Fight Mode** if available on the plan.

Suggested custom rules:

### Protect the admin area

Expression:

```text
(http.request.uri.path starts_with "/admin")
```

Action: Managed Challenge. Exclude trusted staff IP addresses only when those IPs are stable.

### Challenge repeated access to public form APIs

Expression:

```text
(http.request.uri.path in {"/api/contact" "/api/inquiry" "/api/newsletter"} and http.request.method eq "POST")
```

Action: Managed Challenge or use a Cloudflare rate-limiting rule appropriate to the plan.

Do not block Cloudflare Turnstile verification endpoints.

## 7. Configure caching safely

- Do not cache `/admin/*`.
- Do not cache `/api/*`.
- Cache static Next.js assets under `/_next/static/*` for a long duration.
- Use standard Cloudflare caching for public images and static files.
- Avoid “Cache Everything” on dynamic pages unless the behavior has been tested.

## 8. Email DNS security

Add the exact records from the email provider:

- SPF
- DKIM
- DMARC
- MX

Mail records must remain DNS only. Start DMARC in monitoring mode if the domain has active email, then tighten it after reviewing reports.

## 9. Production verification checklist

- Domain status is Active in Cloudflare.
- Root and `www` both open over HTTPS.
- One hostname redirects to the canonical hostname.
- SSL/TLS mode is Full (strict).
- Contact and inquiry forms pass Turnstile and store real leads.
- Invalid or repeated requests receive 400/429 responses.
- `/admin` is not indexed and is challenged by Cloudflare.
- `/api` and `/admin` are not cached.
- Email sending and receiving still work.
- `/.well-known/security.txt` opens correctly.
- No `.env.local`, service-role key, API key, build cache or `node_modules` is included in the uploaded source ZIP.

## Security maintenance

- Rotate API keys immediately if they have ever been shared publicly.
- Enable MFA on Cloudflare, Vercel, Supabase and the domain registrar.
- Use separate administrator accounts rather than sharing one password.
- Review Cloudflare Security Events and Supabase auth logs weekly during the first month.
- Keep Next.js and dependencies patched after testing updates in staging.
- Back up the database and storage before every major deployment.
