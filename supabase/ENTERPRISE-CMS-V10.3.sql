-- THE SALT ORIGIN ENTERPRISE CMS V10.3
-- Run after V10.2. Safe to re-run.

alter table public.document_letterheads add column if not exists background_url text;
alter table public.business_documents add column if not exists outcome text not null default 'open';
create index if not exists business_documents_search_idx on public.business_documents(document_type,document_number,status,created_at desc);

-- Ensure daily automation is enabled.
update public.blog_automation_settings set enabled=true, approval_required=true, frequency='daily', updated_at=now();
