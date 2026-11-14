-- Hide the original development catalog while preserving any related order history.
update public.products
set is_active = false,
    updated_at = now()
where id in (
  'esim', 'gift', 'online-banking', 'flight-ticket',
  'esim-europe-5gb', 'esim-uk-10gb', 'esim-global-3gb',
  'gift-apple', 'gift-amazon', 'gift-google-play',
  'banking-app-setup', 'banking-transfer-help', 'banking-account-guidance',
  'flight-lagos-london', 'flight-lagos-dubai', 'flight-lagos-accra'
)
and is_active;
