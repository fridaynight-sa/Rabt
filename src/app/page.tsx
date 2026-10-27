import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { ListingCard, ListingGrid } from "@/features/listings/components/listing-card";
import { searchListings } from "@/features/listings/queries";
import { ProviderCard } from "@/features/providers/components/provider-card";
import { getReferenceData, searchProviders } from "@/features/providers/queries";
import { SearchBar } from "@/features/search/components/search-bar";
import { searchHref } from "@/features/search/params";

const sectorBlurbs: Record<string, string> = {
  restaurants: "معدات المطابخ، الخامات، الأثاث والتغليف",
  cafes: "مكائن القهوة، الحبوب، الديكور والتجهيز",
  "online-stores": "التغليف، الشحن، التصوير والتسويق",
};

export default async function HomePage() {
  const [ref, latest, topProviders] = await Promise.all([
    getReferenceData(),
    searchListings({ pageSize: 8 }),
    searchProviders({ pageSize: 6 }),
  ]);
  const cityName = (id: number) => ref.cities.find((c) => c.id === id)?.name_ar;

  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
          <h1 className="max-w-2xl text-3xl font-bold leading-tight text-slate-900 sm:text-5xl">
            كل اللي يحتاجه مشروعك، في مكان واحد
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-600">
            موردين ومزودي خدمات للمطاعم والكوفيهات والمتاجر الإلكترونية. ابحث، قارن، وتواصل مباشرة.
          </p>
          <div className="mt-8 max-w-3xl">
            <SearchBar cities={ref.cities} />
          </div>
        </div>
      </section>

      <section aria-labelledby="sectors" className="mx-auto max-w-6xl px-4 py-10">
        <h2 id="sectors" className="text-xl font-bold text-slate-900">
          وش نوع مشروعك؟
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {ref.sectors.map((s) => (
            <li key={s.slug}>
              <Link
                href={searchHref({ sector: s.slug })}
                className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-400 hover:shadow"
              >
                <span className="text-lg font-semibold text-slate-900">{s.name_ar}</span>
                <span className="mt-1 block text-sm text-slate-600">
                  {sectorBlurbs[s.slug] ?? ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="categories" className="mx-auto max-w-6xl px-4 pb-10">
        <h2 id="categories" className="text-xl font-bold text-slate-900">
          تصفح حسب الفئة
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {ref.categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={searchHref({ category: c.slug })}
                className="block rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-500 hover:text-brand-800"
              >
                {c.name_ar}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="latest" className="mx-auto max-w-6xl px-4 pb-10">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="latest" className="text-xl font-bold text-slate-900">
            أحدث الإعلانات
          </h2>
          <Link href="/search" className="text-sm font-semibold text-brand-700 hover:underline">
            عرض الكل
          </Link>
        </div>
        {latest.items.length > 0 ? (
          <div className="mt-4">
            <ListingGrid>
              {latest.items.map((l) => (
                <ListingCard key={l.id} listing={l} cityName={cityName(l.cityId)} />
              ))}
            </ListingGrid>
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
            ما فيه إعلانات للحين. إذا كنت مورد، كن أول من يعلن.
          </p>
        )}
      </section>

      {topProviders.items.length > 0 && (
        <section aria-labelledby="providers" className="mx-auto max-w-6xl px-4 pb-10">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="providers" className="text-xl font-bold text-slate-900">
              موردين مميزين
            </h2>
            <Link
              href={searchHref({ type: "providers" })}
              className="text-sm font-semibold text-brand-700 hover:underline"
            >
              كل الموردين
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {topProviders.items.map((p) => (
              <ProviderCard key={p.id} provider={p} cityName={cityName(p.cityId)} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex flex-col items-start gap-4 rounded-2xl bg-brand-800 p-8 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">عندك منتجات أو خدمات للمشاريع؟</h2>
            <p className="mt-1 text-brand-100">سجّل مجاناً، واعرض أعمالك وإعلاناتك للتجار.</p>
          </div>
          <ButtonLink href="/signup/provider" variant="secondary">
            سجّل كمورد
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
