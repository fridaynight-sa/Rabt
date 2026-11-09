// Weekly clean-up: deletes image files that no listing or portfolio row points to.
// Runs from .github/workflows/cleanup-images.yml with the project's URL and secret key.
//   SUPABASE_URL=... SUPABASE_SECRET_KEY=... node scripts/cleanup-images.mjs [--dry-run]
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const dryRun = process.argv.includes("--dry-run");
if (!url || !key) {
  console.log("Skipped: SUPABASE_URL and SUPABASE_SECRET_KEY are not set.");
  process.exit(0);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const bucket = supabase.storage.from("rabt-media");
let removed = 0;

for (let round = 0; round < 20; round++) {
  const { data, error } = await supabase.rpc("orphan_media_files", { p_limit: 500 });
  if (error) throw new Error(`orphan lookup failed: ${error.message}`);
  const names = (data ?? []).map((r) => r.name);
  if (names.length === 0) break;
  if (dryRun) {
    console.log(`Would delete ${names.length} files, for example:`, names.slice(0, 5));
    break;
  }
  for (let i = 0; i < names.length; i += 100) {
    const batch = names.slice(i, i + 100);
    const { error: removeError } = await bucket.remove(batch);
    if (removeError) throw new Error(`delete failed: ${removeError.message}`);
    removed += batch.length;
  }
}

console.log(dryRun ? "Dry run done." : `Deleted ${removed} unused image files.`);
