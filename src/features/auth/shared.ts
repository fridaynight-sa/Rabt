import "server-only";
import { getPublicEnv } from "@/lib/env";

// Messages and links shared by the auth and account server actions.

export const GENERIC_ERROR = "صار خطأ غير متوقع. حاول مرة ثانية بعد شوي.";
export const BAD_LOGIN = "الإيميل أو رقم الجوال أو كلمة المرور غير صحيحة.";

export function authErrorMessage(code: string | undefined): string {
  switch (code) {
    case "email_not_confirmed":
      return "أكّد إيميلك أول من الرابط اللي وصلك، وبعدها سجّل دخول.";
    case "invalid_credentials":
      return BAD_LOGIN;
    case "weak_password":
      return "كلمة المرور ضعيفة، اختر وحدة أقوى.";
    case "same_password":
      return "اختر كلمة مرور مختلفة عن القديمة.";
    case "email_exists":
      return "هذا الإيميل مستخدم في حساب ثاني.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "محاولات كثيرة. انتظر دقائق وحاول مرة ثانية.";
    case "email_address_invalid":
      return "الإيميل غير مقبول، جرّب إيميل ثاني.";
    default:
      return GENERIC_ERROR;
  }
}

/** Link in emails that lands on /auth/confirm and then goes to `next`. */
export function confirmUrl(next: string): string {
  const url = new URL("/auth/confirm", getPublicEnv().NEXT_PUBLIC_SITE_URL);
  url.searchParams.set("next", next);
  return url.toString();
}
