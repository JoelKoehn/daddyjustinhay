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
        <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          ${currentPrice}
        </span>
        <CountdownBadge endTime={endTime} />
      </div>

      <div className="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        {hasEnded ? (
          <p className="text-sm text-zinc-500">This auction has ended.</p>
        ) : isSignedIn ? (
          <form onSubmit={placeBid} className="flex flex-wrap items-end gap-3">
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Your bid (min ${minBid})
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min={minBid}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-40 rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
            >
              {isPending ? "Placing bid…" : "Place bid"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <Link href="/login" className="font-medium underline">
              Sign in
            </Link>{" "}
            to place a bid.
          </p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <h2 className="mt-10 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Bid history
      </h2>
      {!bids.length && (
        <p className="mt-2 text-sm text-zinc-500">No bids yet — be the first.</p>
      )}
      <ul className="mt-2 divide-y divide-zinc-200 dark:divide-zinc-800">
        {bids.map((bid) => (
          <li key={bid.id} className="flex justify-between py-2 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              Bidder #{bid.bidder_id.slice(0, 4).toUpperCase()}
            </span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              ${bid.amount}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
