-- THE SALT ORIGIN ENTERPRISE CMS V12
-- Run once in Supabase SQL Editor. Safe to re-run.
create extension if not exists pgcrypto;

create table if not exists public.keyword_research_runs (
  id uuid primary key default gen_random_uuid(),
  research_date date not null default current_date,
  market text not null default 'global',
  primary_keywords jsonb not null default '[]'::jsonb,
  secondary_keywords jsonb not null default '[]'::jsonb,
  questions jsonb not null default '[]'::jsonb,
  competitor_topics jsonb not null default '[]'::jsonb,
  content_opportunities jsonb not null default '[]'::jsonb,
  source_summary text,
  status text not null default 'ready',
  created_at timestamptz not null default now(),
  unique(research_date, market)
);

create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  campaign_type text not null default 'email',
  subject text,
  content text,
  audience_filter jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  company text,
  country text,
  status text not null default 'subscribed',
  source text default 'website',
  created_at timestamptz not null default now()
);

create table if not exists public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  headline text,
  content jsonb not null default '{}'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  variant_group text,
  variant_name text,
  views bigint not null default 0,
  conversions bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  description text,
  discount_type text not null default 'percentage',
  discount_value numeric not null default 0,
  minimum_order numeric not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit integer,
  usage_count integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.lead_magnets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  file_url text,
  form_fields jsonb not null default '["name","email","company"]'::jsonb,
  downloads bigint not null default 0,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.customer_accounts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  company_name text not null,
  contact_name text,
  email text unique not null,
  phone text,
  country text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.customer_shipments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customer_accounts(id) on delete cascade,
  reference_number text unique not null,
  shipment_type text not null default 'container',
  carrier_type text not null default 'custom',
  carrier_name text,
  tracking_number text,
  bl_number text,
  container_number text,
  vessel_name text,
  voyage_number text,
  origin text,
  destination text,
  etd timestamptz,
  eta timestamptz,
  current_status text not null default 'booked',
  tracking_url text,
  milestones jsonb not null default '[]'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_files (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  folder text not null default '/',
  storage_bucket text not null default 'cms-media',
  storage_path text not null,
  public_url text,
  mime_type text,
  size_bytes bigint not null default 0,
  tags text[] not null default '{}',
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  entity_type text,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.conversion_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  page_path text,
  source text,
  medium text,
  campaign text,
  country text,
  session_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.system_checks (
  id uuid primary key default gen_random_uuid(),
  check_type text not null,
  status text not null,
  latency_ms integer,
  details jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default now()
);

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  provider text unique not null,
  label text not null,
  category text not null,
  status text not null default 'not_connected',
  config_hint jsonb not null default '{}'::jsonb,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.integration_connections(provider,label,category,config_hint) values
('meta','Meta / Facebook / Instagram','social','{"required":["META_APP_ID","META_APP_SECRET","META_ACCESS_TOKEN"]}'),
('linkedin','LinkedIn','social','{"required":["LINKEDIN_CLIENT_ID","LINKEDIN_CLIENT_SECRET"]}'),
('google_business','Google Business Profile','social','{"required":["GOOGLE_BUSINESS_ACCOUNT_ID"]}'),
('youtube','YouTube','social','{"required":["YOUTUBE_CHANNEL_ID"]}'),
('whatsapp','WhatsApp Business Platform','messaging','{"required":["WHATSAPP_PHONE_NUMBER_ID","WHATSAPP_ACCESS_TOKEN"]}'),
('dhl','DHL Express','tracking','{"required":["DHL_API_KEY"]}'),
('fedex','FedEx','tracking','{"required":["FEDEX_CLIENT_ID","FEDEX_CLIENT_SECRET"]}'),
('ups','UPS','tracking','{"required":["UPS_CLIENT_ID","UPS_CLIENT_SECRET"]}')
on conflict(provider) do nothing;

alter table public.blog_posts add column if not exists keyword_research_id uuid references public.keyword_research_runs(id) on delete set null;
alter table public.blog_posts add column if not exists image_prompt text default '';
alter table public.blog_posts add column if not exists internal_links jsonb not null default '[]'::jsonb;
alter table public.blog_posts add column if not exists seo_score integer not null default 0;

create index if not exists idx_shipments_customer on public.customer_shipments(customer_id, created_at desc);
create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);
create index if not exists idx_conversion_events_created on public.conversion_events(created_at desc);
create index if not exists idx_cms_files_folder on public.cms_files(folder, created_at desc);

-- Authenticated CMS users can manage enterprise modules.
do $$
declare t text;
begin
  foreach t in array array['keyword_research_runs','marketing_campaigns','newsletter_subscribers','landing_pages','coupons','lead_magnets','customer_accounts','customer_shipments','cms_files','audit_logs','system_checks','integration_connections']
  loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists "authenticated manage %s" on public.%I',t,t);
    execute format('create policy "authenticated manage %s" on public.%I for all to authenticated using (true) with check (true)',t,t);
  end loop;
end $$;

alter table public.conversion_events enable row level security;
drop policy if exists "public insert conversion events" on public.conversion_events;
create policy "public insert conversion events" on public.conversion_events for insert to anon, authenticated with check (true);
drop policy if exists "authenticated read conversion events" on public.conversion_events;
create policy "authenticated read conversion events" on public.conversion_events for select to authenticated using (true);
