"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/session";
import { firstFieldErrors, type FormState } from "@/lib/form";
import { MAX_UPLOAD_BYTES, PORTFOLIO_LIMIT, detectImageType, extensionFor } from "@/lib/images";
import { getMediaBucket } from "@/lib/storage/r2";
import { createClient } from "@/lib/supabase/server";
import { providerProfileSchema, readProfileForm } from "./schemas";

const GENERIC_ERROR = "صار خطأ غير متوقع. حاول مرة ثانية بعد شوي.";

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

export type UploadResult = { ok: true } | { ok: false; message: string };

export async function uploadPortfolioImage(formData: FormData): Promise<UploadResult> {
  const user = await requireUser(["provider"]);
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "اختر صورة." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: "الصورة كبيرة، الحد 3 ميجا." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) {
    return { ok: false, message: "نوع الملف غير مدعوم. الصيغ المقبولة: JPG وPNG وWEBP." };
  }

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

  const key = `portfolio/${user.id}/${crypto.randomUUID()}.${extensionFor(type)}`;
  const bucket = await getMediaBucket();
  await bucket.put(key, bytes, { httpMetadata: { contentType: type } });

  const { error } = await supabase
    .from("portfolio_images")
    .insert({ provider_id: user.id, storage_key: key });
  if (error) {
    // Do not leave a file behind that no row points to.
    await bucket.delete(key);
    if (error.code === "23514") {
      return { ok: false, message: `وصلت الحد الأعلى (${PORTFOLIO_LIMIT} صورة).` };
    }
    console.error("portfolio insert failed", error.code, error.message);
    return { ok: false, message: GENERIC_ERROR };
  }

  revalidatePath("/dashboard/provider", "layout");
  return { ok: true };
}

export async function deletePortfolioImage(imageId: string): Promise<UploadResult> {
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

  await (await getMediaBucket()).delete(data.storage_key);
  revalidatePath("/dashboard/provider", "layout");
  return { ok: true };
}
