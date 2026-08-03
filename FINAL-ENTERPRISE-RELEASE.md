# The Salt Origin Enterprise CMS — Final Release

## Added in this release
- WSF-style AI Content Studio with editorial queue, review, rewrite and approve/publish flow.
- Daily keyword, competitor-gap and backlink opportunity research controls.
- Executive dashboard for GA4 data: realtime users, sessions, page views, engagement, bounce, countries, sources, pages, products and conversions.
- Newsletter subscriber center with filtering and CSV export.
- Backlink & Competitor Intelligence center.
- Separate Help Center; operational instructions removed from production modules.
- Premium centered CMS login using the supplied Khan & Co. logo.
- Khan & Co. A4 business-document print system with seller, buyer, numbering, dates, Incoterms, payment, origin, destination, line items, totals and terms.
- Letterhead is rendered in both preview and print/PDF output; no stamp is included by default.
- Integration-ready architecture remains available for WhatsApp, Meta, LinkedIn, Google Business and YouTube.

## Database
Run `supabase/ENTERPRISE-CMS-V12.sql` once in Supabase SQL Editor if it has not already been applied.

## Validation
`node node_modules/typescript/bin/tsc --noEmit` passed successfully.
The Next.js production build reached the SWC dependency step but the package mirror returned HTTP 503; this is an environment download issue rather than a TypeScript failure.

## Environment
Copy `.env.example` to `.env.local` and use the existing project credentials. `.env.local` is intentionally excluded from the delivery ZIP to protect secrets.
