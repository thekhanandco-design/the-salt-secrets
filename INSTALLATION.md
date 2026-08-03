# The Salt Origin — Premium Analytics V2 Patch

## Replace these files

1. `src/app/admin/analytics/page.tsx`
2. `src/app/api/admin/analytics/route.ts`

Copy both files into the exact same paths in your current project and replace the existing files.

## After replacing

PowerShell:

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

Open:

`http://localhost:3000/admin/analytics`

## Required environment variables

The analytics API uses the existing GA4 service-account integration:

```env
GA4_PROPERTY_ID=your_property_id
GA4_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GA4_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

The service-account email must have Viewer access to the GA4 property.

## Authentic-data policy

All figures shown by this patch come from Google Analytics Data API reports. If GA4 is unavailable, the page shows a connection error. It does not generate sample numbers.

The geography map uses GA4 country rows. A marker appears only when GA4 returns that country and a map coordinate is available. The ranked country list always shows the actual returned data.

## Included analytics

- Active users, new users, sessions and page views
- Engagement rate, bounce rate and average session duration
- GA4 realtime users, pages, countries and devices
- Session trend chart
- Audience new-versus-returning chart
- Traffic source donut and source/medium data
- Country and city reporting
- Devices, browsers and operating systems
- Top pages and landing pages
- GA4 events and key events
- CSV export
- 7, 30 and 90-day filters

No SQL migration and no new npm package are required.
