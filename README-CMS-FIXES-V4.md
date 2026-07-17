# The Salt Origin CMS Fixes V4

## What was fixed

1. Inquiry detail popup now has:
   - fixed header and footer
   - visible close (X) button
   - internal vertical scrolling
   - separately scrollable long message
   - backdrop click to close
   - mobile-safe height (`92vh`)

2. Admin CMS is now visually separate from the public website:
   - public Navbar, Footer and WhatsApp button are hidden on all `/admin/*` routes
   - CMS keeps its own sidebar/header only

3. CMS dark/light mode contrast was corrected:
   - dark text is converted to readable light text in dark mode
   - cards, tables, inputs, selects and borders receive correct theme colors
   - CMS scrollbars are visible

4. Public dark mode was improved:
   - hero gradients no longer wash out the text
   - dark cards, borders, paragraphs and headings have stronger contrast

5. Language behavior was corrected:
   - selecting Arabic/Urdu no longer reverses the complete website layout
   - translated content loads from Supabase while the original layout remains stable
   - Text Manager includes `Save + Translate All`
   - Text Manager includes `Translate Whole Page`

6. Homepage CMS coverage was expanded:
   - Private Label bullets, button, card headings and card descriptions
   - PET Bottles, PET Jars, Grinder and Pouch card titles/descriptions/button
   - all six Why Choose Us titles and descriptions
   - quality description
   - export labels and values

7. Homepage image key mismatch was fixed:
   - Custom Bottles and Custom Packaging image changes now load correctly from the CMS

8. WhatsApp inquiry notifications were expanded:
   - existing webhook support remains
   - direct WhatsApp Cloud API notification support added

## Files changed

- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/admin/inquiries/page.tsx`
- `src/app/admin/text/page.tsx`
- `src/app/api/admin/translate/route.ts`
- `src/components/SiteChrome.tsx`
- `src/components/admin/AdminShell.tsx`
- `src/components/Navbar.tsx`
- `src/components/HomepageClone.tsx`
- `src/lib/cms-registry.ts`
- `src/lib/notifications.ts`

## Setup

Copy your existing `.env.local` into the project root.

For AI translation add:

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_TRANSLATION_MODEL=gpt-5-mini
```

For WhatsApp Cloud API notifications add:

```env
WHATSAPP_CLOUD_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_CLOUD_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_NOTIFICATION_TO=923xxxxxxxxx
WHATSAPP_GRAPH_VERSION=v23.0
```

`WHATSAPP_NOTIFICATION_TO` must be written in international format without `+`.

You may alternatively keep using:

```env
WHATSAPP_WEBHOOK_URL=https://your-webhook-url
```

## After replacing the project

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000/admin/text`
- click **Sync Current Website** once
- edit English text
- use **Save + Translate All** or **Translate Whole Page**

The project was validated with `npm run build` successfully.
