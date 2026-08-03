# The Salt Origin — Final CMS Change Pack

## Implemented in this release

- Unified CMS typography: removed the forced slab/Arvo treatment and standardized the interface on a clean system/Inter-style sans serif stack.
- Unified button radius, primary pink gradient, card radius, borders, shadows, fields, tables and page headings.
- Dashboard KPI label changed to **Live Visitors** with more prominent card typography.
- Dashboard static world-map image replaced by an inline vector geographic visualization. Markers are created only from GA4 country rows returned by the analytics endpoint.
- Dashboard country list now shows country flags.
- Dashboard traffic and performance cards tightened to remove large unused white areas.
- Analytics typography normalized to the Dashboard design language; secondary over-labels/subcopy are visually reduced.
- Existing GA4 vector geography view preserved; no fake visitor totals are added.
- Added **FAQ Manager** at `/admin/faqs` with draft/review/published states, edit, copy, delete, publish/unpublish and live-page preview.
- Added public SEO-friendly FAQ page at `/faqs`, including FAQPage JSON-LD schema.
- Added SQL migration for `cms_faqs` with RLS policies.
- Keyword Research now includes copy buttons, clickable Content Studio opportunities, FAQ-draft creation from buyer questions and an FAQ Manager link.
- Added a separate **Shipment Tracking** module at `/admin/shipments`.
- Shipment tracking supports customer, reference, mode, carrier, route, ETA, status, tracking URL and direct carrier tracking links for DHL, FedEx, UPS, Aramex and TCS.
- Renamed Customer Portal navigation entry to **Customers CRM** and separated shipment tracking into its own navigation item.
- Rebuilt **Tasks & Reminders** into a grouped ClickUp-style roadmap with teams, ETA, owner, progress, status and color-coded workspaces.
- Existing production security package retained: Turnstile integration, application rate limits, security headers, HSTS production behavior, input checks, same-origin controls and Cloudflare deployment guide.

## One required database step

Run this file once in Supabase SQL Editor:

`supabase/migrations/20260727_faq_manager.sql`

No existing Supabase project, keys or current CMS tables should be replaced.

## Validation

`tsc --noEmit` completed successfully.

A complete Next.js production build could not be executed in the packaging environment because the Linux SWC binary download returned a temporary package-gateway error. This is an environment download issue, not a TypeScript error. Run `npm install` and `npm run build` on the normal project machine before deployment.

## External services still required for authentic data

- Keyword volume/difficulty: DataForSEO, Semrush, Ahrefs or another keyword-data provider.
- Backlink intelligence: DataForSEO, Ahrefs, Semrush or Moz API.
- Automatic daily social publishing: Vercel Cron plus approved platform API credentials.
- Live carrier status inside the CMS: carrier APIs. Direct tracking links already work without those APIs.
- Cloudflare WAF, DNS proxy, Bot Fight Mode and account-level rate limiting must be enabled in Cloudflare Dashboard after deployment.
