import { z } from "zod";
import { looksLikePhone, normalizePhone } from "@/lib/phone";

// Form rules, shared by the forms and the server. The database checks them again.

const fullName = z
  .string()
  .trim()
  .min(2, "الاسم لازم يكون حرفين أو أكثر")
  .max(80, "الاسم طويل، الحد 80 حرف");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "الإيميل طويل")
  .pipe(z.email("اكتب إيميل صحيح"));

export const passwordRule = z
  .string()
  .min(8, "كلمة المرور لازم تكون 8 أحرف أو أكثر")
  .max(72, "كلمة المرور طويلة، الحد 72 حرف")
  .regex(/[A-Za-z؀-ۿ]/, "كلمة المرور لازم فيها حرف واحد على الأقل")
  .regex(/\d/, "كلمة المرور لازم فيها رقم واحد على الأقل");

const phone = (message: string) =>
  z
    .string()
    .trim()
    .transform((value, ctx) => {
      const normalized = normalizePhone(value);
      if (!normalized) {
        ctx.addIssue({ code: "custom", message });
        return z.NEVER;
      }
      return normalized;
    });

const optionalPhone = z
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
  });

export const merchantSignUpSchema = z.object({
  fullName,
  email,
  phone: optionalPhone.prefault(""),
  password: passwordRule,
});

export const providerSignUpSchema = z.object({
  fullName: fullName.max(80),
  cityId: z.coerce.number("اختر المدينة").int().positive("اختر المدينة"),
  email,
  whatsapp: phone("اكتب رقم واتساب صحيح، مثل 05xxxxxxxx"),
  services: z
    .string()
    .trim()
    .min(3, "اكتب الخدمات أو المنتجات اللي تقدمها")
    .max(1000, "النص طويل، الحد 1000 حرف"),
  password: passwordRule,
});

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "اكتب الإيميل أو رقم الجوال")
    .transform((value, ctx) => {
      if (looksLikePhone(value)) {
        const normalized = normalizePhone(value);
        if (!normalized) {
          ctx.addIssue({ code: "custom", message: "رقم الجوال غير صحيح" });
          return z.NEVER;
        }
        return { kind: "phone" as const, value: normalized };
      }
      const parsed = email.safeParse(value);
      if (!parsed.success) {
        ctx.addIssue({ code: "custom", message: "اكتب إيميل أو رقم جوال صحيح" });
        return z.NEVER;
      }
      return { kind: "email" as const, value: parsed.data };
    }),
  password: z.string().min(1, "اكتب كلمة المرور").max(72),
  next: z.string().optional(),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({ password: passwordRule });

export type MerchantSignUpInput = z.infer<typeof merchantSignUpSchema>;
export type ProviderSignUpInput = z.infer<typeof providerSignUpSchema>;
