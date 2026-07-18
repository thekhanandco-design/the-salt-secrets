-- CMS PREMIUM PATCH V6
-- Run this file in Supabase SQL Editor after taking a backup.

-- THE SALT ORIGIN CMS OPERATIONS PATCH
-- Adds business documents, letterheads, CRM workflow support and role management.
create extension if not exists pgcrypto;

alter table if exists public.inquiries add column if not exists status text default 'new';
alter table if exists public.inquiries add column if not exists notes text;

create table if not exists public.document_letterheads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text not null,
  logo_url text,
  address text,
  email text,
  phone text,
  website text,
  bank_details text,
  signature_url text,
  stamp_url text,
  footer_text text,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.business_documents (
  id uuid primary key default gen_random_uuid(),
  document_type text not null default 'quotation',
  document_number text unique,
  status text not null default 'draft',
  currency text not null default 'USD',
  issue_date date default current_date,
  valid_until date,
  buyer_name text,
  buyer_company text,
  buyer_email text,
  buyer_phone text,
  buyer_address text,
  buyer_country text,
  incoterm text,
  payment_terms text,
  delivery_terms text,
  origin_country text default 'Pakistan',
  destination_port text,
  freight numeric default 0,
  insurance numeric default 0,
  discount numeric default 0,
  tax_rate numeric default 0,
  subtotal numeric default 0,
  tax_amount numeric default 0,
  grand_total numeric default 0,
  notes text,
  items jsonb not null default '[]'::jsonb,
  letterhead_id uuid references public.document_letterheads(id) on delete set null,
  inquiry_id bigint references public.inquiries(id) on delete set null,
  parent_document_id uuid references public.business_documents(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create sequence if not exists public.business_document_seq start 1001;
create or replace function public.assign_business_document_number()
returns trigger language plpgsql as $$
declare prefix text;
begin
  if new.document_number is null or btrim(new.document_number) = '' then
    prefix := case new.document_type
      when 'quotation' then 'QT'
      when 'proforma_invoice' then 'PI'
      when 'commercial_invoice' then 'CI'
      when 'packing_list' then 'PL'
      when 'tax_invoice' then 'TI'
      when 'purchase_order' then 'PO'
      when 'credit_note' then 'CN'
      when 'delivery_note' then 'DN'
      else 'DOC' end;
    new.document_number := prefix || '-' || to_char(current_date,'YYYY') || '-' || lpad(nextval('public.business_document_seq')::text,5,'0');
  end if;
  return new;
end; $$;
drop trigger if exists trg_assign_business_document_number on public.business_documents;
create trigger trg_assign_business_document_number before insert on public.business_documents for each row execute function public.assign_business_document_number();

insert into public.document_letterheads(name,company_name,email,phone,website,address,footer_text,is_default)
select 'The Salt Origin','The Salt Origin','thekhanandco@gmail.com','+92 331 1281289','https://www.thesaltorigin.com','Pakistan','Premium Himalayan Pink Salt Supplier & Private Label Partner',true
where not exists (select 1 from public.document_letterheads);

alter table public.document_letterheads enable row level security;
alter table public.business_documents enable row level security;
drop policy if exists "authenticated manage letterheads" on public.document_letterheads;
create policy "authenticated manage letterheads" on public.document_letterheads for all to authenticated using (true) with check (true);
drop policy if exists "authenticated manage documents" on public.business_documents;
create policy "authenticated manage documents" on public.business_documents for all to authenticated using (true) with check (true);

-- Admins need to see all profiles in the workflow screen.
drop policy if exists "authenticated read profiles" on public.cms_profiles;
create policy "authenticated read profiles" on public.cms_profiles for select to authenticated using (true);

-- Keep document history.
drop trigger if exists trg_document_versions on public.business_documents;
create trigger trg_document_versions after insert or update or delete on public.business_documents for each row execute function public.capture_cms_version();


-- Optional WhatsApp settings can be stored in environment variables.
-- No access token is stored in the database.
