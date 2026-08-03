# Enterprise CMS V10.2 Update

## Main improvements

- Premium typography and consistent pink gradient controls across the CMS
- Compact Dashboard action cards and uppercase Business Command Center title
- Correct capitalization for Google Analytics Overview and Inquiry Pipeline
- Light-theme fixes for Images Manager and Text Manager
- GA4 integration guidance in Site Settings
- Daily automatic Blog and Industry Article drafts
- Separate Blog and Article queues, AI keywords, Approve & Publish, and Reject actions
- Public `/blog` now shows blogs; new public `/articles` route shows long-form articles
- AI SEO Command Center with audits, keyword suggestions and quick wins
- Language page now has a Translate Now action
- Social daily campaign drafts with captions, hashtags, keywords and optional AI image generation
- Business Documents storage bucket migration fixes “Bucket not found”
- Hobby-plan-compatible Vercel cron schedules (daily only)

## Required SQL

Run:

```text
supabase/ENTERPRISE-CMS-V10.2.sql
```

## Local setup

```bash
npm install
npx tsc --noEmit
npm run dev
```

## GA4

Add to `.env.local`:

```text
GA4_PROPERTY_ID=123456789
GA4_ACCESS_TOKEN=your_google_oauth_access_token
```

The access token must have Google Analytics read access. Refresh tokens/service-account automation are recommended for production because a manually created OAuth access token expires.

## WhatsApp Cloud API

Add:

```text
WHATSAPP_CLOUD_ACCESS_TOKEN=
WHATSAPP_CLOUD_PHONE_NUMBER_ID=
WHATSAPP_NOTIFICATION_TO=15551234567
WHATSAPP_GRAPH_VERSION=v23.0
```

Use a real test recipient in international format without `+`. The displayed number in the UI is only a random example.

## Daily AI drafts

Set `blog_automation_settings.enabled=true` in Supabase. The daily cron generates one Blog and one Industry Article as drafts. They remain offline until **Approve & Publish** is clicked.

## Social automation

Set:

```text
OPENAI_IMAGE_MODEL=gpt-image-1
OPENAI_IMAGE_AUTOGENERATE=true
```

The daily social cron creates a draft campaign. If image generation is available, it uploads a matching image to the `cms-media` bucket. Human approval is still required.

## Vercel Hobby plan

All included cron jobs run once per day. Exact minute execution is not guaranteed on Hobby.
