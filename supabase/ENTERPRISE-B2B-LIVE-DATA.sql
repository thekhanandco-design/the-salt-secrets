-- THE SALT ORIGIN — ENTERPRISE B2B LIVE DATA UPGRADE
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- This migration contains schema only. It does not insert fake/demo business records.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- COMPANIES AND CONTACTS
-- -----------------------------------------------------------------------------
create table if not exists public.b2b_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  company_type text not null default 'Prospect',
  industry text,
  website text,
  primary_contact_name text,
  primary_contact_email text,
  products_of_interest text[] not null default '{}',
  estimated_annual_volume text,
  tier text not null default 'New',
  relationship_status text not null default 'Prospect',
  preferred_buyer boolean not null default false,
  repeat_client boolean not null default false,
  assigned_manager uuid references auth.users(id) on delete set null,
  last_activity_at timestamptz,
  next_follow_up_at timestamptz,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists b2b_companies_name_idx on public.b2b_companies(lower(name));
create index if not exists b2b_companies_country_idx on public.b2b_companies(country);
create index if not exists b2b_companies_status_idx on public.b2b_companies(relationship_status);
drop trigger if exists trg_b2b_companies_updated_at on public.b2b_companies;
create trigger trg_b2b_companies_updated_at before update on public.b2b_companies for each row execute function public.set_updated_at();

create table if not exists public.b2b_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.b2b_companies(id) on delete set null,
  name text not null,
  job_title text,
  country text,
  email text,
  phone_whatsapp text,
  lifecycle text not null default 'New Contact',
  source text,
  product_interest text,
  owner_id uuid references auth.users(id) on delete set null,
  last_contact_at timestamptz,
  next_follow_up_at timestamptz,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists b2b_contacts_email_unique on public.b2b_contacts(lower(email)) where email is not null and btrim(email) <> '';
