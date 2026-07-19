import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LocalTime } from "@/components/local-time";

const statusColor: Record<string, string> = {
  draft: "text-muted",
  active: "text-success",
  ended: "text-accent",
  payment_failed: "text-danger",
  paid: "text-accent",
  shipped: "text-success",
  cancelled: "text-danger",
};

export default async function AdminHome() {
  const supabase = await createClient();
  const { data: lots } = await supabase
    .from("lots")
    .select("id, title, status, current_price, end_time")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide text-foreground">
          Lots
        </h1>
        <Link
          href="/admin/lots/new"
          className="rounded-sm bg-accent px-4 py-2 text-sm font-heading uppercase tracking-wide text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          + New lot
        </Link>
      </div>

      <ul className="mt-8 divide-y divide-border">
        {lots?.map((lot) => (
          <li key={lot.id} className="flex items-center justify-between py-3">
            <div>
              <Link
                href={`/admin/lots/${lot.id}/edit`}
                className="font-medium text-foreground hover:text-accent"
              >
                {lot.title}
              </Link>
              <p className="text-sm text-muted">
                ${lot.current_price} · ends <LocalTime iso={lot.end_time} />
              </p>
            </div>
            <span
              className={`font-heading text-xs uppercase tracking-wide ${statusColor[lot.status] ?? "text-muted"}`}
            >
              {lot.status}
            </span>
          </li>
        ))}
        {!lots?.length && <p className="py-3 text-sm text-muted">No lots yet.</p>}
      </ul>
    </div>
  );
}
