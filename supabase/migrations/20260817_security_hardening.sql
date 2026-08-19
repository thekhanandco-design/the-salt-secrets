-- The Salt Origin — pre-deployment security hardening
-- 2026-08-17
-- Safe, non-destructive migration: no production content/data is deleted or reset.
-- Existing approved CMS users remain unchanged. New Auth users become pending/disabled.

begin;

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1) SAFE CMS USER DEFAULTS / NO AUTOMATIC SUPER ADMIN
-- -----------------------------------------------------------------------------

insert into public.cms_roles(name, description, permissions)
values ('pending', 'Pending CMS access approval', '{}'::jsonb)
on conflict (name) do nothing;

alter table if exists public.cms_profiles alter column role_name set default 'pending';
alter table if exists public.cms_profiles alter column enabled set default false;

-- Older CMS revisions used `enabled`; newer ones also introduced `is_active`.
-- Keep both compatibility flags available so the hardened read policy is safe
-- regardless of which historical schema was applied first.
alter table if exists public.cms_languages add column if not exists enabled boolean not null default true;
alter table if exists public.cms_languages add column if not exists is_active boolean not null default true;

create or replace function public.handle_new_cms_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.cms_profiles(id, full_name, role_name, enabled)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      split_part(coalesce(new.email, ''), '@', 1),
      'Pending user'
    ),
    'pending',
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Do not alter existing legitimate CMS profiles. Only create safe profiles for
-- Auth users that currently have no CMS profile at all.
insert into public.cms_profiles(id, full_name, role_name, enabled)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data->>'full_name', ''),
    nullif(u.raw_user_meta_data->>'name', ''),
    split_part(coalesce(u.email, ''), '@', 1),
    'Pending user'
  ),
  'pending',
  false
from auth.users u
where not exists (select 1 from public.cms_profiles p where p.id = u.id)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 2) AUTHORIZATION HELPERS
-- -----------------------------------------------------------------------------

create or replace function public.has_aal2()
returns boolean
language sql
stable
as $$
  select coalesce((select auth.jwt()->>'aal'), 'aal1') = 'aal2';
$$;

create or replace function public.is_active_cms_user()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.cms_profiles p
    where p.id = (select auth.uid())
      and p.enabled is true
      and lower(coalesce(p.role_name, '')) not in ('', 'pending', 'disabled')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.has_aal2() and exists (
    select 1
    from public.cms_profiles p
    where p.id = (select auth.uid())
      and p.enabled is true
      and lower(coalesce(p.role_name, '')) = 'super_admin'
  );
$$;

revoke all on function public.has_aal2() from public, anon;
revoke all on function public.is_active_cms_user() from public, anon;
revoke all on function public.is_super_admin() from public, anon;
grant execute on function public.has_aal2() to authenticated;
grant execute on function public.is_active_cms_user() to authenticated;
grant execute on function public.is_super_admin() to authenticated;

-- -----------------------------------------------------------------------------
-- Helpers used below to replace legacy permissive policies consistently.
-- -----------------------------------------------------------------------------

create or replace function pg_temp.drop_table_policies(target_table text)
returns void
language plpgsql
as $$
declare p record;
begin
  if to_regclass(format('public.%I', target_table)) is null then return; end if;
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = target_table
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, target_table);
  end loop;
end;
$$;

create or replace function pg_temp.lock_internal_table(target_table text)
returns void
language plpgsql
as $$
begin
  if to_regclass(format('public.%I', target_table)) is null then return; end if;
  perform pg_temp.drop_table_policies(target_table);
  execute format('alter table public.%I enable row level security', target_table);
  execute format('revoke all on table public.%I from anon', target_table);
  execute format('grant select, insert, update, delete on table public.%I to authenticated', target_table);
  execute format(
    'create policy %I on public.%I for all to authenticated using (public.is_active_cms_user() and public.has_aal2()) with check (public.is_active_cms_user() and public.has_aal2())',
    'approved aal2 cms access', target_table
  );
