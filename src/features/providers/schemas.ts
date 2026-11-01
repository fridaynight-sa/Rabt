import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

const idList = z.array(z.coerce.number().int().positive()).max(50).default([]);

export const providerProfileSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "الاسم لازم يكون حرفين أو أكثر")
    .max(80, "الاسم طويل، الحد 80 حرف"),
  cityId: z.coerce.number("اختر المدينة").int().positive("اختر المدينة"),
  whatsapp: z
    .string()
    .trim()
    .transform((value, ctx) => {
      const normalized = normalizePhone(value);
      if (!normalized) {
        ctx.addIssue({ code: "custom", message: "اكتب رقم واتساب صحيح، مثل 05xxxxxxxx" });
        return z.NEVER;
      }
      return normalized;
    }),
  services: z
    .string()
    .trim()
    .min(3, "اكتب الخدمات أو المنتجات اللي تقدمها")
    .max(1000, "النص طويل، الحد 1000 حرف"),
  description: z
    .string()
    .trim()
    .max(2000, "الوصف طويل، الحد 2000 حرف")
    .transform((v) => (v === "" ? null : v)),
  sectorIds: idList,
  categoryIds: idList,
});

export type ProviderProfileInput = z.infer<typeof providerProfileSchema>;

/** Reads the profile form, including the multi-choice checkboxes. */
export function readProfileForm(formData: FormData) {
  return {
    businessName: formData.get("businessName") ?? "",
    cityId: formData.get("cityId") ?? "",
    whatsapp: formData.get("whatsapp") ?? "",
    services: formData.get("services") ?? "",
    description: formData.get("description") ?? "",
    sectorIds: formData.getAll("sectorIds"),
    categoryIds: formData.getAll("categoryIds"),
  };
}
