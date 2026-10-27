-- Rabt phase 3: listings and search.

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Listing image keys must sit in their listing's own folder.
-- ---------------------------------------------------------------------------

alter table public.listing_images
  add constraint listing_images_key_in_listing_folder
  check (storage_key like 'listings/' || listing_id::text || '/%');

-- ---------------------------------------------------------------------------
-- Arabic-friendly search text: removes diacritics and tatweel, and treats
-- letter variants alike (أ إ آ ٱ -> ا, ى -> ي, ة -> ه, ؤ -> و, ئ -> ي).
-- So "مؤسسة" finds "موسسه" and "قهوة" finds "قهوه".
-- ---------------------------------------------------------------------------

create function public.normalize_search_text(t text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(
    translate(
      regexp_replace(coalesce(t, ''), '[ً-ْٰـ]', '', 'g'),
      'أإآٱىةؤئ',
      'اااايهوي'
    )
  );
$$;

alter table public.listings
  add column search_text text
  generated always as (public.normalize_search_text(title || ' ' || description)) stored;

alter table public.providers
  add column search_text text
  generated always as (
    public.normalize_search_text(business_name || ' ' || services || ' ' || coalesce(description, ''))
  ) stored;

create index listings_search_text_idx
  on public.listings using gin (search_text extensions.gin_trgm_ops);
create index providers_search_text_idx
  on public.providers using gin (search_text extensions.gin_trgm_ops);
create index providers_rating_idx on public.providers (rating_avg desc, rating_count desc);

-- Search term ready for LIKE: normalized, and with % _ \ treated as plain characters.
create function public.search_pattern(p_query text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when nullif(btrim(coalesce(p_query, '')), '') is null then null
    else '%' || replace(replace(replace(
      public.normalize_search_text(btrim(p_query)), '\', '\\'), '%', '\%'), '_', '\_') || '%'
  end;
$$;

-- ---------------------------------------------------------------------------
-- Search listings by their title and description, or the provider's name.
-- Runs as the caller: row level security hides hidden listings and suspended
-- providers. Returns one page plus the total count.
-- ---------------------------------------------------------------------------

create function public.search_listings(
  p_query text default null,
  p_city_id smallint default null,
  p_category_id smallint default null,
  p_sector_id smallint default null,
  p_provider_id uuid default null,
  p_sort text default 'new',
  p_limit integer default 24,
  p_offset integer default 0
)
returns table (
  id uuid,
  title text,
  price numeric,
  city_id smallint,
  category_id smallint,
  contact_method public.contact_method,
  created_at timestamptz,
  provider_id uuid,
  provider_name text,
  provider_slug text,
  provider_verified boolean,
  cover_key text,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    l.id, l.title, l.price, l.city_id, l.category_id, l.contact_method, l.created_at,
    p.id, p.business_name, p.slug, p.is_verified,
    (
      select i.storage_key from public.listing_images i
      where i.listing_id = l.id
      order by i.sort_order, i.created_at
      limit 1
    ),
    count(*) over ()
  from public.listings l
  join public.providers p on p.id = l.provider_id
  where l.status = 'published'
    and (public.search_pattern(p_query) is null
         or l.search_text like public.search_pattern(p_query)
         or public.normalize_search_text(p.business_name) like public.search_pattern(p_query))
    and (p_city_id is null or l.city_id = p_city_id)
    and (p_category_id is null or l.category_id = p_category_id)
    and (p_provider_id is null or l.provider_id = p_provider_id)
    and (p_sector_id is null or exists (
      select 1 from public.provider_sectors s
      where s.provider_id = l.provider_id and s.sector_id = p_sector_id
    ))
  order by
    case when p_sort = 'price_low' then l.price end asc nulls last,
    case when p_sort = 'price_high' then l.price end desc nulls last,
    l.created_at desc,
    l.id
  limit least(greatest(coalesce(p_limit, 24), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

-- ---------------------------------------------------------------------------
-- Search providers. Same rules as above.
-- ---------------------------------------------------------------------------

create function public.search_providers(
  p_query text default null,
  p_city_id smallint default null,
  p_category_id smallint default null,
  p_sector_id smallint default null,
  p_sort text default 'rating',
  p_limit integer default 24,
  p_offset integer default 0
)
returns table (
  id uuid,
  slug text,
  business_name text,
  city_id smallint,
  services text,
  is_verified boolean,
  rating_avg numeric,
  rating_count integer,
  cover_key text,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p.id, p.slug, p.business_name, p.city_id, p.services, p.is_verified,
    p.rating_avg, p.rating_count,
    (
      select i.storage_key from public.portfolio_images i
      where i.provider_id = p.id
      order by i.sort_order, i.created_at
      limit 1
    ),
    count(*) over ()
  from public.providers p
  where public.is_account_active(p.id)
    and (public.search_pattern(p_query) is null or p.search_text like public.search_pattern(p_query))
    and (p_city_id is null or p.city_id = p_city_id)
    and (p_category_id is null or exists (
      select 1 from public.provider_categories c
      where c.provider_id = p.id and c.category_id = p_category_id
    ))
    and (p_sector_id is null or exists (
      select 1 from public.provider_sectors s
      where s.provider_id = p.id and s.sector_id = p_sector_id
    ))
  order by
    case when p_sort = 'new' then p.created_at end desc nulls last,
    p.rating_avg desc,
    p.rating_count desc,
    p.created_at desc,
    p.id
  limit least(greatest(coalesce(p_limit, 24), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

revoke execute on function public.normalize_search_text(text) from public;
revoke execute on function public.search_pattern(text) from public;
revoke execute on function public.search_listings(text, smallint, smallint, smallint, uuid, text, integer, integer) from public;
revoke execute on function public.search_providers(text, smallint, smallint, smallint, text, integer, integer) from public;

grant execute on function public.normalize_search_text(text) to anon, authenticated;
grant execute on function public.search_pattern(text) to anon, authenticated;
grant execute on function public.search_listings(text, smallint, smallint, smallint, uuid, text, integer, integer) to anon, authenticated;
grant execute on function public.search_providers(text, smallint, smallint, smallint, text, integer, integer) to anon, authenticated;
