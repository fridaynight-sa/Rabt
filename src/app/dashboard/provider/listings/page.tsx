import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/features/auth/session";
import { DeleteListingButton } from "@/features/listings/components/delete-listing-button";
import { getOwnListings } from "@/features/listings/queries";
import { formatPrice, timeAgo } from "@/lib/format";
import { mediaUrl } from "@/lib/images";

export const metadata: Metadata = { title: "إعلاناتي" };

export default async function ProviderListingsPage() {
  const user = await requireUser(["provider"]);
  const listings = await getOwnListings(user.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-600">{listings.length} إعلان</p>
        <ButtonLink href="/dashboard/provider/listings/new">إعلان جديد</ButtonLink>
      </div>

      {listings.length === 0 ? (
        <Card>
          <p className="text-center text-slate-600">
            ما عندك إعلانات للحين. أضف أول إعلان عشان يظهر للتجار في البحث.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {listings.map((l) => (
            <li
              key={l.id}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3"
            >
              <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {l.coverKey && (
                  // eslint-disable-next-line @next/next/no-img-element -- images are already resized on upload
                  <img src={mediaUrl(l.coverKey)} alt="" className="size-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/provider/listings/${l.id}`}
                  className="block truncate font-semibold text-slate-900 hover:underline"
                >
                  {l.title}
                </Link>
                <p className="text-sm text-slate-600">
                  {formatPrice(l.price)} · {timeAgo(l.createdAt)}
                </p>
                <p className="mt-0.5 flex flex-wrap gap-2 text-xs">
                  {l.status === "hidden" && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 font-semibold text-red-700">
                      مخفي من الإدارة
                    </span>
                  )}
                  {l.imageCount === 0 && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-800">
                      بدون صور
                    </span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
                <Link
                  href={`/dashboard/provider/listings/${l.id}`}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                >
                  تعديل
                </Link>
                <DeleteListingButton listingId={l.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
