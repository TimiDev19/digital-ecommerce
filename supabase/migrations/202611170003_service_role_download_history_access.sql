-- The admin product delete flow checks download history before deleting a product.
-- Keep the table private to users/admins while allowing the server-only service role to count rows.
grant select on public.downloads to service_role;
