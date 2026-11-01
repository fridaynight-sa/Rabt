"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteListing } from "../actions";

export function DeleteListingButton({
  listingId,
  redirectTo,
}: {
  listingId: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm("تبي تحذف الإعلان؟ ما تقدر ترجعه بعد الحذف.")) return;
          start(async () => {
            const result = await deleteListing(listingId);
            if (!result.ok) return setError(result.message);
            if (redirectTo) router.push(redirectTo);
            router.refresh();
          });
        }}
        className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        {pending ? "جاري الحذف..." : "حذف"}
      </button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </span>
  );
}
