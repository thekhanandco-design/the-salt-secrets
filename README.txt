THE SALT ORIGIN — WEBSITE + ENTERPRISE B2B EXPORT CMS

LOCAL CHECK
1. Copy the current production .env.local into this project. Never commit it.
2. Run supabase/THE-SALT-ORIGIN-LIVE-CMS.sql once in the existing Supabase project.
3. Run npm install
4. Run npm run dev
5. Website: http://localhost:3000
6. CMS: http://localhost:3000/admin/login

THIS REVISION
- Public website routes and content architecture remain in place.
- Dashboard connection warning/subtitle removed; compact GEO and real follow-up intelligence added.
- Analytics redesigned with compact GA4, SEO and detailed GEO panels.
- Recent activity text wrapping fixed.
- Daily Blog, FAQ, Outreach and Social review-draft automation retained; nothing auto-publishes.
- Website Visual Editor same-origin preview restriction fixed.
- Website Text Manager font list expanded.
- Pages Manager now includes GEO completeness, recommendations and product-detail page records.
- Forms and the duplicate Export Document Center removed from CMS navigation/routes.
- Leads and Contacts include lifecycle controls, follow-up dates and source/platform tracking.
- Quotation document selector now adapts fields/preview for Quotation, Proforma Invoice and Commercial Invoice.
- Product Detail Pages now have a dedicated complete CMS editor for text, images, specifications, documents, CTAs and SEO.
- Public product pages were polished; the large inquiry form and OEM / Bulk / 100% strip were removed.
- Product Commercial Sheet now uses the existing page_content store, so Add Product Row works without the missing product_commercial_terms table.
- Blog Center includes a daily WSF-style publishing desk with two researched drafts, SEO/GEO fields and optional generated image.
- Social Media Studio opens today’s researched same-topic platform pack automatically and prepares one shared image with platform-specific copy.
- Social Profile Links manager adds real platform icons and URLs to the public footer.
- Email Reply Assistant added; it uses website/product/commercial data and refuses to invent missing terms.
- SEO AI audit now prepares metadata, social preview text and image guidance.
- Newsletter is a subscriber-record module, not a newsletter creation screen.

LIVE-DATA RULE
No business records, metrics, leads, contacts, tasks, quotations or shipments are seeded by this revision. Missing services show zero, empty state or Connection Required.

AUTOMATION / API REQUIREMENTS
- OpenAI research/content: OPENAI_API_KEY
- AI images: OPENAI_IMAGE_MODEL and OPENAI_IMAGE_AUTOGENERATE=true
- Live database/storage: Supabase variables
- GA4/Search Console: Google service-account variables
- Scheduled daily jobs: CRON_SECRET and the included vercel.json cron routes
- Real social publishing: each platform's access token and approved platform permissions

LATEST BLOG / SOCIAL / TASK REVIEW FIX
- Dashboard duplicate-list-key console warning fixed.
- Send to Review now opens a complete Blog editorial review with article, keywords, SEO/GEO scores and publishing controls.
- Old zero-score Blog records can be recalculated from their real content.
- New researched articles contain no source URLs, citation links or raw # headings on the public website.
- Social Media Studio uses actual platform logos and supports LinkedIn, Instagram, Facebook, Pinterest, Threads, X, TikTok, YouTube, Reddit, WhatsApp, Telegram, Discord, Snapchat, Mastodon and Bluesky.
- Team Tasks has ClickUp-style reminders and owner/list grouping. Existing databases should run supabase/2026-08-03-TASK-REMINDERS.sql.
