"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/session";
import { GENERIC_ERROR } from "@/features/auth/shared";
import { firstFieldErrors, type ActionResult, type FormState } from "@/lib/form";
import { PORTFOLIO_LIMIT } from "@/lib/images";
import { removeImages, storeImage } from "@/lib/storage/upload";
import { createClient } from "@/lib/supabase/server";
import { providerProfileSchema, readProfileForm } from "./schemas";

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function updateProviderProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser(["provider"]);
  const raw = readProfileForm(formData);
  const parsed = providerProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstFieldErrors(parsed.error) };
  }
  const input = parsed.data;
  const supabase = await createClient();

  const { error: providerError } = await supabase
    .from("providers")
    .update({
      business_name: input.businessName,
      city_id: input.cityId,
      whatsapp: input.whatsapp,
      services: input.services,
      description: input.description,
    })
    .eq("id", user.id);
  if (providerError) {
    if (providerError.code === "23503") {
      return { status: "error", fieldErrors: { cityId: "اختر المدينة من القائمة." } };
    }
    console.error("provider update failed", providerError.code, providerError.message);
    return { status: "error", message: GENERIC_ERROR };
  }

  // Keep the account name the same as the business name.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: input.businessName })
    .eq("id", user.id);
  if (profileError) console.error("profile name sync failed", profileError.code);

  const { error: tagsError } = await supabase.rpc("set_provider_tags", {
    p_sector_ids: input.sectorIds,
    p_category_ids: input.categoryIds,
  });
  if (tagsError) {
    console.error("provider tags update failed", tagsError.code, tagsError.message);
    return { status: "error", message: "انحفظت البيانات، لكن الأقسام ما انحفظت. حاول مرة ثانية." };
  }

  revalidatePath("/dashboard/provider", "layout");
  return { status: "success", message: "انحفظت التعديلات." };
}

// ---------------------------------------------------------------------------
// Portfolio images
// ---------------------------------------------------------------------------

export async function uploadPortfolioImage(formData: FormData): Promise<ActionResult> {
  const user = await requireUser(["provider"]);
  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("portfolio_images")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", user.id);
  if (countError) {
    console.error("portfolio count failed", countError.code);
    return { ok: false, message: GENERIC_ERROR };
  }
  if ((count ?? 0) >= PORTFOLIO_LIMIT) {
    return { ok: false, message: `وصلت الحد الأعلى (${PORTFOLIO_LIMIT} صورة). احذف صورة أول.` };
  }

  const stored = await storeImage(formData.get("image"), `portfolio/${user.id}`);
  if (!stored.ok) return stored;

  const { error } = await supabase
    .from("portfolio_images")
    .insert({ provider_id: user.id, storage_key: stored.key });
  if (error) {
    // Do not leave a file behind that no row points to.
    await removeImages([stored.key]);
    if (error.code === "23514") {
      return { ok: false, message: `وصلت الحد الأعلى (${PORTFOLIO_LIMIT} صورة).` };
    }
    console.error("portfolio insert failed", error.code, error.message);
    return { ok: false, message: GENERIC_ERROR };
  }

  revalidatePath("/dashboard/provider", "layout");
  return { ok: true };
}

export async function deletePortfolioImage(imageId: string): Promise<ActionResult> {
  const user = await requireUser(["provider"]);
  if (!/^[0-9a-f-]{36}$/.test(imageId)) return { ok: false, message: GENERIC_ERROR };

  const supabase = await createClient();
  // Row level security only lets the owner delete; "returning" tells us what was removed.
  const { data, error } = await supabase
    .from("portfolio_images")
    .delete()
    .eq("id", imageId)
    .eq("provider_id", user.id)
    .select("storage_key")
    .maybeSingle();
  if (error) {
    console.error("portfolio delete failed", error.code, error.message);
    return { ok: false, message: GENERIC_ERROR };
  }
  if (!data) return { ok: false, message: "الصورة غير موجودة." };

  await removeImages([data.storage_key]);
  revalidatePath("/dashboard/provider", "layout");
  return { ok: true };
}
