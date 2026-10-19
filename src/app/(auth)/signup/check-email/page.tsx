import type { Metadata } from "next";
import { FormPage } from "@/components/ui/card";

export const metadata: Metadata = { title: "أكّد إيميلك" };

export default function CheckEmailPage() {
  return (
    <FormPage title="باقي خطوة وحدة">
      <p className="text-slate-700">أرسلنا لك رابط تأكيد على إيميلك. افتحه عشان يتفعّل حسابك.</p>
      <p className="mt-3 text-sm text-slate-500">
        ما وصلك شي؟ شيك على مجلد الرسائل غير المرغوب فيها (Spam).
      </p>
    </FormPage>
  );
}
