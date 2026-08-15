# The Salt Origin — Final Enterprise Website + CMS

Final Next.js + TypeScript source using the approved Salt Origin website and enterprise CMS design system.

## Final workflows included
- Team Tasks: team roster, assignee, priority, due date, reminder, status, labels and description.
- AI Content Studio: daily buyer-topic research, concise blog, SEO/GEO review, keyword review, square/default shared creative, platform-specific social copy and human approval.
- Blog Center: daily concise blog draft, review/edit, manual or AI image, draft/reject/publish workflow.
- FAQ Intelligence: live website FAQ edit/delete/hide/show/manual-add plus AI research suggestions.
- Visual Editor: show/hide, reorder, minimum height, top spacing and bottom spacing.
- Text Manager: page/section fields with mixed-heading segment editing and font, size, weight, italic, color, highlight, alignment, casing, letter spacing and line height.
- Images Manager: page/section filtering, current visual preview, upload/replace, AI generate, hide/show and reset.
- Pages registry, Certifications + buyer document requests, Export Document Builder, Email Reply Assistant, Product Commercial Sheet.
- Production & Shipments: metrics, order journey, live shipment records, tracking links and provider-ready full-screen map area without invented locations.
- Social Media Studio: same-topic daily campaign, per-platform character limits, previews, shared creative, approvals and publishing queue.
- Social Profile Links: individual save, show/hide, delete and add-platform controls; public links read from the same records.
- Campaigns & Content Calendar, Newsletter, Integrations, Access & Roles, Activity Logs, Help & Guide.
- Themed login/loading, administrator-approved password reset workflow and corrected light/dark contrast.

## Existing services and secrets
No secret values are included in this ZIP. The source reads the existing environment variables for Supabase, AI, analytics, email, WhatsApp, search, social and deployment services. Deploying to the same Vercel project keeps that project's stored environment variables.

## Production commands
```bash
npm ci
npm run build
npx vercel --prod
```

## Scheduled automation
`vercel.json` runs morning keyword research, blog drafting, FAQ research and social drafting, with the social publishing queue checked hourly. Today's social automation reuses today's researched blog topic when available so the blog and social campaign stay aligned.
