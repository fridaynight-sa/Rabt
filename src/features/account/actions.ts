"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/session";
import { GENERIC_ERROR, authErrorMessage, confirmUrl } from "@/features/auth/shared";
import { firstFieldErrors, formValues, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import { changeEmailSchema, changePasswordSchema, merchantDetailsSchema } from "./schemas";

const WRONG_PASSWORD = "كلمة المرور الحالية غير صحيحة.";

/** Confirms the signed-in user typed their current password. */
async function verifyCurrentPassword(email: string | null, password: string): Promise<boolean> {
  if (!email) return false;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return !error;
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstFieldErrors(parsed.error) };
  }

  if (!(await verifyCurrentPassword(user.email, parsed.data.currentPassword))) {
    return { status: "error", fieldErrors: { currentPassword: WRONG_PASSWORD } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) {
    if (error.code !== "same_password") {
      console.error("password change failed", error.code, error.message);
    }
    return { status: "error", message: authErrorMessage(error.code) };
  }
  return { status: "success", message: "تغيّرت كلمة المرور." };
}

export async function changeEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const values = formValues(formData, ["newEmail"]);
  const parsed = changeEmailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstFieldErrors(parsed.error), values };
  }
  const { newEmail, currentPassword } = parsed.data;

  if (newEmail === user.email) {
    return { status: "error", fieldErrors: { newEmail: "هذا هو إيميلك الحالي." }, values };
  }
  if (!(await verifyCurrentPassword(user.email, currentPassword))) {
    return { status: "error", fieldErrors: { currentPassword: WRONG_PASSWORD }, values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser(
    { email: newEmail },
    { emailRedirectTo: confirmUrl("/dashboard") },
  );
  if (error) {
    console.error("email change failed", error.code, error.message);
    return { status: "error", message: authErrorMessage(error.code), values };
  }
  return {
    status: "success",
    message:
      "أرسلنا رابط تأكيد على الإيميل الجديد (وعلى إيميلك الحالي). الإيميل يتغير بعد ما تفتح الرابط.",
  };
}

export async function updateMerchantDetails(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser(["merchant"]);
  const values = formValues(formData, ["fullName", "phone"]);
  const parsed = merchantDetailsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstFieldErrors(parsed.error), values };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, phone: parsed.data.phone })
    .eq("id", user.id);
  if (error) {
    if (error.code === "23505") {
      return {
        status: "error",
        fieldErrors: { phone: "رقم الجوال مستخدم في حساب ثاني." },
        values,
      };
    }
    console.error("merchant details update failed", error.code, error.message);
    return { status: "error", message: GENERIC_ERROR, values };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "انحفظت التعديلات.", values };
}
