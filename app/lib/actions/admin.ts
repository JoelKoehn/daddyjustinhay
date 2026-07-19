"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminFormState = { error?: string } | undefined;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not signed in.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Admins only.");
  }

  return { supabase, user };
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function uploadLotPhotos(
  supabase: SupabaseServerClient,
  lotId: string,
  files: File[],
  sortOffset = 0,
) {
  let index = 0;
  for (const file of files) {
    if (!file || file.size === 0) continue;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${lotId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("lot-media").upload(path, file);
    if (uploadError) {
      throw new Error(`Photo upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage.from("lot-media").getPublicUrl(path);
    const { error: insertError } = await supabase.from("lot_media").insert({
      lot_id: lotId,
      url: publicUrlData.publicUrl,
      type: "photo",
      sort_order: sortOffset + index,
    });
    if (insertError) {
      throw new Error(`Saving photo failed: ${insertError.message}`);
    }
    index += 1;
  }
}

export async function createLot(
  _state: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  let supabase: SupabaseServerClient;
  try {
    ({ supabase } = await requireAdmin());
  } catch (e) {
    return { error: (e as Error).message };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const hayType = String(formData.get("hay_type") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const sellerId = String(formData.get("seller_id") ?? "");
  const startingPrice = Number(formData.get("starting_price"));
  const bidIncrement = Number(formData.get("bid_increment"));
  const endTimeIso = String(formData.get("end_time") ?? "");
  const status = String(formData.get("status") ?? "draft");

  if (
    !title ||
    !sellerId ||
    !endTimeIso ||
    !Number.isFinite(startingPrice) ||
    !Number.isFinite(bidIncrement)
  ) {
    return { error: "Fill in all required fields." };
  }

  const { data: lot, error: insertError } = await supabase
    .from("lots")
    .insert({
      title,
      description,
      hay_type: hayType,
      region,
      seller_id: sellerId,
      starting_price: startingPrice,
      bid_increment: bidIncrement,
      current_price: startingPrice,
      end_time: endTimeIso,
      status,
    })
    .select("id")
    .single();

  if (insertError || !lot) {
    return { error: insertError?.message ?? "Could not create the lot." };
  }

  const files = formData.getAll("photos") as File[];
  try {
    await uploadLotPhotos(supabase, lot.id, files);
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidatePath("/admin");
  redirect(`/admin/lots/${lot.id}/edit`);
}

export async function updateLot(
  lotId: string,
  _state: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  let supabase: SupabaseServerClient;
  try {
    ({ supabase } = await requireAdmin());
  } catch (e) {
    return { error: (e as Error).message };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const hayType = String(formData.get("hay_type") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const sellerId = String(formData.get("seller_id") ?? "");
  const bidIncrement = Number(formData.get("bid_increment"));
  const endTimeIso = String(formData.get("end_time") ?? "");
  const status = String(formData.get("status") ?? "draft");

  if (!title || !sellerId || !endTimeIso || !Number.isFinite(bidIncrement)) {
    return { error: "Fill in all required fields." };
  }

  const { error: updateError } = await supabase
    .from("lots")
    .update({
      title,
      description,
      hay_type: hayType,
      region,
      seller_id: sellerId,
      bid_increment: bidIncrement,
      end_time: endTimeIso,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", lotId);

  if (updateError) {
    return { error: updateError.message };
  }

  const { count } = await supabase
    .from("lot_media")
    .select("id", { count: "exact", head: true })
    .eq("lot_id", lotId);

  const files = (formData.getAll("photos") as File[]).filter((f) => f && f.size > 0);
  try {
    await uploadLotPhotos(supabase, lotId, files, count ?? 0);
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/lots/${lotId}/edit`);
  return {};
}

export async function deleteLotMedia(mediaId: string) {
  const { supabase } = await requireAdmin();

  const { data: media } = await supabase
    .from("lot_media")
    .select("url, lot_id")
    .eq("id", mediaId)
    .single();

  if (!media) return;

  const path = media.url.split("/lot-media/")[1];
  if (path) {
    await supabase.storage.from("lot-media").remove([path]);
  }

  await supabase.from("lot_media").delete().eq("id", mediaId);
  revalidatePath(`/admin/lots/${media.lot_id}/edit`);
}

export async function createSeller(
  _state: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  let supabase: SupabaseServerClient;
  try {
    ({ supabase } = await requireAdmin());
  } catch (e) {
    return { error: (e as Error).message };
  }

  const name = String(formData.get("name") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();

  if (!name) {
    return { error: "Seller name is required." };
  }

  const { error } = await supabase.from("sellers").insert({
    name,
    contact_email: contactEmail || null,
    region: region || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/sellers");
  return {};
}
