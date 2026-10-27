"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/session";
import { GENERIC_ERROR } from "@/features/auth/shared";
import type { FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";

const CODE = /^\d{6}$/;
const WRONG_CODE = "الرمز غير صحيح أو انتهى وقته. جرّب الرمز الجديد من التطبيق.";

function readCode(formData: FormData): string | null {
  const raw = String(formData.get("code") ?? "")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/\s/g, "");
  return CODE.test(raw) ? raw : null;
}

export type EnrollStart =
  { ok: true; factorId: string; qrCode: string; secret: string } | { ok: false; message: string };

/** Starts setting up the authenticator app: returns the QR code to scan. */
export async function startMfaEnroll(): Promise<EnrollStart> {
  await requireUser(["admin"]);
  const supabase = await createClient();

  // Clear any setup that was started and never finished.
  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const f of factors?.all ?? []) {
    if (f.factor_type === "totp" && f.status !== "verified") {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `Rabt admin ${new Date().toISOString().slice(0, 10)}`,
  });
  if (error || !data) {
    console.error("mfa enroll failed", error?.code, error?.message);
    return { ok: false, message: GENERIC_ERROR };
  }
  return { ok: true, factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

/** Checks a code from the authenticator app and moves the session to the second step. */
export async function verifyMfa(
  factorId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser(["admin"]);
  const code = readCode(formData);
  if (!code) return { status: "error", fieldErrors: { code: "اكتب الرمز المكون من 6 أرقام" } };

  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) return { status: "error", fieldErrors: { code: WRONG_CODE } };
  redirect("/admin");
}
