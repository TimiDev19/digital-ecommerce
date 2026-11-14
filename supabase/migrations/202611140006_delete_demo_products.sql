-- Permanently remove the known demo catalog rows when they have no purchase
-- history. Keep historical references intact by archiving those that do.
delete from public.products p
where p.id in (
  'esim', 'gift', 'online-banking', 'flight-ticket',
  'esim-europe-5gb', 'esim-uk-10gb', 'esim-global-3gb',
  'gift-apple', 'gift-amazon', 'gift-google-play',
  'banking-app-setup', 'banking-transfer-help', 'banking-account-guidance',
  'flight-lagos-london', 'flight-lagos-dubai', 'flight-lagos-accra'
)
and not exists (
  select 1 from public.order_items oi where oi.product_id = p.id
)
and not exists (
  select 1 from public.downloads d where d.product_id = p.id
);

update public.products p
set is_active = false,
    updated_at = now()
where p.id in (
  'esim', 'gift', 'online-banking', 'flight-ticket',
  'esim-europe-5gb', 'esim-uk-10gb', 'esim-global-3gb',
  'gift-apple', 'gift-amazon', 'gift-google-play',
  'banking-app-setup', 'banking-transfer-help', 'banking-account-guidance',
  'flight-lagos-london', 'flight-lagos-dubai', 'flight-lagos-accra'
)
and p.is_active;
