"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { CheckboxGroup } from "@/components/ui/checkbox-group";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/form";
import { updateProviderProfile } from "../actions";

type Ref = { id: number; name_ar: string };

export type ProfileFormDefaults = {
  businessName: string;
  cityId: number;
  whatsapp: string;
  services: string;
  description: string | null;
  sectorIds: number[];
  categoryIds: number[];
};

const toOptions = (items: Ref[]) => items.map((i) => ({ value: String(i.id), label: i.name_ar }));

/** Shows the Saudi number the way people write it locally. */
function localPhone(e164: string): string {
  return e164.startsWith("+966") ? `0${e164.slice(4)}` : e164;
}

export function ProviderProfileForm({
  defaults,
  cities,
  sectors,
  categories,
}: {
  defaults: ProfileFormDefaults;
  cities: Ref[];
  sectors: Ref[];
  categories: Ref[];
}) {
  const [state, action] = useActionState(updateProviderProfile, initialFormState);
  const e = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.status === "success" && <Alert tone="success">{state.message}</Alert>}
      {state.status === "error" && state.message && <Alert tone="error">{state.message}</Alert>}

      <TextField
        name="businessName"
        label="الاسم"
        defaultValue={defaults.businessName}
        error={e.businessName}
        hint="اسم نشاطك كما يظهر للتجار"
      />
      <SelectField
        name="cityId"
        label="المدينة"
        placeholder="اختر المدينة"
        options={toOptions(cities)}
        defaultValue={String(defaults.cityId)}
        error={e.cityId}
      />
      <TextField
        name="whatsapp"
        label="رقم الواتساب"
        type="tel"
        dir="ltr"
        defaultValue={localPhone(defaults.whatsapp)}
        error={e.whatsapp}
      />
      <TextAreaField
        name="services"
        label="الخدمات أو المنتجات اللي تقدمها"
        maxLength={1000}
        defaultValue={defaults.services}
        error={e.services}
      />
      <TextAreaField
        name="description"
        label="وصف مختصر عن نشاطك"
        rows={5}
        maxLength={2000}
        optional
        defaultValue={defaults.description ?? ""}
        error={e.description}
        hint="من أنتم، خبرتكم، وش يميزكم"
      />
      <CheckboxGroup
        name="sectorIds"
        legend="مين تخدم؟"
        hint="اختر نوع المشاريع اللي تتعامل معها"
        options={toOptions(sectors)}
        defaultValues={defaults.sectorIds.map(String)}
        error={e.sectorIds}
      />
      <CheckboxGroup
        name="categoryIds"
        legend="وش تقدم؟"
        hint="اختر الفئات اللي تنطبق على خدماتك أو منتجاتك"
        options={toOptions(categories)}
        defaultValues={defaults.categoryIds.map(String)}
        error={e.categoryIds}
      />
      <div className="sm:w-56">
        <SubmitButton pendingText="جاري الحفظ...">حفظ التعديلات</SubmitButton>
      </div>
    </form>
  );
}
