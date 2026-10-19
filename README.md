# ربط (Rabt)

منصة تربط المطاعم والكوفيهات والمتاجر الإلكترونية بالموردين ومزودي الخدمات. التواصل بينهم مباشر على الواتساب أو الاتصال.

A B2B directory connecting restaurants, cafes and online stores with suppliers and service providers.

## Stack

| Part               | Tool                                                                       |
| ------------------ | -------------------------------------------------------------------------- |
| Web app            | Next.js 16 (App Router, Server Actions), TypeScript, Tailwind CSS 4        |
| Hosting            | Cloudflare Workers via OpenNext                                            |
| Database and login | Supabase (Postgres with row level security, Supabase Auth)                 |
| Images             | Cloudflare R2 (from phase 3)                                               |
| Validation         | Zod, shared by forms and server                                            |
| Tests              | Vitest (unit), plain SQL tests on a throwaway Postgres (database security) |

## Run it locally

```bash
npm install
cp .env.example .env.local   # fill in the Supabase values
npm run dev                  # http://localhost:3000
```

## Checks

```bash
npm run check     # lint + types + formatting + unit tests
npm run test:db   # migrations + database security tests (needs PostgreSQL 15+ binaries)
npm run build
```

CI runs all of these on every pull request (`.github/workflows/ci.yml`).

## Project layout

```
docs/                 Architecture, database, security, roadmap, decisions
src/app/              Pages and routes
src/features/<name>/  One folder per feature: server actions, forms, rules
src/components/       Shared UI
src/lib/              Supabase clients, env, phone numbers, helpers
src/proxy.ts          Refreshes the login session, guards private pages
supabase/migrations/  Every database change, in order
supabase/tests/       Database security tests
tests/unit/           Unit tests
```

## Docs

- [Setup (Arabic): accounts and first launch](docs/SETUP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database](docs/DATABASE.md)
- [Security](docs/SECURITY.md)
- [Roadmap](docs/ROADMAP.md)
- [Decisions](docs/decisions/)
