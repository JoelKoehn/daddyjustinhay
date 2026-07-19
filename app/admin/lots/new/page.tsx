import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createLot } from "@/app/lib/actions/admin";
import { LotForm } from "@/components/lot-form";

export default async function NewLotPage() {
  const supabase = await createClient();
  const { data: sellers } = await supabase.from("sellers").select("id, name").order("name");

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide text-foreground">
        New lot
      </h1>

      {!sellers?.length && (
        <p className="mt-4 text-sm text-muted">
          You need a seller first —{" "}
          <Link href="/admin/sellers" className="text-accent underline">
            add one here
          </Link>
          .
        </p>
      )}

      <div className="mt-6">
        <LotForm sellers={sellers ?? []} action={createLot} submitLabel="Create lot" />
      </div>
    </div>
  );
}
