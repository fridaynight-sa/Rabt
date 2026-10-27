"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { merchantSignUpSchema, providerSignUpSchema } from "@/features/auth/schemas";
import { GENERIC_ERROR, authErrorMessage } from "@/features/auth/shared";
import { firstFieldErrors, formValues, type ActionResult, type FormState } from "@/lib/form";
import { removeImages } from "@/lib/storage/upload";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AccountStatus, ListingStatus, ReportStatus } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { accountTypeSchema, referenceSchema } from "./schemas";
import { requireAdmin } from "./session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Maps database refusals to short Arabic messages. */
function fail(error: { code?: string; message: string }, what: string): ActionResult {
  if (error.code === "42501") return { ok: false, message: "ما عندك صلاحية لهذا الإجراء." };
  if (error.code === "P0002") return { ok: false, message: "العنصر غير موجود، يمكن انحذف." };
  console.error(`admin ${what} failed`, error.code, error.message);
  return { ok: false, message: GENERIC_ERROR };
}

/**
 * The database must agree this session is an admin (role, active, second step)
 * before the server uses the full-access key on its behalf.
 */
async function confirmAdminInDatabase() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_admin");
  if (error || data !== true) throw new Error("admin check failed");
  return supabase;
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export async function setAccountStatus(
  userId: string,
  status: AccountStatus,
): Promise<ActionResult> {
  await requireAdmin();
  if (!UUID.test(userId)) return { ok: false, message: GENERIC_ERROR };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_account_status", {
    p_user_id: userId,
    p_status: status,
  });
  if (error) return fail(error, "status");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setProviderVerified(
  providerId: string,
  verified: boolean,
): Promise<ActionResult> {
  await requireAdmin();
  if (!UUID.test(providerId)) return { ok: false, message: GENERIC_ERROR };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_provider_verified", {
    p_provider_id: providerId,
    p_verified: verified,
  });
  if (error) return fail(error, "verify");
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Deletes an account, its data and its images. Cannot delete admins. */
export async function deleteAccount(userId: string): Promise<ActionResult> {
  const me = await requireAdmin();
  if (!UUID.test(userId) || userId === me.id) return { ok: false, message: GENERIC_ERROR };
  const supabase = await confirmAdminInDatabase();

  const { data: target } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", userId)
    .maybeSingle();
  if (!target) return { ok: false, message: "الحساب غير موجود." };
  if (target.role === "admin") return { ok: false, message: "ما يمكن حذف حساب أدمن من هنا." };

  // Collect the account's image files before the rows disappear.
  const service = createAdminClient();
  const [portfolio, listings] = await Promise.all([
    service.from("portfolio_images").select("storage_key").eq("provider_id", userId),
    service.from("listings").select("id").eq("provider_id", userId),
  ]);
  const listingIds = (listings.data ?? []).map((l) => l.id);
  const listingImages = listingIds.length
    ? await service.from("listing_images").select("storage_key").in("listing_id", listingIds)
    : { data: [] };
  const keys = [
    ...(portfolio.data ?? []).map((i) => i.storage_key),
    ...(listingImages.data ?? []).map((i) => i.storage_key),
  ];

  // Log first: the log entry must exist even if a later step fails.
  const { error: logError } = await supabase.rpc("admin_log", {
    p_action: "account.delete",
    p_target_type: "account",
    p_target_id: userId,
    p_details: { name: target.full_name, role: target.role, images: keys.length },
  });
  if (logError) return fail(logError, "delete log");

  const { error } = await service.auth.admin.deleteUser(userId);
  if (error) {
    console.error("admin delete user failed", error.code, error.message);
    return { ok: false, message: GENERIC_ERROR };
  }
  await removeImages(keys);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Creates a confirmed merchant or provider account with a password the admin sets. */
export async function createAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const fields = ["accountType", "fullName", "email", "phone", "cityId", "whatsapp", "services"];
  const values = formValues(formData, fields);
  const type = accountTypeSchema.safeParse(formData.get("accountType"));
  if (!type.success) {
    return { status: "error", fieldErrors: { accountType: "اختر نوع الحساب" }, values };
  }

  const raw = Object.fromEntries(formData);
  let email: string;
  let password: string;
  let metadata: Record<string, string | null>;
  if (type.data === "merchant") {
    const parsed = merchantSignUpSchema.safeParse(raw);
    if (!parsed.success) {
      return { status: "error", fieldErrors: firstFieldErrors(parsed.error), values };
    }
    ({ email, password } = parsed.data);
    metadata = {
      account_type: "merchant",
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
    };
  } else {
    const parsed = providerSignUpSchema.safeParse(raw);
    if (!parsed.success) {
      return { status: "error", fieldErrors: firstFieldErrors(parsed.error), values };
    }
    ({ email, password } = parsed.data);
    metadata = {
      account_type: "provider",
      full_name: parsed.data.fullName,
      city_id: String(parsed.data.cityId),
      whatsapp: parsed.data.whatsapp,
      services: parsed.data.services,
    };
  }

  const supabase = await confirmAdminInDatabase();
  const service = createAdminClient();
  if (metadata.phone) {
    const { data: taken } = await service
      .from("profiles")
      .select("id")
      .eq("phone", metadata.phone)
      .limit(1);
    if (taken?.length) {
      return { status: "error", fieldErrors: { phone: "رقم الجوال مستخدم في حساب ثاني." }, values };
    }
  }

  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error || !data.user) {
    console.error("admin create user failed", error?.code, error?.message);
    const message =
      error?.code === "email_exists"
        ? authErrorMessage("email_exists")
        : authErrorMessage(error?.code);
    return { status: "error", message, values };
  }

  await supabase.rpc("admin_log", {
    p_action: "account.create",
    p_target_type: "account",
    p_target_id: data.user.id,
    p_details: { role: type.data, name: metadata.full_name },
  });
  revalidatePath("/admin", "layout");
  redirect(`/admin/accounts?created=1&q=${encodeURIComponent(email)}`);
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export async function setListingStatus(
  listingId: string,
  status: ListingStatus,
): Promise<ActionResult> {
  await requireAdmin();
  if (!UUID.test(listingId)) return { ok: false, message: GENERIC_ERROR };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_listing_status", {
    p_listing_id: listingId,
    p_status: status,
  });
  if (error) return fail(error, "listing");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function adminDeleteReview(reviewId: string): Promise<ActionResult> {
  await requireAdmin();
  if (!UUID.test(reviewId)) return { ok: false, message: GENERIC_ERROR };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_review", { p_review_id: reviewId });
  if (error) return fail(error, "review");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function resolveReport(reportId: string, status: ReportStatus): Promise<ActionResult> {
  await requireAdmin();
  if (!UUID.test(reportId) || status === "open") return { ok: false, message: GENERIC_ERROR };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_resolve_report", {
    p_report_id: reportId,
    p_status: status,
  });
  if (error) return fail(error, "report");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Cities, sectors, categories
// ---------------------------------------------------------------------------

export async function saveReference(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const values = formValues(formData, ["kind", "id", "slug", "nameAr", "sortOrder"]);
  const parsed = referenceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstFieldErrors(parsed.error), values };
  }
  const { kind, id, slug, nameAr, sortOrder } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_reference", {
    p_kind: kind,
    p_id: id,
    p_slug: slug,
    p_name_ar: nameAr,
    p_sort_order: sortOrder,
  });
  if (error) {
    if (error.code === "23505") {
      return { status: "error", message: "الاسم أو الرابط مستخدم من قبل.", values };
    }
    const r = fail(error, "reference");
    return { status: "error", message: r.ok ? GENERIC_ERROR : r.message, values };
  }
  revalidatePath("/", "layout");
  return { status: "success", message: id ? "انحفظ التعديل." : "انضاف." };
}
