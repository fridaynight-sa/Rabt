import Link from "next/link";
import type { SessionUser } from "@/features/auth/session";
import { Rating } from "@/features/providers/components/rating";
import { ReportButton } from "@/features/reports/components/report-button";
import { timeAgo } from "@/lib/format";
import { saveReview } from "../actions";
import { getProviderReviews } from "../queries";
import { ReviewForm } from "./review-form";

/** Reviews on a provider page: the average, the merchant's own form, then the list. */
export async function ReviewsSection({
  provider,
  viewer,
}: {
  provider: { id: string; slug: string; ratingAvg: number; ratingCount: number };
  viewer: SessionUser | null;
}) {
  const reviews = await getProviderReviews(provider.id);
  const mine = reviews.find((r) => r.isMine) ?? null;
  const loginHref = `/login?next=${encodeURIComponent(`/providers/${provider.slug}#reviews`)}`;

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="mt-8 scroll-mt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="reviews-title" className="text-lg font-semibold text-slate-900">
          التقييمات
        </h2>
        <Rating average={provider.ratingAvg} count={provider.ratingCount} />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
        {viewer?.role === "merchant" && viewer.status === "active" ? (
          <>
            <h3 className="mb-3 font-semibold text-slate-900">
              {mine ? "تقييمك" : "تعاملت معهم؟ قيّم تجربتك"}
            </h3>
            <ReviewForm
              save={saveReview.bind(null, provider.id)}
              existing={mine && { id: mine.id, rating: mine.rating, comment: mine.comment }}
            />
          </>
        ) : viewer ? (
          <p className="text-sm text-slate-600">التقييم متاح لحسابات التجار.</p>
        ) : (
          <p className="text-sm text-slate-600">
            تعاملت معهم؟{" "}
            <Link href={loginHref} className="font-semibold text-brand-700 hover:underline">
              سجّل دخول كتاجر
            </Link>{" "}
            وقيّم تجربتك.
          </p>
        )}
      </div>

      {reviews.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">
                  {r.reviewerName}
                  {r.isMine && (
                    <span className="ms-2 text-xs font-normal text-brand-700">(تقييمك)</span>
                  )}
                </p>
                <span className="text-xs text-slate-500">
                  {timeAgo(r.createdAt)}
                  {r.edited && " · معدّل"}
                </span>
              </div>
              <p className="mt-1 text-amber-500" role="img" aria-label={`${r.rating} من 5`}>
                {"★".repeat(r.rating)}
                <span className="text-slate-300">{"★".repeat(5 - r.rating)}</span>
              </p>
              {r.comment && <p className="mt-2 whitespace-pre-line text-slate-700">{r.comment}</p>}
              {!r.isMine && (
                <div className="mt-2">
                  <ReportButton
                    targetType="review"
                    targetId={r.id}
                    signedIn={Boolean(viewer)}
                    compact
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">ما فيه تقييمات للحين.</p>
      )}
    </section>
  );
}
