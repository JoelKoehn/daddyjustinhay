import { createClient } from "@/lib/supabase/server";
import { SellerForm } from "@/components/seller-form";

export default async function AdminSellersPage() {
  const supabase = await createClient();
  const { data: sellers } = await supabase
    .from("sellers")
    .select("id, name, contact_email, region, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide text-foreground">
        Sellers
      </h1>

      <div className="mt-8 rounded-sm border border-border bg-background-elevated p-4">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted">
          Add a seller
        </h2>
        <div className="mt-3">
          <SellerForm />
        </div>
      </div>

      <ul className="mt-8 divide-y divide-border">
        {sellers?.map((seller) => (
          <li key={seller.id} className="py-3">
            <p className="font-medium text-foreground">{seller.name}</p>
            <p className="text-sm text-muted">
              {seller.contact_email || "No email"} · {seller.region || "No region"}
            </p>
          </li>
        ))}
        {!sellers?.length && <p className="py-3 text-sm text-muted">No sellers yet.</p>}
      </ul>
    </div>
  );
}
