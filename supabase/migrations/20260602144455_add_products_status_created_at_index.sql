/*
  # Add composite index on products(status, created_at)

  The Products admin page queries products filtered by status and ordered by
  created_at DESC. With 140k+ rows the existing single-column status index
  causes a full sort on every page load, hitting the statement timeout.

  This composite index lets Postgres satisfy both the filter and the ORDER BY
  in one index scan with no separate sort step.
*/

CREATE INDEX IF NOT EXISTS products_status_created_at_idx
  ON public.products (status, created_at DESC);
