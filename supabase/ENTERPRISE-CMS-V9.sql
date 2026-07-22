-- THE SALT ORIGIN ENTERPRISE CMS V9
-- Run in Supabase SQL Editor after taking a backup.

create extension if not exists pgcrypto;

create table if not exists public.social_scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  caption text not null default '',
  hashtags text not null default '',
  keywords text not null default '',
  image_url text not null default '',
  platforms jsonb not null default '[]'::jsonb,
  scheduled_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('draft','scheduled','processing','published','failed','connection_required','ready_for_adapter')),
  platform_results jsonb not null default '{}'::jsonb,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.social_scheduled_posts enable row level security;
drop policy if exists "Authenticated users manage social schedule" on public.social_scheduled_posts;
create policy "Authenticated users manage social schedule" on public.social_scheduled_posts for all to authenticated using (true) with check (true);

create index if not exists social_scheduled_posts_due_idx on public.social_scheduled_posts(status, scheduled_at);

alter table public.blog_automation_settings add column if not exists default_language text not null default 'en';
alter table public.blog_automation_settings add column if not exists topic_focus text not null default 'Himalayan pink salt sourcing, private label packaging, retail trends, food industry applications and export guidance';
alter table public.blog_automation_settings add column if not exists updated_at timestamptz not null default now();

insert into public.blog_automation_settings(enabled,frequency,approval_required,default_language,topic_focus)
select true,'daily',true,'en','Himalayan pink salt sourcing, private label packaging, retail trends, food industry applications and export guidance'
where not exists(select 1 from public.blog_automation_settings);
