import { z } from "zod";
import { passwordRule } from "@/features/auth/schemas";
import { normalizePhone } from "@/lib/phone";

const currentPassword = z.string().min(1, "اكتب كلمة المرور الحالية").max(72);

export const changePasswordSchema = z.object({
  currentPassword,
  newPassword: passwordRule,
});

export const changeEmailSchema = z.object({
  newEmail: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "الإيميل طويل")
    .pipe(z.email("اكتب إيميل صحيح")),
  currentPassword,
});

export const merchantDetailsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "الاسم لازم يكون حرفين أو أكثر")
    .max(80, "الاسم طويل، الحد 80 حرف"),
  phone: z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (value === "") return null;
      const normalized = normalizePhone(value);
      if (!normalized) {
        ctx.addIssue({ code: "custom", message: "اكتب رقم جوال صحيح، مثل 05xxxxxxxx" });
        return z.NEVER;
      }
      return normalized;
    })
    .prefault(""),
});
