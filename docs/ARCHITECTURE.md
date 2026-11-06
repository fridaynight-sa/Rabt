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
Supabase                   WhatsApp / phone call
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

## Search

`/search` reads its filters from the address (`?q=&type=&city=&category=&sector=&sort=&page=`,
parsed by `src/features/search/params.ts`), so any search can be shared as a link. The filter
form is a plain GET form and works without JavaScript. Results come from the
`search_listings` and `search_providers` database functions.

## Images

1. The browser shrinks each photo (longest side 1280px, WebP at quality 0.8, or JPEG where
   WebP is not supported) before upload (`src/lib/client/compress-image.ts`). A 4 MB phone
   photo becomes about 100 to 250 KB.
2. A server action checks the size (max 3 MB) and the real file type from its first bytes
   (JPEG, PNG or WebP only), then stores it under `portfolio/<provider id>/<random id>.<ext>`
   or `listings/<listing id>/<random id>.<ext>` and saves the key in the database
   (`src/lib/storage/upload.ts`).
3. Images live in the Supabase Storage bucket `rabt-media` (public read, created by
   `supabase/migrations/20261106000001_storage.sql`). Uploads and deletes run as the
   signed-in user, so the bucket's policies decide: a provider writes only to their own
   folder or their own listings' folders. Pages load images straight from Supabase's CDN
   (`mediaUrl` in `src/lib/storage/config.ts`).

### Moving images to Cloudflare R2 later

All storage code sits behind one switch (`src/lib/storage/`): `config.ts` (where images live
and their address), `store.ts` (upload and delete for Supabase or R2), `r2.ts` (the R2
binding) and the `/media` route (serves R2 images). Keys are the same in both. To switch:

1. Create the R2 bucket `rabt-media` and uncomment the `r2_buckets` binding in `wrangler.jsonc`.
2. Copy the files from Supabase Storage to R2 with the same keys.
3. Set `NEXT_PUBLIC_IMAGE_STORAGE=r2` and deploy. Image addresses become `/media/<key>`.

With R2 the server checks ownership before writing (the database rows and constraints),
since the bucket has no per-user rules.

## Hosting

`npm run deploy` builds with OpenNext and deploys to Cloudflare Workers
(`wrangler.jsonc`). `NEXT_PUBLIC_*` values are baked in at build time, so they
must be set in the build environment; `SUPABASE_SECRET_KEY` is a Worker secret.
