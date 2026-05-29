const SUPABASE_URL = 'https://twosrdqyaxhdfyqgefjm.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3b3NyZHF5YXhoZGZ5cWdlZmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDQzMDksImV4cCI6MjA5NTU4MDMwOX0.qJ8ZQaMobmuL29-A3swShTbF-D7SVf1oUK9LU7vO7RE'

export type ProductStatus = 'pending' | 'approved' | 'rejected'
export type CategorizationStatus = 'unclassified' | 'auto_mapped' | 'ai_classified' | 'needs_review' | 'reviewed'

export interface Product {
  id: string
  barcode: string
  name: string
  brand: string
  quantity: string
  generic_name: string
  image_front_url: string
  image_ingredients_url: string
  image_nutrition_url: string
  ingredients_text: string
  nutrition: Record<string, number | null>
  allergen_tags: string[]
  diet_tags: string[]
  label_tags: string[]
  custom_tags: string[]
  off_categories_tags: string[]
  off_labels_tags: string[]
  nutriscore_grade: string
  nova_group: number | null
  status: ProductStatus
  health_rating: number | null
  ai_insights: string
  admin_notes: string
  off_id: string
  approved_at: string | null
  approved_by: string
  created_at: string
  updated_at: string
  // AI classification fields
  ai_category_id: string | null
  ai_subcategory_id: string | null
  ai_confidence: number | null
  ai_category_confidence: number | null
  ai_subcategory_confidence: number | null
  ai_tags: string[] | null
  ai_tag_confidences: Record<string, number> | null
  ai_classification_reason: string | null
  ai_classified_at: string | null
  ai_model: string | null
  categorization_status: CategorizationStatus | null
  review_priority: number | null
}

export interface AiCorrection {
  id: string
  product_id: string
  product_name: string
  brand: string
  off_categories_tags: string[]
  original_parent_id: string | null
  original_subcategory_id: string | null
  original_confidence: number | null
  corrected_parent_id: string | null
  corrected_subcategory_id: string | null
  corrected_tags: string[]
  correction_note: string
  corrected_by: string
  corrected_at: string
}

export interface AppCategory {
  id: string
  slug: string
  display_name: string
  image_url: string
  sort_order: number
  off_tag: string
}

export interface ImportJob {
  id: string
  source: 'api' | 'csv'
  category_slug: string
  off_tag: string
  filename: string | null
  pages_imported: number
  products_upserted: number
  products_skipped: number
  auto_mapped: number
  needs_review: number
  status: 'running' | 'completed' | 'failed'
  error_message: string
  started_at: string
  completed_at: string | null
}

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { headers })
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  return res.json()
}

async function patch<T>(path: string, body: Partial<T>, filter: string): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}?${filter}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`)
  return res.json()
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`)
  return res.json()
}

