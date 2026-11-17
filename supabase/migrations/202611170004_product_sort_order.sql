-- Add stable catalog ordering for products and initialize it to the current
-- newest-first order within each category.
alter table public.products
  add column if not exists sort_order integer not null default 0;

with ranked_products as (
  select
    id,
    row_number() over (partition by category order by created_at desc, id) as position
  from public.products
)
update public.products as product
set sort_order = ranked_products.position
from ranked_products
where product.id = ranked_products.id;
