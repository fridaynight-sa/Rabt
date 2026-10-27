import type { SearchParams } from "../params";

type Ref = { slug: string; name_ar: string };

const selectClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200";

function Select({
  name,
  label,
  value,
  options,
  all,
}: {
  name: string;
  label: string;
  value: string | null;
  options: { value: string; label: string }[];
  all?: string;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select name={name} defaultValue={value ?? ""} className={selectClass}>
        {all && <option value="">{all}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const toOptions = (items: Ref[]) => items.map((i) => ({ value: i.slug, label: i.name_ar }));

/** Filter form. A plain GET form: works without JavaScript and keeps filters in the address. */
export function SearchFilters({
  params,
  cities,
  sectors,
  categories,
}: {
  params: SearchParams;
  cities: Ref[];
  sectors: Ref[];
  categories: Ref[];
}) {
  const sorts =
    params.type === "listings"
      ? [
          { value: "new", label: "الأحدث" },
          { value: "price_low", label: "الأقل سعراً" },
          { value: "price_high", label: "الأعلى سعراً" },
        ]
      : [
          { value: "rating", label: "الأعلى تقييماً" },
          { value: "new", label: "الأحدث" },
        ];

  return (
    <form action="/search" role="search" className="space-y-4">
      {params.type === "providers" && <input type="hidden" name="type" value="providers" />}
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">كلمة البحث</span>
        <input
          name="q"
          type="search"
          maxLength={100}
          defaultValue={params.q}
          placeholder="مثلاً: مكينة قهوة"
          className={selectClass}
        />
      </label>
      <Select
        name="sector"
        label="نوع مشروعك"
        value={params.sector}
        options={toOptions(sectors)}
        all="الكل"
      />
      <Select
        name="category"
        label="الفئة"
        value={params.category}
        options={toOptions(categories)}
        all="كل الفئات"
      />
      <Select
        name="city"
        label="المدينة"
        value={params.city}
        options={toOptions(cities)}
        all="كل المدن"
      />
      <Select name="sort" label="الترتيب" value={params.sort} options={sorts} />
      <button
        type="submit"
        className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
      >
        تطبيق
      </button>
    </form>
  );
}