async function del(path: string, filter: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/${path}?${filter}`, { method: 'DELETE', headers })
}

export async function getProducts(opts: {
  status?: ProductStatus | ''
  search?: string
  page?: number
  pageSize?: number
}): Promise<{ products: Product[]; total: number }> {
  const { status, search, page = 0, pageSize = 25 } = opts
  const from = page * pageSize
  const to = from + pageSize - 1

  const url = new URL(`${SUPABASE_URL}/rest/v1/products`)
  if (status) url.searchParams.set('status', `eq.${status}`)
  if (search?.trim()) {
    url.searchParams.set('or', `(name.ilike.*${search}*,brand.ilike.*${search}*,barcode.ilike.*${search}*)`)
  }
  url.searchParams.set('order', 'created_at.desc')
  url.searchParams.set('select', '*')

  const res = await fetch(url.toString(), {
    headers: { ...headers, Range: `${from}-${to}`, Prefer: 'count=exact' },
  })
  if (!res.ok) throw new Error(`getProducts failed: ${res.status}`)
  const total = parseInt((res.headers.get('Content-Range') || '').split('/')[1] ?? '0', 10) || 0
  const products: Product[] = await res.json()
  return { products, total }
}

export async function getProduct(id: string): Promise<Product> {
  const rows = await get<Product[]>('products', { id: `eq.${id}`, select: '*' })
  if (!rows?.length) throw new Error(`Product ${id} not found`)
  return rows[0]
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<Product> {
  const rows = await patch<Product>('products', data, `id=eq.${id}`)
  if (!rows?.length) throw new Error(`Product ${id} not found after update`)
  return rows[0]
}

export async function approveProduct(id: string): Promise<void> {
  await patch('products', { status: 'approved', approved_at: new Date().toISOString() }, `id=eq.${id}`)
}

export async function rejectProduct(id: string): Promise<void> {
  await patch('products', { status: 'rejected' }, `id=eq.${id}`)
}

export async function getCategories(): Promise<AppCategory[]> {
  return get<AppCategory[]>('app_categories', { order: 'sort_order.asc', select: '*' })
}

export async function getProductCategoryIds(productId: string): Promise<string[]> {
  const rows = await get<{ category_id: string }[]>('product_categories', {
    product_id: `eq.${productId}`,
    select: 'category_id',
  })
  return rows.map(r => r.category_id)
}

export async function setProductCategories(productId: string, categoryIds: string[]): Promise<void> {
  await del('product_categories', `product_id=eq.${productId}`)
  if (categoryIds.length) {
    await post('product_categories', categoryIds.map(cid => ({ product_id: productId, category_id: cid })))
  }
}

export async function getImportJobs(): Promise<ImportJob[]> {
  return get<ImportJob[]>('import_jobs', { order: 'started_at.desc', select: '*' })
}

export async function triggerImport(
  categorySlug: string,
  offTag: string,
  maxPages: number,
): Promise<{ job_id: string; products_upserted: number; pages_imported: number; error: string | null }> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/import-products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ category_slug: categorySlug, off_tag: offTag, max_pages: maxPages }),
  })
  if (!res.ok) throw new Error(`Import failed: ${res.status}`)
  return res.json()
}

// ─── CSV import ───────────────────────────────────────────────────────────────

const CSV_CHUNK_LINES = 2000 // ~1-2 MB of text per chunk

export interface CsvChunkResult {
  processed: number
  skipped: number
  auto_mapped: number
  needs_review: number
}

export interface CsvImportResult {
  job_id: string
  products_upserted: number
  products_skipped: number
  auto_mapped: number
  needs_review: number
}

async function callImportCsv(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/import-csv`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`)
  return data
}

export async function createCsvImportJob(filename: string): Promise<string> {
  const data = await callImportCsv({ action: 'create_job', filename })
  return data.job_id as string
}

export async function processCsvChunk(
  jobId: string,
  header: string,
  chunk: string,
): Promise<CsvChunkResult> {
  const data = await callImportCsv({ action: 'process_chunk', job_id: jobId, header, chunk })
  return data as unknown as CsvChunkResult
}

export async function finishCsvImportJob(jobId: string): Promise<CsvImportResult> {
  const data = await callImportCsv({ action: 'finish_job', job_id: jobId })
  return data as unknown as CsvImportResult
}

export async function failCsvImportJob(jobId: string, message: string): Promise<void> {
  await patch('import_jobs', { status: 'failed', error_message: message, completed_at: new Date().toISOString() }, `id=eq.${jobId}`)
}

/** Split CSV text (already loaded) into line-chunks for streaming upload */
export function splitIntoChunks(text: string, linesPerChunk = CSV_CHUNK_LINES): string[] {
  const lines = text.split('\n')
  const chunks: string[] = []
  for (let i = 0; i < lines.length; i += linesPerChunk) {
    chunks.push(lines.slice(i, i + linesPerChunk).join('\n'))
  }
  return chunks
}

// ─── Taxonomy ─────────────────────────────────────────────────────────────────

export interface TaxonomyParent {
  id: string
  slug: string
  display_name: string
  icon: string
  description: string
  sort_order: number
  image_url: string
  created_at: string
}

export interface TaxonomySubcategory {
  id: string
  parent_id: string
  slug: string
  display_name: string
  sort_order: number
  off_tags: string[]
  created_at: string
}

export interface TaxonomyOffMapping {
  id: string
  off_pattern: string
  match_type: 'exact' | 'prefix' | 'contains'
  parent_id: string
  subcategory_id: string | null
  priority: number
  created_at: string
}

export async function getTaxonomyParents(): Promise<TaxonomyParent[]> {
  return get<TaxonomyParent[]>('taxonomy_parents', { order: 'sort_order.asc', select: '*' })
}

export async function createTaxonomyParent(data: Partial<TaxonomyParent>): Promise<TaxonomyParent> {
  const rows = await post<TaxonomyParent[]>('taxonomy_parents', data)
  return (rows as TaxonomyParent[])[0]
}

export async function updateTaxonomyParent(id: string, data: Partial<TaxonomyParent>): Promise<void> {
  await patch('taxonomy_parents', data, `id=eq.${id}`)
}

export async function deleteTaxonomyParent(id: string): Promise<void> {
  await del('taxonomy_parents', `id=eq.${id}`)
}

export async function getTaxonomySubcategories(): Promise<TaxonomySubcategory[]> {
  return get<TaxonomySubcategory[]>('taxonomy_subcategories', { order: 'parent_id.asc,sort_order.asc', select: '*' })
}

export async function createTaxonomySubcategory(data: Partial<TaxonomySubcategory>): Promise<TaxonomySubcategory> {
  const rows = await post<TaxonomySubcategory[]>('taxonomy_subcategories', data)
  return (rows as TaxonomySubcategory[])[0]
}

export async function updateTaxonomySubcategory(id: string, data: Partial<TaxonomySubcategory>): Promise<void> {
  await patch('taxonomy_subcategories', data, `id=eq.${id}`)
}

export async function deleteTaxonomySubcategory(id: string): Promise<void> {
  await del('taxonomy_subcategories', `id=eq.${id}`)
}

export async function getTaxonomyMappings(): Promise<TaxonomyOffMapping[]> {
  return get<TaxonomyOffMapping[]>('taxonomy_off_mappings', { order: 'priority.desc,off_pattern.asc', select: '*' })
}

export async function createTaxonomyMapping(data: Partial<TaxonomyOffMapping>): Promise<TaxonomyOffMapping> {
  const rows = await post<TaxonomyOffMapping[]>('taxonomy_off_mappings', data)
  return (rows as TaxonomyOffMapping[])[0]
}

export async function deleteTaxonomyMapping(id: string): Promise<void> {
  await del('taxonomy_off_mappings', `id=eq.${id}`)
}

export async function bulkReclassifyProducts(): Promise<number> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/fn_bulk_reclassify_products`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  })
  if (!res.ok) throw new Error(`Bulk reclassify failed: ${res.status}`)
  return res.json()
}

