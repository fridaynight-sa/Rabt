import { z } from "zod";

export const LISTING_IMAGE_LIMIT = 5;
export const MAX_PRICE = 99_999_999;

/** Reads a price as typed: Arabic digits, commas and spaces are fine. Empty means none. */
export function parsePrice(input: string): number | null | "invalid" {
  const ascii = input
    .trim()
    .replace(/[٠-٩۰-۹]/g, (d) => String((d.charCodeAt(0) & 0xf) % 10))
    .replace(/[\s,٬]/g, "")
    .replace(/٫/g, ".");
  if (ascii === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(ascii)) return "invalid";
  const value = Number(ascii);
  return value > MAX_PRICE ? "invalid" : value;
}

export const listingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "العنوان لازم يكون 3 أحرف أو أكثر")
    .max(120, "العنوان طويل، الحد 120 حرف"),
  description: z
    .string()
    .trim()
    .min(10, "اكتب وصف أوضح (10 أحرف على الأقل)")
    .max(3000, "الوصف طويل، الحد 3000 حرف"),
  price: z
    .string()
    .prefault("")
    .transform((value, ctx) => {
      const price = parsePrice(value);
      if (price === "invalid") {
        ctx.addIssue({ code: "custom", message: "اكتب السعر بالأرقام، مثل 1500" });
        return z.NEVER;
      }
      return price;
    }),
  cityId: z.coerce.number("اختر المدينة").int().positive("اختر المدينة"),
  categoryId: z.coerce.number("اختر الفئة").int().positive("اختر الفئة"),
  contactMethod: z.enum(["whatsapp", "call"], "اختر طريقة التواصل"),
});

export type ListingInput = z.infer<typeof listingSchema>;