create index if not exists b2b_contacts_company_idx on public.b2b_contacts(company_id);
create index if not exists b2b_contacts_lifecycle_idx on public.b2b_contacts(lifecycle);
drop trigger if exists trg_b2b_contacts_updated_at on public.b2b_contacts;
create trigger trg_b2b_contacts_updated_at before update on public.b2b_contacts for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- LEADS — EXISTING WEBSITE INQUIRIES BECOME THE LIVE CRM SOURCE
-- -----------------------------------------------------------------------------
alter table if exists public.inquiries add column if not exists company_id uuid references public.b2b_companies(id) on delete set null;
alter table if exists public.inquiries add column if not exists contact_id uuid references public.b2b_contacts(id) on delete set null;
alter table if exists public.inquiries add column if not exists buyer_type text;
alter table if exists public.inquiries add column if not exists packaging_requirement text;
alter table if exists public.inquiries add column if not exists estimated_volume text;
alter table if exists public.inquiries add column if not exists lead_source text default 'Website Inquiry';
alter table if exists public.inquiries add column if not exists lifecycle_stage text default 'New Inquiry';
alter table if exists public.inquiries add column if not exists lead_temperature text default 'New';
alter table if exists public.inquiries add column if not exists assigned_manager uuid references auth.users(id) on delete set null;
alter table if exists public.inquiries add column if not exists last_contact_at timestamptz;
alter table if exists public.inquiries add column if not exists next_follow_up_at timestamptz;
alter table if exists public.inquiries add column if not exists won_at timestamptz;
alter table if exists public.inquiries add column if not exists lost_at timestamptz;
alter table if exists public.inquiries add column if not exists lost_reason text;
alter table if exists public.inquiries add column if not exists form_name text;
alter table if exists public.inquiries add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table if exists public.inquiries add column if not exists updated_at timestamptz not null default now();
create index if not exists inquiries_lifecycle_idx on public.inquiries(lifecycle_stage);
create index if not exists inquiries_created_idx on public.inquiries(created_at desc);
create index if not exists inquiries_followup_idx on public.inquiries(next_follow_up_at) where next_follow_up_at is not null;
drop trigger if exists trg_inquiries_updated_at on public.inquiries;
create trigger trg_inquiries_updated_at before update on public.inquiries for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- CLIENTS — EXTEND THE EXISTING CLIENT ACCOUNT TABLE
-- -----------------------------------------------------------------------------
alter table if exists public.customer_accounts add column if not exists industry text;
alter table if exists public.customer_accounts add column if not exists website text;
alter table if exists public.customer_accounts add column if not exists segment text default 'New Client';
alter table if exists public.customer_accounts add column if not exists tier text default 'New';
alter table if exists public.customer_accounts add column if not exists products text[] not null default '{}';
alter table if exists public.customer_accounts add column if not exists last_quotation text;
alter table if exists public.customer_accounts add column if not exists last_shipment text;
alter table if exists public.customer_accounts add column if not exists last_contact_at timestamptz;
alter table if exists public.customer_accounts add column if not exists assigned_manager uuid references auth.users(id) on delete set null;
alter table if exists public.customer_accounts add column if not exists repeat_client boolean not null default false;
alter table if exists public.customer_accounts add column if not exists preferred_buyer boolean not null default false;
alter table if exists public.customer_accounts add column if not exists notes text;
alter table if exists public.customer_accounts add column if not exists updated_at timestamptz not null default now();
drop trigger if exists trg_customer_accounts_updated_at on public.customer_accounts;
create trigger trg_customer_accounts_updated_at before update on public.customer_accounts for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- QUOTATIONS AND EXPORT DOCUMENTS — EXTEND EXISTING DOCUMENT TABLE
-- -----------------------------------------------------------------------------
alter table if exists public.business_documents add column if not exists contact_id uuid references public.b2b_contacts(id) on delete set null;
alter table if exists public.business_documents add column if not exists company_id uuid references public.b2b_companies(id) on delete set null;
alter table if exists public.business_documents add column if not exists port_of_loading text;
alter table if exists public.business_documents add column if not exists port_of_discharge text;
alter table if exists public.business_documents add column if not exists shipment_method text;
alter table if exists public.business_documents add column if not exists total_quantity numeric default 0;
alter table if exists public.business_documents add column if not exists quantity_unit text;
alter table if exists public.business_documents add column if not exists sent_at timestamptz;
alter table if exists public.business_documents add column if not exists delivered_at timestamptz;
alter table if exists public.business_documents add column if not exists viewed_at timestamptz;
alter table if exists public.business_documents add column if not exists accepted_at timestamptz;
alter table if exists public.business_documents add column if not exists rejected_at timestamptz;
alter table if exists public.business_documents add column if not exists next_follow_up_at timestamptz;
alter table if exists public.business_documents add column if not exists owner_id uuid references auth.users(id) on delete set null;
alter table if exists public.business_documents add column if not exists email_message text;
alter table if exists public.business_documents add column if not exists whatsapp_message text;
alter table if exists public.business_documents add column if not exists revision_number integer not null default 0;
create index if not exists business_documents_status_idx on public.business_documents(status, document_type);
create index if not exists business_documents_followup_idx on public.business_documents(next_follow_up_at) where next_follow_up_at is not null;

