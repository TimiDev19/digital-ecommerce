-- Gift orders collect delivery details before payment initialization.
alter table public.orders
  add column if not exists delivery_details jsonb;
