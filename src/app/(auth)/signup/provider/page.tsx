import type { Metadata } from "next";
import { FormPage } from "@/components/ui/card";
import { ProviderSignupForm } from "@/features/auth/components/provider-signup-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "تسجيل مورد" };

export default async function ProviderSignupPage() {
  const supabase = await createClient();
  const { data: cities, error } = await supabase
    .from("cities")
    .select("id, name_ar")
    .order("sort_order");
  if (error) throw error;

  return (
    <FormPage
      title="تسجيل مورد أو مزود خدمة"
      subtitle="بعد التسجيل تقدر تضيف وصف وصور أعمالك وإعلاناتك"
    >
      <ProviderSignupForm cities={cities} />
    </FormPage>
  );
}
