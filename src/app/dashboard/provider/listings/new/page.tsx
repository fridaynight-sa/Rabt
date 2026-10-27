import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/features/auth/session";
import { createListing } from "@/features/listings/actions";
import { ListingForm } from "@/features/listings/components/listing-form";
import { getProviderById, getReferenceData } from "@/features/providers/queries";

export const metadata: Metadata = { title: "إعلان جديد" };

export default async function NewListingPage() {
  const user = await requireUser(["provider"]);
  const [provider, ref] = await Promise.all([getProviderById(user.id), getReferenceData()]);
  if (!provider) notFound();

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900">إعلان جديد</h2>
      <p className="mt-1 mb-5 text-sm text-slate-600">بعد الحفظ تضيف صور الإعلان (لين 5 صور).</p>
      <ListingForm
        action={createListing}
        defaults={{
          title: "",
          description: "",
          price: null,
          cityId: provider.cityId,
          categoryId: provider.categories[0]?.id ?? null,
          contactMethod: "whatsapp",
        }}
        cities={ref.cities}
        categories={ref.categories}
        submitLabel="حفظ ومتابعة للصور"
      />
    </Card>
  );
}
