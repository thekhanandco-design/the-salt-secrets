# The Salt Origin — V6.5 final typography / AI content fix

## Typography source of truth
The public website is locked to the same typography used by the uploaded `prototype2/index.html`:

- **Cormorant Garamond** — all editorial/display headings.
  - normal: 500 / 600 / 700
  - accent phrase: italic 500 / 600 in deep rose
- **Inter** — body copy, navigation, buttons, labels, forms and metadata.
  - 400 / 500 / 600 / 700 / 800

See `FONT-GUIDE.md` for exact color and gradient values.

## Public website cleanup
- No Turnstile development-bypass/helper message is rendered to visitors.
- Public legal empty states contain customer-facing wording only.
- Header, footer, About, Contact, FAQ, Blog and CTA typography are normalized to the prototype scale.
- CMS Text Manager inline styles still override the default typography when deliberately saved.

## AI Content Studio
- Existing content loads immediately; missing daily content is researched/generated in the background.
- Daily order is **researched blog first**, then platform-specific social drafts from the same topic/keyword.
- Browser and OpenAI calls have bounded timeouts so the UI cannot remain on an endless search spinner.
- Social image generation is non-blocking: if the image provider is slow/unavailable, the researched drafts still appear and the image can be generated/uploaded during review.
- Manual content-package generation uses the same researched-blog-first workflow.
- POST access to the daily blog generation route requires an authenticated admin session; cron GET remains protected by `CRON_SECRET` when configured.

## Hidden-ready product architecture
The current public `/products` page remains the visible catalog. Future category hierarchy is already available but not linked in the public navigation:

- `/products/categories`
- `/products/categories/[slug]`
- existing `/products/[slug]` detail pages

Both category routes are `noindex` until you choose to expose them.
