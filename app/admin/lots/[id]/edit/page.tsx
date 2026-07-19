import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateLot, type AdminFormState } from "@/app/lib/actions/admin";
import { LotForm } from "@/components/lot-form";

export default async function EditLotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: lot }, { data: sellers }, { data: media }] = await Promise.all([
    supabase.from("lots").select("*").eq("id", id).single(),
    supabase.from("sellers").select("id, name").order("name"),
    supabase.from("lot_media").select("id, url, type").eq("lot_id", id).order("sort_order"),
  ]);

  if (!lot) {
    notFound();
  }

  async function updateThisLot(state: AdminFormState, formData: FormData) {
    "use server";
    return updateLot(id, state, formData);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide text-foreground">
        Edit lot
      </h1>

      <div className="mt-6">
        <LotForm
          sellers={sellers ?? []}
          action={updateThisLot}
          initial={{
            title: lot.title,
            description: lot.description,
            hay_type: lot.hay_type,
            region: lot.region,
            seller_id: lot.seller_id,
            bid_increment: Number(lot.bid_increment),
            end_time: lot.end_time,
            status: lot.status,
          }}
          existingMedia={media ?? []}
          lotId={id}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
