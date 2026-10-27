"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { GENERIC_ERROR } from "@/features/auth/shared";
import { requireUser } from "@/features/auth/session";
import { firstFieldErrors, formValues, type ActionResult, type FormState } from "@/lib/form";
import { removeImages, storeImage } from "@/lib/storage/upload";
import { createClient } from "@/lib/supabase/server";
import { LISTING_IMAGE_LIMIT, listingSchema } from "./schemas";

const FIELDS = ["title", "description", "price", "cityId", "categoryId", "contactMethod"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function fkError(code: string | undefined): FormState["fieldErrors"] | null {
  // A city or category id that does not exist.
  return code === "23503" ? { cityId: "اختر من القائمة.", categoryId: "اختر من القائمة." } : null;
}

export async function createListing(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser(["provider"]);
  const values = formValues(formData, FIELDS);
  const parsed = listingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstFieldErrors(parsed.error), values };
  }
  const input = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .insert({
      provider_id: user.id,
      title: input.title,
      description: input.description,
      price: input.price,
      city_id: input.cityId,
      category_id: input.categoryId,
      contact_method: input.contactMethod,
    })
    .select("id")
    .single();
  if (error) {
    const fields = fkError(error.code);
    if (fields) return { status: "error", fieldErrors: fields, values };
    console.error("listing create failed", error.code, error.message);
    return { status: "error", message: GENERIC_ERROR, values };
  }

  revalidatePath("/", "layout");
  redirect(`/dashboard/provider/listings/${data.id}?new=1`);
}

export async function updateListing(
  listingId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser(["provider"]);
  const values = formValues(formData, FIELDS);
  if (!UUID.test(listingId)) return { status: "error", message: GENERIC_ERROR, values };
  const parsed = listingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstFieldErrors(parsed.error), values };
  }
  const input = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .update({
      title: input.title,
      description: input.description,
      price: input.price,
      city_id: input.cityId,
      category_id: input.categoryId,
      contact_method: input.contactMethod,
    })
    .eq("id", listingId)
    .eq("provider_id", user.id)
    .select("id");
  if (error) {
    const fields = fkError(error.code);
    if (fields) return { status: "error", fieldErrors: fields, values };
    console.error("listing update failed", error.code, error.message);
    return { status: "error", message: GENERIC_ERROR, values };
  }
  if (!data?.length) return { status: "error", message: "الإعلان غير موجود.", values };

  revalidatePath("/", "layout");
  return { status: "success", message: "انحفظ الإعلان.", values };
}

export async function deleteListing(listingId: string): Promise<ActionResult> {
  const user = await requireUser(["provider"]);
  if (!UUID.test(listingId)) return { ok: false, message: GENERIC_ERROR };
  const supabase = await createClient();

  const { data: images, error: imagesError } = await supabase
    .from("listing_images")
    .select("storage_key")
    .eq("listing_id", listingId);
  if (imagesError) {
    console.error("listing images read failed", imagesError.code);
    return { ok: false, message: GENERIC_ERROR };
  }

  const { data, error } = await supabase
    .from("listings")
    .delete()
    .eq("id", listingId)
    .eq("provider_id", user.id)
    .select("id");
  if (error) {
    console.error("listing delete failed", error.code, error.message);
    return { ok: false, message: GENERIC_ERROR };
  }
  if (!data?.length) return { ok: false, message: "الإعلان غير موجود." };

  // Images rows are removed with the listing; remove the files too.
  await removeImages((images ?? []).map((i) => i.storage_key));
  revalidatePath("/", "layout");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Listing images
// ---------------------------------------------------------------------------

export async function uploadListingImage(
  listingId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser(["provider"]);
  if (!UUID.test(listingId)) return { ok: false, message: GENERIC_ERROR };
  const supabase = await createClient();

  // Only the owner's own listing; row level security checks this again on insert.
  const { data: listing } = await supabase
    .from("listings")
    .select("id")
    .eq("id", listingId)
    .eq("provider_id", user.id)
    .maybeSingle();
  if (!listing) return { ok: false, message: "الإعلان غير موجود." };

  const { count } = await supabase
    .from("listing_images")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId);
  if ((count ?? 0) >= LISTING_IMAGE_LIMIT) {
    return { ok: false, message: `الحد ${LISTING_IMAGE_LIMIT} صور للإعلان.` };
  }

  const stored = await storeImage(formData.get("image"), `listings/${listingId}`);
  if (!stored.ok) return stored;

  const { error } = await supabase
    .from("listing_images")
    .insert({ listing_id: listingId, storage_key: stored.key });
  if (error) {
    await removeImages([stored.key]);
    if (error.code === "23514") {
      return { ok: false, message: `الحد ${LISTING_IMAGE_LIMIT} صور للإعلان.` };
    }
    console.error("listing image insert failed", error.code, error.message);
    return { ok: false, message: GENERIC_ERROR };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteListingImage(
  listingId: string,
  imageId: string,
): Promise<ActionResult> {
  await requireUser(["provider"]);
  if (!UUID.test(listingId) || !UUID.test(imageId)) return { ok: false, message: GENERIC_ERROR };
  const supabase = await createClient();
  // Row level security only lets the listing's owner delete.
  const { data, error } = await supabase
    .from("listing_images")
    .delete()
    .eq("id", imageId)
    .eq("listing_id", listingId)
    .select("storage_key")
    .maybeSingle();
  if (error) {
    console.error("listing image delete failed", error.code, error.message);
    return { ok: false, message: GENERIC_ERROR };
  }
  if (!data) return { ok: false, message: "الصورة غير موجودة." };

  await removeImages([data.storage_key]);
  revalidatePath("/", "layout");
  return { ok: true };
}
