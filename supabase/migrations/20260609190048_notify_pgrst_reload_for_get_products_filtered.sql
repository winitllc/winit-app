-- Force PostgREST to reload its schema cache to pick up get_products_filtered
NOTIFY pgrst, 'reload schema';
