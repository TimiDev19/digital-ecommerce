-- Retire flight ticket ordering while preserving historical orders and request records.
update public.categories
set is_active = false,
    updated_at = now()
where lower(slug) = 'flight-tickets'
   or lower(name) = 'flight tickets';

update public.products
set is_active = false,
    updated_at = now()
where lower(category) = 'flight tickets'
   or id = 'custom-flight-ticket';
