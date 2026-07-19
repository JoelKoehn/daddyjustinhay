alter table public.profiles
  add column if not exists stripe_payment_method_id text;

-- Bidding requires a linked bank account, per the buyer flow requirement
-- ("link at signup or before first bid, not scrambling after winning").
create or replace function public.place_bid(p_lot_id uuid, p_amount numeric)
returns public.bids
language plpgsql
security definer set search_path = ''
as $$
declare
  v_lot public.lots;
  v_bid public.bids;
  v_bank_linked boolean;
  v_soft_close_window interval := interval '3 minutes';
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to bid.';
  end if;

  select bank_linked into v_bank_linked from public.profiles where id = auth.uid();

  if v_bank_linked is not true then
    raise exception 'Link a bank account on your account page before bidding.';
  end if;

  select * into v_lot from public.lots where id = p_lot_id for update;

  if not found then
    raise exception 'Lot not found.';
  end if;

  if v_lot.status <> 'active' or v_lot.end_time <= now() then
    raise exception 'This auction is no longer accepting bids.';
  end if;

  if p_amount < v_lot.current_price + v_lot.bid_increment then
    raise exception 'Bid must be at least %.', (v_lot.current_price + v_lot.bid_increment)::text;
  end if;

  insert into public.bids (lot_id, bidder_id, amount)
  values (p_lot_id, auth.uid(), p_amount)
  returning * into v_bid;

  update public.lots
  set
    current_price = p_amount,
    winning_bid_id = v_bid.id,
    end_time = case
      when end_time - now() < v_soft_close_window then now() + v_soft_close_window
      else end_time
    end,
    updated_at = now()
  where id = p_lot_id;

  return v_bid;
end;
$$;

alter table public.lots
  drop constraint if exists lots_status_check,
  add constraint lots_status_check
    check (status in ('draft', 'active', 'ended', 'payment_failed', 'paid', 'shipped', 'cancelled'));

create table public.charges (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.lots (id),
  buyer_id uuid not null references public.profiles (id),
  stripe_payment_intent_id text,
  amount numeric(10, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
  failure_reason text,
  created_at timestamptz not null default now()
);

alter table public.charges enable row level security;

create policy "Buyers can view their own charges"
  on public.charges for select
  using (buyer_id = auth.uid());

create policy "Admins can manage charges"
  on public.charges for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.lots (id),
  seller_id uuid not null references public.sellers (id),
  amount numeric(10, 2) not null,
  commission_amount numeric(10, 2) not null,
  stripe_transfer_id text,
  status text not null default 'scheduled' check (status in ('scheduled', 'processing', 'paid', 'failed')),
  scheduled_for timestamptz not null,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.payouts enable row level security;

create policy "Admins can manage payouts"
  on public.payouts for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
