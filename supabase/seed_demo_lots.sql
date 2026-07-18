-- Optional: a demo seller + 4 active lots with placeholder photos, so the
-- homepage and lot pages have something real to render before the admin
-- dashboard (build step 6) exists. Safe to delete these rows later —
-- nothing else depends on them. Run this in the Supabase SQL Editor.

insert into public.sellers (id, name, contact_email, region)
values ('11111111-1111-1111-1111-111111111111', 'Demo Seller', 'demo-seller@example.com', 'Texas Panhandle');

insert into public.lots
  (id, seller_id, title, description, hay_type, region, starting_price, bid_increment, current_price, end_time, status)
values
  ('21111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   '50 Round Bales — Coastal Bermuda', 'Cut and baled this season, stored under cover. Good color, tested for horses.',
   'Coastal Bermuda', 'Texas Panhandle', 1200, 25, 1250, now() + interval '2 days', 'active'),
  ('21111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111',
   '30 Square Bales — Alfalfa', 'Premium alfalfa, third cutting, minimal weeds.',
   'Alfalfa', 'Texas Panhandle', 900, 20, 900, now() + interval '5 hours', 'active'),
  ('21111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111',
   '75 Round Bales — Mixed Grass', 'Good all-purpose hay for cattle, barn stored.',
   'Mixed Grass', 'Oklahoma Panhandle', 1800, 30, 1890, now() + interval '1 day', 'active'),
  ('21111111-1111-1111-1111-111111111114', '11111111-1111-1111-1111-111111111111',
   '20 Round Bales — Timothy', 'Small lot, ideal for horse owners. Soft, leafy, no rain damage.',
   'Timothy', 'Texas Panhandle', 700, 15, 700, now() + interval '3 days', 'active');

insert into public.lot_media (lot_id, url, type, sort_order)
values
  ('21111111-1111-1111-1111-111111111111', 'https://picsum.photos/seed/hay-bermuda/800/600', 'photo', 0),
  ('21111111-1111-1111-1111-111111111112', 'https://picsum.photos/seed/hay-alfalfa/800/600', 'photo', 0),
  ('21111111-1111-1111-1111-111111111113', 'https://picsum.photos/seed/hay-mixedgrass/800/600', 'photo', 0),
  ('21111111-1111-1111-1111-111111111114', 'https://picsum.photos/seed/hay-timothy/800/600', 'photo', 0);
