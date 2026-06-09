-- Fix RPC ambiguity: drop the old no-parameter overload
DROP FUNCTION IF EXISTS get_quality_filter_counts();

-- Notify PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
