import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormPage } from "@/components/ui/card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "كلمة مرور جديدة" };

export default async function ResetPasswordPage() {
  // The reset link signs the user in first (see /auth/confirm).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/forgot-password");

  return (
    <FormPage title="كلمة مرور جديدة">
      <ResetPasswordForm />
    </FormPage>
  );
}
