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
    <div className="flex-1 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          Active Hay Lots
        </h1>

        {!lots?.length && (
          <p className="mt-6 text-zinc-600 dark:text-zinc-400">
            No active lots right now. Check back soon.
          </p>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {lots?.map((lot) => {
            const photo = [...(lot.lot_media ?? [])].sort(
              (a, b) => a.sort_order - b.sort_order,
            )[0];

            return (
              <Link
                key={lot.id}
                href={`/lots/${lot.id}`}
                className="block overflow-hidden rounded-lg border border-zinc-200 transition-shadow hover:shadow-md dark:border-zinc-800"
              >
                <div className="aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-900">
                  {photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo.url}
                      alt={lot.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {lot.title}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {lot.hay_type} · {lot.region}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
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
