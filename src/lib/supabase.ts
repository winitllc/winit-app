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
  review_reasons: string[]
  product_categories?: { category_id: string }[]
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
  last_modified_since: number | null
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
  last_row: number | null
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
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`PATCH ${path} failed: ${res.status} ${text}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : []
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

export type QualityFilter = 'missing_name' | 'missing_ingredients' | 'needs_review' | 'user_submitted'

export async function getProducts(opts: {
  status?: ProductStatus | ''
  search?: string
  page?: number
  pageSize?: number
  qualityFilter?: QualityFilter | ''
}): Promise<{ products: Product[]; total: number }> {
  const { status, search, page = 0, pageSize = 25, qualityFilter } = opts

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_products_filtered`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      p_status:         status || null,
      p_search:         search?.trim() || null,
      p_quality_filter: qualityFilter || null,
      p_page:           page,
      p_page_size:      pageSize,
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`getProducts failed: ${res.status} ${body}`)
  }
  const raw = await res.json()
  // PostgREST may return the scalar directly or wrap it in an array
  const data = (Array.isArray(raw) ? raw[0] : raw) as { products?: Product[]; total?: number } | null
  return { products: data?.products ?? [], total: data?.total ?? 0 }
}

export async function getProduct(id: string): Promise<Product> {
  const rows = await get<Product[]>('products', { id: `eq.${id}`, select: '*' })
  if (!rows?.length) throw new Error(`Product ${id} not found`)
  return rows[0]
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  await patch<Product>('products', data, `id=eq.${id}`)
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

export async function resetCategoryWatermark(slug: string): Promise<void> {
  await patch('app_categories', { last_modified_since: null }, `slug=eq.${slug}`)
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

export async function resumeCsvImportJob(jobId: string): Promise<{
  last_row: number | null
  products_upserted: number
  products_skipped: number
  auto_mapped: number
  needs_review: number
}> {
  const data = await callImportCsv({ action: 'resume_job', job_id: jobId })
  return data as never
}

export async function processCsvChunk(
  jobId: string,
  header: string,
  chunk: string,
  startRow: number,
): Promise<CsvChunkResult> {
  const data = await callImportCsv({ action: 'process_chunk', job_id: jobId, header, chunk, start_row: startRow })
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

// ─── Image patch ─────────────────────────────────────────────────────────────

export interface ImagePatchChunkResult {
  processed: number
  skipped: number
}

export interface ImagePatchResult {
  job_id: string
  products_upserted: number
  products_skipped: number
}

async function callPatchImages(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/patch-images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`)
  return data
}

export async function createImagePatchJob(filename: string): Promise<string> {
  const data = await callPatchImages({ action: 'create_job', filename })
  return data.job_id as string
}

export async function processImagePatchChunk(
  jobId: string,
  header: string,
  chunk: string,
): Promise<ImagePatchChunkResult> {
  const data = await callPatchImages({ action: 'process_chunk', job_id: jobId, header, chunk })
  return data as unknown as ImagePatchChunkResult
}

export async function finishImagePatchJob(jobId: string): Promise<ImagePatchResult> {
  const data = await callPatchImages({ action: 'finish_job', job_id: jobId })
  return data as unknown as ImagePatchResult
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

/** Run AI classification on all products that haven't been AI-classified yet.
 *  Fetches IDs in pages of 50 and calls classify-product for each batch. */
export async function bulkAiClassify(
  onProgress?: (done: number, total: number) => void,
): Promise<{ classified: number; needs_review: number }> {
  // Fetch all unclassified/auto_mapped product IDs
  const url = new URL(`${SUPABASE_URL}/rest/v1/products`)
  url.searchParams.set('select', 'id')
  url.searchParams.set('or', '(categorization_status.eq.unclassified,categorization_status.eq.auto_mapped)')
  url.searchParams.set('order', 'created_at.asc')

  const res = await fetch(url.toString(), {
    headers: { ...headers, Prefer: 'count=exact', Range: '0-9999' },
  })
  if (!res.ok) throw new Error(`Failed to fetch product IDs: ${res.status}`)
  const rows: { id: string }[] = await res.json()
  const total = rows.length
  let classified = 0, needsReview = 0, done = 0

  const BATCH = 50
  for (let i = 0; i < rows.length; i += BATCH) {
    const ids = rows.slice(i, i + BATCH).map(r => r.id)
    const r = await fetch(`${SUPABASE_URL}/functions/v1/classify-product`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_ids: ids }),
    })
    if (r.ok) {
      const data = await r.json() as { classified: number; needs_review: number }
      classified += data.classified ?? 0
      needsReview += data.needs_review ?? 0
    }
    done += ids.length
    onProgress?.(done, total)
  }
  return { classified, needs_review: needsReview }
}

export async function getProductStats(): Promise<{ pending: number; approved: number; rejected: number; total: number }> {
  const rows = await get<{ pending_count: number; approved_count: number; rejected_count: number; total_count: number }[]>(
    'product_stats', { select: 'pending_count,approved_count,rejected_count,total_count', id: 'eq.1' }
  )
  const r = rows?.[0]
  if (!r) return { pending: 0, approved: 0, rejected: 0, total: 0 }
  return { pending: r.pending_count, approved: r.approved_count, rejected: r.rejected_count, total: r.total_count }
}

export async function getQualityFilterCounts(status?: ProductStatus | ''): Promise<Record<QualityFilter, number>> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_quality_filter_counts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ p_status: status || null }),
  })
  if (!res.ok) return { missing_name: 0, missing_ingredients: 0, needs_review: 0, user_submitted: 0 }
  const data = await res.json() as Record<string, number>
  return {
    missing_name:        data.missing_name        ?? 0,
    missing_ingredients: data.missing_ingredients ?? 0,
    needs_review:        data.needs_review        ?? 0,
    user_submitted:      data.user_submitted       ?? 0,
  }
}

// ─── Ingredients ─────────────────────────────────────────────────────────────

export interface UnknownIngredient {
  name: string
  product_count: number
  is_classified: boolean
  allergen_tags: string[]
  notes: string
}

export interface IngredientClassification {
  name: string
  allergen_tags: string[]
  notes: string
  classified_at: string
  classified_by: string
}

export async function getUnknownIngredients(opts: {
  search?: string
  page?: number
  pageSize?: number
}): Promise<{ items: UnknownIngredient[]; total: number }> {
  const { search, page = 0, pageSize = 50 } = opts
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_unknown_ingredients`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      p_search:    search?.trim() || null,
      p_page:      page,
      p_page_size: pageSize,
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`getUnknownIngredients failed: ${res.status} ${body}`)
  }
  const raw = await res.json()
  const data = (Array.isArray(raw) ? raw[0] : raw) as { items?: UnknownIngredient[]; total?: number } | null
  return { items: data?.items ?? [], total: data?.total ?? 0 }
}

export async function classifyIngredient(
  name: string,
  allergenTags: string[],
  notes: string,
): Promise<{ affected_products: number; auto_approved: number }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/classify_ingredient`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      p_name:          name,
      p_allergen_tags: allergenTags,
      p_notes:         notes,
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`classifyIngredient failed: ${res.status} ${body}`)
  }
  const raw = await res.json()
  const data = (Array.isArray(raw) ? raw[0] : raw) as { affected_products?: number; auto_approved?: number } | null
  return { affected_products: data?.affected_products ?? 0, auto_approved: data?.auto_approved ?? 0 }
}

export async function getProductsForIngredient(
  ingredientName: string,
  opts: { page?: number; pageSize?: number } = {},
): Promise<{ products: Product[]; total: number }> {
  const { page = 0, pageSize = 24 } = opts
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_products_for_ingredient`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_ingredient_name: ingredientName, p_page: page, p_page_size: pageSize }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`getProductsForIngredient failed: ${res.status} ${body}`)
  }
  const raw = await res.json()
  const data = (Array.isArray(raw) ? raw[0] : raw) as { products?: Product[]; total?: number } | null
  return { products: data?.products ?? [], total: data?.total ?? 0 }
}