-- -----------------------------------------------------------------------------
-- PRODUCTION AND SHIPMENTS — EXTEND EXISTING SHIPMENT TABLE
-- -----------------------------------------------------------------------------
alter table if exists public.customer_shipments add column if not exists company_id uuid references public.b2b_companies(id) on delete set null;
alter table if exists public.customer_shipments add column if not exists client_name text;
alter table if exists public.customer_shipments add column if not exists country text;
alter table if exists public.customer_shipments add column if not exists product text;
alter table if exists public.customer_shipments add column if not exists quantity text;
alter table if exists public.customer_shipments add column if not exists incoterm text;
alter table if exists public.customer_shipments add column if not exists freight_mode text;
alter table if exists public.customer_shipments add column if not exists container_type text;
alter table if exists public.customer_shipments add column if not exists current_stage text default 'Contract Confirmed';
alter table if exists public.customer_shipments add column if not exists completion integer not null default 0;
alter table if exists public.customer_shipments add column if not exists document_status text default 'Pending';
alter table if exists public.customer_shipments add column if not exists owner_id uuid references auth.users(id) on delete set null;
alter table if exists public.customer_shipments add column if not exists delay_reason text;
alter table if exists public.customer_shipments add column if not exists recent_update text;
alter table if exists public.customer_shipments add column if not exists status text default 'Active';
create index if not exists customer_shipments_stage_idx on public.customer_shipments(current_stage, status);
create index if not exists customer_shipments_eta_idx on public.customer_shipments(eta);

