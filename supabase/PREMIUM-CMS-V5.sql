-- THE SALT ORIGIN PREMIUM CMS V5
-- Run after CMS-REDESIGN-V3.sql / COMPLETE-CMS-SETUP.sql

create extension if not exists pgcrypto;

alter table if exists public.cms_text_entries
  add column if not exists style_json jsonb not null default '{"fontFamily":"inherit","fontSize":"","fontWeight":"","textTransform":"none","fontStyle":"normal","textDecoration":"none","textAlign":"left","letterSpacing":"","lineHeight":""}'::jsonb;

alter table if exists public.site_settings
  add column if not exists favicon_url text default '/favicon.ico',
  add column if not exists app_icon_url text default '/web-app-manifest-192x192.png',
  add column if not exists notification_email text,
  add column if not exists pwa_enabled boolean default true;

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text unique not null,
  label text not null,
  url text,
  icon_key text,
  enabled boolean default false,
  display_order int default 0,
  updated_at timestamptz default now()
);

create table if not exists public.cms_roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.cms_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role_name text default 'super_admin',
  enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.content_versions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  action text not null default 'update',
  snapshot jsonb not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.backup_snapshots (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  snapshot jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.cms_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'info',
  title text not null,
  message text,
  link text,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.ai_assistant_history (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  response text,
  task_type text default 'general',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

insert into public.social_links(platform,label,url,icon_key,enabled,display_order) values
('whatsapp','WhatsApp','https://wa.me/92331281289','whatsapp',true,1),
('instagram','Instagram','','instagram',false,2),
('facebook','Facebook','','facebook',false,3),
('tiktok','TikTok','','tiktok',false,4),
('youtube','YouTube','','youtube',false,5),
('linkedin','LinkedIn','','linkedin',false,6),
('x','X / Twitter','','x',false,7),
('pinterest','Pinterest','','pinterest',false,8)
on conflict(platform) do nothing;

insert into public.cms_roles(name,description,permissions) values
('super_admin','Full control of the CMS','{"all":true}'::jsonb),
('admin','Manage content, products, blogs and leads','{"content":true,"products":true,"blogs":true,"inquiries":true}'::jsonb),
('editor','Edit and publish website content','{"content":true,"products":true,"blogs":true}'::jsonb),
('content_writer','Create and edit blog drafts','{"blogs":true}'::jsonb),
('sales_manager','Manage inquiries and lead status','{"inquiries":true}'::jsonb)
on conflict(name) do nothing;

-- Keep dashboard notifications in sync with new inquiries.
create or replace function public.notify_new_inquiry()
returns trigger language plpgsql security definer as $$
begin
  insert into public.cms_notifications(type,title,message,link)
  values('inquiry','New website inquiry',coalesce(new.name,'A visitor') || ' submitted an inquiry','/admin/inquiries');
  return new;
end;
$$;

drop trigger if exists trg_notify_new_inquiry on public.inquiries;
create trigger trg_notify_new_inquiry
after insert on public.inquiries
for each row execute function public.notify_new_inquiry();

-- RLS
alter table public.social_links enable row level security;
alter table public.cms_roles enable row level security;
alter table public.cms_profiles enable row level security;
alter table public.content_versions enable row level security;
alter table public.backup_snapshots enable row level security;
alter table public.cms_notifications enable row level security;
alter table public.ai_assistant_history enable row level security;

do $$
declare t text;
begin
  foreach t in array array['social_links','cms_roles','content_versions','backup_snapshots','cms_notifications','ai_assistant_history']
  loop
    execute format('drop policy if exists "public read %s" on public.%I',t,t);
    execute format('create policy "public read %s" on public.%I for select using (true)',t,t);
    execute format('drop policy if exists "authenticated manage %s" on public.%I',t,t);
    execute format('create policy "authenticated manage %s" on public.%I for all to authenticated using (true) with check (true)',t,t);
  end loop;
end $$;

drop policy if exists "profiles read own" on public.cms_profiles;
create policy "profiles read own" on public.cms_profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "profiles update own" on public.cms_profiles;
create policy "profiles update own" on public.cms_profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Generic version capture helpers for text and image records.
create or replace function public.capture_cms_version()
returns trigger language plpgsql security definer as $$
begin
  insert into public.content_versions(entity_type,entity_id,action,snapshot,changed_by)
  values(TG_TABLE_NAME,coalesce((to_jsonb(new)->>'id'),(to_jsonb(old)->>'id'),'unknown'),TG_OP,coalesce(to_jsonb(new),to_jsonb(old)),auth.uid());
  return coalesce(new,old);
end;
$$;

drop trigger if exists trg_text_versions on public.cms_text_translations;
create trigger trg_text_versions after insert or update or delete on public.cms_text_translations for each row execute function public.capture_cms_version();
drop trigger if exists trg_image_versions on public.cms_image_slots;
create trigger trg_image_versions after insert or update or delete on public.cms_image_slots for each row execute function public.capture_cms_version();
drop trigger if exists trg_product_versions on public.products;
create trigger trg_product_versions after insert or update or delete on public.products for each row execute function public.capture_cms_version();
