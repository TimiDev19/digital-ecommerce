create table if not exists public.order_email_notifications (
  order_id uuid not null references public.orders(id) on delete cascade,
  kind text not null check (kind in ('customer_confirmation', 'merchant_summary')),
  recipient text not null,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed')),
  provider_id text,
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  primary key (order_id, kind)
);

alter table public.order_email_notifications enable row level security;
grant select, insert, update on public.order_email_notifications to service_role;
