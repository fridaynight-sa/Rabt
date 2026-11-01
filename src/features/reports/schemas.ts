import { z } from "zod";

export const REPORT_REASONS = {
  misleading: "معلومات غير صحيحة أو مضللة",
  fraud: "احتيال أو نصب",
  abusive: "محتوى مسيء",
  impersonation: "انتحال اسم أو نشاط",
  other: "سبب آخر",
} as const;

export type ReportReason = keyof typeof REPORT_REASONS;

export const reportSchema = z
  .object({
    targetType: z.enum(["provider", "listing", "review"]),
    targetId: z.guid(),
    reason: z.enum(Object.keys(REPORT_REASONS) as [ReportReason, ...ReportReason[]], "اختر السبب"),
    details: z.string().trim().max(400, "التفاصيل طويلة، الحد 400 حرف").prefault(""),
  })
  .refine((r) => r.reason !== "other" || r.details.length >= 5, {
    path: ["details"],
    message: "اكتب السبب باختصار",
  });

/** The text saved in the database: the reason, then the details if any. */
export function reportText(reason: ReportReason, details: string): string {
  return details ? `${REPORT_REASONS[reason]}: ${details}` : REPORT_REASONS[reason];
}
