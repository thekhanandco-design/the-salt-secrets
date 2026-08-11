# The Salt Origin — Final Website + CMS Integration

This package is the full Next.js source prepared from the supplied production project. Existing API routes, Supabase structure, cron workflows and environment-variable integrations are preserved. The public website and CMS UI were upgraded to the approved The Salt Origin premium white / blush / dark-pink / charcoal design system.

## Main integrated changes

- Premium public homepage: compact header, executive hero, wide Private Label section, 3 x 2 Signature Collections, B2B process, quality, export, story, blog, FAQ and CTA.
- Premium CMS theme across the existing admin application.
- AI Content Studio: one topic creates a long-form blog plus platform-specific Facebook, LinkedIn, Instagram, Threads, X, YouTube, Pinterest and TikTok drafts through the existing authenticated AI routes.
- Shared campaign image: AI generation or manual upload through the existing OpenAI image route and Supabase CMS media storage.
- Blog review / reject / approve-and-publish workflow writes to the existing `blog_posts` source used by the website.
- Existing daily Blog Center, Social Studio and FAQ Intelligence cron/API workflows are retained.
- Website Visual Editor now stores section visibility/order in the existing `site_settings.config_json` field. Homepage, Products, Private Label, Certifications, About, FAQ, Contact and Blog sections can be hidden/shown/reordered without a new database migration.
- Text Manager continues to use the existing page/section text registry; additional homepage Signature Collection fields are registered.
- Images Manager remains page/section based and now includes both Upload/Replace and Create with AI controls using existing APIs/storage.
- Existing Social Profile Links, CRM, quotations, commercial sheet, newsletter, analytics, SEO/GEO, roles, integrations and other CMS modules are preserved.
- Legacy source references to `the-salt-secrets` / `thesaltsecrets.com` were replaced with The Salt Origin / `www.thesaltorigin.com` where found in active source.

## Deployment

Deploy this code to the same Vercel project / environment that already contains the live environment variables. `.env.local` is deliberately excluded from this handoff for security; Vercel-stored variables remain attached to the Vercel project and do not need to be placed in the ZIP.

Typical commands in a normal networked development environment:

```bash
npm ci
npm run build
npm run dev
```

No new Supabase migration is required for the section-layout feature because it uses the existing `site_settings.config_json` field.

## Validation note

Changed TS/TSX files were syntax-parsed locally and no syntax diagnostics were found. Existing API route files and Supabase SQL files were preserved. A full `npm ci` / `next build` could not be executed in the packaging sandbox because access to `registry.npmjs.org` timed out; therefore this package does not falsely claim an independently passing production build in that sandbox.
