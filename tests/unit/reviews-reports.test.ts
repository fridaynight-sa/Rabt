import { describe, expect, it } from "vitest";
import { REPORT_REASONS, reportSchema, reportText } from "@/features/reports/schemas";
import { reviewSchema } from "@/features/reviews/schemas";

describe("reviewSchema", () => {
  it("accepts 1 to 5 stars with an optional comment", () => {
    expect(reviewSchema.parse({ rating: "5", comment: "  ممتاز  " })).toEqual({
      rating: 5,
      comment: "ممتاز",
    });
    expect(reviewSchema.parse({ rating: "1" })).toEqual({ rating: 1, comment: null });
  });

  it.each(["0", "6", "3.5", "", "abc"])("rejects a rating of %j", (rating) => {
    expect(reviewSchema.safeParse({ rating }).success).toBe(false);
  });

  it("limits the comment to 1000 characters", () => {
    expect(reviewSchema.safeParse({ rating: "4", comment: "x".repeat(1001) }).success).toBe(false);
  });
});

describe("reportSchema", () => {
  const base = {
    targetType: "listing",
    targetId: "aaaaaaaa-0000-4000-8000-000000000001",
    reason: "misleading",
  };

  it("accepts a known reason without details", () => {
    expect(reportSchema.parse(base).details).toBe("");
  });

  it("needs details when the reason is 'other'", () => {
    const r = reportSchema.safeParse({ ...base, reason: "other" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(["details"]);
    expect(
      reportSchema.safeParse({ ...base, reason: "other", details: "السعر وهمي" }).success,
    ).toBe(true);
  });

  it("accepts any well-formed id, like the database does", () => {
    const id = "1bbbbbbb-0000-0000-0000-000000000002";
    expect(reportSchema.safeParse({ ...base, targetId: id }).success).toBe(true);
  });

  it("rejects unknown targets and reasons", () => {
    expect(reportSchema.safeParse({ ...base, targetType: "profile" }).success).toBe(false);
    expect(reportSchema.safeParse({ ...base, targetId: "not-a-uuid" }).success).toBe(false);
    expect(reportSchema.safeParse({ ...base, reason: "spam" }).success).toBe(false);
  });

  it("builds report text within the database limit", () => {
    expect(reportText("fraud", "")).toBe(REPORT_REASONS.fraud);
    expect(reportText("other", "x".repeat(400)).length).toBeLessThanOrEqual(500);
  });
});
