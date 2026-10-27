import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/features/auth/session";
import { PortfolioManager } from "@/features/providers/components/portfolio-manager";
import { getProviderById } from "@/features/providers/queries";

export const metadata: Metadata = { title: "صور الأعمال" };

export default async function ProviderPortfolioPage() {
  const user = await requireUser(["provider"]);
  const provider = await getProviderById(user.id);
  if (!provider) notFound();

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900">صور الأعمال</h2>
      <p className="mt-1 mb-5 text-sm text-slate-600">
        صور من شغلك أو منتجاتك. تظهر في صفحتك العامة بنفس الترتيب.
      </p>
      <PortfolioManager images={provider.images} />
    </Card>
  );
}
