-- The Salt Origin - manual, cost-controlled content pipeline
-- Safe to run more than once.

create extension if not exists pgcrypto;

create table if not exists public.content_topic_queue (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  primary_keyword text,
  secondary_keywords text[] not null default '{}',
  target_market text not null default 'Global',
  buyer_type text not null default 'Importers, distributors and private-label buyers',
  notes text,
  cta text not null default 'Request a quotation',
  status text not null default 'idea',
  draft_package jsonb not null default '{}'::jsonb,
  campaign_id uuid references public.marketing_campaigns(id) on delete set null,
  blog_post_id bigint references public.blog_posts(id) on delete set null,
  social_post_id uuid references public.social_scheduled_posts(id) on delete set null,
  scheduled_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.content_topic_queue enable row level security;
drop policy if exists "Authenticated users manage content topic queue" on public.content_topic_queue;
create policy "Authenticated users manage content topic queue"
on public.content_topic_queue for all to authenticated using (true) with check (true);

create index if not exists content_topic_queue_status_idx on public.content_topic_queue(status, scheduled_at, created_at desc);

alter table public.blog_posts add column if not exists campaign_id uuid references public.marketing_campaigns(id) on delete set null;
alter table public.blog_posts add column if not exists source_topic_id uuid references public.content_topic_queue(id) on delete set null;
alter table public.blog_posts add column if not exists scheduled_at timestamptz;
alter table public.blog_posts add column if not exists approval_status text not null default 'Draft';

alter table public.social_scheduled_posts add column if not exists source_topic_id uuid references public.content_topic_queue(id) on delete set null;
alter table public.social_scheduled_posts add column if not exists campaign_id uuid references public.marketing_campaigns(id) on delete set null;
alter table public.social_scheduled_posts add column if not exists approval_status text not null default 'Draft';
alter table public.social_scheduled_posts add column if not exists platform_content jsonb not null default '{}'::jsonb;
alter table public.social_scheduled_posts add column if not exists platform_images jsonb not null default '{}'::jsonb;
alter table public.social_scheduled_posts add column if not exists brief jsonb not null default '{}'::jsonb;
alter table public.social_scheduled_posts add column if not exists last_error text;

alter table public.social_scheduled_posts alter column scheduled_at drop not null;
