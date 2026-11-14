-- Admin and catalog API routes use the server-only service role key.
-- Grant this role table access explicitly while keeping RLS enabled and
-- leaving anon/authenticated without direct write access.
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.products to service_role;
