import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { ReferenceForm } from "@/features/admin/components/reference-form";
import { REFERENCE_LABELS, referenceKinds } from "@/features/admin/schemas";
import { requireAdmin } from "@/features/admin/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "الأقسام والمدن" };

export default async function AdminListsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const lists = await Promise.all(
    referenceKinds.map(async (kind) => {
      const { data, error } = await supabase
        .from(kind)
        .select("id, slug, name_ar, sort_order")
        .order("sort_order")
        .order("id");
      if (error) throw error;
      return { kind, items: data ?? [] };
    }),
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        الرابط (slug) يظهر في عناوين البحث. غيّر الاسم بحرية، وغيّر الرابط بحذر لأن الروابط القديمة
        تتوقف. الحذف غير متاح لأن الإعلانات والموردين مرتبطين فيها.
      </p>
      {lists.map(({ kind, items }) => (
        <Card key={kind}>
          <h2 className="text-lg font-semibold text-slate-900">
            {REFERENCE_LABELS[kind].title} ({items.length})
          </h2>
          <div className="mt-4 space-y-2">
            {items.map((item) => (
              <ReferenceForm key={item.id} kind={kind} item={item} />
            ))}
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-2 text-sm font-medium text-slate-700">
              إضافة {REFERENCE_LABELS[kind].one}
            </p>
            <ReferenceForm kind={kind} />
          </div>
        </Card>
      ))}
    </div>
  );
}
