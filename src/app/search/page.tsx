import type { Metadata } from "next";
import Link from "next/link";
import { ListingCard, ListingGrid } from "@/features/listings/components/listing-card";
import { searchListings } from "@/features/listings/queries";
import { ProviderCard } from "@/features/providers/components/provider-card";
import { getReferenceData, searchProviders } from "@/features/providers/queries";
import { Pagination } from "@/features/search/components/pagination";
import { SearchFilters } from "@/features/search/components/search-filters";
import {
  parseSearchParams,
  searchHref,
  type ListingSort,
  type ProviderSort,
} from "@/features/search/params";

const PAGE_SIZE = 24;

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = parseSearchParams(await searchParams);
  return {
    title: params.q ? `نتائج البحث عن "${params.q}"` : "البحث",
    robots: { index: false },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const params = parseSearchParams(await searchParams);
  const ref = await getReferenceData();
  const idOf = (list: { id: number; slug: string }[], slug: string | null) =>
    slug ? (list.find((x) => x.slug === slug)?.id ?? -1) : null;
  const filters = {
    query: params.q || null,
    cityId: idOf(ref.cities, params.city),
    categoryId: idOf(ref.categories, params.category),
    sectorId: idOf(ref.sectors, params.sector),
    page: params.page,
    pageSize: PAGE_SIZE,
  };
  const cityName = (id: number) => ref.cities.find((c) => c.id === id)?.name_ar;

  const results =
    params.type === "listings"
      ? {
          kind: "listings" as const,
          ...(await searchListings({ ...filters, sort: params.sort as ListingSort })),
        }
      : {
          kind: "providers" as const,
          ...(await searchProviders({ ...filters, sort: params.sort as ProviderSort })),
        };
  const pageCount = Math.ceil(results.total / PAGE_SIZE);

  const tabs = [
    { type: "listings" as const, label: "الإعلانات" },
    { type: "providers" as const, label: "الموردين" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">
        {params.q ? `نتائج "${params.q}"` : "تصفح"}
      </h1>

      <nav aria-label="نوع النتائج" className="mt-4 flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.type}
            href={searchHref({ ...params, type: t.type, sort: undefined, page: 1 })}
            aria-current={params.type === t.type ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              params.type === t.type
                ? "bg-brand-700 text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_1fr]">
        <aside>
          {/* Collapsed on phones so results show first; always open on wide screens. */}
          <details className="rounded-2xl border border-slate-200 bg-white p-4 lg:hidden">
            <summary className="cursor-pointer font-semibold text-slate-900">
              الفلاتر والترتيب
            </summary>
            <div className="mt-4">
              <SearchFilters
                params={params}
                cities={ref.cities}
                sectors={ref.sectors}
                categories={ref.categories}
              />
            </div>
          </details>
          <div className="hidden rounded-2xl border border-slate-200 bg-white p-4 lg:block">
            <SearchFilters
              params={params}
              cities={ref.cities}
              sectors={ref.sectors}
              categories={ref.categories}
            />
          </div>
        </aside>

        <section aria-live="polite">
          <p className="mb-4 text-sm text-slate-600">
            {results.total === 0 ? "ما لقينا نتائج" : `${results.total} نتيجة`}
          </p>

          {results.total === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
              <p className="text-slate-700">جرّب كلمة ثانية أو شيل بعض الفلاتر.</p>
              <Link
                href={searchHref({ type: params.type })}
                className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline"
              >
                مسح الفلاتر
              </Link>
            </div>
          ) : results.kind === "listings" ? (
            <ListingGrid>
              {results.items.map((l) => (
                <ListingCard key={l.id} listing={l} cityName={cityName(l.cityId)} />
              ))}
            </ListingGrid>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {results.items.map((p) => (
                <ProviderCard key={p.id} provider={p} cityName={cityName(p.cityId)} />
              ))}
            </div>
          )}

          <div className="mt-8">
            <Pagination
              page={params.page}
              pageCount={pageCount}
              hrefFor={(page) => searchHref({ ...params, page })}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
