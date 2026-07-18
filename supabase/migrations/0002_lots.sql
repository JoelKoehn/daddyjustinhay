-- Sellers are onboarded by admins, not self-service auth users.
create table public.sellers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text,
  contact_phone text,
  region text,
  stripe_connect_account_id text,
  stripe_connect_status text,
  created_at timestamptz not null default now()
);

alter table public.sellers enable row level security;

create policy "Admins can manage sellers"
  on public.sellers for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create table public.lots (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers (id),
  title text not null,
  description text,
  hay_type text,
  region text,
  starting_price numeric(10, 2) not null,
  bid_increment numeric(10, 2) not null default 10,
  current_price numeric(10, 2) not null,
  start_time timestamptz not null default now(),
  end_time timestamptz not null,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'ended', 'paid', 'shipped', 'cancelled')),
  winning_bid_id uuid,
  shipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lots enable row level security;

-- No seller identity is exposed here by design — only region/hay_type/photos are public.
create policy "Anyone can view non-draft lots"
  on public.lots for select
  using (status in ('active', 'ended', 'paid', 'shipped'));

create policy "Admins can manage lots"
  on public.lots for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create table public.lot_media (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.lots (id) on delete cascade,
  url text not null,
  type text not null default 'photo' check (type in ('photo', 'video')),
  sort_order int not null default 0
);

alter table public.lot_media enable row level security;

create policy "Anyone can view media for visible lots"
  on public.lot_media for select
  using (
    exists (
      select 1 from public.lots
      where id = lot_id and status in ('active', 'ended', 'paid', 'shipped')
    )
  );

create policy "Admins can manage lot media"
  on public.lot_media for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create table public.bids (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.lots (id) on delete cascade,
  bidder_id uuid not null references public.profiles (id),
  amount numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

alter table public.bids enable row level security;

-- Bid amounts are public (bid history), but bidder identity is masked client-side
-- rather than in RLS since profiles rows themselves aren't publicly readable.
create policy "Anyone can view bids on visible lots"
  on public.bids for select
  using (
    exists (
      select 1 from public.lots
      where id = lot_id and status in ('active', 'ended', 'paid', 'shipped')
    )
  );

create policy "Authenticated buyers can place their own bids"
  on public.bids for insert
  to authenticated
  with check (bidder_id = auth.uid());

alter table public.lots
  add constraint lots_winning_bid_id_fkey foreign key (winning_bid_id) references public.bids (id);
