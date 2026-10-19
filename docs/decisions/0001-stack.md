# 0001: Stack

**Decision:** Next.js 16 on Cloudflare Workers (OpenNext), Supabase for Postgres
and login, Cloudflare R2 for images.

**Why:**

- All free at the start, and each scales without a rewrite (Supabase Pro, R2
  pay-as-you-go, Workers paid plan).
- Server-rendered pages are fast on phones and readable by Google.
- Postgres row level security puts access rules in the database, where a bug in
  a page cannot bypass them.
- One language (TypeScript) across the app.

**Trade-off:** OpenNext adds a build step between Next.js and Cloudflare. It is
the officially recommended way to run Next.js on Cloudflare.
