import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/features/auth/session";

export const metadata: Metadata = { title: "حسابي" };

export default async function MerchantDashboardPage() {
  const user = await requireUser(["merchant"]);
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">أهلاً {user.fullName}</h1>
      <Card className="mt-6">
        <p className="text-slate-700">حسابك جاهز.</p>
        <p className="mt-2 text-sm text-slate-500">
          البحث عن الموردين يجي في المرحلة الثالثة، والتقييم في المرحلة الرابعة.
        </p>
        <ButtonLink href="/dashboard/account" variant="secondary" className="mt-4">
          إعدادات الحساب
        </ButtonLink>
      </Card>
    </div>
  );
}
