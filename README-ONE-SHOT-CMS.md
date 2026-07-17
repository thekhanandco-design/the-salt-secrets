# The Salt Origin — One-Shot CMS Upgrade

This project keeps the existing public website visual theme and adds a structured Supabase CMS.

## Included CMS modules

- Premium dashboard with light/dark mode
- Text Manager grouped by page and section
- Images Control panel grouped by page with preview, upload/replace, URL, alt text, reset, remove and visibility
- Media Library
- Complete Product Manager
- Product detail page CMS fields: gallery, specifications, sizes, grain type, features, applications, brochure, SEO and visibility
- Categories
- Blogs and AI-draft endpoint
- Inquiry CRM
- SEO Manager
- Site Settings
- Language Manager
- English, Arabic, French, Spanish, German, Portuguese, Turkish and Urdu registry
- Arabic and Urdu RTL support in the public language selector
- Navbar and footer connected to the CMS text/image system
- Homepage hero and private-label copy connected to CMS text/image data
- Supabase storage buckets for site media, product images, blogs, certificates and catalogs
- Existing Git repository and GitHub remote retained

## First-time setup

1. Extract the ZIP.
2. Copy your existing `.env.local` into the project root.
3. Open Supabase → SQL Editor → New query.
4. Open `supabase/COMPLETE-CMS-SETUP.sql`, copy all content, paste it into Supabase, and click Run.
5. Install and run:

```bash
npm install
npm run dev
```

6. Open:

```text
http://localhost:3000/admin
```

## New CMS routes

```text
/admin/images       Page-by-page image slots
/admin/text         Page-by-page multilingual text fields
/admin/languages    Enable/disable languages and select default
/admin/products     Full product and product-detail editor
/admin/media        General media library
/admin/blogs        Blog manager
/admin/inquiries    Inquiry CRM
/admin/seo          SEO manager
/admin/settings     Global site settings
```

## Environment variables

Keep your existing Supabase and Resend values:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
```

Optional AI blog generation:

```env
OPENAI_API_KEY=
OPENAI_BLOG_MODEL=gpt-5-mini
```

## Storage security

The SQL creates public-read buckets and authenticated write policies. Before final production launch, keep admin routes behind Supabase Auth and ensure only authenticated admin users can upload, update, or delete media.

## Verification

The project compiled successfully and passed TypeScript. A Next.js production `BUILD_ID` was generated using placeholder build-time environment values. Use your real `.env.local` for local and production use.
