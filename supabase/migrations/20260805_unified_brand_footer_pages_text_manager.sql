-- The Salt Origin — unified public design, editable About/Contact content and premium footer.
-- Safe to re-run. Existing translations and uploaded images are preserved.

begin;

-- The newsletter band was intentionally removed from the public footer.
delete from public.cms_text_entries
where page_slug = 'global'
  and section_slug = 'footer'
  and field_key like 'newsletter_%';

insert into public.cms_image_slots (
  page_slug,
  section_slug,
  slot_key,
  slot_label,
  current_url,
  default_url,
  alt_text,
  display_order,
  is_active,
  updated_at
)
values
  ('global','branding','header_logo','Header / Navbar Logo','/logo.png','/logo.png','The Salt Origin header logo',1,true,now()),
  ('global','branding','footer_logo','Footer Logo','/logo.png','/logo.png','The Salt Origin footer logo',2,true,now()),
  ('about','hero','mountains','About Page Mountain Background','/mountains-bg.png','/mountains-bg.png','Himalayan mountain illustration',3,true,now())
on conflict (page_slug, section_slug, slot_key)
do update set
  slot_label = excluded.slot_label,
  default_url = excluded.default_url,
  alt_text = excluded.alt_text,
  display_order = excluded.display_order,
  is_active = true,
  updated_at = now();

