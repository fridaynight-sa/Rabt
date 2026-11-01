import { describe, expect, it } from "vitest";
import { parseSearchParams, searchHref } from "@/features/search/params";

describe("parseSearchParams", () => {
  it("uses safe defaults", () => {
    expect(parseSearchParams({})).toEqual({
      q: "",
      type: "listings",
      city: null,
      category: null,
      sector: null,
      sort: "new",
      page: 1,
    });
  });

  it("reads valid filters", () => {
    const p = parseSearchParams({
      q: "  مكينة قهوة ",
      type: "providers",
      city: "riyadh",
      category: "equipment",
      sector: "cafes",
      sort: "new",
      page: "3",
    });
    expect(p).toMatchObject({
      q: "مكينة قهوة",
      type: "providers",
      city: "riyadh",
      sort: "new",
      page: 3,
    });
  });

  it("drops anything unexpected", () => {
    const p = parseSearchParams({
      type: "admins",
      city: "<script>",
      category: ["equipment", "other"],
      sort: "drop table",
      page: "-4",
    });
    expect(p.type).toBe("listings");
    expect(p.city).toBeNull();
    expect(p.category).toBe("equipment");
    expect(p.sort).toBe("new");
    expect(p.page).toBe(1);
  });

  it("keeps a sort only when it fits the result type", () => {
    expect(parseSearchParams({ type: "providers", sort: "price_low" }).sort).toBe("rating");
    expect(parseSearchParams({ sort: "rating" }).sort).toBe("new");
  });

  it("limits the search text and the page number", () => {
    expect(parseSearchParams({ q: "x".repeat(300) }).q).toHaveLength(100);
    expect(parseSearchParams({ page: "100000" }).page).toBe(1);
  });
});

describe("searchHref", () => {
  it("leaves out defaults", () => {
    expect(searchHref({})).toBe("/search");
    expect(searchHref({ type: "listings", sort: "new", page: 1 })).toBe("/search");
    expect(searchHref({ type: "providers", sort: "rating" })).toBe("/search?type=providers");
  });

  it("builds a shareable address", () => {
    expect(searchHref({ q: "قهوة", city: "jeddah", page: 2 })).toBe(
      "/search?q=%D9%82%D9%87%D9%88%D8%A9&city=jeddah&page=2",
    );
  });

  it("round-trips through the parser", () => {
    const params = parseSearchParams({
      q: "تغليف",
      category: "packaging",
      sort: "price_low",
      page: "2",
    });
    const url = new URL(searchHref(params), "http://x");
    expect(parseSearchParams(Object.fromEntries(url.searchParams))).toEqual(params);
  });
});
