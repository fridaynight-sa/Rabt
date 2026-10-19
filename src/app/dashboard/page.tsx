import { redirect } from "next/navigation";
import { homeForRole, requireUser } from "@/features/auth/session";

/** Sends each user to their own dashboard. */
export default async function DashboardPage() {
  const user = await requireUser();
  redirect(homeForRole(user.role));
}
