import type { Metadata } from "next";
import { FormPage } from "@/components/ui/card";
import { MerchantSignupForm } from "@/features/auth/components/merchant-signup-form";

export const metadata: Metadata = { title: "تسجيل تاجر" };

export default function MerchantSignupPage() {
  return (
    <FormPage title="تسجيل تاجر" subtitle="مجاني، ويأخذ أقل من دقيقة">
      <MerchantSignupForm />
    </FormPage>
  );
}
