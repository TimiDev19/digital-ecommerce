create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.products (
  id text primary key, name text not null, category text not null,
  description text not null default '', price_ngn integer not null check(price_ngn > 0),
  cover_image_url text, storage_path text, is_active boolean not null default true,
  is_featured boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index products_active_category_idx on public.products(category) where is_active;
create table public.carts (id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.profiles(id) on delete cascade, updated_at timestamptz not null default now());
create table public.cart_items (cart_id uuid not null references public.carts(id) on delete cascade, product_id text not null references public.products(id) on delete cascade, quantity integer not null default 1 check(quantity between 1 and 99), created_at timestamptz not null default now(), primary key(cart_id,product_id));
create table public.orders (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), status text not null default 'pending' check(status in ('pending','paid','failed','refunded','cancelled')), currency char(3) not null default 'NGN', total_amount integer not null check(total_amount > 0), paid_at timestamptz, created_at timestamptz not null default now());
create index orders_user_date_idx on public.orders(user_id,created_at desc);
create table public.order_items (id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade, product_id text not null references public.products(id), unit_amount integer not null check(unit_amount > 0), quantity integer not null default 1 check(quantity > 0), unique(order_id,product_id));
create table public.payments (id uuid primary key default gen_random_uuid(), order_id uuid not null unique references public.orders(id), provider text not null default 'paystack', reference text not null unique, amount integer not null check(amount > 0), currency char(3) not null default 'NGN', status text not null default 'initialized' check(status in ('initialized','success','failed')), verified_at timestamptz, created_at timestamptz not null default now());
create table public.downloads (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), product_id text not null references public.products(id), downloaded_at timestamptz not null default now());
create index downloads_user_idx on public.downloads(user_id,downloaded_at desc);
create table public.reviews (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), product_id text not null references public.products(id) on delete cascade, rating int not null check(rating between 1 and 5), body text not null default '', is_published boolean not null default false, created_at timestamptz not null default now(), unique(user_id,product_id));
create table public.wishlists (id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.profiles(id) on delete cascade, created_at timestamptz not null default now());
create table public.wishlist_items (wishlist_id uuid not null references public.wishlists(id) on delete cascade, product_id text not null references public.products(id) on delete cascade, created_at timestamptz not null default now(), primary key(wishlist_id,product_id));
create table public.newsletter_subscribers (email text primary key, subscribed_at timestamptz not null default now());

create function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin') $$;
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,display_name) values(new.id,coalesce(new.raw_user_meta_data->>'display_name','')); insert into public.carts(user_id) values(new.id); insert into public.wishlists(user_id) values(new.id); return new; end $$;
create trigger auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create function public.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create trigger profile_touch before update on public.profiles for each row execute procedure public.touch_updated_at();

alter table public.profiles enable row level security; alter table public.products enable row level security; alter table public.carts enable row level security; alter table public.cart_items enable row level security; alter table public.orders enable row level security; alter table public.order_items enable row level security; alter table public.payments enable row level security; alter table public.downloads enable row level security; alter table public.reviews enable row level security; alter table public.wishlists enable row level security; alter table public.wishlist_items enable row level security; alter table public.newsletter_subscribers enable row level security;
create policy "profiles read own or admin" on public.profiles for select using(id=auth.uid() or public.is_admin());
create policy "profiles update own" on public.profiles for update using(id=auth.uid()) with check(id=auth.uid() and role='customer');
create policy "products public active" on public.products for select using(is_active or public.is_admin());
create policy "products admin manage" on public.products for all using(public.is_admin()) with check(public.is_admin());
create policy "carts owner" on public.carts for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "cart items owner" on public.cart_items for all using(exists(select 1 from public.carts c where c.id=cart_id and c.user_id=auth.uid())) with check(exists(select 1 from public.carts c where c.id=cart_id and c.user_id=auth.uid()));
create policy "orders owner read" on public.orders for select using(user_id=auth.uid() or public.is_admin());
create policy "order items owner read" on public.order_items for select using(exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or public.is_admin())));
create policy "payments owner read" on public.payments for select using(exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or public.is_admin())));
create policy "downloads owner read" on public.downloads for select using(user_id=auth.uid() or public.is_admin());
create policy "downloads record own paid item" on public.downloads for insert with check(user_id=auth.uid() and exists(select 1 from public.order_items oi join public.orders o on o.id=oi.order_id where oi.product_id=downloads.product_id and o.user_id=auth.uid() and o.status='paid'));
create policy "reviews published read" on public.reviews for select using(is_published or user_id=auth.uid() or public.is_admin());
create policy "reviews owner insert" on public.reviews for insert with check(user_id=auth.uid() and exists(select 1 from public.order_items oi join public.orders o on o.id=oi.order_id where oi.product_id=reviews.product_id and o.user_id=auth.uid() and o.status='paid'));
create policy "reviews admin manage" on public.reviews for all using(public.is_admin()) with check(public.is_admin());
create policy "wishlists owner" on public.wishlists for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "wishlist items owner" on public.wishlist_items for all using(exists(select 1 from public.wishlists w where w.id=wishlist_id and w.user_id=auth.uid())) with check(exists(select 1 from public.wishlists w where w.id=wishlist_id and w.user_id=auth.uid()));
create policy "newsletter subscribe" on public.newsletter_subscribers for insert with check(length(email)<255);

