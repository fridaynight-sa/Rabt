"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-xl font-semibold text-slate-900">صار خطأ غير متوقع</h1>
      <p className="mt-2 text-slate-600">حاول مرة ثانية. إذا تكرر، بلغنا.</p>
      <Button onClick={reset} className="mt-6">
        حاول مرة ثانية
      </Button>
    </div>
  );
}
