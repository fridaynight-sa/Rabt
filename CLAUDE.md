# Working rules for this project

Rabt is an Arabic, right-to-left B2B directory. Read `docs/ARCHITECTURE.md` and
`docs/SECURITY.md` before changing anything.

## Every change

1. Keep the change to what was asked. No features the owner did not approve.
2. Run before every commit and fix anything that fails:
   - `npm run check` (lint, types, formatting, unit tests)
   - `npm run test:db` when anything under `supabase/` changes
   - `npm run build`
3. Security review of your own diff before pushing:
   - Every new table: RLS enabled, explicit GRANTs (insert/update by column), policies,
     and tests in `supabase/tests/` for each role (visitor, merchant, provider, admin).
   - Every new function: `set search_path = ''`, and `revoke execute ... from public, anon,
authenticated` unless the browser must call it.
   - Never trust form data: validate with Zod on the server, the database checks again.
   - Never use the admin (secret key) Supabase client for something a user can do with
     their own session.
   - No secrets in code, logs or error messages.
4. Update docs (`docs/`, README) in the same change when behaviour or structure changes.

## Conventions

- UI text is Arabic (Saudi, friendly and short). Code, comments and docs are English.
- Features live in `src/features/<name>/` (actions, components, schemas).
- Database changes are new files in `supabase/migrations/`; never edit an applied migration.
- Phone numbers are stored as E.164 (`+9665...`); use `src/lib/phone.ts`.
- Redirect targets from user input go through `safeNextPath`.
