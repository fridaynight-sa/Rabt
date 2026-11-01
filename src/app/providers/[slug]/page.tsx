import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/features/auth/session";
import { Rating } from "@/features/providers/components/rating";
import { WhatsAppButton } from "@/features/providers/components/whatsapp-button";
import { getProviderBySlug } from "@/features/providers/queries";
import { mediaUrl } from "@/lib/images";

type Props = { params: Promise<{ slug: string }> };

const SLUG = /^[a-z0-9-]{3,60}$/;

async function load(slug: string) {
  return SLUG.test(slug) ? getProviderBySlug(slug) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const provider = await load((await params).slug);
  if (!provider) return { title: "الصفحة غير موجودة" };
  const description = (provider.description ?? provider.services).slice(0, 160);
  return {
    title: provider.businessName,
    description,
    openGraph: {
      title: provider.businessName,
      description,
      images: provider.images[0] ? [mediaUrl(provider.images[0].storageKey)] : undefined,
    },
  };
}

export default async function ProviderPage({ params }: Props) {
  const provider = await load((await params).slug);
  if (!provider) notFound();
  const viewer = await getSessionUser();
  const isOwner = viewer?.id === provider.id;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {isOwner && (
        <p className="mb-4 rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-900">
          هذي صفحتك كما يشوفها التجار.
        </p>
      )}

      <header className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{provider.businessName}</h1>
          {provider.isVerified && (
            <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-800">
              موثّق
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
          {provider.cityName && <span>{provider.cityName}</span>}
          <Rating average={provider.ratingAvg} count={provider.ratingCount} />
        </div>
        {(provider.sectors.length > 0 || provider.categories.length > 0) && (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="الأقسام">
            {[...provider.categories, ...provider.sectors].map((t) => (
              <li
                key={`${t.slug}`}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
              >
                {t.name_ar}
              </li>
            ))}
          </ul>
        )}
        <WhatsAppButton number={provider.whatsapp} className="mt-6 w-full sm:w-auto" />
      </header>

      <section
        aria-labelledby="about"
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
      >
        <h2 id="about" className="text-lg font-semibold text-slate-900">
          الخدمات والمنتجات
        </h2>
        <p className="mt-2 whitespace-pre-line text-slate-700">{provider.services}</p>
        {provider.description && (
          <>
            <h2 className="mt-6 text-lg font-semibold text-slate-900">نبذة</h2>
            <p className="mt-2 whitespace-pre-line text-slate-700">{provider.description}</p>
          </>
        )}
      </section>

      {provider.images.length > 0 && (
        <section aria-labelledby="work" className="mt-6">
          <h2 id="work" className="text-lg font-semibold text-slate-900">
            من أعمالنا
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {provider.images.map((img, i) => (
              <li key={img.id} className="aspect-square overflow-hidden rounded-xl bg-slate-100">
                <a href={mediaUrl(img.storageKey)} target="_blank" rel="noopener">
                  {/* eslint-disable-next-line @next/next/no-img-element -- images are already resized on upload */}
                  <img
                    src={mediaUrl(img.storageKey)}
                    alt={`من أعمال ${provider.businessName} (${i + 1})`}
                    loading={i < 3 ? "eager" : "lazy"}
                    className="size-full object-cover transition hover:scale-105"
                  />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
