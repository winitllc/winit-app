/*
  # Add increment_import_job_counts RPC helper

  Called by the import-csv Edge Function after each batch to atomically
  increment the running totals on an import_jobs row without race conditions.
*/

CREATE OR REPLACE FUNCTION increment_import_job_counts(
  p_job_id       uuid,
  p_upserted     int,
  p_skipped      int,
  p_auto_mapped  int,
  p_needs_review int
) RETURNS void LANGUAGE sql AS $$
  UPDATE import_jobs SET
    products_upserted = products_upserted + p_upserted,
    products_skipped  = products_skipped  + p_skipped,
    auto_mapped       = auto_mapped       + p_auto_mapped,
    needs_review      = needs_review      + p_needs_review
  WHERE id = p_job_id;
$$;
