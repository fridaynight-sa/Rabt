// Search filters live in the address (?q=...&city=riyadh), so results can be shared.

export type SearchType = "listings" | "providers";
export type ListingSort = "new" | "price_low" | "price_high";
export type ProviderSort = "rating" | "new";

export type SearchParams = {
  q: string;
  type: SearchType;
  city: string | null;
  category: string | null;
  sector: string | null;
  sort: ListingSort | ProviderSort;
  page: number;
};

type Raw = Record<string, string | string[] | undefined>;

const LISTING_SORTS: ListingSort[] = ["new", "price_low", "price_high"];
const PROVIDER_SORTS: ProviderSort[] = ["rating", "new"];
const SLUG = /^[a-z0-9-]{2,40}$/;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function slug(value: string | string[] | undefined): string | null {
  const v = first(value).trim();
  return SLUG.test(v) ? v : null;
}

export function parseSearchParams(raw: Raw): SearchParams {
  const type: SearchType = first(raw.type) === "providers" ? "providers" : "listings";
  const sortRaw = first(raw.sort);
  const sort =
    type === "listings"
      ? (LISTING_SORTS as string[]).includes(sortRaw)
        ? (sortRaw as ListingSort)
        : "new"
      : (PROVIDER_SORTS as string[]).includes(sortRaw)
        ? (sortRaw as ProviderSort)
        : "rating";
  const page = Number.parseInt(first(raw.page), 10);

  return {
    q: first(raw.q).trim().slice(0, 100),
    type,
    city: slug(raw.city),
    category: slug(raw.category),
    sector: slug(raw.sector),
    sort,
    page: Number.isFinite(page) && page > 0 && page <= 500 ? page : 1,
  };
}

/** Address of a search with these filters; empty and default values are left out. */
export function searchHref(params: Partial<SearchParams>): string {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.type && params.type !== "listings") query.set("type", params.type);
  if (params.city) query.set("city", params.city);
  if (params.category) query.set("category", params.category);
  if (params.sector) query.set("sector", params.sector);
  const defaultSort = params.type === "providers" ? "rating" : "new";
  if (params.sort && params.sort !== defaultSort) query.set("sort", params.sort);
  if (params.page && params.page > 1) query.set("page", String(params.page));
  const s = query.toString();
  return s ? `/search?${s}` : "/search";
}
