# The Salt Origin – Complete CMS Upgrade

## Included
- Premium admin dashboard and responsive sidebar
- Admin light/dark mode saved in browser
- Homepage CMS
- Generic page-content center for Home, About, Products, Private Label, Certifications, Contact, Footer and Navbar
- Product manager with image upload, editing and deletion
- Categories manager
- Media library
- Inquiry CRM with statuses, details and CSV export
- Blog manager with drafts, publishing, SEO fields and AI draft generation
- Public blog listing with latest article first and older articles below
- Dynamic blog detail pages
- SEO manager and site settings
- Expanded Supabase schema

## Setup
1. Copy `.env.local` into the project root.
2. Run `supabase/cms-schema.sql` in Supabase SQL Editor.
3. Create public storage buckets if missing:
   - `product-images`
   - `site-media`
   - `blog-images`
   - `certificates`
4. Install and run:
   ```bash
   npm install
   npm run dev
   ```
5. Optional AI blog generation environment variables:
   ```env
   OPENAI_API_KEY=your_key
   OPENAI_BLOG_MODEL=gpt-5-mini
   ```

## Existing environment variables
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
```

## Security note
Keep service-role, Resend and OpenAI keys server-side only. Never prefix secret keys with `NEXT_PUBLIC_`.
