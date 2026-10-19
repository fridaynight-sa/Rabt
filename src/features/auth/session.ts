import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AccountStatus, UserRole } from "@/lib/supabase/database.types";

export type SessionUser = {
  id: string;
  email: string | null;
  role: UserRole;
  fullName: string;
  status: AccountStatus;
};

/** The signed-in user with their profile, or null. Cached for one request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, status")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return null;

  return {
    id: user.id,
    email: user.email ?? null,
    role: profile.role,
    fullName: profile.full_name,
    status: profile.status,
  };
});

/** Home page for each role after login. */
export function homeForRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "provider":
      return "/dashboard/provider";
    case "merchant":
      return "/dashboard/merchant";
  }
}

/**
 * Use at the top of every private page. Sends signed-out users to login,
 * suspended users to the notice page, and the wrong role to their own home.
 */
export async function requireUser(roles?: UserRole[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.status !== "active") redirect("/account-suspended");
  if (roles && !roles.includes(user.role)) redirect(homeForRole(user.role));
  return user;
}