with fields(page_slug,section_slug,field_key,field_label,field_type,default_value,display_order) as (
  values
    ('global','branding','logo_alt','Header & Footer Logo Alt Text','text','The Salt Origin',1),
    ('global','footer','description','Footer Description','textarea','Premium Himalayan Pink Salt supplier for global markets. Purity from the Himalayas, trusted worldwide.',10),
    ('global','footer','quick_links_title','Footer Quick Links Heading','text','Quick Links',11),
    ('global','footer','contact_title','Footer Contact Heading','text','Contact Info',12),
    ('global','footer','policies_title','Footer Policies Heading','text','Policies',13),
    ('global','footer','quote_button','Footer Quote Button Label','text','Get Quote',14),
    ('global','footer','copyright','Footer Copyright Line','textarea','© {year} {site}. All Rights Reserved.',15),
    ('global','footer','privacy_label','Footer Privacy Link Label','text','Privacy Policy',16),
    ('global','footer','terms_label','Footer Terms Link Label','text','Terms & Conditions',17),
    ('global','footer','bottom_note','Footer Bottom Note','textarea',E'Premium Himalayan Pink Salt\nSupplier & Private Label Partner',18),
    ('global','footer','website_credit','Website Designed / Developed By Line','textarea','',19),

    ('about','hero','eyebrow','About Eyebrow','text','ABOUT US',100),
    ('about','hero','title','About Main Heading','textarea','The Origin of Purity',101),
    ('about','hero','description','About Hero Description','textarea','Your sourcing partner for authentic Himalayan Pink Salt from Pakistan.',102),
    ('about','story','eyebrow','Who We Are Eyebrow','text','WHO WE ARE',110),
    ('about','story','title','Who We Are Heading','text','Who We Are',111),
    ('about','story','body_one','Who We Are Paragraph 1','textarea','The Salt Origin connects international buyers with authentic Himalayan Pink Salt sourced from Pakistan and prepared for global retail, foodservice and private-label markets.',112),
    ('about','story','body_two','Who We Are Paragraph 2','textarea','As an export-focused B2B supplier, we support distributors, wholesalers and brands with dependable supply, defined product specifications, market-ready packaging and responsive commercial service.',113),
    ('about','mission','eyebrow','Mission Eyebrow','text','OUR PURPOSE',120),
    ('about','mission','title','Mission Heading','text','Our Mission',121),
    ('about','mission','text','Mission Description','textarea','To deliver dependable Himalayan Pink Salt solutions with clear specifications, consistent service and long-term value for international buyers.',122),
    ('about','vision','eyebrow','Vision Eyebrow','text','OUR DIRECTION',130),
    ('about','vision','title','Vision Heading','text','Our Vision',131),
    ('about','vision','text','Vision Description','textarea','To become a trusted international partner for Himalayan Pink Salt, private-label development and export-ready product programs.',132),
    ('about','founder','eyebrow','Founder Message Eyebrow','text','FOUNDER''S MESSAGE',140),
    ('about','founder','title','Founder Message Heading','textarea','Meet the Vision Behind The Salt Origin',141),
    ('about','founder','message','Founder Message','textarea','We started The Salt Origin with a simple purpose: to close the gap between the source of Himalayan Pink Salt and serious international buyers. Our focus is not only to supply a product, but to build trust through clear communication, dependable quality and responsible export support.',142),
    ('about','founder','name','Founder Name','text','Muhammad Hamza Khan',143),
    ('about','founder','role','Founder Role','textarea','CEO & Founder, The Salt Origin & Khan & Co.',144),

    ('contact','hero','eyebrow','Contact Eyebrow','text','CONTACT',200),
    ('contact','hero','title','Contact Main Heading','textarea','Let’s Discuss Your Requirements',201),
    ('contact','hero','description','Contact Hero Description','textarea','Tell us what you need, where you sell and how you want the product packed. Our export team will respond with the right product, packaging and quotation path.',202),
    ('contact','hero','quote_button','Contact Quote Button','text','Request Quote',203),
    ('contact','hero','whatsapp_button','Contact WhatsApp Button','text','WhatsApp Us',204),
    ('contact','snapshot','eyebrow','Direct Contact Eyebrow','text','DIRECT CONTACT',210),
    ('contact','snapshot','title','Direct Contact Heading','textarea','Speak With Our Export Team',211),
    ('contact','snapshot','description','Direct Contact Description','textarea','Use the channel that is easiest for you. Commercial inquiries are reviewed by our B2B team.',212),
    ('contact','snapshot','email_label','Email Label','text','Email',213),
    ('contact','snapshot','phone_label','Phone Label','text','Phone / WhatsApp',214),
    ('contact','snapshot','location_label','Location Label','text','Location',215),
    ('contact','snapshot','hours_label','Business Hours Label','text','Business Hours',216),
    ('contact','snapshot','hours_value','Business Hours Value','textarea','Mon–Sat · 09:00 AM–06:00 PM',217),
    ('contact','form','eyebrow','Contact Form Eyebrow','text','START YOUR INQUIRY',220),
    ('contact','form','title','Contact Form Heading','textarea','Build the Right Salt Program for Your Market',221),
    ('contact','form','description','Contact Form Description','textarea','Share your target market, preferred packaging, estimated quantity and timeline. The more detail you provide, the more relevant our response can be.',222),
    ('contact','form','benefit_one_title','Contact Benefit 1 Heading','text','Commercially Relevant Reply',223),
    ('contact','form','benefit_one_text','Contact Benefit 1 Text','textarea','Product and packaging guidance matched to your inquiry.',224),
    ('contact','form','benefit_two_title','Contact Benefit 2 Heading','text','Export-Focused Support',225),
    ('contact','form','benefit_two_text','Contact Benefit 2 Text','textarea','Documentation and shipment considerations for international buyers.',226),
    ('contact','form','benefit_three_title','Contact Benefit 3 Heading','text','Private Label Ready',227),
    ('contact','form','benefit_three_text','Contact Benefit 3 Text','textarea','Custom branding and retail packaging options for qualified projects.',228),
    ('contact','help','eyebrow','Help Section Eyebrow','text','HOW WE CAN HELP',230),
    ('contact','help','title','Help Section Heading','textarea','Support Across the Buyer Journey',231),
    ('contact','help','private_label_title','Private Label Help Heading','text','Private Label Development',232),
    ('contact','help','private_label_text','Private Label Help Text','textarea','Branding, labels and market-ready packaging support.',233),
    ('contact','help','bulk_orders_title','Bulk Orders Help Heading','text','Bulk Orders',234),
    ('contact','help','bulk_orders_text','Bulk Orders Help Text','textarea','Commercial supply planning for distributors and wholesalers.',235),
    ('contact','help','specifications_title','Specifications Help Heading','text','Product Specifications',236),
    ('contact','help','specifications_text','Specifications Help Text','textarea','Grades, grain sizes, packaging and technical product details.',237),
    ('contact','help','documents_title','Export Documents Help Heading','text','Export Documentation',238),
    ('contact','help','documents_text','Export Documents Help Text','textarea','Commercial and shipment documentation support for international trade.',239),
    ('contact','help','samples_title','Samples Help Heading','text','Sample Requests',240),
    ('contact','help','samples_text','Samples Help Text','textarea','Product and packaging samples for qualified buyer projects.',241),
    ('contact','help','quality_title','Quality Help Heading','text','Quality & Compliance',242),
    ('contact','help','quality_text','Quality Help Text','textarea','Certification, COA and compliance information where available.',243)
)
insert into public.cms_text_entries (
  page_slug,
  section_slug,
  field_key,
  field_label,
  field_type,
  default_value,
  display_order,
  updated_at
)
select
  page_slug,
  section_slug,
  field_key,
  field_label,
  field_type,
  default_value,
  display_order,
  now()
from fields
on conflict (page_slug, section_slug, field_key)
do update set
  field_label = excluded.field_label,
  field_type = excluded.field_type,
  default_value = excluded.default_value,
  display_order = excluded.display_order,
  updated_at = now();

commit;
