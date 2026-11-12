# Forma

A considered digital goods storefront built with Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, Redux Toolkit, Supabase and Paystack.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and provide a Supabase project URL, anon key, service role key, Paystack secret and public site URL.
3. Apply `supabase/migrations/202611120001_initial_schema.sql` in the Supabase SQL editor or with the Supabase CLI.
4. Create a private storage bucket named `digital-products` (the migration creates it) and upload each purchased asset using the matching product `storage_path`.
5. Configure the Paystack webhook to `https://YOUR_DOMAIN/api/paystack/webhook`.
6. Start the app with `npm run dev`.

Promote an initial administrator using a trusted SQL session after registering the account:

```sql
update public.profiles set role = 'admin' where id = 'AUTH_USER_UUID';
```

Never put the Supabase service role key or Paystack secret in a `NEXT_PUBLIC_` variable.

## Included

- Editorial home, catalog filtering/search/sorting, product pages and a mobile-first responsive design.
- Redux cart with guest browser persistence, account cart sync and guest-to-account merge.
- Supabase email/password signup, sign-in, password reset, private library, admin analytics and RLS policies.
- Server price lookup, Paystack initialization, signature-checked and transaction-verified webhook fulfillment, private signed downloads, download history.
- Supabase schema and seeded development catalog, SEO metadata, sitemap and robots rules.

The catalog uses the included seed products and illustrative cover imagery. Add the actual deliverable files to the private Storage bucket and populate `storage_path` before accepting production orders. Paystack and Supabase cannot be live until credentials and webhook configuration are provided.
