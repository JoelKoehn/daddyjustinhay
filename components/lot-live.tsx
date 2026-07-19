"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CountdownBadge } from "@/components/countdown-badge";

type Bid = { id: string; amount: number; bidder_id: string; created_at: string };

export function LotLive({
  lotId,
  initialCurrentPrice,
  initialEndTime,
  bidIncrement,
  initialBids,
  isSignedIn,
}: {
  lotId: string;
  initialCurrentPrice: number;
  initialEndTime: string;
  bidIncrement: number;
  initialBids: Bid[];
  isSignedIn: boolean;
}) {
  const [currentPrice, setCurrentPrice] = useState(initialCurrentPrice);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [bids, setBids] = useState(initialBids);
  const [amount, setAmount] = useState(String(initialCurrentPrice + bidIncrement));
  const [error, setError] = useState<string | null>(null);
  const [hasEnded, setHasEnded] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Live-updates everyone watching this lot, including the bidder who just
  // placed the bid — the RPC's own writes are what trigger these events.
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`lot-${lotId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bids", filter: `lot_id=eq.${lotId}` },
        (payload) => {
          const bid = payload.new as Bid;
          setBids((prev) => [bid, ...prev]);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lots", filter: `id=eq.${lotId}` },
        (payload) => {
          const lot = payload.new as { current_price: number; end_time: string };
          const newPrice = Number(lot.current_price);
          setCurrentPrice(newPrice);
          setEndTime(lot.end_time);
          setAmount(String(newPrice + bidIncrement));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lotId, bidIncrement]);

  // Ticks hasEnded independently of the countdown badge's own timer —
  // starts false on both server and client render to avoid a hydration
  // mismatch, then an effect corrects it once mounted.
  useEffect(() => {
    const check = () => setHasEnded(new Date(endTime).getTime() <= Date.now());
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const minBid = Number(currentPrice) + Number(bidIncrement);

  function placeBid(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
      setError("Enter a valid bid amount.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("place_bid", {
        p_lot_id: lotId,
        p_amount: numericAmount,
      });

      if (rpcError) {
        setError(rpcError.message);
      }
    });
  }

  return (
    <div>
      <div className="mt-4 flex items-center gap-4">
        <span className="font-heading text-3xl font-semibold text-foreground">
          ${currentPrice}
        </span>
        <CountdownBadge endTime={endTime} />
      </div>

      <div className="mt-6 rounded-sm border border-border bg-background-elevated p-4">
        {hasEnded ? (
          <p className="text-sm text-muted">This auction has ended.</p>
        ) : isSignedIn ? (
          <form onSubmit={placeBid} className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-muted">
                Your bid (min ${minBid})
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min={minBid}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-40 rounded-sm border border-border bg-background px-3 py-2 text-foreground"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-sm bg-accent px-4 py-2 font-heading uppercase tracking-wide text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {isPending ? "Placing bid…" : "Place bid"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-muted">
            <Link href="/login" className="font-medium text-accent underline">
              Sign in
            </Link>{" "}
            to place a bid.
          </p>
        )}
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>

      <h2 className="mt-10 font-heading text-lg font-semibold uppercase tracking-wide text-foreground">
        Bid history
      </h2>
      {!bids.length && <p className="mt-2 text-sm text-muted">No bids yet — be the first.</p>}
      <ul className="mt-2 divide-y divide-border">
        {bids.map((bid) => (
          <li key={bid.id} className="flex justify-between py-2 text-sm">
            <span className="text-muted">Bidder #{bid.bidder_id.slice(0, 4).toUpperCase()}</span>
            <span className="font-medium text-foreground">${bid.amount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
