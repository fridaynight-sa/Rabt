import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageManager } from "@/components/image-manager";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/features/auth/session";
import { deleteListingImage, updateListing, uploadListingImage } from "@/features/listings/actions";
import { DeleteListingButton } from "@/features/listings/components/delete-listing-button";
import { ListingForm } from "@/features/listings/components/listing-form";
import { getListing } from "@/features/listings/queries";
import { LISTING_IMAGE_LIMIT } from "@/features/listings/schemas";
import { getReferenceData } from "@/features/providers/queries";

export const metadata: Metadata = { title: "تعديل الإعلان" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
};

export default async function EditListingPage({ params, searchParams }: Props) {
  const user = await requireUser(["provider"]);
  const [{ id }, { new: isNew }] = await Promise.all([params, searchParams]);
  const [listing, ref] = await Promise.all([getListing(id), getReferenceData()]);
  if (!listing || listing.providerId !== user.id) notFound();

  return (
    <div className="space-y-6">
      {isNew && listing.images.length === 0 && (
        <Alert tone="success">انحفظ الإعلان. أضف صوره الحين عشان يلفت انتباه التجار.</Alert>
      )}
      {listing.status === "hidden" && (
        <Alert tone="error">هذا الإعلان مخفي من الإدارة، وما يظهر للتجار.</Alert>
      )}

      <Card>
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">صور الإعلان</h2>
          <Link
            href={`/listings/${listing.id}`}
            className="text-sm font-semibold text-brand-700 hover:underline"
          >
            عرض الإعلان
          </Link>
        </div>
        <ImageManager
          images={listing.images}
          limit={LISTING_IMAGE_LIMIT}
          upload={uploadListingImage.bind(null, listing.id)}
          remove={deleteListingImage.bind(null, listing.id)}
          emptyText="ما أضفت صور للحين. أول صورة تكون صورة الإعلان الرئيسية."
          altText="صورة الإعلان"
        />
      </Card>

      <Card>
        <h2 className="mb-5 text-lg font-semibold text-slate-900">بيانات الإعلان</h2>
        <ListingForm
          action={updateListing.bind(null, listing.id)}
          defaults={{
            title: listing.title,
            description: listing.description,
            price: listing.price,
            cityId: listing.cityId,
            categoryId: listing.categoryId,
            contactMethod: listing.contactMethod,
          }}
          cities={ref.cities}
          categories={ref.categories}
          submitLabel="حفظ التعديلات"
        />
      </Card>

      <div className="flex justify-end">
        <DeleteListingButton listingId={listing.id} redirectTo="/dashboard/provider/listings" />
      </div>
    </div>
  );
}
