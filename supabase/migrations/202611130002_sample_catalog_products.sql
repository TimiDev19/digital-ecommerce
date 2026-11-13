alter table public.products add column if not exists is_sample boolean not null default false;

-- Replace the original one-per-category service placeholders with sample products.
update public.products set is_active = false, updated_at = now() where id in ('esim','gift','online-banking','flight-ticket');

insert into public.products (id,name,category,description,price_ngn,cover_image_url,is_active,is_featured,is_sample) values
('esim-europe-5gb','Europe eSIM · 5 GB','eSIM','Sample listing. A regional data plan for customers travelling in Europe. Confirm countries, validity and price before ordering.',5000,'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',true,true,true),
('esim-uk-10gb','UK eSIM · 10 GB','eSIM','Sample listing. A UK data plan for travellers. Confirm coverage, validity and price before ordering.',8500,'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',true,false,true),
('esim-global-3gb','Global eSIM · 3 GB','eSIM','Sample listing. A multi-country data plan. Confirm supported destinations, validity and price before ordering.',12000,'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',true,false,true),
('gift-apple','Apple Gift Card','Gifts','Sample listing. Ask about available denominations, region compatibility and current price.',10000,'https://images.unsplash.com/photo-1513201099705-a9746e1e201f',true,true,true),
('gift-amazon','Amazon Gift Card','Gifts','Sample listing. Ask about available denominations, region compatibility and current price.',25000,'https://images.unsplash.com/photo-1513201099705-a9746e1e201f',true,false,true),
('gift-google-play','Google Play Gift Card','Gifts','Sample listing. Ask about available denominations, region compatibility and current price.',50000,'https://images.unsplash.com/photo-1513201099705-a9746e1e201f',true,false,true),
('banking-app-setup','Mobile Banking App Setup','Online Banking','Sample listing. Request guidance with setting up an online banking app. Never share passwords, PINs or one-time codes.',3000,'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d',true,true,true),
('banking-transfer-help','Online Transfer Assistance','Online Banking','Sample listing. Ask about help navigating an online transfer. Never share passwords, PINs or one-time codes.',5000,'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d',true,false,true),
('banking-account-guidance','Account Setup Guidance','Online Banking','Sample listing. Request general guidance on online account setup. Service eligibility and requirements must be confirmed.',7500,'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d',true,false,true),
('flight-lagos-london','Lagos → London','Flight Tickets','Sample itinerary listing. Send your preferred travel dates and passenger details for availability and a quote.',850000,'https://images.unsplash.com/photo-1436491865332-7a61a109cc05',true,true,true),
('flight-lagos-dubai','Lagos → Dubai','Flight Tickets','Sample itinerary listing. Send your preferred travel dates and passenger details for availability and a quote.',480000,'https://images.unsplash.com/photo-1436491865332-7a61a109cc05',true,false,true),
('flight-lagos-accra','Lagos → Accra','Flight Tickets','Sample itinerary listing. Send your preferred travel dates and passenger details for availability and a quote.',220000,'https://images.unsplash.com/photo-1436491865332-7a61a109cc05',true,false,true)
on conflict (id) do nothing;
