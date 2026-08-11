-- Global branding, navbar and footer CMS controls.
-- Safe to re-run. Existing translations and uploaded images are preserved.

begin;

insert into public.cms_image_slots (
  page_slug,
  section_slug,
  slot_key,
  slot_label,
  current_url,
  default_url,
  alt_text,
  display_order,
  is_active
)
values
  ('global','branding','header_logo','Header / Navbar Logo','/logo.png','/logo.png','The Salt Origin header logo',1,true),
  ('global','branding','footer_logo','Footer Logo','/logo.png','/logo.png','The Salt Origin footer logo',2,true)
on conflict (page_slug,section_slug,slot_key) do nothing;

insert into public.cms_text_entries (
  page_slug,
  section_slug,
  field_key,
  field_label,
  field_type,
  default_value,
  display_order
)
values
  ('global','branding','logo_alt','Header & Footer Logo Alt Text','text','The Salt Origin',100),
  ('global','footer','newsletter_eyebrow','Newsletter Eyebrow','text','Salt market brief',110),
  ('global','footer','newsletter_title','Newsletter Heading','textarea','Get product launches and export updates.',111),
  ('global','footer','newsletter_description','Newsletter Description','textarea','One useful email at a time. Unsubscribe whenever you choose.',112),
  ('global','footer','newsletter_placeholder','Newsletter Email Placeholder','text','Business email address',113),
  ('global','footer','newsletter_button','Newsletter Button Label','text','Subscribe',114),
  ('global','footer','newsletter_saving','Newsletter Saving Label','text','Saving…',115),
  ('global','footer','newsletter_success','Newsletter Success Message','textarea','Thank you. You are subscribed.',116),
  ('global','footer','newsletter_invalid','Newsletter Invalid Email Message','textarea','Enter a valid email address.',117),
  ('global','footer','newsletter_existing','Newsletter Existing Subscriber Message','textarea','You are already subscribed.',118),
  ('global','footer','newsletter_error','Newsletter Error Message','textarea','Subscription could not be saved.',119),
  ('global','footer','brand_tagline','Footer Brand Tagline','text','Himalayan Pink Salt Exporter',120),
  ('global','footer','description','Footer Description','textarea','Premium Himalayan Pink Salt supplier offering retail packaging, bulk supply and private label solutions for distributors, wholesalers and international buyers worldwide.',121),
  ('global','footer','social_title','Footer Social Media Heading','text','Connect with us',122),
  ('global','footer','quick_links_title','Footer Quick Links Heading','text','Quick Links',123),
  ('global','footer','contact_title','Footer Contact Heading','text','Contact Info',124),
  ('global','footer','quote_button','Footer Quote Button Label','text','Request Quote',125),
  ('global','footer','copyright','Footer Copyright Line','textarea','© {year} {site}. All Rights Reserved.',126),
  ('global','footer','privacy_label','Footer Privacy Link Label','text','Privacy Policy',127),
  ('global','footer','terms_label','Footer Terms Link Label','text','Terms & Conditions',128),
  ('global','footer','bottom_note','Footer Bottom Note','textarea','Premium Himalayan Pink Salt Supplier & Private Label Partner',129),
  ('global','footer','website_credit','Website Designed / Developed By Line','textarea','',130)
on conflict (page_slug,section_slug,field_key) do update set
  field_label = excluded.field_label,
  field_type = excluded.field_type,
  display_order = excluded.display_order;

commit;
