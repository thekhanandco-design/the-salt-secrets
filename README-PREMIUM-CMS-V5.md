# The Salt Origin — Premium CMS V5

This build upgrades the current CMS without changing the public website's core visual identity.

## Included

- Premium responsive admin shell with dark/light mode
- Text Manager formatting toolbar: font, size, bold, italic, underline, uppercase/lowercase, alignment
- Cached OpenAI translations stored in Supabase
- AI blog draft generation and web-researched topic suggestions
- Daily Vercel cron draft workflow with approval required by default
- Social Media Manager connected to website footer icons
- Favicon and PWA/mobile app icon manager
- Installable PWA foundation and browser notification support
- Inquiry notification bell backed by Supabase notifications
- CMS roles/workflow reference panel
- Manual JSON backup snapshots and automatic content version history
- Homepage text-style rendering for core hero and section fields
- Existing product, image, text, blog, SEO and inquiries modules retained

## Required Supabase SQL

Run this after the older CMS SQL files:

`supabase/PREMIUM-CMS-V5.sql`

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_BLOG_MODEL=gpt-5-mini
OPENAI_TRANSLATION_MODEL=gpt-5-mini
CRON_SECRET=
```

Add the same variables in Vercel → Project → Settings → Environment Variables, then redeploy.

## Blog automation

1. Open `/admin/blogs`.
2. Enable automation and keep Approval Required on.
3. Save settings.
4. Vercel cron calls `/api/blog/daily-draft` daily at 06:00 UTC.
5. Drafts appear in CMS and do not publish until approved.

## Mobile installation

Open the website in Chrome/Safari and use **Add to Home Screen**. Browser notifications must be enabled from the CMS bell/sparkle control while the CMS is open.

## Validation

- `npx tsc --noEmit` passes.
- Next.js compilation and TypeScript build stages pass.
- Full static page-data collection requires real Supabase environment values and may not complete in an isolated build environment.
