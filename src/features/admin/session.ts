import "server-only";
import { redirect } from "next/navigation";
import { requireUser, type SessionUser } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";

/** True when this session has done the second login step (authenticator code). */
export async function hasSecondStep(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return data?.currentLevel === "aal2";
}

/**
 * Use at the top of every admin page and action. Admin role, active account,
 * and the second login step. The database checks the same things again.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser(["admin"]);
  if (!(await hasSecondStep())) redirect("/admin/mfa");
  return user;
}
