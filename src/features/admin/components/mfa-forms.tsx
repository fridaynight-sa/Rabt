"use client";

import { useActionState, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/form";
import { startMfaEnroll, verifyMfa, type EnrollStart } from "../mfa-actions";

function CodeForm({ factorId, submitLabel }: { factorId: string; submitLabel: string }) {
  const [state, action] = useActionState(verifyMfa.bind(null, factorId), initialFormState);
  return (
    <form action={action} className="space-y-4" noValidate>
      <TextField
        name="code"
        label="الرمز من التطبيق"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        dir="ltr"
        placeholder="123456"
        error={state.fieldErrors?.code}
        className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-center text-2xl tracking-[0.5em]"
      />
      <SubmitButton pendingText="جاري التحقق...">{submitLabel}</SubmitButton>
    </form>
  );
}

/** Second login step for an admin who already set up the app. */
export function MfaVerify({ factorId }: { factorId: string }) {
  return <CodeForm factorId={factorId} submitLabel="تأكيد" />;
}

/** First-time setup: scan the QR code with an authenticator app, then confirm a code. */
export function MfaEnroll() {
  const [enroll, setEnroll] = useState<EnrollStart | null>(null);
  const [pending, start] = useTransition();

  if (!enroll || !enroll.ok) {
    return (
      <div className="space-y-4">
        {enroll && !enroll.ok && <Alert tone="error">{enroll.message}</Alert>}
        <ol className="list-decimal space-y-1 ps-5 text-sm text-slate-700">
          <li>نزّل تطبيق مصادقة على جوالك، مثل Google Authenticator أو Microsoft Authenticator.</li>
          <li>اضغط الزر تحت، وامسح الرمز اللي يطلع بالتطبيق.</li>
          <li>اكتب الرمز المكون من 6 أرقام اللي يعطيك إياه التطبيق.</li>
        </ol>
        <Button
          type="button"
          disabled={pending}
          onClick={() => start(async () => setEnroll(await startMfaEnroll()))}
        >
          {pending ? "جاري التجهيز..." : "ابدأ الإعداد"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- QR code is an inline SVG data address */}
        <img src={enroll.qrCode} alt="رمز QR لتطبيق المصادقة" className="size-48" />
        <p className="text-center text-xs text-slate-500">
          ما تقدر تمسح؟ اكتب هذا المفتاح في التطبيق:
          <span dir="ltr" className="mt-1 block select-all font-mono text-sm text-slate-800">
            {enroll.secret}
          </span>
        </p>
      </div>
      <CodeForm factorId={enroll.factorId} submitLabel="تفعيل" />
    </div>
  );
}
