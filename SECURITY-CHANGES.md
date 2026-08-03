# Production security changes included

- Cloudflare Turnstile component with server-side Siteverify validation.
- Turnstile protection on contact and product inquiry forms.
- Per-IP application rate limiting for contact, inquiry and newsletter endpoints.
- Request body size limits.
- Same-origin validation for public POST endpoints.
- Honeypot bot fields.
- Input length restrictions, basic HTML stripping and control-character removal.
- Server-side email validation.
- No fallback production database credentials.
- Generic production errors that avoid leaking internal details.
- `Cache-Control: no-store` for APIs and admin pages.
- HSTS in production, clickjacking protection, MIME sniffing protection, strict referrer policy and restrictive permissions policy.
- Removed `X-Powered-By`.
- `/.well-known/security.txt` endpoint.
- `.env.local`, `.next` and `node_modules` excluded from the delivery ZIP.

## Important boundary

Cloudflare DNS, proxying, WAF, Bot Fight Mode, TLS mode and account MFA are external controls. They cannot be activated from source code. Follow `CLOUDFLARE-DEPLOYMENT-GUIDE.md` after deploying the project.

The in-memory rate limiter is suitable as a first application layer. For guaranteed distributed limits across multiple serverless instances, also enable Cloudflare rate limiting or use a shared store such as Upstash Redis.
