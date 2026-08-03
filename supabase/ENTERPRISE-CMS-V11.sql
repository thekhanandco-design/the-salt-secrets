-- THE SALT ORIGIN ENTERPRISE CMS V11
-- Run after the previous CMS migrations.

alter table public.business_documents
  add column if not exists sent_via text not null default 'not_sent',
  add column if not exists response_status text not null default 'pending';

create index if not exists business_documents_response_idx
  on public.business_documents(response_status, sent_via, created_at desc);

insert into public.social_links(platform,label,url,icon_key,enabled,display_order) values
('threads','Threads','','threads',true,8),
('google_business','Google Business','','google',true,9)
on conflict (platform) do nothing;

-- The existing document-number trigger continues the series automatically:
-- QT-YYYY-00001, PI-YYYY-00002, CI-YYYY-00003, etc.
