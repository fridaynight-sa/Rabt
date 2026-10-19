import { signOut } from "@/features/auth/actions";
import { getSessionUser, homeForRole } from "@/features/auth/session";
import { ButtonLink } from "./ui/button";
import { Logo } from "./logo";

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav aria-label="الحساب" className="flex items-center gap-2">
          {user ? (
            <>
              <ButtonLink href={homeForRole(user.role)} variant="ghost">
                لوحتي
              </ButtonLink>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  خروج
                </button>
              </form>
            </>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost">
                دخول
              </ButtonLink>
              <ButtonLink href="/signup">حساب جديد</ButtonLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
