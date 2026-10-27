import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/features/auth/session";
import { ListingContact } from "@/features/listings/components/contact-buttons";
import { getListing } from "@/features/listings/queries";
import { Rating } from "@/features/providers/components/rating";
import { getProviderById, getReferenceData } from "@/features/providers/queries";
import { ReportButton } from "@/features/reports/components/report-button";
import { searchHref } from "@/features/search/params";
import { formatPrice, timeAgo } from "@/lib/format";
import { mediaUrl } from "@/lib/images";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await getListing((await params).id);
  if (!listing) return { title: "الإعلان غير موجود" };
  const description = listing.description.slice(0, 160);
  return {
    title: listing.title,
    description,
    openGraph: {
      title: listing.title,
      description,
      images: listing.images[0] ? [mediaUrl(listing.images[0].storageKey)] : undefined,
    },
  };
}

export default async function ListingPage({ params }: Props) {
  const listing = await getListing((await params).id);
  if (!listing) notFound();
  const [provider, ref, viewer] = await Promise.all([
    getProviderById(listing.providerId),
    getReferenceData(),
    getSessionUser(),
  ]);
  if (!provider) notFound();

  const city = ref.cities.find((c) => c.id === listing.cityId);
  const category = ref.categories.find((c) => c.id === listing.categoryId);
  const isOwner = viewer?.id === listing.providerId;
  const [cover, ...rest] = listing.images;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {isOwner && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-900">
          <span>
            {listing.status === "hidden"
              ? "هذا الإعلان مخفي من الإدارة، وما يشوفه غيرك."
              : "هذا إعلانك كما يشوفه التجار."}
          </span>
          <Link
            href={`/dashboard/provider/listings/${listing.id}`}
            className="font-semibold hover:underline"
          >
            تعديل
          </Link>
        </div>
      )}

      {/* Phones: photos, then title and contact, then description. Wide screens: two columns. */}
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-3 lg:col-start-1 lg:row-start-1">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
            {cover ? (
              <a href={mediaUrl(cover.storageKey)} target="_blank" rel="noopener">
                {/* eslint-disable-next-line @next/next/no-img-element -- images are already resized on upload */}
                <img
                  src={mediaUrl(cover.storageKey)}
                  alt={listing.title}
                  className="size-full object-cover"
                />
              </a>
            ) : (
              <div className="grid size-full place-items-center text-slate-400">بدون صورة</div>
            )}
          </div>
          {rest.length > 0 && (
            <ul className="grid grid-cols-4 gap-2">
              {rest.map((img, i) => (
                <li key={img.id} className="aspect-square overflow-hidden rounded-xl bg-slate-100">
                  <a href={mediaUrl(img.storageKey)} target="_blank" rel="noopener">
                    {/* eslint-disable-next-line @next/next/no-img-element -- images are already resized on upload */}
                    <img
                      src={mediaUrl(img.storageKey)}
                      alt={`${listing.title} (${i + 2})`}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h1 className="text-xl font-bold text-slate-900">{listing.title}</h1>
            <p className="mt-2 text-2xl font-bold text-brand-800">{formatPrice(listing.price)}</p>
            <dl className="mt-4 space-y-1 text-sm text-slate-600">
              {city && (
                <div className="flex gap-2">
                  <dt className="text-slate-500">المدينة:</dt>
                  <dd>
                    <Link href={searchHref({ city: city.slug })} className="hover:underline">
                      {city.name_ar}
                    </Link>
                  </dd>
                </div>
              )}
              {category && (
                <div className="flex gap-2">
                  <dt className="text-slate-500">الفئة:</dt>
                  <dd>
                    <Link
                      href={searchHref({ category: category.slug })}
                      className="hover:underline"
                    >
                      {category.name_ar}
                    </Link>
                  </dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="text-slate-500">نُشر:</dt>
                <dd>{timeAgo(listing.createdAt)}</dd>
              </div>
            </dl>
            <div className="mt-5">
              <ListingContact
                method={listing.contactMethod}
                number={provider.whatsapp}
                title={listing.title}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs text-slate-500">المعلن</p>
            <Link
              href={`/providers/${provider.slug}`}
              className="mt-1 block font-semibold text-slate-900 hover:underline"
            >
              {provider.businessName}
              {provider.isVerified && (
                <span className="ms-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800">
                  موثّق
                </span>
              )}
            </Link>
            <div className="mt-1">
              <Rating average={provider.ratingAvg} count={provider.ratingCount} />
            </div>
            <Link
              href={`/providers/${provider.slug}`}
              className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline"
            >
              صفحة المورد وكل إعلاناته
            </Link>
          </div>

          {!isOwner && (
            <div className="text-center">
              <ReportButton targetType="listing" targetId={listing.id} signedIn={Boolean(viewer)} />
            </div>
          )}
        </aside>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-start-1 lg:row-start-2 lg:self-start">
          <h2 className="text-lg font-semibold text-slate-900">الوصف</h2>
          <p className="mt-2 whitespace-pre-line text-slate-700">{listing.description}</p>
        </div>
      </div>
    </div>
  );
}
