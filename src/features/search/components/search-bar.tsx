type City = { slug: string; name_ar: string };

/** The big search box on the home page. Submits to /search. */
export function SearchBar({ cities }: { cities: City[] }) {
  return (
    <form
      action="/search"
      role="search"
      className="flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-slate-200 sm:flex-row"
    >
      <label htmlFor="hero-q" className="sr-only">
        وش تدوّر عليه؟
      </label>
      <input
        id="hero-q"
        name="q"
        type="search"
        maxLength={100}
        placeholder="وش تدوّر عليه؟ مثلاً: مكينة قهوة، تغليف، تصميم شعار"
        className="min-w-0 flex-1 rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-brand-200"
      />
      <label htmlFor="hero-city" className="sr-only">
        المدينة
      </label>
      <select
        id="hero-city"
        name="city"
        defaultValue=""
        className="rounded-xl border-0 bg-slate-50 px-4 py-3 text-base sm:w-44"
      >
        <option value="">كل المدن</option>
        {cities.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name_ar}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-xl bg-brand-700 px-6 py-3 text-base font-semibold text-white hover:bg-brand-800"
      >
        بحث
      </button>
    </form>
  );
}
