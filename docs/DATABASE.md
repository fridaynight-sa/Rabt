# Database

Postgres on Supabase. Schema lives in `supabase/migrations/`.

| Table                                 | Purpose                                                                           | Who reads                          | Who writes                               |
| ------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------- |
| cities, sectors, categories           | Reference lists                                                                   | Everyone                           | Migrations / admin                       |
| profiles                              | One row per account: role, name, phone, status                                    | Owner, admin                       | Owner (name, phone only)                 |
| providers                             | Provider page: business name, slug, city, WhatsApp, services, description, rating | Everyone (active accounts)         | Owner (not slug, verification or rating) |
| provider_sectors, provider_categories | What a provider serves and offers                                                 | Everyone                           | Owner                                    |
| portfolio_images                      | Work photos (R2 keys under `portfolio/<provider id>/`), max 30                    | Everyone (active accounts)         | Owner                                    |
| listings                              | Ads: title, description, optional price, city, category, contact method           | Everyone when published and active | Owner (not status)                       |
| listing_images                        | Ad photos (R2 keys), max 5                                                        | Same as the listing                | Owner                                    |
| reviews                               | 1-5 stars + comment, one per merchant per provider                                | Everyone                           | Merchant (own)                           |
| reports                               | Reports on a provider, listing or review                                          | Reporter, admin                    | Any active user                          |
| page_views_daily                      | Visits per day and path                                                           | Admin                              | Server only                              |
| audit_log                             | What admins did                                                                   | Admin                              | Server only                              |

## Rules enforced by the database

- Ratings: a trigger keeps `providers.rating_avg` and `rating_count` current.
- Image limits: triggers cap listing images at 5 and portfolio images at 30.
- Image keys: a portfolio image key must sit in its owner's folder (`portfolio/<provider id>/...`).
- Image keys: a listing image key must sit in its listing's folder (`listings/<listing id>/...`).
- Search: `listings.search_text` and `providers.search_text` are generated columns holding
  normalized Arabic text (`normalize_search_text`: no diacritics, أ/إ/آ → ا, ة → ه, ى → ي),
  indexed with trigrams (`pg_trgm`).
- `search_listings(...)` and `search_providers(...)` return one page of results plus the total.
  They run as the caller, so RLS hides hidden listings and suspended providers. Listings match
  on their title and description or the provider's name; `%` and `_` in the search are plain text.
- `set_provider_tags(sector_ids, category_ids)` replaces a provider's sectors and categories in one step, as the caller (RLS applies).
- Phone and WhatsApp numbers must be E.164.
- Suspended accounts disappear from public pages and cannot write.
- Admin changes (suspend, hide, verify) will go through audited functions (phase 5).

## Changing the schema

1. Add a new file `supabase/migrations/<timestamp>_<name>.sql`. Never edit an
   applied one.
2. Add tests to `supabase/tests/` and run `npm run test:db`.
3. Update `src/lib/supabase/database.types.ts` and this file.
