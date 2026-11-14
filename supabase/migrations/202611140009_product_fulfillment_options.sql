alter table public.products
  add column if not exists requires_clothing_size boolean not null default false,
  add column if not exists requires_ring_size boolean not null default false,
  add column if not exists allows_customization boolean not null default false;

alter table public.cart_items
  add column if not exists fulfillment_options jsonb not null default '{}'::jsonb;

alter table public.order_items
  add column if not exists fulfillment_options jsonb not null default '{}'::jsonb;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('customization-files', 'customization-files', false, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = excluded.allowed_mime_types;
