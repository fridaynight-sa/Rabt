import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/features/auth/session";

export const metadata: Metadata = { title: "لوحة المورد" };

export default async function ProviderDashboardPage() {
  const user = await requireUser(["provider"]);
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">أهلاً {user.fullName}</h1>
      <Card className="mt-6">
        <p className="text-slate-700">حسابك جاهز.</p>
        <p className="mt-2 text-sm text-slate-500">
          تعديل صفحتك وإضافة صور أعمالك تجي في المرحلة الثانية، والإعلانات في المرحلة الثالثة.
        </p>
      </Card>
    </div>
  );
}
