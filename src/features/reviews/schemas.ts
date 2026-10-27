import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.coerce
    .number("اختر عدد النجوم")
    .int("اختر عدد النجوم")
    .min(1, "اختر عدد النجوم")
    .max(5, "اختر عدد النجوم"),
  comment: z
    .string()
    .trim()
    .max(1000, "التعليق طويل، الحد 1000 حرف")
    .prefault("")
    .transform((v) => (v === "" ? null : v)),
});