end;
$$;

create or replace function pg_temp.public_content_table(target_table text, public_using text)
returns void
language plpgsql
as $$
begin
  if to_regclass(format('public.%I', target_table)) is null then return; end if;
  perform pg_temp.drop_table_policies(target_table);
  execute format('alter table public.%I enable row level security', target_table);
  execute format('revoke all on table public.%I from anon', target_table);
  execute format('grant select on table public.%I to anon', target_table);
  execute format('grant select, insert, update, delete on table public.%I to authenticated', target_table);
  execute format('create policy %I on public.%I for select to anon, authenticated using (%s)', 'public website read', target_table, public_using);
  execute format(
    'create policy %I on public.%I for all to authenticated using (public.is_active_cms_user() and public.has_aal2()) with check (public.is_active_cms_user() and public.has_aal2())',
    'approved aal2 cms manage', target_table
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 3) SPECIAL RBAC TABLES
-- -----------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.cms_profiles') is not null then
    perform pg_temp.drop_table_policies('cms_profiles');
    alter table public.cms_profiles enable row level security;
    revoke all on table public.cms_profiles from anon;
    grant select, insert, update, delete on table public.cms_profiles to authenticated;

    -- Own profile is readable at AAL1 so a newly signed-in account can determine
    -- whether it is approved and can complete the mandatory MFA flow.
    create policy "cms profile read own"
      on public.cms_profiles for select to authenticated
      using ((select auth.uid()) = id);

    create policy "super admin manages cms profiles"
      on public.cms_profiles for all to authenticated
      using (public.is_super_admin())
      with check (public.is_super_admin());
  end if;

  if to_regclass('public.cms_roles') is not null then
    perform pg_temp.drop_table_policies('cms_roles');
    alter table public.cms_roles enable row level security;
    revoke all on table public.cms_roles from anon;
    grant select, insert, update, delete on table public.cms_roles to authenticated;
    create policy "approved cms reads roles"
      on public.cms_roles for select to authenticated
      using (public.is_active_cms_user() and public.has_aal2());
    create policy "super admin manages roles"
      on public.cms_roles for all to authenticated
      using (public.is_super_admin())
      with check (public.is_super_admin());
  end if;

  if to_regclass('public.integration_oauth_tokens') is not null then
    perform pg_temp.drop_table_policies('integration_oauth_tokens');
    alter table public.integration_oauth_tokens enable row level security;
    revoke all on table public.integration_oauth_tokens from anon, authenticated;
  end if;

  if to_regclass('public.integration_connections') is not null then
    perform pg_temp.drop_table_policies('integration_connections');
    alter table public.integration_connections enable row level security;
    revoke all on table public.integration_connections from anon;
    grant select, insert, update, delete on table public.integration_connections to authenticated;
    create policy "approved cms reads integration status"
      on public.integration_connections for select to authenticated
      using (public.is_active_cms_user() and public.has_aal2());
    create policy "super admin manages integrations"
      on public.integration_connections for all to authenticated
      using (public.is_super_admin())
      with check (public.is_super_admin());
  end if;

  if to_regclass('public.backup_snapshots') is not null then
    perform pg_temp.drop_table_policies('backup_snapshots');
    alter table public.backup_snapshots enable row level security;
    revoke all on table public.backup_snapshots from anon;
    grant select, insert, update, delete on table public.backup_snapshots to authenticated;
    create policy "super admin manages backups"
      on public.backup_snapshots for all to authenticated
      using (public.is_super_admin())
      with check (public.is_super_admin());
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 4) GENUINELY PUBLIC WEBSITE CONTENT
-- -----------------------------------------------------------------------------

