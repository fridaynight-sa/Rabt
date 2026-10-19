import type { Metadata } from "next";
import { FormPage } from "@/components/ui/card";
import { signOut } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "الحساب موقوف", robots: { index: false } };

export default function AccountSuspendedPage() {
  return (
    <FormPage title="حسابك موقوف">
      <p className="text-slate-700">
        تم إيقاف حسابك من إدارة المنصة. إذا تشوف إن فيه خطأ، تواصل معنا.
      </p>
      <form action={signOut} className="mt-6">
        <Button type="submit" variant="secondary">
          تسجيل الخروج
        </Button>
      </form>
    </FormPage>
  );
}
