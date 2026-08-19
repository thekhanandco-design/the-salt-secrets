# Supabase Security Notice

`supabase/migrations/20260817_security_hardening.sql` is the authoritative final security migration for the current The Salt Origin codebase and must run after the older migrations.

Several root-level SQL files and historical migrations document earlier CMS installation phases. Some of those historical scripts contain permissive policies that were appropriate to prototypes but are **not approved for production security**. They are retained as historical/setup artifacts and must not be re-run against an already hardened production database.

For production:

1. Back up the database.
2. Apply the ordered migration set through `20260817_security_hardening.sql`.
3. Do not subsequently run older bootstrap/enterprise/CMS SQL files manually.
4. Verify the final RLS and storage policies using `SECURITY-DEPLOYMENT-CHECKLIST.md`.

The final hardening migration drops/replaces legacy project policies for the protected tables and storage buckets, changes new CMS users to pending/disabled, and applies active-user/AAL2/super-admin authorization controls.
