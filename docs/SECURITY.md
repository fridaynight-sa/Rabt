# Security

## Principles

1. **Deny by default.** Migrations revoke every privilege, then grant per table
   and per column. Every table has row level security.
2. **Check twice.** Zod validates on the server; the database validates again
   with constraints, triggers and RLS. The browser is never trusted.
3. **Least privilege.** The server talks to Supabase as the signed-in user. The
   secret key is used only for:
   - finding the email for a phone number at login (`get_login_email_for_phone`)
   - checking a phone number is free at sign up
   - counting page views (`record_page_view`)
4. **Tested.** `supabase/tests/01_security.sql` proves what each role can and
   cannot do. CI runs it on every pull request.

## Accounts

- Nobody can sign up as admin; the trigger rejects it and `role` is not
  writable by users.
- Login errors do not reveal whether an email or phone exists. Password reset
  always gives the same answer.
- Suspended users are signed out at login and blocked by RLS.
- Passwords: at least 8 characters with a letter and a digit (app and Supabase).
- Email must be confirmed before login.
- Reviews show only the reviewer's display name; their phone, email and account stay private.
  Only active merchants review, once per provider; they can edit or delete their own review.
- Changing the email or password needs the current password. A new email only takes
  effect after the link sent to it is opened (Supabase secure email change also asks
  the old address).

## Web

- Security headers on every response: HSTS, `X-Frame-Options: DENY`,
  `nosniff`, strict referrer policy, CSP `frame-ancestors 'none'`.
- Uploads: max 3 MB, type read from the file's bytes (JPEG, PNG, WebP only; no SVG),
  random file names, stored only in the owner's folder (enforced by the database).
  Images are served with `Content-Security-Policy: default-src 'none'; sandbox`.
- Redirects after login only go to paths on this site (`safeNextPath`).
- Server actions are protected against cross-site posts by Next.js
  (Origin check).

## Secrets

- `SUPABASE_SECRET_KEY` is server only (`src/lib/supabase/admin.ts` imports
  `server-only`). It is set as a Cloudflare Worker secret, never in code.
- `.env*` and `.dev.vars` are git-ignored.
- Owner keeps all passwords and keys in Bitwarden.

## Admin

- Admin powers need the second login step: a code from an authenticator app (Supabase MFA,
  `aal2`). `is_admin()` checks it in the database, so an admin session without the code
  has no admin rights anywhere, not only in the pages. The first visit to `/admin` sets
  the app up.
- Every admin change goes through an `admin_*` database function that checks admin rights
  and writes `audit_log` in the same transaction. Creating and deleting logins (Supabase
  admin API) is logged with `admin_log` before it runs. Nobody can edit or delete the log.
- Admins cannot suspend or delete themselves or other admins from the dashboard.
- Before the server uses the secret key for an admin, the database must confirm the
  session is an admin (`is_admin()` over the user's own session).
- Lost phone: in Supabase, open Authentication > Users, pick the admin, and remove the
  authenticator factor. The next visit to `/admin` sets up a new one.

## Visit counting

Page views are counted in `src/proxy.ts` after the response is sent: public pages only,
real page loads and in-app navigations, no bots, prefetches or dashboards
(`src/lib/analytics.ts`). Only the path is stored, per day. No personal data.

## Making the first admin

In the Supabase SQL editor, after signing up normally with your own email:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'YOUR_EMAIL');
```

Then open `/admin` and set up the authenticator app (required).

## Known gaps (planned)

| Gap                                                           | Plan                                 |
| ------------------------------------------------------------- | ------------------------------------ |
| Bot protection on sign up and login                           | Cloudflare Turnstile, phase 6        |
| Full Content Security Policy (scripts, styles)                | Phase 6, with nonces                 |
| Supabase rate limits count per IP; our server makes the calls | Review limits before launch, phase 6 |

## Checks

- On every change: `npm run check`, `npm run test:db`, `npm run build`, and a
  security review of the diff (see `CLAUDE.md`).
- Weekly: scheduled review of dependencies (`npm audit`), errors and uptime.