select pg_temp.public_content_table('products', 'lower(coalesce(status, '''')) in (''active'',''published'',''live'',''enabled'')');
select pg_temp.public_content_table('categories', 'lower(coalesce(status, '''')) in (''active'',''published'',''live'',''enabled'')');
select pg_temp.public_content_table('blog_posts', 'lower(coalesce(status, '''')) = ''published'' and (published_at is null or published_at <= now())');
select pg_temp.public_content_table('cms_faqs', 'lower(coalesce(status, '''')) = ''published''');
select pg_temp.public_content_table('social_links', 'enabled is true');
select pg_temp.public_content_table('cms_image_slots', 'is_active is true');
select pg_temp.public_content_table('cms_languages', 'enabled is true and is_active is true');
select pg_temp.public_content_table('cms_text_entries', 'true');
select pg_temp.public_content_table('cms_text_translations', 'true');
select pg_temp.public_content_table('homepage', 'true');
select pg_temp.public_content_table('page_content', 'true');
select pg_temp.public_content_table('seo_settings', 'true');
select pg_temp.public_content_table('blog_categories', 'true');
select pg_temp.public_content_table('product_images', 'true');
select pg_temp.public_content_table('product_translations', 'true');
select pg_temp.public_content_table('cms_menus', 'true');
select pg_temp.public_content_table('cms_menu_items', 'is_active is true');

-- site_settings contains an internal notification email, so the table itself is
-- not exposed to anon. A limited view below exposes only fields required by the site.
select pg_temp.lock_internal_table('site_settings');

create or replace view public.public_site_settings
with (security_barrier = true)
as
select
  id,
  created_at,
  updated_at,
  site_name,
  contact_email,
  whatsapp_number,
  address,
  footer_text,
  favicon_url,
  app_icon_url,
  pwa_enabled,
  brand_json,
  config_json
from public.site_settings;

revoke all on table public.public_site_settings from public;
grant select on table public.public_site_settings to anon, authenticated;

-- Certification files must never be discoverable just because a public card is
-- visible. Public callers receive only non-sensitive metadata through this view.
select pg_temp.lock_internal_table('certifications');

create or replace view public.public_certifications
with (security_barrier = true)
as
select id, document_name, category, issuing_authority, status, visibility, issue_date, expiry_date, created_at, updated_at
from public.certifications
where lower(coalesce(visibility, 'private')) = 'public'
  and lower(coalesce(status, 'draft')) not in ('draft','hidden','archived','rejected');

revoke all on table public.public_certifications from public;
grant select on table public.public_certifications to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5) ALL INTERNAL / SENSITIVE CMS TABLES
-- -----------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'ai_agents','ai_assistant_history','approval_items','audit_logs',
    'automation_runs','automation_workflows','b2b_activities','b2b_companies',
    'b2b_contacts','b2b_followups','business_documents','content_drafts',
    'content_versions','content_topic_queue','conversion_events','coupons','customer_accounts',
    'customer_shipments','document_letterheads','email_reply_drafts',
    'faq_research_questions','form_submissions','geo_audits','inquiries',
    'keyword_research_runs','landing_pages','lead_magnets','marketing_campaigns',
    'media_library','newsletter_subscribers','outreach_opportunities',
    'page_versions','product_commercial_terms','sample_requests','saved_reports',
    'social_scheduled_posts','system_checks','team_tasks','website_assets',
    'website_editor_drafts','website_forms','cms_files','cms_notifications',
    'cms_tasks','blog_automation_settings','password_reset_requests','competitor_profiles','activity_logs'
  ]
  loop
    perform pg_temp.lock_internal_table(t);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- 6) STORAGE HARDENING
-- -----------------------------------------------------------------------------

-- Keep public web image buckets public; certificates/documents are private.
insert into storage.buckets(id, name, public)
values ('cms-private', 'cms-private', false)
on conflict (id) do update set public = false;

update storage.buckets
set public = false
where id in ('certificates', 'documents', 'cms-private');

