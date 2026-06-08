-- Index for unfiltered ORDER BY created_at DESC (used by Products page with no status filter)
CREATE INDEX IF NOT EXISTS products_created_at_idx ON products (created_at DESC);
