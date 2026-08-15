# The Salt Origin — Prototype-Synced Production Build

This package applies the approved website and CMS prototype design language to the existing Next.js production project while preserving the existing backend architecture and integration routes.

## Visual source of truth
- Public website: approved premium website prototype (`prototype2.zip`)
- CMS/admin: approved Premium CMS Content Operations V2 prototype
- Brand system: Cormorant Garamond + Inter, white/blush surfaces, rose/deep-wine accents, charcoal-to-wine gradients, premium rounded geometry, compact header, mountain motif.

## Preserved production systems
- Next.js 16 / React 19 / TypeScript
- Supabase database, auth, CMS tables, storage and migrations
- OpenAI content/image generation routes and existing AI workflows
- Gemini hooks
- Resend email
- Contact/inquiry/newsletter APIs
- GA4 admin analytics and frontend measurement support
- Google Search Console and Bing Webmaster routes
- GTM and Microsoft Clarity hooks
- Cloudflare integration hooks
- YouTube OAuth routes
- Existing social publishing/daily-draft routes and stored integration-token architecture
- Existing cron/daily research workflows

## GA4
The public app now prefers `GA4_MEASUREMENT_ID` from the environment for frontend measurement. Admin analytics continues to use `GA4_PROPERTY_ID` plus the existing service-account/access-token flow. GTM remains supported through `NEXT_PUBLIC_GTM_ID`.

## Environment variables
Secret values are intentionally NOT included in this ZIP. The code uses the existing production variable names. Deploying this code to the same Vercel project keeps the environment variables already configured there. Safe placeholder templates are included in `.env.example` and `.env.local.example`.

## QA performed in the build sandbox
- 167 TS/TSX source files syntax-transpiled: 0 syntax errors
- `src/app/globals.css`: 0 CSS parse errors
- `src/app/admin/premium-admin.css`: 0 CSS parse errors
- 39 API route handlers present
- 22 Supabase SQL migration/schema files present
- Active source scan found no legacy Salt Secrets branding/domain references
- Required local integration credentials were checked for presence without printing values; core Supabase, OpenAI, Gemini, Resend, GA4, Search Console, GTM, Clarity, Cloudflare, Bing, YouTube, Google Calendar/Sheets/Drive, integration encryption and cron values are present in the supplied local environment.

A full `npm ci` / `next build` could not be completed in this sandbox because dependency installation could not reliably reach the npm registry. Do not treat that as a source build failure; production build should still be verified by Vercel on deployment.
