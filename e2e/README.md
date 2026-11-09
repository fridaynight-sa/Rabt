# End-to-end tests

A real browser (Playwright, phone-sized) walks through the site the way people use it:

1. A visitor searches from the home page (Arabic spelling variants still match).
2. A provider signs up, confirms the email, edits their page, uploads a work photo and
   posts an ad with a photo.
3. A merchant signs up, rates the provider and reports the ad.
4. The admin sets up the authenticator app, sees the report and hides the ad; a visitor
   then gets "not found".

They run in CI on every pull request (`e2e` job in `.github/workflows/ci.yml`) against a
local Supabase started by the Supabase CLI. Nothing touches the live site.

## Run them on your machine

Needs Docker and the Supabase CLI.

```bash
supabase start                     # migrations + supabase/seed.sql
supabase status -o env             # copy the keys into .env.local:
#   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
#   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY or ANON_KEY>
#   SUPABASE_SECRET_KEY=<SECRET_KEY or SERVICE_ROLE_KEY>
#   NEXT_PUBLIC_SITE_URL=http://localhost:3000
npm run build
npx playwright install chromium
npm run test:e2e
```

Emails (sign-up confirmations) go to the local mailbox at http://127.0.0.1:54324.

## Sample data

`supabase/seed.sql` adds sample providers, merchants, ads, reviews and an admin, all
marked "(تجريبي)" with `@example.com` emails and the password `Sample-pass-1`. It is for
local development and tests only. Never run it on the live project: merchants would see
businesses and WhatsApp numbers that do not exist.
