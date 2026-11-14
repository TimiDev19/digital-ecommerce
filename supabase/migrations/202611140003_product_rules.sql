-- Apply safe defaults and constraints for admin-created products.
alter table public.products
  alter column id set default gen_random_uuid()::text,
  alter column is_featured set default true;

update public.products set is_featured = true where is_featured is distinct from true;

-- A public product without a price cannot be checked out. Keep legacy records
-- with missing prices archived so an admin can set their price before relisting.
update public.products
set is_active = false, updated_at = now()
where price_ngn is null and is_active;

alter table public.products
  add constraint products_active_price_required
  check (not is_active or price_ngn is not null);

alter table public.products drop column if exists is_sample;
