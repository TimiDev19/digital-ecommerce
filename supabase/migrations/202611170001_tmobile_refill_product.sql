alter table public.products
  add column if not exists allows_tmobile_refill boolean not null default false;

insert into public.categories (name, slug, description, display_order, is_active)
values ('eSIM', 'esim', 'Browse regional and global mobile data plans.', 1, true)
on conflict (slug) do update set is_active = true, updated_at = now();

insert into public.products (
  id, name, category, description, price_ngn, is_active, is_featured,
  requires_clothing_size, requires_ring_size, allows_customization, allows_tmobile_refill
)
values (
  'tmobile-refill', 'T mobile refill', 'eSIM',
  'Choose a US dollar refill amount from $10 to $150. Converted at ₦1,400 per $1.',
  14000, true, true, false, false, false, true
)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  price_ngn = excluded.price_ngn,
  is_active = true,
  allows_tmobile_refill = true,
  updated_at = now();
