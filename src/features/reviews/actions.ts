"use server";

import { revalidatePath } from "next/cache";
import { GENERIC_ERROR } from "@/features/auth/shared";
import { requireUser } from "@/features/auth/session";
import { firstFieldErrors, formValues, type ActionResult, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import { reviewSchema } from "./schemas";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Creates the merchant's review of a provider, or updates it (one review each). */
export async function saveReview(
  providerId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser(["merchant"]);
  const values = formValues(formData, ["rating", "comment"]);
  if (!UUID.test(providerId)) return { status: "error", message: GENERIC_ERROR, values };
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstFieldErrors(parsed.error), values };
  }
  const { rating, comment } = parsed.data;
  const supabase = await createClient();

  const { data: provider } = await supabase
    .from("providers")
    .select("slug")
    .eq("id", providerId)
    .maybeSingle();
  if (!provider) return { status: "error", message: "المورد غير موجود.", values };

  const { data: existing, error: readError } = await supabase
    .from("reviews")
    .select("id")
    .eq("provider_id", providerId)
    .eq("merchant_id", user.id)
    .maybeSingle();
  if (readError) {
    console.error("review read failed", readError.code);
    return { status: "error", message: GENERIC_ERROR, values };
  }

  const { error } = existing
    ? await supabase.from("reviews").update({ rating, comment }).eq("id", existing.id)
    : await supabase
        .from("reviews")
        .insert({ provider_id: providerId, merchant_id: user.id, rating, comment });
  if (error) {
    // Two tabs submitting at once: the second insert hits the one-review rule.
    if (error.code === "23505") {
      return { status: "error", message: "قيّمت هذا المورد من قبل. حدّث الصفحة.", values };
    }
    console.error("review save failed", error.code, error.message);
    return { status: "error", message: GENERIC_ERROR, values };
  }

  revalidatePath(`/providers/${provider.slug}`);
  revalidatePath("/dashboard/merchant");
  return {
    status: "success",
    message: existing ? "تحدّث تقييمك." : "شكراً، انحفظ تقييمك.",
    values,
  };
}

export async function deleteReview(reviewId: string): Promise<ActionResult> {
  const user = await requireUser(["merchant"]);
  if (!UUID.test(reviewId)) return { ok: false, message: GENERIC_ERROR };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("merchant_id", user.id)
    .select("id");
  if (error) {
    console.error("review delete failed", error.code, error.message);
    return { ok: false, message: GENERIC_ERROR };
  }
  if (!data?.length) return { ok: false, message: "التقييم غير موجود." };
  revalidatePath("/", "layout");
  return { ok: true };
}
