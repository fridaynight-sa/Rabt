import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/features/auth/session";
import { ProviderProfileForm } from "@/features/providers/components/provider-profile-form";
import { getProviderById, getReferenceData } from "@/features/providers/queries";

export const metadata: Metadata = { title: "بيانات الصفحة" };

export default async function ProviderProfilePage() {
  const user = await requireUser(["provider"]);
  const [provider, ref] = await Promise.all([getProviderById(user.id), getReferenceData()]);
  if (!provider) notFound();

  return (
    <Card>
      <ProviderProfileForm
        defaults={{
          businessName: provider.businessName,
          cityId: provider.cityId,
          whatsapp: provider.whatsapp,
          services: provider.services,
          description: provider.description,
          sectorIds: provider.sectors.map((s) => s.id),
          categoryIds: provider.categories.map((c) => c.id),
        }}
        cities={ref.cities}
        sectors={ref.sectors}
        categories={ref.categories}
      />
    </Card>
  );
}
