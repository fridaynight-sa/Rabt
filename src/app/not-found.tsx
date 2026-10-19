import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-5xl font-bold text-brand-700">404</p>
      <h1 className="mt-4 text-xl font-semibold text-slate-900">الصفحة غير موجودة</h1>
      <p className="mt-2 text-slate-600">يمكن الرابط غلط أو الصفحة انحذفت.</p>
      <ButtonLink href="/" className="mt-6">
        الرئيسية
      </ButtonLink>
    </div>
  );
}
