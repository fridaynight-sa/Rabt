import Link from "next/link";
import { mediaUrl } from "@/lib/images";
import { Rating } from "./rating";

export type ProviderCardData = {
  slug: string;
  businessName: string;
  services: string;
  isVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  coverKey: string | null;
};

export function ProviderCard({
  provider,
  cityName,
}: {
  provider: ProviderCardData;
  cityName?: string;
}) {
  return (
    <article className="relative flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-brand-50">
        {provider.coverKey ? (
          // eslint-disable-next-line @next/next/no-img-element -- images are already resized on upload
          <img
            src={mediaUrl(provider.coverKey)}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center text-2xl font-bold text-brand-700">
            {provider.businessName.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
          <Link href={`/providers/${provider.slug}`} className="after:absolute after:inset-0">
            {provider.businessName}
          </Link>
          {provider.isVerified && (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800">
              موثّق
            </span>
          )}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-slate-600">
          {cityName && <span>{cityName}</span>}
          <Rating average={provider.ratingAvg} count={provider.ratingCount} />
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{provider.services}</p>
      </div>
    </article>
  );
}
