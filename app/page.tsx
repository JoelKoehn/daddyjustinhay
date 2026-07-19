import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CountdownBadge } from "@/components/countdown-badge";

export default async function Home() {
  const supabase = await createClient();
  const { data: lots, error } = await supabase
    .from("lots")
    .select("id, title, hay_type, region, current_price, end_time, lot_media(url, sort_order)")
    .eq("status", "active")
    .order("end_time", { ascending: true });

  if (error) {
    console.error("Failed to load active lots:", error.message);
  }

  return (
    <div className="flex-1">
      <div className="border-b border-border bg-background-elevated">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h1 className="font-heading text-4xl font-semibold uppercase tracking-wide text-foreground sm:text-5xl">
            Active Hay Lots
          </h1>
          <p className="mt-3 max-w-xl text-muted">
            Straight from the field to the highest bidder. Bid with confidence — every lot ships
            from a vetted seller.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">
        {!lots?.length && (
          <p className="text-muted">No active lots right now. Check back soon.</p>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {lots?.map((lot) => {
            const photo = [...(lot.lot_media ?? [])].sort(
              (a, b) => a.sort_order - b.sort_order,
            )[0];

            return (
              <Link
                key={lot.id}
                href={`/lots/${lot.id}`}
                className="group block overflow-hidden rounded-sm border border-border bg-background-elevated transition-colors hover:border-accent"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-background">
                  {photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo.url}
                      alt={lot.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-heading text-lg font-medium uppercase tracking-wide text-foreground">
                    {lot.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {lot.hay_type} · {lot.region}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-heading text-xl font-semibold text-foreground">
                      ${lot.current_price}
                    </span>
                    <CountdownBadge endTime={lot.end_time} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