-- -----------------------------------------------------------------------------
-- FOLLOW-UPS AND ACTIVITY
-- -----------------------------------------------------------------------------
create table if not exists public.b2b_followups (
  id uuid primary key default gen_random_uuid(),
  inquiry_id bigint references public.inquiries(id) on delete cascade,
  company_id uuid references public.b2b_companies(id) on delete cascade,
  contact_id uuid references public.b2b_contacts(id) on delete cascade,
  document_id uuid references public.business_documents(id) on delete cascade,
  title text not null,
  due_at timestamptz not null,
  priority text not null default 'Normal',
  status text not null default 'Open',
  assigned_to uuid references auth.users(id) on delete set null,
  notes text,
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists b2b_followups_due_idx on public.b2b_followups(status, due_at);
drop trigger if exists trg_b2b_followups_updated_at on public.b2b_followups;
create trigger trg_b2b_followups_updated_at before update on public.b2b_followups for each row execute function public.set_updated_at();

create table if not exists public.b2b_activities (
  id uuid primary key default gen_random_uuid(),
  activity_type text not null,
  module text not null,
  record_id text,
  title text not null,
  description text,
  company_name text,
  country text,
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists b2b_activities_created_idx on public.b2b_activities(created_at desc);
create index if not exists b2b_activities_module_idx on public.b2b_activities(module, created_at desc);

-- -----------------------------------------------------------------------------
-- APPROVAL CENTER
-- -----------------------------------------------------------------------------
create table if not exists public.approval_items (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  record_id text,
  title text not null,
  creator_name text,
  creator_id uuid references auth.users(id) on delete set null,
  ai_agent text,
  status text not null default 'Draft',
  preview_url text,
  change_summary text,
  comments jsonb not null default '[]'::jsonb,
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists approval_items_status_idx on public.approval_items(status, created_at desc);
drop trigger if exists trg_approval_items_updated_at on public.approval_items;
create trigger trg_approval_items_updated_at before update on public.approval_items for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- CERTIFICATIONS
-- -----------------------------------------------------------------------------
create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(),
  document_name text not null,
  category text not null,
  issuing_authority text,
  certificate_number text,
  issue_date date,
  expiry_date date,
  applicable_products text[] not null default '{}',
  applicable_markets text[] not null default '{}',
  visibility text not null default 'Private',
  file_url text,
  thumbnail_url text,
  expiry_reminder_days integer not null default 60,
  status text not null default 'Draft',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists certifications_expiry_idx on public.certifications(expiry_date);
drop trigger if exists trg_certifications_updated_at on public.certifications;
create trigger trg_certifications_updated_at before update on public.certifications for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- FORMS
-- -----------------------------------------------------------------------------
create table if not exists public.website_forms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  form_type text not null default 'General Inquiry',
  website_placement text,
  fields jsonb not null default '[]'::jsonb,
  status text not null default 'Draft',
  assigned_owner uuid references auth.users(id) on delete set null,
  notifications jsonb not null default '{}'::jsonb,
  submission_count integer not null default 0,
  last_submission_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_website_forms_updated_at on public.website_forms;
create trigger trg_website_forms_updated_at before update on public.website_forms for each row execute function public.set_updated_at();

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid references public.website_forms(id) on delete set null,
  inquiry_id bigint references public.inquiries(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  source_page text,
  created_at timestamptz not null default now()
);
create index if not exists form_submissions_form_idx on public.form_submissions(form_id, created_at desc);

-- -----------------------------------------------------------------------------
-- SAMPLE REQUESTS
-- -----------------------------------------------------------------------------
create table if not exists public.sample_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text unique,
  inquiry_id bigint references public.inquiries(id) on delete set null,
  company_id uuid references public.b2b_companies(id) on delete set null,
  company_name text,
  country text,
  product_samples text,
  packaging_sample text,
  request_date date not null default current_date,
  courier text,
  tracking_number text,
  cost_responsibility text,
  status text not null default 'Requested',
  follow_up_date date,
  owner_id uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create sequence if not exists public.sample_request_seq start 1001;
create or replace function public.assign_sample_request_number()
returns trigger language plpgsql as $$
begin
  if new.request_number is null or btrim(new.request_number) = '' then
    new.request_number := 'SR-' || to_char(current_date,'YYYY') || '-' || lpad(nextval('public.sample_request_seq')::text,5,'0');
  end if;
  return new;
end;
$$;
drop trigger if exists trg_assign_sample_request_number on public.sample_requests;
create trigger trg_assign_sample_request_number before insert on public.sample_requests for each row execute function public.assign_sample_request_number();
drop trigger if exists trg_sample_requests_updated_at on public.sample_requests;
create trigger trg_sample_requests_updated_at before update on public.sample_requests for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- OUTREACH / FAQ INTELLIGENCE / GEO / AI AGENTS / SAVED REPORTS
-- -----------------------------------------------------------------------------
create table if not exists public.outreach_opportunities (
  id uuid primary key default gen_random_uuid(),
  website text not null,
  country text,
  opportunity_type text,
  authority_score integer,
  relevance_score integer,
  contact_person text,
  contact_email text,
  status text not null default 'Identified',
  last_contact_at timestamptz,
  follow_up_date date,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_outreach_updated_at on public.outreach_opportunities;
create trigger trg_outreach_updated_at before update on public.outreach_opportunities for each row execute function public.set_updated_at();

create table if not exists public.faq_research_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  source text,
  source_mode text not null default 'Connection Required',
  demand_score integer,
  target_country text,
  related_keyword text,
  recommended_category text,
  ai_answer text,
  answer_length integer,
  schema_preview jsonb not null default '{}'::jsonb,
  internal_links jsonb not null default '[]'::jsonb,
  reference_notes text,
  status text not null default 'New Suggestion',
  approved_at timestamptz,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_faq_research_updated_at on public.faq_research_questions;
create trigger trg_faq_research_updated_at before update on public.faq_research_questions for each row execute function public.set_updated_at();

create table if not exists public.geo_audits (
  id uuid primary key default gen_random_uuid(),
  page_path text not null,
  page_title text,
  ai_visibility_score integer,
  answer_readiness_score integer,
  entity_consistency_score integer,
  citation_opportunities integer,
  status text not null default 'Needs Review',
  recommendations jsonb not null default '[]'::jsonb,
  llms_txt_excerpt text,
  last_audited_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_geo_audits_updated_at on public.geo_audits;
create trigger trg_geo_audits_updated_at before update on public.geo_audits for each row execute function public.set_updated_at();

create table if not exists public.ai_agents (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  purpose text,
  status text not null default 'Paused',
  last_run_at timestamptz,
  tasks_completed integer not null default 0,
  pending_approvals integer not null default 0,
  settings jsonb not null default '{}'::jsonb,
  last_activity text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_ai_agents_updated_at on public.ai_agents;
create trigger trg_ai_agents_updated_at before update on public.ai_agents for each row execute function public.set_updated_at();

create table if not exists public.saved_reports (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  report_type text not null,
  date_from date,
  date_to date,
  country_filter text,
  owner_filter uuid references auth.users(id) on delete set null,
  filters jsonb not null default '{}'::jsonb,
  status text not null default 'Ready',
  generated_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_saved_reports_updated_at on public.saved_reports;
create trigger trg_saved_reports_updated_at before update on public.saved_reports for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- MARKETING / SOCIAL / BLOG APPROVAL FIELDS
-- -----------------------------------------------------------------------------
alter table if exists public.marketing_campaigns add column if not exists objective text;
alter table if exists public.marketing_campaigns add column if not exists target_countries text[] not null default '{}';
alter table if exists public.marketing_campaigns add column if not exists target_audience text;
alter table if exists public.marketing_campaigns add column if not exists channels text[] not null default '{}';
alter table if exists public.marketing_campaigns add column if not exists landing_page text;
alter table if exists public.marketing_campaigns add column if not exists leads_generated integer not null default 0;
alter table if exists public.marketing_campaigns add column if not exists owner_id uuid references auth.users(id) on delete set null;

alter table if exists public.social_scheduled_posts add column if not exists title text;
alter table if exists public.social_scheduled_posts add column if not exists campaign_id uuid references public.marketing_campaigns(id) on delete set null;
alter table if exists public.social_scheduled_posts add column if not exists platform_content jsonb not null default '{}'::jsonb;
alter table if exists public.social_scheduled_posts add column if not exists platform_images jsonb not null default '{}'::jsonb;
alter table if exists public.social_scheduled_posts add column if not exists approval_status text not null default 'Draft';
alter table if exists public.social_scheduled_posts add column if not exists reviewer_id uuid references auth.users(id) on delete set null;
alter table if exists public.social_scheduled_posts add column if not exists approved_at timestamptz;

alter table if exists public.blog_posts add column if not exists target_country text;
alter table if exists public.blog_posts add column if not exists primary_keyword text;
alter table if exists public.blog_posts add column if not exists geo_score integer not null default 0;
alter table if exists public.blog_posts add column if not exists approval_status text not null default 'Draft';
alter table if exists public.blog_posts add column if not exists reviewer_id uuid references auth.users(id) on delete set null;
alter table if exists public.blog_posts add column if not exists approved_at timestamptz;

-- -----------------------------------------------------------------------------
-- LIVE ACTIVITY TRIGGERS
-- -----------------------------------------------------------------------------
create or replace function public.log_inquiry_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.b2b_activities(activity_type,module,record_id,title,description,company_name,country,metadata)
    values('created','Leads',new.id::text,'New inquiry received',coalesce(new.name,'Website visitor') || ' submitted an inquiry',new.company,new.country,jsonb_build_object('email',new.email,'product',new.product,'source',coalesce(new.lead_source,'Website Inquiry')));
  elsif tg_op = 'UPDATE' and (old.lifecycle_stage is distinct from new.lifecycle_stage or old.status is distinct from new.status) then
    insert into public.b2b_activities(activity_type,module,record_id,title,description,company_name,country,metadata)
    values('status_changed','Leads',new.id::text,'Lead status updated',coalesce(old.lifecycle_stage,old.status,'New') || ' → ' || coalesce(new.lifecycle_stage,new.status,'New'),new.company,new.country,jsonb_build_object('email',new.email,'product',new.product));
  end if;
  return new;
end;
$$;
drop trigger if exists trg_log_inquiry_activity on public.inquiries;
create trigger trg_log_inquiry_activity after insert or update on public.inquiries for each row execute function public.log_inquiry_activity();

create or replace function public.log_document_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.b2b_activities(activity_type,module,record_id,title,description,company_name,country,metadata)
    values('created','Quotations',new.id::text,coalesce(new.document_number,'Document') || ' created',initcap(replace(new.document_type,'_',' ')),new.buyer_company,new.buyer_country,jsonb_build_object('status',new.status,'grand_total',new.grand_total,'currency',new.currency));
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    insert into public.b2b_activities(activity_type,module,record_id,title,description,company_name,country,metadata)
    values('status_changed','Quotations',new.id::text,coalesce(new.document_number,'Document') || ' status updated',coalesce(old.status,'Draft') || ' → ' || coalesce(new.status,'Draft'),new.buyer_company,new.buyer_country,jsonb_build_object('status',new.status));
  end if;
  return new;
end;
$$;
drop trigger if exists trg_log_document_activity on public.business_documents;
create trigger trg_log_document_activity after insert or update on public.business_documents for each row execute function public.log_document_activity();

create or replace function public.log_shipment_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.b2b_activities(activity_type,module,record_id,title,description,company_name,country,metadata)
    values('created','Shipments',new.id::text,coalesce(new.reference_number,'Shipment') || ' created',coalesce(new.current_stage,new.current_status,'Booked'),new.client_name,new.country,jsonb_build_object('completion',new.completion,'eta',new.eta));
  elsif tg_op = 'UPDATE' and (old.current_stage is distinct from new.current_stage or old.current_status is distinct from new.current_status) then
    insert into public.b2b_activities(activity_type,module,record_id,title,description,company_name,country,metadata)
    values('status_changed','Shipments',new.id::text,coalesce(new.reference_number,'Shipment') || ' updated',coalesce(new.current_stage,new.current_status,'Booked'),new.client_name,new.country,jsonb_build_object('completion',new.completion,'eta',new.eta));
  end if;
  return new;
end;
$$;
drop trigger if exists trg_log_shipment_activity on public.customer_shipments;
create trigger trg_log_shipment_activity after insert or update on public.customer_shipments for each row execute function public.log_shipment_activity();

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY — AUTHENTICATED CMS USERS ONLY
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'b2b_companies','b2b_contacts','b2b_followups','b2b_activities','approval_items',
    'certifications','website_forms','form_submissions','sample_requests','outreach_opportunities',
    'faq_research_questions','geo_audits','ai_agents','saved_reports'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "authenticated manage %s" on public.%I', t, t);
    execute format('create policy "authenticated manage %s" on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- Ensure authenticated CMS users can manage live operational tables.
do $$
declare t text;
begin
  foreach t in array array['inquiries','business_documents','customer_accounts','customer_shipments','marketing_campaigns','social_scheduled_posts','blog_posts'] loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists "enterprise cms authenticated manage" on public.%I', t);
      execute format('create policy "enterprise cms authenticated manage" on public.%I for all to authenticated using (true) with check (true)', t);
    end if;
  end loop;
end $$;

-- Keep public website form submission permissions intact.
-- Existing website routes use the service role server-side, so no public select policy is added.

-- COMPETITOR INTELLIGENCE
create table if not exists public.competitor_profiles (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  company_name text,
  country text,
  market_focus text,
  estimated_visibility numeric,
  top_keywords jsonb not null default '[]'::jsonb,
  new_pages integer not null default 0,
  new_blogs integer not null default 0,
  content_gaps jsonb not null default '[]'::jsonb,
  backlink_gaps jsonb not null default '[]'::jsonb,
  status text not null default 'Active',
  last_checked_at timestamptz,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_competitor_profiles_updated_at on public.competitor_profiles;
create trigger trg_competitor_profiles_updated_at before update on public.competitor_profiles for each row execute function public.set_updated_at();
alter table public.competitor_profiles enable row level security;
drop policy if exists "authenticated manage competitor_profiles" on public.competitor_profiles;
create policy "authenticated manage competitor_profiles" on public.competitor_profiles for all to authenticated using (true) with check (true);
