-- Checkout and the payment webhook use the server-only service role.
-- RLS remains enabled; these grants do not expose these tables to browser roles.
grant select, insert, update on table public.orders to service_role;
grant select, insert on table public.order_items to service_role;
grant select, insert, update on table public.payments to service_role;
