THE SALT ORIGIN - META OAUTH CONNECTION PATCH
==============================================

Purpose
-------
Adds the real Meta Business OAuth connection flow for Facebook Page + linked Instagram Professional account.
It does not yet publish posts. Live publishing is the next phase after the connection test succeeds.

What changes
------------
- Adds /api/admin/meta/oauth/start
- Adds /api/admin/meta/oauth/callback
- Adds signed OAuth state validation
- Encrypts the returned Meta access token before Supabase storage
- Stores the authorized Facebook Page and linked Instagram account in the existing integration registry
- Makes Facebook and Instagram cards use Connect / Reconnect instead of the old token-presence-only Test behavior
- Keeps YouTube and all unrelated integrations unchanged

Required server environment variables
-------------------------------------
META_APP_ID
META_APP_SECRET
META_REDIRECT_URI=https://www.thesaltorigin.com/api/admin/meta/oauth/callback
META_LOGIN_CONFIG_ID
INTEGRATION_TOKEN_ENCRYPTION_KEY   (minimum 32 characters)

Optional
--------
META_GRAPH_VERSION=v25.0
If META_GRAPH_VERSION is omitted, the patch currently defaults to v25.0.

Do not paste secrets into source files or commit .env.local.

Database
--------
Run this migration in the same Supabase project used by production:
  supabase/migrations/20260808_meta_oauth_connection.sql

The migration is idempotent and preserves an existing Meta connection row.

After applying the patch
------------------------
1. Run npm install and npm run build on your own machine.
2. Open /admin/integrations.
3. Under Social Media, click Connect on Facebook or Instagram.
4. Complete the Meta Business login and select the intended The Salt Origin Facebook Page / Instagram asset.
5. You should return to /admin/integrations with the connection status updated.

Safety behavior
---------------
If Meta returns multiple ambiguous Facebook Pages, the callback refuses to guess which Page to publish to and asks you to reconnect with only the intended Page selected.
If Facebook is authorized but Meta returns no linked Instagram Professional account, Facebook is stored as connected and Instagram remains Connection Required.