export async function deleteUnknownIngredient(
  name: string,
): Promise<{ deleted_products: number }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/delete_unknown_ingredient`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_name: name }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`deleteUnknownIngredient failed: ${res.status} ${body}`)
  }
  const raw = await res.json()
  const data = (Array.isArray(raw) ? raw[0] : raw) as { deleted_products?: number } | null
  return { deleted_products: data?.deleted_products ?? 0 }
}

// ─── Professionals ────────────────────────────────────────────────────────────

export interface Professional {
  id: string
  name: string
  slug: string
  title: string
  bio: string
  photo_url: string
  specialties: string[]
  website_url: string
  email: string
  is_active: boolean
  status: 'pending' | 'approved' | 'blocked'
  created_at: string
  updated_at: string
}

export interface MealPlan {
  id: string
  professional_id: string
  name: string
  description: string
  is_public: boolean
  share_token: string
  slug: string
  created_at: string
  updated_at: string
}

export interface MealPlanDay {
  id: string
  meal_plan_id: string
  day_number: number
  label: string
  sort_order: number
}

export interface Meal {
  id: string
  day_id: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  sort_order: number
}

export interface MealFood {
  id: string
  meal_id: string
  name: string
  notes: string
  sort_order: number
}

export interface ReferralInvite {
  id: string
  professional_id: string
  meal_plan_id: string | null
  token: string
  click_count: number
  created_at: string
}

export interface ReferralConversion {
  id: string
  invite_id: string
  professional_id: string
  status: 'invited' | 'downloaded' | 'active'
  created_at: string
  activated_at: string | null
}

export interface MealPlanFull extends MealPlan {
  days: (MealPlanDay & {
    meals: (Meal & { foods: MealFood[] })[]
  })[]
}

export async function getProfessionals(): Promise<Professional[]> {
  return get<Professional[]>('professionals', { order: 'created_at.desc', select: '*' })
}

export async function getProfessionalBySlug(slug: string): Promise<Professional | null> {
  const rows = await get<Professional[]>('professionals', { slug: `eq.${slug}`, select: '*' })
  return rows?.[0] ?? null
}

export async function getProfessional(id: string): Promise<Professional | null> {
  const rows = await get<Professional[]>('professionals', { id: `eq.${id}`, select: '*' })
  return rows?.[0] ?? null
}

export async function createProfessional(data: Partial<Professional>): Promise<Professional> {
  const rows = await post<Professional[]>('professionals', data)
  return (rows as Professional[])[0]
}

export async function updateProfessional(id: string, data: Partial<Professional>): Promise<void> {
  await patch('professionals', { ...data, updated_at: new Date().toISOString() }, `id=eq.${id}`)
}

export async function deleteProfessional(id: string): Promise<void> {
  await del('professionals', `id=eq.${id}`)
}

export async function getMealPlans(professionalId: string): Promise<MealPlan[]> {
  return get<MealPlan[]>('meal_plans', {
    professional_id: `eq.${professionalId}`,
    order: 'created_at.desc',
    select: '*',
  })
}

export async function getMealPlanByToken(token: string): Promise<MealPlan | null> {
  const rows = await get<MealPlan[]>('meal_plans', { share_token: `eq.${token}`, select: '*' })
  return rows?.[0] ?? null
}

export interface MealPlanPublic extends MealPlan {
  professional_name: string
  professional_slug: string
  professional_title: string | null
  professional_photo_url: string | null
}

export async function getMealPlanByProSlug(proSlug: string, planSlug: string): Promise<MealPlanPublic | null> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_meal_plan_by_pro_slug`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ p_pro_slug: proSlug, p_plan_slug: planSlug }),
  })
  if (!res.ok) return null
  const data = await res.json()
  if (!data) return null
  // PostgREST may return array or scalar
  return (Array.isArray(data) ? data[0] : data) as MealPlanPublic | null
}

