create table if not exists public.flight_ticket_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('FLT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_email text not null,
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  flight_class text not null check (flight_class in ('Economy', 'Business', 'First class')),
  traveling_from text not null,
  traveling_to text not null,
  gender text not null check (gender in ('Female', 'Male', 'Other')),
  flight_date date not null,
  trip_type text not null check (trip_type in ('One way', 'Round trip')),
  requested_price_ngn bigint check (requested_price_ngn is null or requested_price_ngn > 0),
  order_id uuid,
  status text not null default 'requested' check (status in ('requested', 'contacted', 'quoted', 'awaiting_payment', 'paid', 'booked', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Also upgrades installations where an earlier copy of this migration created
-- the table before payment support was added.
alter table public.flight_ticket_requests add column if not exists order_id uuid;
alter table public.flight_ticket_requests drop constraint if exists flight_ticket_requests_status_check;
alter table public.flight_ticket_requests add constraint flight_ticket_requests_status_check
  check (status in ('requested', 'contacted', 'quoted', 'awaiting_payment', 'paid', 'booked', 'cancelled'));

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'flight_ticket_requests_order_id_fkey'
      and conrelid = 'public.flight_ticket_requests'::regclass
  ) then
    alter table public.flight_ticket_requests
      add constraint flight_ticket_requests_order_id_fkey
      foreign key (order_id) references public.orders(id) on delete set null;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'flight_ticket_requests_order_id_key'
      and conrelid = 'public.flight_ticket_requests'::regclass
  ) then
    alter table public.flight_ticket_requests
      add constraint flight_ticket_requests_order_id_key unique (order_id);
  end if;
end $$;

create index if not exists flight_ticket_requests_created_at_idx
  on public.flight_ticket_requests (created_at desc);
create index if not exists flight_ticket_requests_user_id_idx
  on public.flight_ticket_requests (user_id, created_at desc);

alter table public.flight_ticket_requests enable row level security;
revoke all on public.flight_ticket_requests from public, anon, authenticated;
grant all on public.flight_ticket_requests to service_role;

-- Online Banking is retired, and flight tickets are quote requests rather than catalog products.
update public.categories set is_active = false, updated_at = now() where slug = 'online-banking';
update public.products set is_active = false, updated_at = now() where category in ('Online Banking', 'Flight Tickets');

-- Inactive FK target for paid custom-flight orders; it is never listed in the shop.
insert into public.products (id, name, category, description, price_ngn, is_active, is_featured)
values ('custom-flight-ticket', 'Custom Flight Ticket', 'Flight Tickets', 'Internal fulfillment item for custom flight requests.', 1, false, false)
on conflict (id) do nothing;
