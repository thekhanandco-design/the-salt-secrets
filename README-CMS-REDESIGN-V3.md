# The Salt Origin CMS Redesign V3

## What was fixed

- Secure Supabase email/password admin login and logout.
- Wedding Story Films-style dark CMS shell with light/dark toggle.
- Images Manager now always displays the current website image registry, even before database synchronization.
- One-click **Sync Current Website** creates/updates all image slots in Supabase.
- Direct image replacement uploads to the public `site-media` Supabase Storage bucket.
- Text Manager now always displays current website headings, paragraphs, buttons and labels.
- One-click text synchronization and multilingual editing.
- Current homepage hero, private-label images, product-range images, certificates, export map and text fields are connected to CMS records.
- Product manager receives seeded sample products and categories through SQL.
- Public website language selector and light/dark theme remain available.

## Required setup

### 1. Environment file
Copy your existing `.env.local` into the project root. It must include:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
```

Do not expose the service-role key to browser code.

### 2. Run the V3 migration
In Supabase Dashboard → SQL Editor → New Query, paste and run:

```text
supabase/CMS-REDESIGN-V3.sql
```

This creates storage buckets, policies, current website image/text records, product categories and six sample products.

### 3. Create the admin login
Supabase Dashboard → Authentication → Users → Add user.

Create your admin email and password, then open:

```text
http://localhost:3000/admin/login
```

All `/admin` screens redirect to login without an active session.

### 4. Install and run

```bash
npm install
npm run dev
```

### 5. CMS test

1. Open `/admin/images`.
2. Click **Sync Current Website** once.
3. Select Homepage and replace the Hero Product Collection image.
4. Open `/` and refresh. The new image should appear.
5. Open `/admin/text`, sync current website text, change Hero Main Heading, save, then refresh `/`.
6. Open `/admin/products`; seeded sample products should be visible.

## Important

Image upload requires an authenticated Supabase admin session. If upload fails, confirm:

- `CMS-REDESIGN-V3.sql` was run.
- The `site-media` bucket exists in Supabase Storage.
- You are logged into `/admin/login`.