-- Remove known legacy project policies first. A second targeted pass below
-- removes any differently-named policy that references one of this project's
-- buckets, preventing an old public certificate/document policy from surviving.
do $$
declare policy_name text;
begin
  foreach policy_name in array array[
    'Public read CMS media','Authenticated upload CMS media','Authenticated update CMS media','Authenticated delete CMS media',
    'Public read site media','Authenticated upload site media','Authenticated update site media','Authenticated delete site media',
    'public read site media','authenticated upload cms files','authenticated update cms files','authenticated delete cms files',
    'Public read cms-media','Authenticated upload cms-media','Authenticated update cms-media','Authenticated delete cms-media',
    'Public read site-media','Authenticated upload site-media','Authenticated update site-media','Authenticated delete site-media',
    'Public read product-images','Authenticated upload product-images','Authenticated update product-images','Authenticated delete product-images',
    'Public read blog-images','Authenticated upload blog-images','Authenticated update blog-images','Authenticated delete blog-images',
    'Public read certificates','Authenticated upload certificates','Authenticated update certificates','Authenticated delete certificates',
    'Public read catalogs','Authenticated upload catalogs','Authenticated update catalogs','Authenticated delete catalogs',
    'Public read documents','Authenticated upload documents','Authenticated update documents','Authenticated delete documents',
    'public read website media','approved cms upload website media','approved cms update website media','approved cms delete website media',
    'approved cms read private media','approved cms upload private media','approved cms update private media','approved cms delete private media'
  ]
  loop
    execute format('drop policy if exists %I on storage.objects', policy_name);
  end loop;
end;
$$;

-- Policy names changed across earlier CMS versions. Drop any remaining storage
-- policy whose expression references a TSO-owned bucket, regardless of its name.
do $$
declare p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (
        coalesce(qual, '') ~ '(site-media|product-images|blog-images|cms-media|catalogs|certificates|documents|cms-private)'
        or coalesce(with_check, '') ~ '(site-media|product-images|blog-images|cms-media|catalogs|certificates|documents|cms-private)'
      )
  loop
    execute format('drop policy if exists %I on storage.objects', p.policyname);
  end loop;
end;
$$;

-- Public images/assets intentionally used by the live website.
create policy "public read website media"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id in ('site-media','product-images','blog-images','catalogs')
    or (bucket_id = 'cms-media' and name not like 'certifications/%' and name not like 'documents/%')
  );

-- Only approved AAL2 CMS users can mutate public website assets directly.
create policy "approved cms upload website media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('site-media','product-images','blog-images','cms-media','catalogs')
    and public.is_active_cms_user() and public.has_aal2()
  );
create policy "approved cms update website media"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('site-media','product-images','blog-images','cms-media','catalogs')
    and public.is_active_cms_user() and public.has_aal2()
  )
  with check (
    bucket_id in ('site-media','product-images','blog-images','cms-media','catalogs')
    and public.is_active_cms_user() and public.has_aal2()
  );
create policy "approved cms delete website media"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('site-media','product-images','blog-images','cms-media','catalogs')
    and public.is_active_cms_user() and public.has_aal2()
  );

-- Private documents/certifications: no anon policy exists.
create policy "approved cms read private media"
  on storage.objects for select to authenticated
  using (
    bucket_id in ('certificates','documents','cms-private')
    and public.is_active_cms_user() and public.has_aal2()
  );
create policy "approved cms upload private media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('certificates','documents','cms-private')
    and public.is_active_cms_user() and public.has_aal2()
  );
create policy "approved cms update private media"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('certificates','documents','cms-private')
    and public.is_active_cms_user() and public.has_aal2()
  )
  with check (
    bucket_id in ('certificates','documents','cms-private')
    and public.is_active_cms_user() and public.has_aal2()
  );
create policy "approved cms delete private media"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('certificates','documents','cms-private')
    and public.is_active_cms_user() and public.has_aal2()
  );

commit;
