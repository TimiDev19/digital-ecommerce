alter table public.orders
  add column if not exists fulfillment_status text not null default 'pending'
    check (fulfillment_status in ('pending', 'completed'));

alter table public.order_items
  add column if not exists delivery_number text,
  add column if not exists delivery_pin text;
