"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { buttonClass } from "@/components/ui/button";
import { compressImage } from "@/lib/client/compress-image";
import type { ActionResult } from "@/lib/form";
import { mediaUrl } from "@/lib/images";

type Image = { id: string; storageKey: string };

/**
 * Upload, show and delete a set of images. Each photo is shrunk in the browser,
 * then sent to the given server action one at a time.
 */
export function ImageManager({
  images,
  limit,
  upload,
  remove,
  emptyText,
  altText,
}: {
  images: Image[];
  limit: number;
  upload: (formData: FormData) => Promise<ActionResult>;
  remove: (imageId: string) => Promise<ActionResult>;
  emptyText: string;
  altText: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [deleting, startDelete] = useTransition();
  const remaining = limit - images.length;

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, Math.max(remaining, 0));
    const problems: string[] = [];

    for (const [i, file] of list.entries()) {
      setBusy(`جاري رفع ${i + 1} من ${list.length}...`);
      try {
        const blob = await compressImage(file);
        const data = new FormData();
        data.set("image", new File([blob], "image", { type: blob.type }));
        const result = await upload(data);
        if (!result.ok) problems.push(`${file.name}: ${result.message}`);
      } catch {
        problems.push(`${file.name}: ما قدرنا نقرأ الصورة. الصيغ المقبولة: JPG وPNG وWEBP.`);
      }
    }
    if (files.length > list.length) {
      problems.push(`انرفعت ${list.length} صور بس، لأن الحد ${limit} صور.`);
    }

    setErrors(problems);
    setBusy(null);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  function onDelete(id: string) {
    if (!confirm("تبي تحذف الصورة؟")) return;
    startDelete(async () => {
      const result = await remove(id);
      setErrors(result.ok ? [] : [result.message]);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label
          className={buttonClass(
            "primary",
            remaining <= 0 || busy ? "pointer-events-none opacity-60" : "cursor-pointer",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            disabled={remaining <= 0 || Boolean(busy)}
            onChange={(e) => onFiles(e.target.files)}
          />
          إضافة صور
        </label>
        <span className="text-sm text-slate-500">
          {images.length} من {limit} · JPG أو PNG أو WEBP
        </span>
      </div>

      {busy && <Alert>{busy}</Alert>}
      {errors.length > 0 && (
        <Alert tone="error">
          <ul className="space-y-1">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Alert>
      )}

      {images.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          {emptyText}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img, i) => (
            <li
              key={img.id}
              className="relative aspect-square overflow-hidden rounded-xl bg-slate-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- images are already resized on upload */}
              <img
                src={mediaUrl(img.storageKey)}
                alt={`${altText} ${i + 1}`}
                loading="lazy"
                className="size-full object-cover"
              />
              {i === 0 && (
                <span className="absolute start-2 top-2 rounded-md bg-slate-900/70 px-2 py-0.5 text-xs text-white">
                  الرئيسية
                </span>
              )}
              <button
                type="button"
                onClick={() => onDelete(img.id)}
                disabled={deleting}
                className="absolute end-2 top-2 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-red-700 shadow hover:bg-white disabled:opacity-60"
              >
                حذف
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
