-- THE SALT ORIGIN ENTERPRISE CMS V10.2
-- Run after previous migrations. Safe to re-run.

alter table public.blog_posts add column if not exists content_type text not null default 'blog';
alter table public.blog_posts add column if not exists keywords text[] not null default '{}';
create index if not exists blog_posts_content_type_status_idx on public.blog_posts(content_type,status,published_at desc);

alter table public.social_scheduled_posts add column if not exists updated_at timestamptz not null default now();

-- Storage buckets used by Images Manager, Business Documents and Social Studio.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
('site-media','site-media',true,5242880,array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml']),
('cms-media','cms-media',true,15728640,array['image/png','image/jpeg','image/webp','application/pdf'])
on conflict (id) do update set public=true;

drop policy if exists "Public read site media" on storage.objects;
create policy "Public read site media" on storage.objects for select using (bucket_id in ('site-media','cms-media'));

drop policy if exists "Authenticated upload site media" on storage.objects;
create policy "Authenticated upload site media" on storage.objects for insert to authenticated with check (bucket_id in ('site-media','cms-media'));

drop policy if exists "Authenticated update site media" on storage.objects;
create policy "Authenticated update site media" on storage.objects for update to authenticated using (bucket_id in ('site-media','cms-media')) with check (bucket_id in ('site-media','cms-media'));

drop policy if exists "Authenticated delete site media" on storage.objects;
create policy "Authenticated delete site media" on storage.objects for delete to authenticated using (bucket_id in ('site-media','cms-media'));

-- Make sure existing records are classified as blogs.
update public.blog_posts set content_type='blog' where content_type is null or content_type='';
