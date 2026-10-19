import type { Metadata } from "next";
import Link from "next/link";
import { FormPage } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "تسجيل الدخول" };

const linkErrors: Record<string, string> = {
  link: "الرابط غير صالح أو انتهت صلاحيته. اطلب رابط جديد.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <FormPage title="تسجيل الدخول" subtitle="أهلاً فيك من جديد">
      {error && linkErrors[error] && (
        <div className="mb-4">
          <Alert tone="error">{linkErrors[error]}</Alert>
        </div>
      )}
      <LoginForm next={next} />
      <p className="mt-6 text-center text-sm text-slate-600">
        ما عندك حساب؟{" "}
        <Link href="/signup" className="font-semibold text-brand-700 hover:underline">
          سجّل الحين
        </Link>
      </p>
    </FormPage>
  );
}
