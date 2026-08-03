# The Salt Origin — Final CMS & Security Update

## Implemented in this release

### Unified visual system
- Consistent premium sans-serif typography across CMS modules.
- Unified pink/red primary gradient, rounded buttons, card radius, borders and shadows.
- Reduced mixed dark/light styling and removed several inconsistent blue/purple actions.
- Improved spacing for forms, categories, document controls and previews.

### Executive Dashboard
- Renamed “Visitors (Live)” to “Live Visitors”.
- KPI mini-chart now sits alongside the metric value.
- Replaced the static world-map image with an interactive vector geography component.
- Added hover country details and GA4-driven map markers.
- Improved traffic, performance, funnel and country presentation.
- Added country flags to Top Countries.

### Analytics
- Simplified the main heading and typography.
- Added interactive GA4 geography map.
- Sessions chart now includes point hover details plus zoom in, zoom out and reset controls.
- Simplified Device Mix, Geography and Traffic headings.
- Unified analytics colors with the CMS theme.

### Keyword Research & FAQs
- Added copy actions for keywords and topic gaps.
- Content opportunities now open AI Content Studio with the keyword/title prefilled.
- Buyer questions can create FAQ drafts.
- Added full CMS FAQ Manager with draft, approve and publish workflow.
- Added public `/faqs` page with FAQ structured data.
- Added SQL migration for `cms_faqs` and task roadmap fields.

### Customers & Logistics
- Added separate Shipment Tracking module.
- Added courier, air, road and ocean shipment modes.
- Added direct carrier tracking links for DHL, FedEx, UPS, Aramex and TCS.
- Added searchable shipment registry, status badges, ETA and route display.
- Renamed sidebar Customer Portal entry to Customer CRM.

### Business Documents
- Added live letterhead thumbnail preview.
- Added delete-letterhead workflow.
- Unified document action buttons.
- Improved document preview spacing and Terms & Conditions placement.

### Security
- Added Cloudflare Turnstile component and server-side verification.
- Added Turnstile protection to public contact and product inquiry forms.
- Added rate limiting, body-size limits, honeypots, same-origin validation and sanitization.
- Added production security headers, HSTS, no-store admin/API headers and `security.txt`.
- Added Cloudflare deployment and security configuration guides.

## Database migration
Run once in Supabase SQL Editor:

`supabase/ENTERPRISE-CMS-FINAL-UI.sql`

## Existing environment
Keep the existing `.env.local`. Add only these new variables after Cloudflare Turnstile is created:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `SECURITY_CONTACT_EMAIL`

## External-provider boundaries
The following require external APIs or deployment configuration and are not faked:
- Live backlink authority and referring-domain data.
- Verified keyword search volume and difficulty.
- Automatic social publishing permissions.
- Carrier API live status beyond tracking links.
- Cloudflare DNS, WAF, proxy and bot settings.
