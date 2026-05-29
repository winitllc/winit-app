/*
  # Extend import_jobs for CSV uploads

  ## Changes
  1. import_jobs.source — 'api' | 'csv' distinguishes pull vs upload jobs
  2. import_jobs.filename — original filename for CSV uploads
  3. import_jobs.products_skipped — rows skipped due to missing barcode / parse error
  4. import_jobs.auto_mapped — products that got at least one WINIT category automatically
  5. import_jobs.needs_review — products that landed in the review queue

  All new columns are nullable so existing rows are unaffected.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='import_jobs' AND column_name='source') THEN
    ALTER TABLE import_jobs ADD COLUMN source text NOT NULL DEFAULT 'api'
      CHECK (source IN ('api','csv'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='import_jobs' AND column_name='filename') THEN
    ALTER TABLE import_jobs ADD COLUMN filename text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='import_jobs' AND column_name='products_skipped') THEN
    ALTER TABLE import_jobs ADD COLUMN products_skipped int NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='import_jobs' AND column_name='auto_mapped') THEN
    ALTER TABLE import_jobs ADD COLUMN auto_mapped int NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='import_jobs' AND column_name='needs_review') THEN
    ALTER TABLE import_jobs ADD COLUMN needs_review int NOT NULL DEFAULT 0;
  END IF;
END $$;
