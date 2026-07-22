# The Salt Origin — Enterprise CMS V10

This archive is a complete source project based on the supplied V7 project. Build caches, Git history, `node_modules`, and `.env.local` are intentionally excluded.

## Important improvements

- Unified premium CMS design language across all existing pages
- Existing sidebar modules and URLs preserved
- Blog AI Studio with:
  - AI research
  - competitor research
  - keyword research
  - article generation
  - SEO and readability scoring
  - internal-link suggestions
  - daily automatic draft generation
  - manual “Generate today’s draft”
  - review and human approval before publishing
- Social Media Studio with:
  - public social profile links
  - enable/disable controls
  - AI captions and hashtags
  - image upload
  - multi-platform scheduling
  - campaign preview and publishing queue
- Real GA4 connection path; no invented analytics values
- OpenAI errors sanitized by the server helper
- Existing translation, workflow, CRM, business documents, WhatsApp, media and settings retained
- Mobile-responsive CMS and PWA support retained

## Installation

1. Extract the ZIP into a new folder.
2. Copy your private `.env.local` into the project root.
3. Do not publish or share `.env.local`.
4. Run:

```bash
npm install
npx tsc --noEmit
npm run dev
```

5. Open:

- `http://localhost:3000/admin`
- `http://localhost:3000/admin/blogs`
- `http://localhost:3000/admin/social`
- `http://localhost:3000/admin/whatsapp`

## Database migration

Run this in Supabase SQL Editor:

```text
supabase/ENTERPRISE-CMS-V10.sql
```

## Automatic daily blogs

The included `vercel.json` calls `/api/blog/daily-draft` every day.

Required environment variables:

```text
OPENAI_API_KEY=
OPENAI_BLOG_MODEL=gpt-5-mini
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

Keep `approval_required` enabled. AI drafts remain in `draft` status until an administrator clicks **Approve & Publish**.

## Social publishing

Profile links work after the V10 SQL migration. Scheduled publishing requires official API credentials and supported adapters for each platform. The CMS does not bypass platform permissions.

## Security

The original uploaded `.env.local` was not included in this archive. Rotate any OpenAI key that has ever appeared in a screenshot or error popup.
