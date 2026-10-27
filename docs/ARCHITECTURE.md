# Architecture

## Overview

```
Visitor / Merchant / Provider / Admin
            │
            ▼
   Next.js app on Cloudflare Workers  ◄── GitHub (CI, then deploy)
   - pages (server-rendered)              UptimeRobot (uptime alerts)
   - server actions (all writes)
   - proxy.ts (session refresh, route guard)
            │
   ┌────────┼──────────────┐
   ▼        ▼              ▼
Supabase   Cloudflare R2   WhatsApp / phone call
(Auth +    (images)        (direct links, no API)
Postgres)
```

The browser never talks to the database directly. Every read and write goes
through the Next.js server, which calls Supabase **as the signed-in user**, so
row level security applies to every query. The secret key is used only for
the few server-only operations listed in `docs/SECURITY.md`.

## Request flow

1. `src/proxy.ts` refreshes the Supabase session cookie on every request and
   redirects signed-out users away from `/dashboard` and `/admin`.
2. The page calls `requireUser([...roles])` (`src/features/auth/session.ts`),
   which checks the role and that the account is active.
3. Forms post to server actions. Each action validates with the feature's
   Zod schema, then calls Supabase. The database validates again (check
   constraints, triggers, RLS).

## Roles

| Role     | How it is created                                      |
| -------- | ------------------------------------------------------ |
| merchant | Sign up at `/signup/merchant`                          |
| provider | Sign up at `/signup/provider`                          |
| admin    | Promoted by hand in the database (see `docs/SETUP.md`) |

The sign-up form data is stored by Supabase Auth as user metadata. The
`handle_new_user` trigger turns it into a `profiles` row (and a `providers`
row), validating it again. The trigger never creates an admin.

## Folder rules

- `src/app/` holds routes only: thin pages that call features.
- `src/features/<feature>/` holds `actions.ts` (server actions), `schemas.ts`
  (Zod rules), `components/` (forms), and server helpers.
- `src/lib/` holds code shared by several features.
- Database: one migration per change, in `supabase/migrations/`, plus tests.

## Images

1. The browser shrinks each photo (longest side 1600px, WebP or JPEG) before upload
   (`src/lib/client/compress-image.ts`).
2. A server action checks the size (max 3 MB) and the real file type from its first
   bytes (JPEG, PNG or WebP only), then stores it in R2 under
   `portfolio/<provider id>/<random id>.<ext>` and saves the key in the database.
3. `/media/<key>` serves images from R2 with a one-year cache. Only keys in the
   site's own format are served, with `Content-Security-Policy: sandbox`.

## Hosting

`npm run deploy` builds with OpenNext and deploys to Cloudflare Workers
(`wrangler.jsonc`). `NEXT_PUBLIC_*` values are baked in at build time, so they
must be set in the build environment; `SUPABASE_SECRET_KEY` is a Worker secret.
The R2 bucket `rabt-media` is bound as `MEDIA`.
