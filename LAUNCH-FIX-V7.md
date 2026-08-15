# The Salt Origin — Launch Sync Fix V7

## What this fixes

- Product page text and section registry are now the same source used by Website Text Manager and Website Visual Editor.
- Stale CMS text fields from older page designs are filtered out for current registered pages.
- Visual Editor uses the actual live section map and supports Add Section with Editorial, Image + Text, and CTA templates.
- Added sections appear on the public page and are available in Text Manager; image sections also appear in Images Manager.
- Sections support show/hide, reorder, minimum height, top spacing, and bottom spacing.
- AI Content Studio no longer holds the whole screen on one long research chain: blog research completes first, then social versions are generated with client/server timeouts.
- Facebook and Instagram integration status recognizes the existing Meta connection and META_ACCESS_TOKEN as well as platform-specific tokens.
- Facebook/Instagram social queue readiness also recognizes META_ACCESS_TOKEN.

## Launch verification

This package intentionally excludes `.env.local`, `.next`, and `node_modules`.
Use the same Vercel project/environment variables already configured for the live project.

Run locally before deployment:

```powershell
npm install
npm run build
```

The source passed TS/TSX syntax checks and internal import checks in the preparation environment. A full Next.js build could not run there because the available dependency folder did not contain the `next` binary.
