import Link from "next/link";
import { formatPrice, timeAgo } from "@/lib/format";
import { mediaUrl } from "@/lib/images";
import type { ListingCardData } from "../queries";

export function ListingCard({
  listing,
  cityName,
}: {
  listing: ListingCardData;
  cityName?: string;
}) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="aspect-[4/3] bg-slate-100">
        {listing.coverKey ? (
          // eslint-disable-next-line @next/next/no-img-element -- images are already resized on upload
          <img
            src={mediaUrl(listing.coverKey)}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center text-sm text-slate-400">بدون صورة</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 font-semibold text-slate-900">
          <Link href={`/listings/${listing.id}`} className="after:absolute after:inset-0">
            {listing.title}
          </Link>
        </h3>
        <p className="font-bold text-brand-800">{formatPrice(listing.price)}</p>
        <p className="mt-auto pt-2 text-xs text-slate-500">
          {listing.providerName}
          {listing.providerVerified && <span className="text-brand-700"> · موثّق</span>}
          {cityName && ` · ${cityName}`} · {timeAgo(listing.createdAt)}
        </p>
      </div>
    </article>
  );
}

export function ListingGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">{children}</div>
  );
}
