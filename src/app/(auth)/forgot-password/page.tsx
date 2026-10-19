import type { Metadata } from "next";
import { FormPage } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "نسيت كلمة المرور" };

export default function ForgotPasswordPage() {
  return (
    <FormPage title="نسيت كلمة المرور" subtitle="اكتب إيميلك ونرسل لك رابط تغيير كلمة المرور">
      <ForgotPasswordForm />
    </FormPage>
  );
}