export async function createMealPlan(data: Partial<MealPlan>): Promise<MealPlan> {
  const rows = await post<MealPlan[]>('meal_plans', data)
  return (rows as MealPlan[])[0]
}

export async function updateMealPlan(id: string, data: Partial<MealPlan>): Promise<void> {
  await patch('meal_plans', { ...data, updated_at: new Date().toISOString() }, `id=eq.${id}`)
}

export async function deleteMealPlan(id: string): Promise<void> {
  await del('meal_plans', `id=eq.${id}`)
}

export async function getMealPlanFull(mealPlanId: string): Promise<MealPlanFull | null> {
  const plans = await get<MealPlan[]>('meal_plans', { id: `eq.${mealPlanId}`, select: '*' })
  const plan = plans?.[0]
  if (!plan) return null

  const days = await get<MealPlanDay[]>('meal_plan_days', {
    meal_plan_id: `eq.${mealPlanId}`,
    order: 'sort_order.asc,day_number.asc',
    select: '*',
  })

  const mealPlanFull: MealPlanFull = { ...plan, days: [] }

  for (const day of days) {
    const meals = await get<Meal[]>('meals', { day_id: `eq.${day.id}`, order: 'sort_order.asc', select: '*' })
    const fullMeals: (Meal & { foods: MealFood[] })[] = []
    for (const meal of meals) {
      const foods = await get<MealFood[]>('meal_foods', { meal_id: `eq.${meal.id}`, order: 'sort_order.asc', select: '*' })
      fullMeals.push({ ...meal, foods })
    }
    mealPlanFull.days.push({ ...day, meals: fullMeals })
  }

  return mealPlanFull
}

