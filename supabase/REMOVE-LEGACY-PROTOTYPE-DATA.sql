-- OPTIONAL CLEANUP ONLY
-- Review before running. This removes only exact company/contact names used in earlier prototype examples.
-- It does not delete records by generic status, date, country or business type.

begin;

delete from public.business_documents
where lower(coalesce(buyer_company, '')) in (
  'nordhaus foods gmbh',
  'maple ridge imports inc.',
  'gulf choice trading llc',
  'atlantic private label ltd.',
  'pacific natural foods',
  'oceanic wellness gmbh'
);

delete from public.inquiries
where lower(coalesce(company, '')) in (
  'nordhaus foods gmbh',
  'maple ridge imports inc.',
  'gulf choice trading llc',
  'atlantic private label ltd.',
  'pacific natural foods',
  'oceanic wellness gmbh'
);

delete from public.b2b_contacts
where lower(coalesce(name, '')) in ('thomas becker');

delete from public.b2b_companies
where lower(coalesce(name, '')) in (
  'nordhaus foods gmbh',
  'maple ridge imports inc.',
  'gulf choice trading llc',
  'atlantic private label ltd.',
  'pacific natural foods',
  'oceanic wellness gmbh'
);

delete from public.customer_accounts
where lower(coalesce(company_name, '')) in (
  'nordhaus foods gmbh',
  'maple ridge imports inc.',
  'gulf choice trading llc',
  'atlantic private label ltd.',
  'pacific natural foods',
  'oceanic wellness gmbh'
);

commit;