export async function getProductStats(): Promise<{ pending: number; approved: number; rejected: number; total: number }> {
  const countOf = (h: Headers) => parseInt((h.get('Content-Range') || '').split('/')[1] ?? '0', 10) || 0
  const [r1, r2, r3] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/products?status=eq.pending&select=id`, { headers: { ...headers, Prefer: 'count=exact', Range: '0-0' } }),
    fetch(`${SUPABASE_URL}/rest/v1/products?status=eq.approved&select=id`, { headers: { ...headers, Prefer: 'count=exact', Range: '0-0' } }),
    fetch(`${SUPABASE_URL}/rest/v1/products?status=eq.rejected&select=id`, { headers: { ...headers, Prefer: 'count=exact', Range: '0-0' } }),
  ])
  const p = countOf(r1.headers), a = countOf(r2.headers), r = countOf(r3.headers)
  return { pending: p, approved: a, rejected: r, total: p + a + r }
}

// ─── AI Review Queue ──────────────────────────────────────────────────────────

export async function getReviewQueue(opts: {
  page?: number
  pageSize?: number
  search?: string
}): Promise<{ products: Product[]; total: number }> {
  const { page = 0, pageSize = 25, search } = opts
  const from = page * pageSize
  const to = from + pageSize - 1

  const url = new URL(`${SUPABASE_URL}/rest/v1/products`)
  url.searchParams.set('categorization_status', 'eq.needs_review')
  url.searchParams.set('order', 'review_priority.desc,created_at.desc')
  url.searchParams.set('select', '*')
  if (search?.trim()) {
    url.searchParams.set('or', `(name.ilike.*${search}*,brand.ilike.*${search}*)`)
  }

  const res = await fetch(url.toString(), {
    headers: { ...headers, Range: `${from}-${to}`, Prefer: 'count=exact' },
  })
  if (!res.ok) throw new Error(`getReviewQueue failed: ${res.status}`)
  const total = parseInt((res.headers.get('Content-Range') || '').split('/')[1] ?? '0', 10) || 0
  const products: Product[] = await res.json()
  return { products, total }
}

export async function approveClassification(product: Product, overrides?: {
  parentId?: string
  subcategoryId?: string
  tags?: string[]
  note?: string
}): Promise<void> {
  const parentId = overrides?.parentId ?? product.ai_category_id
  const subcatId = overrides?.subcategoryId ?? product.ai_subcategory_id
  const tags = overrides?.tags ?? product.ai_tags ?? []

  // Save correction if overrides provided
  if (overrides?.parentId || overrides?.subcategoryId || overrides?.tags) {
    await post('ai_correction_log', {
      product_id: product.id,
      product_name: product.name,
      brand: product.brand ?? '',
      off_categories_tags: product.off_categories_tags ?? [],
      original_parent_id: product.ai_category_id,
      original_subcategory_id: product.ai_subcategory_id,
      original_confidence: product.ai_confidence,
      corrected_parent_id: parentId,
      corrected_subcategory_id: subcatId,
      corrected_tags: tags,
      correction_note: overrides?.note ?? '',
    })
  }

  await patch('products', {
    categorization_status: 'reviewed',
    review_priority: 0,
    ai_category_id: parentId,
    ai_subcategory_id: subcatId,
    ai_tags: tags,
  }, `id=eq.${product.id}`)

  // Upsert product_taxonomy
  if (parentId) {
    await post('product_taxonomy', {
      product_id: product.id,
      parent_id: parentId,
      subcategory_id: subcatId,
      auto_assigned: false,
    })
  }
}

export async function rejectClassification(productId: string, note?: string): Promise<void> {
  await patch('products', {
    categorization_status: 'reviewed',
    review_priority: 0,
    admin_notes: note ?? 'Rejected via review queue',
    status: 'rejected',
  }, `id=eq.${productId}`)
}

export async function reclassifyProduct(productId: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/classify-product`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: productId }),
  })
  if (!res.ok) throw new Error(`Reclassify failed: ${res.status}`)
}
