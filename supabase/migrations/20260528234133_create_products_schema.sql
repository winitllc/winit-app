/*
  # Product Database Schema

  ## Overview
  Full product catalog stored in Supabase, replacing live OpenFoodFacts queries.
  Products are imported from OpenFoodFacts (ODbL licensed), then curated by admins.

  ## New Tables

  ### `app_categories`
  Your own curated category list (Snacks, Beverages, etc.) — completely independent
  of OpenFoodFacts taxonomy. Admins can add/rename/reorder freely.
  - `id` (uuid, pk)
  - `slug` (text, unique) — URL-safe identifier e.g. "snacks"
  - `display_name` (text) — shown to users
  - `image_url` (text) — Pexels or local asset URL
  - `sort_order` (int) — controls display order
  - `off_tag` (text) — OpenFoodFacts tag used during import (can differ from slug)

  ### `products`
  Master product catalog. One row per product (keyed on OFF barcode).
  - Core identity: `id`, `barcode`, `name`, `brand`, `quantity`
  - Content: `ingredients_text`, `nutrition` (jsonb)
  - Normalized flags: `allergen_tags[]`, `diet_tags[]`, `label_tags[]`
  - Images: `image_front_url`, `image_ingredients_url`, `image_nutrition_url`
  - Grades: `nutriscore_grade`, `nova_group`
  - Admin fields: `status`, `health_rating`, `ai_insights`, `custom_tags[]`
  - Attribution: `off_id` (original OFF code), `off_categories_tags[]`
  - Audit: `created_at`, `updated_at`, `approved_at`, `approved_by`

  ### `product_categories`
  Many-to-many join: products ↔ app_categories. Admins assign products to
  categories independently of what OFF says.

  ### `import_jobs`
  Tracks each import run (category + page range). Lets admins re-trigger
  imports and see what was last synced.

  ## Security
  - RLS enabled on all tables
  - Products readable by everyone (anon) — ODbL requires public availability
  - All writes restricted to authenticated users (admins)
  - Import jobs writable by authenticated users only

  ## Full-Text Search
  - `search_vector` tsvector column on `products` auto-updated by trigger
  - Covers: name, brand, ingredients_text, custom_tags
  - GIN index for fast search

  ## Indexes
  - Barcode lookup (unique)
  - Status filter (pending/approved/rejected)
  - Category join
  - Full-text search vector
*/

-- ============================================================
-- EXTENSION
-- ============================================================
create extension if not exists unaccent;

-- ============================================================
-- APP_CATEGORIES
-- ============================================================
create table if not exists app_categories (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  display_name text not null,
  image_url    text not null default '',
  sort_order   int  not null default 0,
  off_tag      text not null default '',  -- e.g. "en:snacks" — used when importing from OFF
  created_at   timestamptz not null default now()
);

alter table app_categories enable row level security;

create policy "Anyone can read categories"
  on app_categories for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can insert categories"
  on app_categories for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update categories"
  on app_categories for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete categories"
  on app_categories for delete
  to authenticated
  using (true);

-- Seed the 10 app categories
insert into app_categories (slug, display_name, image_url, sort_order, off_tag) values
  ('snacks',           'Snacks',           'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400', 1,  'en:snacks'),
  ('beverages',        'Beverages',        'https://images.pexels.com/photos/1292294/pexels-photo-1292294.jpeg?auto=compress&cs=tinysrgb&w=400', 2,  'en:beverages'),
  ('breakfast-cereals','Breakfast Cereals','assets/browse/cereal.png', 3,  'en:breakfast-cereals'),
  ('bread',            'Bread',            'assets/browse/bread.png',  4,  'en:bread'),
  ('yogurts',          'Yogurts',          'assets/browse/yogurt.png', 5,  'en:yogurts'),
  ('cheese',           'Cheese',           'assets/browse/cheeses.png',6,  'en:cheese'),
  ('plant-based-foods','Plant-Based Foods','assets/browse/plant.png',  7,  'en:plant-based-foods'),
  ('sauces',           'Sauces',           'https://images.pexels.com/photos/1435706/pexels-photo-1435706.jpeg?auto=compress&cs=tinysrgb&w=400', 8,  'en:sauces'),
  ('frozen-foods',     'Frozen Foods',     'https://images.pexels.com/photos/3872373/pexels-photo-3872373.jpeg?auto=compress&cs=tinysrgb&w=400', 9,  'en:frozen-foods'),
  ('desserts',         'Desserts',         'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400',   10, 'en:sweet-snacks')
on conflict (slug) do nothing;

