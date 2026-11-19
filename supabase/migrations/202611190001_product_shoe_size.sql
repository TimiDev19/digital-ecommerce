alter table public.products
  add column if not exists requires_shoe_size boolean not null default false;
