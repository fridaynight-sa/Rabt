import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * For the uptime monitor (UptimeRobot): 200 when the site and the database answer,
 * 503 when the database does not. Says nothing else.
 */
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const env = getPublicEnv();
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { error } = await supabase
      .from("cities")
      .select("id", { head: true, count: "exact" })
      .limit(1);
    if (error) throw error;
    return Response.json({ ok: true }, { headers });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers });
  }
}
