-- THE SALT ORIGIN ENTERPRISE CMS V8 ESSENTIALS
create extension if not exists pgcrypto;

alter table if exists public.customer_accounts add column if not exists billing_address text;
alter table if exists public.customer_accounts add column if not exists shipping_address text;
alter table if exists public.customer_accounts add column if not exists registration_number text;
alter table if exists public.customer_accounts add column if not exists preferred_currency text not null default 'USD';
alter table if exists public.customer_accounts add column if not exists incoterm text not null default 'FOB';
alter table if exists public.customer_accounts add column if not exists payment_terms text;
alter table if exists public.customer_accounts add column if not exists assigned_salesperson text;
alter table if exists public.customer_accounts add column if not exists notes text;

create table if not exists public.cms_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo','in_progress','done','cancelled')),
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  due_at timestamptz,
  assigned_to text,
  related_type text not null default 'general',
  related_id text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.cms_tasks enable row level security;
drop policy if exists "Authenticated users manage tasks" on public.cms_tasks;
create policy "Authenticated users manage tasks" on public.cms_tasks for all to authenticated using (true) with check (true);
create index if not exists cms_tasks_status_due_idx on public.cms_tasks(status,due_at);

alter table if exists public.social_scheduled_posts add column if not exists topic text not null default '';
alter table if exists public.social_scheduled_posts add column if not exists platform_copy jsonb not null default '{}'::jsonb;
alter table if exists public.social_scheduled_posts drop constraint if exists social_scheduled_posts_status_check;
alter table if exists public.social_scheduled_posts add constraint social_scheduled_posts_status_check check (status in ('draft','scheduled','processing','published','failed','connection_required','ready_for_adapter','rejected'));
