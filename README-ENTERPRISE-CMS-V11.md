# The Salt Origin Enterprise CMS V11

## What changed

- One unified Arvo-style slab-serif typography system across every CMS page
- Consistent left-aligned, smaller uppercase page headings with subtle dark gradient
- Same pink-only gradient for primary actions
- Social Studio automatically loads today's AI draft into the editor
- Official platform icons for Facebook, Instagram, LinkedIn, TikTok, YouTube, Pinterest, X, Threads and Google Business
- Approve, schedule or reject social drafts
- Saved Documents workspace with search, type, buyer, status, sent-via and response tracking
- Improved A4 printing with the uploaded full-page letterhead behind the document
- Existing automatic document number series retained

## Install

1. Extract this complete ZIP into a new folder.
2. Copy your private `.env.local` into the project root.
3. Run `supabase/ENTERPRISE-CMS-V11.sql` in Supabase SQL Editor.
4. Run:

```powershell
npm install
npx tsc --noEmit
npm run dev
```

## Important paths

- Dashboard: `/admin`
- Social Studio: `/admin/social`
- Business Documents: `/admin/documents`
- Blog Studio: `/admin/blogs`
- Articles: `/admin/articles`

## Social publishing

The CMS can prepare captions, hashtags, keywords and an AI image draft automatically. Actual publishing still requires official API permissions and tokens from each platform. The CMS does not bypass Facebook, Instagram, LinkedIn, TikTok, YouTube or Google approval rules.

## Fonts

The CMS requests the Arvo font from Google Fonts and includes Rockwell/Georgia fallbacks. No font file is bundled.
