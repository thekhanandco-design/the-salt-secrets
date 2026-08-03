# The Salt Origin Enterprise CMS V8 Essentials

## Added
- OpenAI image-model diagnostics endpoint and clearer status inside Social Media Publishing.
- Automatic social topic fallback when the user leaves topic/keywords blank.
- Social post Review modal with generated image, copy, hashtags, platforms and approval.
- Functional Add Customer form with commercial details, addresses, payment terms and salesperson.
- Functional Add Shipment form with container, BL, vessel, courier/AWB, route, ETA and tracking URL.
- Clickable tracking links in the shipment registry.
- Notion-style Tasks & Reminders module and sidebar link.
- Supabase migration for customer fields, tasks, social topic/platform copy and rejected status.

## Fixed
- Improved quotation spacing, table readability, party sections, terms and totals on Khan & Co. A4 letterhead.
- Added safer image-model validation messaging. Image generation still requires an OpenAI project with image-model access and billing/verification where required.

## Install
1. Replace the project with this ZIP.
2. Run `supabase/ENTERPRISE-CMS-V8-ESSENTIALS.sql` once in Supabase SQL Editor.
3. Keep `OPENAI_API_KEY` server-side in `.env.local` / Vercel.
4. Optionally set `OPENAI_IMAGE_MODEL=gpt-image-1` or another image model available to your OpenAI project.
