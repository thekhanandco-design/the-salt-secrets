THE SALT ORIGIN CMS OPERATIONS PATCH

1. Copy the patch files into the root of your current project and allow Windows to Replace/Merge.
2. Run this SQL in Supabase SQL Editor:
   supabase/CMS-OPERATIONS-PATCH.sql
3. Add these Vercel variables if missing:
   NEXT_PUBLIC_SITE_URL=https://www.thesaltorigin.com
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   OPENAI_API_KEY=your-openai-key
   OPENAI_BLOG_MODEL=gpt-5-mini
   OPENAI_TRANSLATION_MODEL=gpt-5-mini
4. Run:
   npm install
   npm run build
5. Push:
   git add .
   git commit -m "CMS operations, documents, CRM and translation patch"
   git push origin main

NEW CMS PAGE:
/admin/documents

FILES ADDED OR REPLACED:
src/components/admin/AdminShell.tsx
src/components/Navbar.tsx
src/app/admin/blogs/page.tsx (existing UI retained; API fixed)
src/app/admin/inquiries/page.tsx
src/app/admin/workflow/page.tsx
src/app/admin/documents/page.tsx
src/app/api/blog/topics/route.ts
src/app/api/blog/generate/route.ts
src/app/api/translate/site/route.ts
src/app/api/admin/users/invite/route.ts
src/app/api/admin/users/role/route.ts
supabase/CMS-OPERATIONS-PATCH.sql

IMPORTANT:
- The Documents page uses browser Print / Save as PDF, so no paid PDF dependency is required.
- User invitations are sent through Supabase Auth and require the service-role key on the server.
- Selecting a non-English language now creates and caches missing registered CMS translations in Supabase. It may take several seconds the first time; later loads use cached translations.
