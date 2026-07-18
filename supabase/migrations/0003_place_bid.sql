-- Remove the direct-insert policy: it let any signed-in buyer write to
-- `bids` via the REST API with no price/increment/soft-close validation.
-- All bids must now go through place_bid(), which checks everything
-- atomically (row-locked) and is the only path that can write a bid.
drop policy if exists "Authenticated buyers can place their own bids" on public.bids;

create or replace function public.place_bid(p_lot_id uuid, p_amount numeric)
returns public.bids
language plpgsql
security definer set search_path = ''
as $$
declare
  v_lot public.lots;
  v_bid public.bids;
  v_soft_close_window interval := interval '3 minutes';
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to bid.';
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

  -- Soft close: a bid landing inside the final 3 minutes pushes the
  -- deadline back out to 3 minutes from now instead of stacking extensions.
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

grant execute on function public.place_bid(uuid, numeric) to authenticated;

alter publication supabase_realtime add table public.bids;
alter publication supabase_realtime add table public.lots;
