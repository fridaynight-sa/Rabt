import type { ContactMethod } from "@/lib/supabase/database.types";
import { WhatsAppButton } from "@/features/providers/components/whatsapp-button";

/** The way the provider chose to be contacted for this listing. */
export function ListingContact({
  method,
  number,
  title,
}: {
  method: ContactMethod;
  number: string;
  title: string;
}) {
  if (method === "call") {
    return (
      <a
        href={`tel:${number}`}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 py-3 text-base font-semibold text-white hover:bg-brand-800"
      >
        اتصال{" "}
        <span dir="ltr" className="font-normal">
          {number.startsWith("+966") ? `0${number.slice(4)}` : number}
        </span>
      </a>
    );
  }
  return (
    <WhatsAppButton
      number={number}
      message={`السلام عليكم، شفت إعلانكم "${title}" في منصة ربط وأبي أستفسر.`}
      className="w-full"
    />
  );
}
