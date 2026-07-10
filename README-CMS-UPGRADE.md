# The Salt Origin CMS Upgrade

This package adds a practical CMS layer while keeping the public website theme intact.

## New CMS modules

- `/admin` dashboard
- `/admin/homepage` homepage content editor
- `/admin/products` product manager with image upload, edit, delete, active/draft
- `/admin/categories` category manager
- `/admin/media` media library using Supabase Storage bucket `product-images`
- `/admin/inquiries` CRM with status tracking, CSV export, detail modal
- `/admin/seo` SEO manager records
- `/admin/settings` site contact/settings records

## Inquiry notifications

API routes now save leads to Supabase and send:

- lead email to `LEAD_NOTIFICATION_EMAIL` or fallback `thekhanandco@gmail.com`
- customer auto reply if customer email is provided
- optional WhatsApp/webhook notification when `WHATSAPP_WEBHOOK_URL` is configured

## Required Supabase SQL

Run this file in Supabase SQL Editor:

`supabase/cms-schema.sql`

## Required environment variables

Keep your existing `.env.local`. Recommended variables:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=onboarding@resend.dev
LEAD_NOTIFICATION_EMAIL=thekhanandco@gmail.com
WHATSAPP_WEBHOOK_URL=
```

## Run locally

```bash
npm install
npm run dev
```

`dev` uses `next dev --webpack` to avoid Windows Turbopack panic errors.
