# The Salt Origin — Theme-Only Functional Release

This release starts from the previously working production project and changes the presentation layer without replacing the live business workflows.

## Preserved working systems
- Existing Next.js API route handlers
- Supabase data/auth/storage workflows
- OpenAI/Gemini content and image routes
- GA4/GTM/Clarity analytics hooks
- Search Console/Bing integrations
- Resend/email and WhatsApp workflows
- Blog generation/review/publish flows
- Social draft/approval/publishing workflows
- Leads, contacts, companies, quotations, commercial sheet, documents, production and shipments
- Newsletter, SEO/GEO, tasks, roles, audit/activity and integrations

## Theme/CMS changes
- Public website restyled to the approved Cormorant Garamond + Inter, white/blush, dark-pink/wine and charcoal design system.
- Header/navigation and homepage use the approved premium prototype presentation.
- Existing public pages keep their original data/forms/actions and receive the new visual theme.
- Website Text Manager keeps legacy editable fields and adds the new theme-specific homepage text segments, including the pink italic hero phrase.
- Images Manager keeps upload/replace and adds live AI image generation through the existing authenticated image API.
- Website Visual Editor now stores section visibility/order per page and applies it to the public site.
- Settings > Brand can optionally enable custom theme overrides for colors, heading/body fonts and desktop content width. Overrides are OFF by default so the approved prototype look remains exact until explicitly changed.

## Security/deployment
`.env.local`, build output and dependency folders are intentionally not included in the handoff ZIP. Deploy to the same Vercel project to keep its already-saved environment variables and API credentials.
