-- The Salt Origin — MFA access recovery / least-privilege adjustment
-- 2026-08-17
-- Safe, non-destructive follow-up to 20260817_security_hardening.sql.
--
-- Rationale:
-- The first hardening migration required AAL2 for every CMS table and every
-- storage mutation. That can lock an approved owner out of the CMS when a TOTP
-- factor is lost or misconfigured. The security brief requires MFA support and
-- prefers AAL2 for sensitive access; it does not require AAL2 for every normal
-- CMS read/write. This migration keeps active-CMS RLS mandatory at AAL1 while
-- retaining AAL2 for Super Admin-only operations through is_super_admin().

begin;

-- General internal CMS policies created by the hardening migration.
do $$
declare p record;
begin
  for p in
    select tablename
    from pg_policies
    where schemaname = 'public' and policyname = 'approved aal2 cms access'
  loop
    execute format('drop policy if exists %I on public.%I', 'approved aal2 cms access', p.tablename);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_active_cms_user()) with check (public.is_active_cms_user())',
      'approved cms access', p.tablename
    );
  end loop;

  for p in
    select tablename
    from pg_policies
    where schemaname = 'public' and policyname = 'approved aal2 cms manage'
  loop
    execute format('drop policy if exists %I on public.%I', 'approved aal2 cms manage', p.tablename);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_active_cms_user()) with check (public.is_active_cms_user())',
      'approved cms manage', p.tablename
    );
  end loop;
end;
$$;

-- Approved CMS users can read role names and integration connection status at
-- AAL1. Role/integration mutations still use is_super_admin(), which includes AAL2.
do $$
begin
  if to_regclass('public.cms_roles') is not null then
    drop policy if exists "approved cms reads roles" on public.cms_roles;
    create policy "approved cms reads roles"
      on public.cms_roles for select to authenticated
      using (public.is_active_cms_user());
  end if;

  if to_regclass('public.integration_connections') is not null then
    drop policy if exists "approved cms reads integration status" on public.integration_connections;
    create policy "approved cms reads integration status"
      on public.integration_connections for select to authenticated
      using (public.is_active_cms_user());
  end if;
end;
$$;

-- Normal CMS media management must remain usable by an approved CMS account.
-- Private buckets remain private: this only changes authenticated RLS from
-- active+AAL2 to active CMS. Public/anon access is not added.
drop policy if exists "approved cms upload website media" on storage.objects;
drop policy if exists "approved cms update website media" on storage.objects;
drop policy if exists "approved cms delete website media" on storage.objects;
drop policy if exists "approved cms read private media" on storage.objects;
drop policy if exists "approved cms upload private media" on storage.objects;
drop policy if exists "approved cms update private media" on storage.objects;
drop policy if exists "approved cms delete private media" on storage.objects;

create policy "approved cms upload website media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('site-media','product-images','blog-images','cms-media','catalogs')
    and public.is_active_cms_user()
  );
create policy "approved cms update website media"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('site-media','product-images','blog-images','cms-media','catalogs')
    and public.is_active_cms_user()
  )
  with check (
    bucket_id in ('site-media','product-images','blog-images','cms-media','catalogs')
    and public.is_active_cms_user()
  );
create policy "approved cms delete website media"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('site-media','product-images','blog-images','cms-media','catalogs')
    and public.is_active_cms_user()
  );

create policy "approved cms read private media"
  on storage.objects for select to authenticated
  using (
    bucket_id in ('certificates','documents','cms-private')
    and public.is_active_cms_user()
  );
create policy "approved cms upload private media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('certificates','documents','cms-private')
    and public.is_active_cms_user()
  );
create policy "approved cms update private media"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('certificates','documents','cms-private')
    and public.is_active_cms_user()
  )
  with check (
    bucket_id in ('certificates','documents','cms-private')
    and public.is_active_cms_user()
  );
create policy "approved cms delete private media"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('certificates','documents','cms-private')
    and public.is_active_cms_user()
  );

commit;
