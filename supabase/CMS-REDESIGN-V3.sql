-- THE SALT ORIGIN CMS REDESIGN V3
-- Run once in Supabase SQL Editor after COMPLETE-CMS-SETUP.sql.

create extension if not exists pgcrypto;

-- Storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('site-media','site-media',true,5242880,array['image/jpeg','image/png','image/webp','image/gif']),
  ('product-images','product-images',true,10485760,array['image/jpeg','image/png','image/webp','image/gif']),
  ('blog-images','blog-images',true,10485760,array['image/jpeg','image/png','image/webp','image/gif']),
  ('documents','documents',true,20971520,array['application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Public reads for website, authenticated writes for CMS.
drop policy if exists "public read site media" on storage.objects;
create policy "public read site media" on storage.objects for select using (bucket_id in ('site-media','product-images','blog-images','documents'));
drop policy if exists "authenticated upload cms files" on storage.objects;
create policy "authenticated upload cms files" on storage.objects for insert to authenticated with check (bucket_id in ('site-media','product-images','blog-images','documents'));
drop policy if exists "authenticated update cms files" on storage.objects;
create policy "authenticated update cms files" on storage.objects for update to authenticated using (bucket_id in ('site-media','product-images','blog-images','documents')) with check (bucket_id in ('site-media','product-images','blog-images','documents'));
drop policy if exists "authenticated delete cms files" on storage.objects;
create policy "authenticated delete cms files" on storage.objects for delete to authenticated using (bucket_id in ('site-media','product-images','blog-images','documents'));

-- Enable RLS with public read / authenticated CMS write.
do $$
declare t text;
begin
  foreach t in array array['cms_languages','cms_text_entries','cms_text_translations','cms_image_slots','products','categories','blog_posts','media_library','site_settings','seo_settings','inquiries']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "public read %s" on public.%I', t, t);
    execute format('create policy "public read %s" on public.%I for select using (true)', t, t);
    execute format('drop policy if exists "authenticated manage %s" on public.%I', t, t);
    execute format('create policy "authenticated manage %s" on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- Current website image registry.
insert into cms_image_slots(page_slug,section_slug,slot_key,title,current_url,default_url,alt_text,recommended_width,recommended_height,display_order,is_active) values
('global','branding','logo','Site Logo — Header & Footer','/logo.png','/logo.png','The Salt Origin logo',400,220,1,true),
('home','hero','products','Hero Section — Product Collection','/hero-products.png','/hero-products.png','Himalayan Pink Salt product collection',900,900,1,true),
('home','hero','mountains','Hero Section — Mountain Background','/mountains-bg.png','/mountains-bg.png','Himalayan mountain background',1920,900,2,true),
('home','private_label','custom_labels','Private Label — Custom Bottles','/custom-labels.png','/custom-labels.png','Custom bottles',600,400,3,true),
('home','private_label','custom_packaging','Private Label — Custom Packaging','/custom-packaging.png','/custom-packaging.png','Custom packaging',600,400,4,true),
('home','products','pet_bottles','Product Range — PET Bottles','/pet-bottles.png','/pet-bottles.png','PET salt bottles',600,600,5,true),
('home','products','pet_jars','Product Range — PET Jars','/pet-jars.png','/pet-jars.png','PET salt jars',600,600,6,true),
('home','products','grinders','Product Range — Grinder Collection','/grinder-bottles.png','/grinder-bottles.png','Salt grinder bottles',600,600,7,true),
('home','products','pouches','Product Range — Stand-Up Pouch','/standup-pouch.png','/standup-pouch.png','Stand-up salt pouch',600,600,8,true),
('home','quality','iso','Quality — ISO Certificate','/cert-iso.png','/cert-iso.png','ISO certificate',400,400,9,true),
('home','quality','haccp','Quality — HACCP Certificate','/cert-haccp.png','/cert-haccp.png','HACCP certificate',400,400,10,true),
('home','quality','gmp','Quality — GMP Certificate','/cert-gmp.png','/cert-gmp.png','GMP certificate',400,400,11,true),
('home','quality','halal','Quality — Halal Certificate','/cert-halal.png','/cert-halal.png','Halal certificate',400,400,12,true),
('home','quality','fda','Quality — FDA Certificate','/cert-fda.png','/cert-fda.png','FDA registration',400,400,13,true),
('home','quality','food','Quality — Food Certificate','/cert-food.png','/cert-food.png','Food certificate',400,400,14,true),
('home','export','map','Export Markets — World Map','/world-map.png','/world-map.png','World export map',1400,700,15,true),
('about','hero','banner','About Page — Hero Banner','/hero-banner.png','/hero-banner.png','The Salt Origin about page',1600,900,1,true),
('about','story','collage','About Page — Product Collage','/product-collage.png','/product-collage.png','Salt product collage',1200,800,2,true),
('products','retail','shaker','Products — Salt Shaker','/shaker-bottles.png','/shaker-bottles.png','Salt shaker collection',800,800,1,true),
('products','retail','jar','Products — Salt Jar','/pet-jars.png','/pet-jars.png','Salt jar collection',800,800,2,true),
('products','retail','pouch','Products — Stand-Up Pouch','/pouches.png','/pouches.png','Stand-up pouch collection',800,800,3,true),
('products','grinder','plastic','Products — Plastic Grinder','/grinder-bottles.png','/grinder-bottles.png','Plastic grinder bottles',800,800,4,true),
('products','grinder','ceramic','Products — Ceramic Grinder','/ceramic-grinders.png','/ceramic-grinders.png','Ceramic grinder bottles',800,800,5,true),
('products','bulk','bag','Products — Bulk Salt Bag','/white-sack.png','/white-sack.png','Bulk salt bag',800,800,6,true),
('private-label','hero','main','Private Label — Hero Image','/custom-logo-design.png','/custom-logo-design.png','Private label salt branding',1200,900,1,true),
('private-label','process','labels','Private Label — Labels','/custom-labels.png','/custom-labels.png','Custom labels',800,600,2,true),
('private-label','process','packaging','Private Label — Packaging','/custom-packaging.png','/custom-packaging.png','Custom packaging',800,600,3,true),
('certifications','cards','iso','Certifications Page — ISO','/cert-iso.png','/cert-iso.png','ISO certification',500,500,1,true),
('certifications','cards','haccp','Certifications Page — HACCP','/cert-haccp.png','/cert-haccp.png','HACCP certification',500,500,2,true),
('certifications','cards','gmp','Certifications Page — GMP','/cert-gmp.png','/cert-gmp.png','GMP certification',500,500,3,true),
('certifications','cards','halal','Certifications Page — Halal','/cert-halal.png','/cert-halal.png','Halal certification',500,500,4,true),
('certifications','cards','fda','Certifications Page — FDA','/cert-fda.png','/cert-fda.png','FDA registration',500,500,5,true),
('contact','hero','banner','Contact Page — Hero Image','/hero-banner.png','/hero-banner.png','Contact The Salt Origin',1600,900,1,true),
('blog','listing','default','Blog — Default Featured Image','/og-image.jpg','/og-image.jpg','Himalayan Pink Salt blog',1200,630,1,true)
on conflict(page_slug,section_slug,slot_key) do update set title=excluded.title, default_url=excluded.default_url, alt_text=excluded.alt_text, recommended_width=excluded.recommended_width, recommended_height=excluded.recommended_height, display_order=excluded.display_order, is_active=true;

-- Current website text registry.
insert into cms_text_entries(page_slug,section_slug,field_key,field_label,field_type,default_value,display_order) values
('home','hero','badge','Hero Badge','text','PREMIUM QUALITY',1),
('home','hero','title','Hero Main Heading','textarea','Himalayan Pink Salt Solutions For Global Markets',2),
('home','hero','description','Hero Description','textarea','We provide premium quality Himalayan Pink Salt in multiple forms and packaging, trusted by importers, distributors and brands worldwide.',3),
('home','hero','primary_button','Explore Products Button','text','Explore Products',4),
('home','hero','secondary_button','Request Quote Button','text','Request Quote',5),
('home','private_label','title','Private Label Heading','text','PRIVATE LABEL SOLUTIONS',1),
('home','private_label','description','Private Label Description','textarea','We help brands create their identity with fully customized bottles and packaging.',2),
('home','products','title','Product Range Heading','text','OUR PRODUCT RANGE',1),
('home','products','description','Product Range Description','textarea','Premium Himalayan Pink Salt products for retail, private label and global distribution.',2),
('home','why_choose','title','Why Choose Us Heading','text','WHY CHOOSE US',1),
('home','why_choose','description','Why Choose Us Description','textarea','Reliable supply, flexible MOQ, custom packaging, export support and premium quality.',2),
('home','quality','title','Quality Standards Heading','text','OUR QUALITY STANDARDS',1),
('home','quality','description','Quality Standards Description','textarea','Certified quality you can trust.',2),
('home','export','title','Export Markets Heading','text','TRUSTED BY BUYERS IN 50+ COUNTRIES',1),
('home','export','countries','Export Destinations Number','text','50+',2),
('home','export','buyers','International Buyers Number','text','500+',3),
('products','hero','eyebrow','Products Eyebrow','text','PRODUCTS',1),
('products','hero','title','Products Page Heading','textarea','Himalayan Pink Salt Product Collection',2),
('products','hero','description','Products Page Description','textarea','Export-ready Himalayan Pink Salt products available in retail packaging, grinder bottles, stand-up pouches, bulk supply and private label solutions.',3),
('products','retail','title','Retail Packaging Heading','text','RETAIL PACKAGING',1),
('products','grinder','title','Grinder Collection Heading','text','GRINDER COLLECTION',1),
('products','bulk','title','Bulk Packaging Heading','text','BULK SALT PACKAGING',1),
('products','private_label','title','Private Label Solutions Heading','text','PRIVATE LABEL SOLUTIONS',1),
('products','comparison','title','Product Comparison Heading','text','PRODUCT COMPARISON',1),
('about','hero','eyebrow','About Eyebrow','text','ABOUT US',1),
('about','hero','title','About Main Heading','textarea','Purity From The Himalayas, Trust From The World.',2),
('private-label','hero','eyebrow','Private Label Eyebrow','text','PRIVATE LABEL MANUFACTURER',1),
('private-label','hero','title','Private Label Main Heading','textarea','Launch Your Own Himalayan Pink Salt Brand',2),
('certifications','hero','eyebrow','Certifications Eyebrow','text','QUALITY & COMPLIANCE',1),
('certifications','hero','title','Certifications Main Heading','textarea','Certified Quality You Can Trust',2),
('contact','hero','eyebrow','Contact Eyebrow','text','CONTACT',1),
('contact','hero','title','Contact Main Heading','textarea','Let’s Discuss Your Requirements',2),
('global','footer','description','Footer Description','textarea','Premium Himalayan Pink Salt supplier offering retail packaging, bulk supply and private label solutions for distributors, wholesalers and international buyers worldwide.',1)
on conflict(page_slug,section_slug,field_key) do update set field_label=excluded.field_label, field_type=excluded.field_type, default_value=excluded.default_value, display_order=excluded.display_order;

insert into cms_text_translations(entry_id,language_code,value)
select id,'en',default_value from cms_text_entries
on conflict(entry_id,language_code) do update set value=excluded.value;

-- Sample categories
insert into categories(name,slug,description,status) values
('Retail Packaging','retail-packaging','Salt shakers, PET bottles, PET jars and stand-up pouches.','active'),
('Grinder Collection','grinder-collection','Plastic and ceramic grinder bottles.','active'),
('Bulk Packaging','bulk-packaging','Industrial and food-service bulk salt bags.','active'),
('Private Label','private-label','Custom brand, label and packaging solutions.','active')
on conflict(slug) do update set name=excluded.name,description=excluded.description,status='active';

-- Sample products visible immediately in CMS and website.
insert into products(title,slug,subtitle,category,description,short_description,image,moq,packaging,status,grain_type,sizes,packaging_type,best_for,features,applications,specifications,gallery,featured,display_order,seo_title,seo_description) values
('Salt Shaker','salt-shaker','PET Bottle','Retail Packaging','Premium food-grade Himalayan Pink Salt in a convenient shaker bottle for retail and household use.','Fine grain Himalayan Pink Salt in PET shaker bottles.','/shaker-bottles.png','1 pallet / custom','100g, 200g and 250g PET shaker bottles','active','Fine Grain','100g, 200g, 250g','PET Bottle (Shaker)','Daily use and retail','["100% natural","Food grade","Private label available","Export-ready packaging"]'::jsonb,'["Retail stores","Supermarkets","E-commerce","Hospitality"]'::jsonb,'{"Origin":"Pakistan","Color":"Natural Pink","Quality":"Food Grade","Private Label":"Available"}'::jsonb,'["/shaker-bottles.png","/retail-packaging.png"]'::jsonb,true,1,'Salt Shaker Bottles | The Salt Origin','Premium Himalayan Pink Salt shaker bottles for retail and private label.'),
('Salt Jar','salt-jar','PET Jar','Retail Packaging','Fine grain Himalayan Pink Salt packed in durable PET jars for kitchens, retail shelves and private label brands.','Fine grain salt in convenient PET jars.','/pet-jars.png','1 pallet / custom','500g, 750g, 1kg and 2kg PET jars','active','Fine Grain','500g, 750g, 1kg, 2kg','PET Jar','Kitchen use and retail','["Food grade","Resealable jar","Custom label available","Multiple sizes"]'::jsonb,'["Retail stores","Kitchen use","Private label","Wholesale"]'::jsonb,'{"Origin":"Pakistan","Material":"Food-grade PET","Color":"Natural Pink"}'::jsonb,'["/pet-jars.png","/retail-packaging.png"]'::jsonb,true,2,'Salt Jars | The Salt Origin','Himalayan Pink Salt PET jars in multiple retail sizes.'),
('Stand-Up Pouch','stand-up-pouch','Zip-Lock Pouch','Retail Packaging','Premium Himalayan Pink Salt in resealable stand-up pouches for retail and e-commerce.','Zip-lock pouches for freshness and easy retail display.','/pouches.png','1 pallet / custom','250g, 500g and 1kg stand-up pouches','active','Fine Grain','250g, 500g, 1kg','Stand-Up Pouch (Zip-Lock)','Retail and e-commerce','["Resealable zip lock","Lightweight packaging","Custom print available","Retail ready"]'::jsonb,'["E-commerce","Retail stores","Private label"]'::jsonb,'{"Origin":"Pakistan","Closure":"Zip Lock","Printing":"Custom Available"}'::jsonb,'["/pouches.png","/standup-pouch.png"]'::jsonb,true,3,'Stand-Up Salt Pouches | The Salt Origin','Export-ready Himalayan Pink Salt stand-up pouches.'),
('Plastic Grinder Bottle','plastic-grinder-bottle','Plastic Grinder','Grinder Collection','Coarse Himalayan Pink Salt in practical plastic grinder bottles for premium retail markets.','Plastic grinder bottles in multiple sizes.','/grinder-bottles.png','1 pallet / custom','100g, 200g, 225g, 360g and 500g','active','Coarse Grain','100g, 200g, 225g, 360g, 500g','Plastic Grinder Bottle','Premium retail','["Adjustable grinder","Refill options","Private label","Shelf-ready"]'::jsonb,'["Premium retail","Restaurants","Gift sets"]'::jsonb,'{"Grinder":"Plastic","Salt":"Coarse Grain","Origin":"Pakistan"}'::jsonb,'["/grinder-bottles.png","/grinder-bottles1.png"]'::jsonb,true,4,'Plastic Salt Grinder Bottles','Plastic Himalayan Pink Salt grinder bottles for retail.'),
('Ceramic Grinder Bottle','ceramic-grinder-bottle','Ceramic Grinder','Grinder Collection','Premium ceramic grinder mechanism paired with natural coarse Himalayan Pink Salt.','Ceramic grinder bottles for premium brands.','/ceramic-grinders.png','1 pallet / custom','100g, 200g, 225g, 360g and 500g','active','Coarse Grain','100g, 200g, 225g, 360g, 500g','Ceramic Grinder Bottle','Premium retail and gifting','["Ceramic mechanism","Premium presentation","Custom branding","Export quality"]'::jsonb,'["Premium supermarkets","Gift shops","Hospitality"]'::jsonb,'{"Grinder":"Ceramic","Salt":"Coarse Grain","Origin":"Pakistan"}'::jsonb,'["/ceramic-grinders.png","/grinder-bottles1.png"]'::jsonb,true,5,'Ceramic Salt Grinder Bottles','Premium ceramic Himalayan Pink Salt grinder bottles.'),
('Bulk Himalayan Pink Salt','bulk-himalayan-pink-salt','PP Woven Bags','Bulk Packaging','Fine and coarse Himalayan Pink Salt supplied in export-ready bulk bags for industrial and food-processing customers.','Bulk salt bags for industrial buyers.','/white-sack.png','1 container / custom','5kg, 10kg, 20kg, 25kg, 30kg and 50kg PP woven bags','active','Fine / Coarse Grain','5kg, 10kg, 20kg, 25kg, 30kg, 50kg','PP Woven Bags','Industrial and food processing','["Bulk supply","Consistent quality","Custom bag printing","Worldwide export"]'::jsonb,'["Food processing","Industrial use","Wholesale distribution"]'::jsonb,'{"Origin":"Pakistan","Bag Type":"PP Woven","Grades":"Fine and Coarse"}'::jsonb,'["/white-sack.png"]'::jsonb,true,6,'Bulk Himalayan Pink Salt Supplier','Bulk Himalayan Pink Salt in PP woven export bags.')
on conflict(slug) do update set title=excluded.title,subtitle=excluded.subtitle,category=excluded.category,description=excluded.description,short_description=excluded.short_description,image=excluded.image,moq=excluded.moq,packaging=excluded.packaging,status='active',grain_type=excluded.grain_type,sizes=excluded.sizes,packaging_type=excluded.packaging_type,best_for=excluded.best_for,features=excluded.features,applications=excluded.applications,specifications=excluded.specifications,gallery=excluded.gallery,featured=excluded.featured,display_order=excluded.display_order,seo_title=excluded.seo_title,seo_description=excluded.seo_description;
