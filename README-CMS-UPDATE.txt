THE SALT ORIGIN - LIVE ENTERPRISE B2B CMS

LOCALHOST
1. Install Node.js 20 or newer.
2. Run: npm install
3. In Supabase SQL Editor, run this file once:
   supabase/ENTERPRISE-B2B-LIVE-DATA.sql
4. Run: npm run dev
5. Website: http://localhost:3000
6. CMS: http://localhost:3000/admin

LIVE DATA
- The original website and its existing public pages are unchanged.
- The included .env.local is copied from the supplied website project and remains excluded by .gitignore.
- GA4 reads the real configured property through the authenticated server API.
- Dashboard leads, Won records, quotations, shipments, activity, follow-ups and approvals read from Supabase.
- Empty or disconnected sources show a clear empty/error state; no fake fallback records are displayed.
- Settings > Users reads real Supabase Auth users and cms_profiles.

VALIDATION
- TypeScript validation completed successfully with: npx tsc --noEmit
- The production build must be run after npm installs the platform-specific Next.js SWC package on the target computer.

DEPLOYMENT
After local approval, commit the project to the existing GitHub repository and deploy it through the existing Vercel project. Never commit .env.local.