-- ============================================================
-- PRODUCTS
-- ============================================================
create table if not exists products (
  id                      uuid primary key default gen_random_uuid(),
  barcode                 text unique not null,

  -- Identity
  name                    text not null default '',
  brand                   text not null default '',
  quantity                text not null default '',
  generic_name            text not null default '',

  -- Images (URLs — OFF CDN or future S3)
  image_front_url         text not null default '',
  image_ingredients_url   text not null default '',
  image_nutrition_url     text not null default '',

  -- Ingredients & nutrition
  ingredients_text        text not null default '',
  nutrition               jsonb not null default '{}'::jsonb,

  -- Normalized allergen / diet / label arrays (admin-curated, lowercase slugs)
  -- e.g. allergen_tags: ["gluten","peanuts","milk"]
  -- e.g. diet_tags: ["vegan","gluten-free","kosher"]
  allergen_tags           text[] not null default '{}',
  diet_tags               text[] not null default '{}',
  label_tags              text[] not null default '{}',
  custom_tags             text[] not null default '{}',

  -- OFF-sourced tags (preserved for reference / re-import)
  off_categories_tags     text[] not null default '{}',
  off_allergens_tags      text[] not null default '{}',
  off_labels_tags         text[] not null default '{}',
  off_ingredients_tags    text[] not null default '{}',

  -- Grades
  nutriscore_grade        text not null default '',  -- a/b/c/d/e
  nova_group              int,                        -- 1-4

  -- Admin-editable fields
  status                  text not null default 'pending' check (status in ('pending','approved','rejected')),
  health_rating           int  check (health_rating between 1 and 10),
  ai_insights             text not null default '',
  admin_notes             text not null default '',

  -- Attribution (ODbL compliance)
  off_id                  text not null default '',  -- original barcode/code from OFF

  -- Audit
  approved_at             timestamptz,
  approved_by             text not null default '',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  -- Full-text search vector (auto-maintained by trigger below)
  search_vector           tsvector
);

alter table products enable row level security;

-- Public read — ODbL requires the data remain publicly accessible
create policy "Anyone can read approved products"
  on products for select
  to anon, authenticated
  using (status = 'approved');

create policy "Authenticated users can read all products"
  on products for select
  to authenticated
  using (true);

create policy "Authenticated users can insert products"
  on products for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update products"
  on products for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete products"
  on products for delete
  to authenticated
  using (true);

-- ============================================================
-- FULL-TEXT SEARCH TRIGGER
-- ============================================================
create or replace function products_search_vector_update()
returns trigger language plpgsql as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(unaccent(new.name), '')), 'A') ||
    setweight(to_tsvector('english', coalesce(unaccent(new.brand), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(unaccent(new.ingredients_text), '')), 'C') ||
    setweight(to_tsvector('english', coalesce(array_to_string(new.custom_tags, ' '), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(new.allergen_tags, ' '), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(new.diet_tags, ' '), '')), 'B');
  new.updated_at := now();
  return new;
end;
$$;

create trigger products_search_vector_trigger
  before insert or update on products
  for each row execute function products_search_vector_update();

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists products_status_idx       on products (status);
create index if not exists products_search_vector_idx on products using gin (search_vector);
create index if not exists products_allergen_tags_idx on products using gin (allergen_tags);
create index if not exists products_diet_tags_idx     on products using gin (diet_tags);
create index if not exists products_barcode_idx       on products (barcode);

-- ============================================================
-- PRODUCT_CATEGORIES  (many-to-many)
-- ============================================================
create table if not exists product_categories (
  product_id  uuid not null references products (id) on delete cascade,
  category_id uuid not null references app_categories (id) on delete cascade,
  primary key (product_id, category_id)
);

alter table product_categories enable row level security;

create policy "Anyone can read product categories"
  on product_categories for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can manage product categories"
  on product_categories for insert
  to authenticated
  with check (true);

create policy "Authenticated users can delete product categories"
  on product_categories for delete
  to authenticated
  using (true);

create index if not exists product_categories_category_idx on product_categories (category_id);
create index if not exists product_categories_product_idx  on product_categories (product_id);

-- ============================================================
-- IMPORT_JOBS
-- ============================================================
create table if not exists import_jobs (
  id             uuid primary key default gen_random_uuid(),
  category_slug  text not null,
  off_tag        text not null,
  pages_imported int  not null default 0,
  products_upserted int not null default 0,
  status         text not null default 'running' check (status in ('running','completed','failed')),
  error_message  text not null default '',
  started_at     timestamptz not null default now(),
  completed_at   timestamptz
);

alter table import_jobs enable row level security;

create policy "Authenticated users can read import jobs"
  on import_jobs for select
  to authenticated
  using (true);

create policy "Authenticated users can insert import jobs"
  on import_jobs for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update import jobs"
  on import_jobs for update
  to authenticated
  using (true)
  with check (true);
