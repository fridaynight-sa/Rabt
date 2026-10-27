"use server";

import { redirect } from "next/navigation";
import { firstFieldErrors, formValues, type FormState } from "@/lib/form";
import { safeNextPath } from "@/lib/safe-redirect";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  merchantSignUpSchema,
  providerSignUpSchema,
  resetPasswordSchema,
} from "./schemas";
import { homeForRole } from "./session";
import { BAD_LOGIN, GENERIC_ERROR, authErrorMessage, confirmUrl } from "./shared";

async function phoneInUse(phone: string): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from("profiles")
    .select("id")
    .eq("phone", phone)
    .limit(1);
  if (error) throw error;
  return data.length > 0;
}

// ---------------------------------------------------------------------------
// Sign up
// ---------------------------------------------------------------------------

export async function signUpMerchant(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ["fullName", "email", "phone"]);
  const parsed = merchantSignUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstFieldErrors(parsed.error), values };
  }
  const input = parsed.data;

  if (input.phone && (await phoneInUse(input.phone))) {
    return { status: "error", fieldErrors: { phone: "رقم الجوال مستخدم في حساب ثاني." }, values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: confirmUrl("/dashboard"),
      data: { account_type: "merchant", full_name: input.fullName, phone: input.phone },
    },
  });
  if (error) {
    console.error("merchant sign up failed", error.code, error.message);
    return { status: "error", message: authErrorMessage(error.code), values };
  }

  redirect("/signup/check-email");
}

export async function signUpProvider(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ["fullName", "cityId", "email", "whatsapp", "services"]);
  const parsed = providerSignUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstFieldErrors(parsed.error), values };
  }
  const input = parsed.data;

  const supabase = await createClient();
  const { data: city } = await supabase
    .from("cities")
    .select("id")
    .eq("id", input.cityId)
    .maybeSingle();
  if (!city) {
    return { status: "error", fieldErrors: { cityId: "اختر المدينة من القائمة." }, values };
  }

  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: confirmUrl("/dashboard"),
      data: {
        account_type: "provider",
        full_name: input.fullName,
        city_id: String(input.cityId),
        whatsapp: input.whatsapp,
        services: input.services,
      },
    },
  });
  if (error) {
    console.error("provider sign up failed", error.code, error.message);
    return { status: "error", message: authErrorMessage(error.code), values };
  }

  redirect("/signup/check-email");
}

// ---------------------------------------------------------------------------
// Login and logout
// ---------------------------------------------------------------------------

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ["identifier", "next"]);
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstFieldErrors(parsed.error), values };
  }
  const { identifier, password, next } = parsed.data;

  let email = identifier.value;
  if (identifier.kind === "phone") {
    const { data, error } = await createAdminClient().rpc("get_login_email_for_phone", {
      p_phone: identifier.value,
    });
    if (error) {
      console.error("phone lookup failed", error.message);
      return { status: "error", message: GENERIC_ERROR, values };
    }
    // Same message as a wrong password, so nobody can test which numbers exist.
    if (!data) return { status: "error", message: BAD_LOGIN, values };
    email = data;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { status: "error", message: authErrorMessage(error.code), values };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile || profile.status !== "active") {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "حسابك موقوف. تواصل مع إدارة المنصة.",
      values,
    };
  }

  redirect(safeNextPath(next, homeForRole(profile.role)));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData, ["email"]);
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstFieldErrors(parsed.error), values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: confirmUrl("/reset-password"),
  });
  if (error && error.code?.startsWith("over_")) {
    return { status: "error", message: authErrorMessage(error.code), values };
  }
  if (error) console.error("password reset request failed", error.code, error.message);

  // Same answer whether or not the email exists.
  return {
    status: "success",
    message: "إذا الإيميل مسجل عندنا، بيوصلك رابط لتغيير كلمة المرور خلال دقائق.",
  };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      status: "error",
      message: "انتهت صلاحية الرابط. اطلب رابط جديد من صفحة نسيت كلمة المرور.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return {
      status: "error",
      message: authErrorMessage(error.code),
    };
  }

  redirect("/dashboard");
}
