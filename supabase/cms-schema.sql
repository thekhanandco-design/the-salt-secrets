-- The Salt Origin CMS schema upgrade
-- Run this in Supabase SQL Editor before using all CMS modules.

alter table inquiries
add column if not exists status text default 'new',
add column if not exists notes text;

alter table products
add column if not exists status text default 'active';

create table if not exists categories (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default now(),
  name text not null,
  slug text unique not null,
  description text,
  status text default 'active'
);

create table if not exists seo_settings (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default now(),
  page_slug text unique not null,
  meta_title text,
  meta_description text,
  og_image text
);

create table if not exists site_settings (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default now(),
  site_name text default 'The Salt Origin',
  contact_email text default 'thekhanandco@gmail.com',
  whatsapp_number text default '92331281289',
  address text default 'Pakistan',
  footer_text text
);

insert into site_settings (site_name, contact_email, whatsapp_number, address, footer_text)
select 'The Salt Origin', 'thekhanandco@gmail.com', '92331281289', 'Pakistan', 'Premium Himalayan Pink Salt supplier offering retail packaging, bulk supply and private label solutions.'
where not exists (select 1 from site_settings);

insert into seo_settings (page_slug, meta_title, meta_description)
values
  ('home', 'The Salt Origin | Premium Himalayan Pink Salt Exporter', 'Premium Himalayan Pink Salt supplier offering retail packaging, bulk supply and private label solutions.'),
  ('products', 'Himalayan Pink Salt Products | The Salt Origin', 'Explore retail packaging, grinder bottles, stand-up pouches and bulk salt supply.'),
  ('contact', 'Contact The Salt Origin', 'Request quotation for Himalayan Pink Salt packaging, private label and bulk supply.')
on conflict (page_slug) do nothing;

-- Full CMS expansion
create table if not exists page_content (
  id bigint generated always as identity primary key,
  page_slug text unique not null,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default now()
);

create table if not exists media_library (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default now(),
  file_name text not null,
  file_url text not null,
  file_type text,
  alt_text text,
  folder text default 'general',
  file_size bigint
);

create table if not exists blog_posts (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  published_at timestamp with time zone,
  title text not null,
  slug text unique not null,
  excerpt text,
  content text,
  featured_image text,
  status text default 'draft',
  seo_title text,
  seo_description text
);

create table if not exists blog_categories (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default now(),
  name text not null,
  slug text unique not null
);

create table if not exists activity_logs (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default now(),
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb default '{}'::jsonb
);

alter table products
add column if not exists subtitle text,
add column if not exists gallery jsonb default '[]'::jsonb,
add column if not exists grain_type text,
add column if not exists sizes text,
add column if not exists packaging_type text,
add column if not exists best_for text,
add column if not exists specifications jsonb default '{}'::jsonb,
add column if not exists display_order integer default 0,
add column if not exists featured boolean default false,
add column if not exists seo_title text,
add column if not exists seo_description text;

insert into page_content (page_slug, content)
values
('home', '{"hero_title":"Himalayan Pink Salt Solutions For Global Markets","hero_description":"We provide premium quality Himalayan Pink Salt in multiple forms and packaging, trusted by importers, distributors and brands worldwide.","hero_image":"/hero-products.png"}'::jsonb),
('about', '{"eyebrow":"ABOUT US","hero_title":"Purity From The Himalayas, Trust From The World."}'::jsonb),
('products', '{"eyebrow":"PRODUCTS","hero_title":"Himalayan Pink Salt Product Collection"}'::jsonb),
('private-label', '{"eyebrow":"PRIVATE LABEL MANUFACTURER","hero_title":"Launch Your Own Himalayan Pink Salt Brand"}'::jsonb),
('certifications', '{"eyebrow":"QUALITY & COMPLIANCE","hero_title":"Certified Quality You Can Trust"}'::jsonb),
('contact', '{"eyebrow":"CONTACT","hero_title":"Let’s Discuss Your Requirements"}'::jsonb),
('footer', '{"description":"Premium Himalayan Pink Salt supplier offering retail packaging, bulk supply and private label solutions for distributors, wholesalers and international buyers worldwide."}'::jsonb),
('navbar', '{"cta_text":"Get Quote"}'::jsonb)
on conflict (page_slug) do nothing;
