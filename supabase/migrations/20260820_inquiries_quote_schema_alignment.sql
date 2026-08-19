-- THE SALT ORIGIN — Quote inquiry schema alignment
-- Safe / additive only. No rows are deleted or rewritten.

alter table if exists public.inquiries add column if not exists phone text;
alter table if exists public.inquiries add column if not exists whatsapp text;
alter table if exists public.inquiries add column if not exists quantity text;
alter table if exists public.inquiries add column if not exists estimated_volume text;
alter table if exists public.inquiries add column if not exists packaging_requirement text;
alter table if exists public.inquiries add column if not exists form_name text;
alter table if exists public.inquiries add column if not exists source_page text;
alter table if exists public.inquiries add column if not exists lead_source text default 'Website Inquiry';
alter table if exists public.inquiries add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table if exists public.inquiries add column if not exists updated_at timestamptz not null default now();
