const SUPABASE_URL = 'https://twosrdqyaxhdfyqgefjm.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3b3NyZHF5YXhoZGZ5cWdlZmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDQzMDksImV4cCI6MjA5NTU4MDMwOX0.qJ8ZQaMobmuL29-A3swShTbF-D7SVf1oUK9LU7vO7RE'

export type ProductStatus = 'pending' | 'approved' | 'rejected'

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
