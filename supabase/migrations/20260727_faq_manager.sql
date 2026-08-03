create table if not exists public.cms_faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text not null default 'General',
  status text not null default 'draft' check (status in ('draft','review','published')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.cms_faqs enable row level security;
drop policy if exists "Public can read published FAQs" on public.cms_faqs;
create policy "Public can read published FAQs" on public.cms_faqs for select using (status='published');
drop policy if exists "Authenticated users manage FAQs" on public.cms_faqs;
create policy "Authenticated users manage FAQs" on public.cms_faqs for all to authenticated using (true) with check (true);
create index if not exists cms_faqs_status_sort_idx on public.cms_faqs(status,sort_order);
