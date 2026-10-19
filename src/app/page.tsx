import { ButtonLink } from "@/components/ui/button";

const steps = [
  { title: "سجّل مجاناً", body: "كتاجر تدوّر على موردين، أو كمورد تعرض خدماتك ومنتجاتك." },
  { title: "لاقي اللي تحتاجه", body: "ابحث حسب نوع مشروعك والفئة والمدينة، وقارن التقييمات." },
  { title: "تواصل مباشرة", body: "كلّم المورد على الواتساب أو اتصال، بدون وسيط." },
];

export default function HomePage() {
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <h1 className="max-w-2xl text-3xl font-bold leading-tight text-slate-900 sm:text-5xl">
            كل اللي يحتاجه مشروعك، في مكان واحد
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-600">
            معدات، أثاث، تغليف، تصميم، صيانة وأكثر. ربط تجمع المطاعم والكوفيهات والمتاجر الإلكترونية
            مع الموردين ومزودي الخدمات.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/signup/merchant" className="px-6 py-3 text-base">
              أدوّر على مورد
            </ButtonLink>
            <ButtonLink href="/signup/provider" variant="secondary" className="px-6 py-3 text-base">
              أنا مورد أو مزود خدمة
            </ButtonLink>
          </div>
        </div>
      </section>

      <section aria-labelledby="how" className="mx-auto max-w-6xl px-4 py-16">
        <h2 id="how" className="text-2xl font-bold text-slate-900">
          كيف تشتغل ربط
        </h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <span className="grid size-9 place-items-center rounded-full bg-brand-100 font-bold text-brand-800">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
