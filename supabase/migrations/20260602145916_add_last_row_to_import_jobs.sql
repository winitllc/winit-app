/*
  # Add last_row resume tracking to import_jobs

  ## Summary
  Adds a `last_row` column to `import_jobs` so CSV uploads can resume from where
  they stopped if the browser tab closes or the connection drops mid-upload.

  ## Changes
  - `import_jobs.last_row` (bigint, nullable) — the 0-based data row index (excluding
    the header) of the last successfully processed row. NULL means no rows processed yet.
    On resume, the browser skips all CSV rows up to and including this index.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'import_jobs' AND column_name = 'last_row'
  ) THEN
    ALTER TABLE import_jobs ADD COLUMN last_row bigint DEFAULT NULL;
  END IF;
END $$;
