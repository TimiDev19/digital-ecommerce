-- Normalize catalog categories so every product belongs to a browsable storefront category.
update public.products set category = case category
  when 'Travel connectivity' then 'eSIM'
  when 'Digital gifts' then 'Gifts'
  when 'Digital services' then 'Online Banking'
  when 'Travel services' then 'Flight Tickets'
  else category
end
where category in ('Travel connectivity','Digital gifts','Digital services','Travel services');