insert into storage.buckets(id,name,public) values('digital-products','digital-products',false) on conflict(id) do nothing;
create policy "purchased users can read product files" on storage.objects for select using(bucket_id='digital-products' and exists(select 1 from public.order_items oi join public.orders o on o.id=oi.order_id join public.products p on p.id=oi.product_id where p.storage_path=name and o.user_id=auth.uid() and o.status='paid'));
create policy "admins manage private product files" on storage.objects for all using(bucket_id='digital-products' and public.is_admin()) with check(bucket_id='digital-products' and public.is_admin());

-- Seed catalog mirrors the development storefront. Replace cover art and upload private files in production.
insert into public.products(id,name,category,description,price_ngn,cover_image_url,is_active,is_featured) values
('folio','Folio — the brand system','Branding','A complete visual identity toolkit for thoughtful businesses.',48000,'https://images.unsplash.com/photo-1545235617-9465d2a55698',true,true),
('atelier','Atelier UI library','UI & Web','A quietly confident interface system for your next launch.',64000,'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8',true,true),
('still-life','Still Life presets','Photography','Warm, tactile tones for images that feel like memories.',28000,'https://images.unsplash.com/photo-1490481651871-ab68de25d43d',true,true),
('fieldnotes','Fieldnotes — 52 prompts','Templates','A year of gentle structure for your most ambitious ideas.',22000,'https://images.unsplash.com/photo-1455390582262-044c5658c1d2',true,true),
('objects','Objects in use','Photography','A library of 84 beautifully imperfect product scenes.',36000,'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9',true,false),
('type-foundry','The quiet type foundry','Typography','Six expressive typefaces for brands with a point of view.',72000,'https://images.unsplash.com/photo-1509223197845-458d87318791',true,false),
('studio-sounds','Studio sounds vol. 01','Audio','Textural sound for films, interfaces and in-between moments.',18000,'https://images.unsplash.com/photo-1511379938547-c1f69419868d',true,false),
('sunday','Sunday recipe journal','Templates','A digital home for recipes worth making more than once.',16000,'https://images.unsplash.com/photo-1490645935967-10de6ba17061',true,false)
on conflict(id) do nothing;

-- Explicit Data API privileges; RLS remains the row-level authorization boundary.
grant select on public.products to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.carts, public.cart_items, public.wishlists, public.wishlist_items to authenticated;
grant select on public.orders, public.order_items, public.payments, public.downloads to authenticated;
grant insert on public.reviews, public.downloads to authenticated;
grant select on public.reviews to anon, authenticated;
grant insert on public.newsletter_subscribers to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
create index order_items_order_idx on public.order_items(order_id);
create index order_items_product_idx on public.order_items(product_id);
create index cart_items_product_idx on public.cart_items(product_id);
create index wishlist_items_product_idx on public.wishlist_items(product_id);
create index products_featured_idx on public.products(is_featured) where is_active and is_featured;
revoke all on function public.handle_new_user() from public, anon, authenticated;
