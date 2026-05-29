/*
  # Add high-water mark to app_categories

  Adds `last_modified_since` (integer, Unix timestamp) to `app_categories`.
  The import-products edge function writes the highest `off_last_modified_t`
  it sees after each successful run, so the next pull for that category only
  fetches products modified after that point.

  1. Modified Tables
    - `app_categories`
      - `last_modified_since` (bigint, nullable) — Unix timestamp of the most
        recently seen OFF `last_modified_t` for this category. NULL means the
        category has never been pulled and the full catalogue is fetched.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_categories' AND column_name = 'last_modified_since'
  ) THEN
    ALTER TABLE app_categories ADD COLUMN last_modified_since bigint DEFAULT NULL;
  END IF;
END $$;
