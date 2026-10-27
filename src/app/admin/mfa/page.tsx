import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormPage } from "@/components/ui/card";
import { MfaEnroll, MfaVerify } from "@/features/admin/components/mfa-forms";
import { hasSecondStep } from "@/features/admin/session";
import { requireUser } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "التحقق بخطوتين", robots: { index: false } };

export default async function AdminMfaPage() {
  await requireUser(["admin"]);
  if (await hasSecondStep()) redirect("/admin");

  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.listFactors();
  const factor = data?.totp.find((f) => f.status === "verified");

  return factor ? (
    <FormPage title="التحقق بخطوتين" subtitle="افتح تطبيق المصادقة واكتب الرمز الحالي.">
      <MfaVerify factorId={factor.id} />
    </FormPage>
  ) : (
    <FormPage
      title="فعّل التحقق بخطوتين"
      subtitle="لوحة الإدارة تحتاج خطوة ثانية بعد كلمة المرور، عشان لو أحد عرف كلمة مرورك ما يقدر يدخل."
    >
      <MfaEnroll />
    </FormPage>
  );
}
