create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_key unique (name)
);
create unique index categories_name_unique_idx on public.categories(lower(name));
create index categories_active_order_idx on public.categories(display_order, name) where is_active;
alter table public.categories enable row level security;
revoke all on public.categories from anon, authenticated;
grant select, insert, update, delete on public.categories to service_role;

insert into public.categories (name, slug, description, display_order) values
  ('eSIM', 'esim', 'Browse regional and global mobile data plans.', 1),
  ('Gifts', 'gifts', 'Find digital gift cards for popular brands.', 2),
  ('Online Banking', 'online-banking', 'Explore online banking setup and support.', 3),
  ('Flight Tickets', 'flight-tickets', 'Browse routes and request a flight quote.', 4)
on conflict (slug) do nothing;

alter table public.products
  add constraint products_category_fkey
  foreign key (category) references public.categories(name)
  on update cascade on delete restrict not valid;
alter table public.products validate constraint products_category_fkey;
