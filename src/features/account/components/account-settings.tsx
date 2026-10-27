import "server-only";
import { Card } from "@/components/ui/card";
import type { SessionUser } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ChangeEmailForm, ChangePasswordForm, MerchantDetailsForm } from "./account-forms";

/** The account settings sections. Merchants also edit their name and phone here. */
export async function AccountSettings({ user }: { user: SessionUser }) {
  let phone: string | null = null;
  if (user.role === "merchant") {
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select("phone").eq("id", user.id).single();
    phone = data?.phone ?? null;
  }

  return (
    <div className="space-y-6">
      {user.role === "merchant" && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">بياناتي</h2>
          <MerchantDetailsForm fullName={user.fullName} phone={phone} />
        </Card>
      )}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">الإيميل</h2>
        <ChangeEmailForm currentEmail={user.email} />
      </Card>
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">كلمة المرور</h2>
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
