# The Salt Origin Enterprise CMS - Final Setup

## Included

- Dark/light public website theme toggle
- English, Arabic, French, Spanish, German, Portuguese, Turkish and Urdu language dropdown
- RTL switching for Arabic and Urdu
- Supabase-connected page image manager with page sidebar, live previews and direct replace/remove
- Page text manager with translated values
- Products manager with product cards and full product detail data
- Category manager with editable images, text and display order
- Product detail pages with gallery, specifications, sizes, features, applications, brochure and inquiry form
- Blog CMS with AI researched draft generation
- Optional daily Vercel cron that creates a draft for approval (never auto-publishes)
- Media library, inquiries CRM, SEO manager and settings

## Required Supabase step

Run the complete file in Supabase SQL Editor:

`supabase/COMPLETE-CMS-SETUP.sql`

It is safe to run more than once. It seeds sample categories, five sample products, image slots and multilingual CMS records.

## Environment variables

Copy your existing `.env.local` into the project root and ensure it contains:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
INQUIRY_EMAIL_TO=thekhanandco@gmail.com
OPENAI_API_KEY=
OPENAI_BLOG_MODEL=gpt-5-mini
CRON_SECRET=
```

`OPENAI_API_KEY` is required only for AI blog drafts. `CRON_SECRET` protects the daily draft endpoint.

## Run

```bash
npm install
npm run dev
```

Admin: `http://localhost:3000/admin`

Key pages:

- `/admin/images`
- `/admin/text`
- `/admin/products`
- `/admin/categories`
- `/admin/blogs`
- `/admin/languages`

## Daily blog workflow

`vercel.json` calls `/api/blog/daily-draft` every day at 06:00 UTC. The endpoint researches current B2B topics through OpenAI web search and saves a **draft** in Supabase. Review it under `/admin/blogs`, add or replace its image, then publish it.

Automation is disabled initially. Enable it by setting `enabled = true` in the `blog_automation_settings` table after testing.

## Verification

TypeScript validation passes with `npx tsc --noEmit`. A full Next.js build requires the actual Supabase environment variables because dynamic server pages read live Supabase data.
