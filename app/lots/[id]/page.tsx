import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LotLive } from "@/components/lot-live";

export default async function LotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: lot, error: lotError } = await supabase
    .from("lots")
    .select(
      "id, title, description, hay_type, region, current_price, bid_increment, end_time, lot_media(url, type, sort_order)",
    )
    .eq("id", id)
    .single();

  if (lotError) {
    console.error("Failed to load lot", id, lotError.message);
  }

  if (!lot) {
    notFound();
  }

  const { data: bids, error: bidsError } = await supabase
    .from("bids")
    .select("id, amount, bidder_id, created_at")
    .eq("lot_id", id)
    .order("created_at", { ascending: false });

  if (bidsError) {
    console.error("Failed to load bids for lot", id, bidsError.message);
  }

  const media = [...(lot.lot_media ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {media.map((item) =>
          item.type === "video" ? (
            <video
              key={item.url}
              src={item.url}
              controls
              className="col-span-2 aspect-video w-full rounded-lg bg-zinc-100 sm:col-span-3 dark:bg-zinc-900"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={item.url}
              src={item.url}
              alt={lot.title}
              className="aspect-square w-full rounded-lg object-cover"
            />
          ),
        )}
      </div>

      <h1 className="mt-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {lot.title}
      </h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        {lot.hay_type} · {lot.region}
      </p>

      {lot.description && (
        <p className="mt-6 whitespace-pre-line text-zinc-700 dark:text-zinc-300">
          {lot.description}
        </p>
      )}

      <LotLive
        lotId={lot.id}
        initialCurrentPrice={Number(lot.current_price)}
        initialEndTime={lot.end_time}
        bidIncrement={Number(lot.bid_increment)}
        initialBids={bids ?? []}
        isSignedIn={!!user}
      />
    </div>
  );
}
