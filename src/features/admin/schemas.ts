import { z } from "zod";

export const referenceKinds = ["categories", "sectors", "cities"] as const;
export type ReferenceKind = (typeof referenceKinds)[number];

export const REFERENCE_LABELS: Record<ReferenceKind, { title: string; one: string }> = {
  categories: { title: "الفئات", one: "فئة" },
  sectors: { title: "أنواع المشاريع", one: "نوع مشروع" },
  cities: { title: "المدن", one: "مدينة" },
};

export const referenceSchema = z.object({
  kind: z.enum(referenceKinds),
  id: z
    .string()
    .prefault("")
    .transform((v, ctx) => {
      if (v === "") return null;
      const n = Number(v);
      if (!Number.isInteger(n) || n <= 0) {
        ctx.addIssue({ code: "custom", message: "invalid id" });
        return z.NEVER;
      }
      return n;
    }),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{2,40}$/, "حروف إنجليزية صغيرة وأرقام وشرطة (-) فقط، مثل coffee-beans"),
  nameAr: z
    .string()
    .trim()
    .min(2, "الاسم لازم يكون حرفين أو أكثر")
    .max(40, "الاسم طويل، الحد 40 حرف"),
  sortOrder: z.coerce.number().int().min(0).max(999).prefault("0"),
});

export const accountTypeSchema = z.enum(["merchant", "provider"], "اختر نوع الحساب");
