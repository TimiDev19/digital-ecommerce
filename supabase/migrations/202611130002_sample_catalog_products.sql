-- Archive the original one-per-category placeholders, if an earlier schema created them.
update public.products set is_active = false, updated_at = now() where id in ('esim','gift','online-banking','flight-ticket');