export async function saveMealPlanFull(plan: MealPlanFull): Promise<void> {
  await patch('meal_plans', { name: plan.name, description: plan.description, updated_at: new Date().toISOString() }, `id=eq.${plan.id}`)
  const existingDays = await get<MealPlanDay[]>('meal_plan_days', { meal_plan_id: `eq.${plan.id}`, select: 'id' })
  for (const d of existingDays) await del('meal_plan_days', `id=eq.${d.id}`)

  for (let di = 0; di < plan.days.length; di++) {
    const day = plan.days[di]
    const newDays = await post<MealPlanDay[]>('meal_plan_days', {
      meal_plan_id: plan.id,
      day_number: day.day_number,
      label: day.label,
      sort_order: di,
    })
    const newDay = (newDays as MealPlanDay[])[0]

    for (let mi = 0; mi < day.meals.length; mi++) {
      const meal = day.meals[mi]
      const newMeals = await post<Meal[]>('meals', { day_id: newDay.id, meal_type: meal.meal_type, sort_order: mi })
      const newMeal = (newMeals as Meal[])[0]

      for (let fi = 0; fi < meal.foods.length; fi++) {
        const food = meal.foods[fi]
        await post('meal_foods', { meal_id: newMeal.id, name: food.name, notes: food.notes, sort_order: fi })
      }
    }
  }
}

export async function createReferralInvite(professionalId: string, mealPlanId?: string): Promise<ReferralInvite> {
  const rows = await post<ReferralInvite[]>('referral_invites', {
    professional_id: professionalId,
    meal_plan_id: mealPlanId ?? null,
  })
  return (rows as ReferralInvite[])[0]
}

export async function getReferralInviteByToken(token: string): Promise<ReferralInvite | null> {
  const rows = await get<ReferralInvite[]>('referral_invites', { token: `eq.${token}`, select: '*' })
  if (!rows?.[0]) return null
  await patch('referral_invites', { click_count: (rows[0].click_count || 0) + 1 }, `id=eq.${rows[0].id}`)
  return rows[0]
}

export async function getReferralStats(professionalId: string): Promise<{
  invited: number
  downloaded: number
  active: number
  total_clicks: number
}> {
  const [conversions, invites] = await Promise.all([
    get<ReferralConversion[]>('referral_conversions', { professional_id: `eq.${professionalId}`, select: 'status' }),
    get<ReferralInvite[]>('referral_invites', { professional_id: `eq.${professionalId}`, select: 'click_count' }),
  ])
  const total_clicks = invites.reduce((sum, i) => sum + (i.click_count || 0), 0)
  return {
    invited: conversions.filter(c => c.status === 'invited').length,
    downloaded: conversions.filter(c => c.status === 'downloaded').length,
    active: conversions.filter(c => c.status === 'active').length,
    total_clicks,
  }
}

export type ProReferralStats = {
  invited: number
  downloaded: number
  active: number
  total_clicks: number
}

export async function getAllReferralStats(): Promise<Record<string, ProReferralStats>> {
  const [conversions, invites] = await Promise.all([
    get<{ professional_id: string; status: string }[]>('referral_conversions', { select: 'professional_id,status' }),
    get<{ professional_id: string; click_count: number }[]>('referral_invites', { select: 'professional_id,click_count' }),
  ])
  const stats: Record<string, ProReferralStats> = {}
  const ensure = (id: string) => {
    if (!stats[id]) stats[id] = { invited: 0, downloaded: 0, active: 0, total_clicks: 0 }
  }
  for (const c of conversions) {
    ensure(c.professional_id)
    if (c.status === 'invited') stats[c.professional_id].invited++
    else if (c.status === 'downloaded') stats[c.professional_id].downloaded++
    else if (c.status === 'active') stats[c.professional_id].active++
  }
  for (const i of invites) {
    ensure(i.professional_id)
    stats[i.professional_id].total_clicks += i.click_count || 0
  }
  return stats
}

export async function recordReferralConversion(inviteId: string, professionalId: string, status: 'invited' | 'downloaded' | 'active' = 'invited'): Promise<void> {
  await post('referral_conversions', {
    invite_id: inviteId,
    professional_id: professionalId,
    status,
    activated_at: status === 'active' ? new Date().toISOString() : null,
  })
}

// ─── AI Review Queue ──────────────────────────────────────────────────────────

export async function backfillReviewReasons(): Promise<void> {
  // Run up to 5 batches of 500 to cover most backlogs without blocking
  for (let i = 0; i < 5; i++) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/backfill_review_reasons`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ batch_size: 500 }),
    })
    if (!res.ok) return
    const updated: number = await res.json()
    if (updated === 0) break
  }
}

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
    headers: { ...headers, Range: `${from}-${to}`, Prefer: 'count=estimated' },
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
