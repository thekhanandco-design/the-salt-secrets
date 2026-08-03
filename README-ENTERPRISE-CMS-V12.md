# The Salt Origin — Enterprise CMS V12

## Added in V12

- Full GA4 Analytics Command Center: active users, new users, sessions, page views, bounce rate, engagement, average session duration, conversions, countries, traffic sources, top pages, top products, devices and real-time visitors.
- Daily Keyword Research Center with AI/web-assisted primary keywords, secondary terms, buyer questions, competitor-topic gaps and content opportunities.
- Marketing Command Center architecture for newsletters, email campaigns, lead magnets, coupons, landing pages, A/B variants and first-party conversion events.
- B2B Customer Portal architecture with customer accounts and shipment records for ocean containers, BL, vessel, voyage, air cargo and courier parcels.
- Enterprise File Manager index for images, video, PDF, Word, Excel, CSV and ZIP assets with folders, tags and search.
- System Health Center for database, AI, email, analytics, cron, cache, backup and API readiness.
- Audit Logs module and database model.
- Integration Hub with API-ready but disconnected adapters for Meta, LinkedIn, Google Business, YouTube, WhatsApp, DHL, FedEx and UPS.
- Enterprise V12 Supabase migration: `supabase/ENTERPRISE-CMS-V12.sql`.
- Vercel cron schedule for daily keyword research, blog/article drafts and social campaign drafts. External auto-publishing remains disabled until credentials are connected.

## Required installation step

Run `supabase/ENTERPRISE-CMS-V12.sql` once in the Supabase SQL Editor.

## Existing environment variables

Keep the existing Supabase, OpenAI, Resend and GA4 variables. Add `CRON_SECRET` in Vercel for protected scheduled endpoints.

## Validation

- TypeScript validation: passed with `tsc --noEmit`.
- Full Next.js build could not finish in the packaging environment because the internal npm mirror returned HTTP 503 while Next.js attempted to download the Linux SWC package. No TypeScript errors were found.
