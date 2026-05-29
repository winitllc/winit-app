import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import styles from './Contributions.module.css'

const SUPABASE_URL = 'https://twosrdqyaxhdfyqgefjm.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3b3NyZHF5YXhoZGZ5cWdlZmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDQzMDksImV4cCI6MjA5NTU4MDMwOX0.qJ8ZQaMobmuL29-A3swShTbF-D7SVf1oUK9LU7vO7RE'
const PAGE_SIZE = 20

type ContribStatus = 'pending' | 'approved' | 'rejected'
type ContribField  = 'image_front' | 'image_ingredients' | 'image_nutrition' | 'image_barcode' | 'ingredients_text'

interface Contribution {
  id: string
  product_id: string
  user_id: string | null
  field: ContribField
  image_url: string | null
  extracted_text: string | null
  raw_text: string | null
  status: ContribStatus
  admin_notes: string
  reviewed_by: string
  reviewed_at: string | null
  created_at: string
  // joined
  product_name?: string
  product_barcode?: string
  user_email?: string
  user_display_name?: string
}

interface Stats { pending: number; approved: number; rejected: number }

const apiHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

const FIELD_LABELS: Record<ContribField, string> = {
  image_front:       'Front Image',
  image_ingredients: 'Ingredients Image',
  image_nutrition:   'Nutrition Label',
  image_barcode:     'Barcode Image',
  ingredients_text:  'Ingredients Text',
}

const FIELD_CSS: Record<ContribField, string> = {
  image_front:       'fieldFront',
  image_ingredients: 'fieldIngredients',
  image_nutrition:   'fieldNutrition',
  image_barcode:     'fieldBarcode',
  ingredients_text:  'fieldText',
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function fetchContributions(opts: {
  status: ContribStatus | ''
  field: ContribField | ''
  search: string
  page: number
}): Promise<{ items: Contribution[]; total: number }> {
  const { status, field, search, page } = opts
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const url = new URL(`${SUPABASE_URL}/rest/v1/product_contributions`)
  url.searchParams.set('select', '*, products(name,barcode), winit_profiles(email,display_name)')
  if (status) url.searchParams.set('status', `eq.${status}`)
  if (field)  url.searchParams.set('field', `eq.${field}`)
  url.searchParams.set('order', 'created_at.desc')

  const res = await fetch(url.toString(), {
    headers: { ...apiHeaders, Range: `${from}-${to}`, Prefer: 'count=exact' },
  })
  if (!res.ok) throw new Error(`Failed: ${res.status}`)
  const total = parseInt((res.headers.get('Content-Range') || '').split('/')[1] ?? '0', 10) || 0
  const raw: any[] = await res.json()

  const items: Contribution[] = raw
    .map(r => ({
      ...r,
      product_name:     r.products?.name ?? '',
      product_barcode:  r.products?.barcode ?? '',
      user_email:       r.winit_profiles?.email ?? '',
      user_display_name: r.winit_profiles?.display_name ?? '',
    }))
    .filter(r => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        r.product_name?.toLowerCase().includes(q) ||
        r.product_barcode?.toLowerCase().includes(q) ||
        r.user_email?.toLowerCase().includes(q)
      )
    })

  return { items, total }
}

async function fetchStats(): Promise<Stats> {
  const countOf = (h: Headers) => parseInt((h.get('Content-Range') || '').split('/')[1] ?? '0', 10) || 0
  const [r1, r2, r3] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/product_contributions?status=eq.pending&select=id`,  { headers: { ...apiHeaders, Prefer: 'count=exact', Range: '0-0' } }),
    fetch(`${SUPABASE_URL}/rest/v1/product_contributions?status=eq.approved&select=id`, { headers: { ...apiHeaders, Prefer: 'count=exact', Range: '0-0' } }),
    fetch(`${SUPABASE_URL}/rest/v1/product_contributions?status=eq.rejected&select=id`, { headers: { ...apiHeaders, Prefer: 'count=exact', Range: '0-0' } }),
  ])
  return { pending: countOf(r1.headers), approved: countOf(r2.headers), rejected: countOf(r3.headers) }
}

async function patchContribution(id: string, data: Partial<Contribution>) {
  await fetch(`${SUPABASE_URL}/rest/v1/product_contributions?id=eq.${id}`, {
    method: 'PATCH',
    headers: apiHeaders,
    body: JSON.stringify(data),
  })
}

async function applyContributionToProduct(c: Contribution) {
  if (!c.product_id) return
  const fieldMap: Partial<Record<ContribField, string>> = {
    image_front:       'image_front_url',
    image_ingredients: 'image_ingredients_url',
    image_nutrition:   'image_nutrition_url',
    ingredients_text:  'ingredients_text',
  }
  const productField = fieldMap[c.field]
  if (!productField) return

  const value = c.field === 'ingredients_text'
    ? (c.extracted_text || c.raw_text || '')
    : (c.image_url || '')

  if (!value) return

  await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${c.product_id}`, {
    method: 'PATCH',
    headers: apiHeaders,
    body: JSON.stringify({ [productField]: value }),
  })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ContributionCard({ item, onApprove, onReject }: {
  item: Contribution
  onApprove: (c: Contribution, notes: string) => void
  onReject:  (c: Contribution, notes: string) => void
}) {
  const [notes, setNotes] = useState(item.admin_notes ?? '')
  const [busy, setBusy]   = useState(false)

  const handleApprove = async () => {
    setBusy(true)
    await onApprove(item, notes)
    setBusy(false)
  }
  const handleReject = async () => {
    setBusy(true)
    await onReject(item, notes)
    setBusy(false)
  }

  const isImage = item.field !== 'ingredients_text'
  const textContent = item.extracted_text || item.raw_text || ''
  const isReviewed = item.status !== 'pending'

  return (
    <div className={`${styles.card} ${styles['card' + item.status.charAt(0).toUpperCase() + item.status.slice(1)]}`}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <span className={`${styles.fieldPill} ${styles[FIELD_CSS[item.field]]}`}>
          {FIELD_LABELS[item.field]}
        </span>
        <Link to={`/products/${item.product_id}/edit`} className={styles.productLink}>
          {item.product_name || '(unnamed product)'}
          {item.product_barcode && <span style={{ fontWeight: 400, color: 'var(--neutral-400)', marginLeft: 6, fontFamily: 'monospace', fontSize: '0.78rem' }}>{item.product_barcode}</span>}
        </Link>
        <span className={`${styles.statusBadge} ${styles['status' + item.status.charAt(0).toUpperCase() + item.status.slice(1)]}`}>
          {item.status}
        </span>
        <span className={styles.cardMeta}>
          {item.user_display_name || item.user_email || 'anonymous'} · {new Date(item.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* Body */}
      <div className={styles.cardBody}>
        {/* Image pane */}
        {isImage ? (
          <div className={styles.imagePane}>
            {item.image_url
              ? <img src={item.image_url} className={styles.submittedImg} alt="Submitted"
                  onError={e => (e.currentTarget.style.opacity = '0.3')} />
              : (
                <div className={styles.noImage}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  No image
                </div>
              )
            }
          </div>
        ) : (
          <div className={styles.imagePane}>
            <div className={styles.noImage} style={{ background: '#f5f3ff', border: '1.5px solid #ede9fe' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <span style={{ color: '#7c3aed', fontWeight: 600 }}>Text only</span>
            </div>
          </div>
        )}

        {/* Detail pane */}
        <div className={styles.detailPane}>
          {/* Extracted / raw text */}
          {item.field === 'image_ingredients' && item.extracted_text && (
            <div className={styles.detailRow}>
              <div className={styles.detailLabel}>AI Extracted Ingredients</div>
              <div className={styles.detailValue}>{item.extracted_text}</div>
            </div>
          )}
          {item.field === 'ingredients_text' && (
            <div className={styles.detailRow}>
              <div className={styles.detailLabel}>Submitted Text</div>
              <div className={styles.detailValue}>{textContent || <span className={styles.emptyValue}>No text submitted</span>}</div>
            </div>
          )}

          {/* Image URL */}
          {isImage && item.image_url && (
            <div className={styles.detailRow}>
              <div className={styles.detailLabel}>Image URL</div>
              <div className={`${styles.detailValue} ${styles.detailValueMono}`}>
                <a href={item.image_url} target="_blank" rel="noreferrer"
                  style={{ color: 'var(--primary)', wordBreak: 'break-all' }}>
                  {item.image_url}
                </a>
              </div>
            </div>
          )}

          {/* Reviewed note */}
          {isReviewed && item.reviewed_at && (
            <div className={styles.detailRow}>
              <div className={styles.detailLabel}>Reviewed</div>
              <div className={styles.detailValue}>
                {new Date(item.reviewed_at).toLocaleString()}
                {item.reviewed_by && ` by ${item.reviewed_by}`}
              </div>
            </div>
          )}

          {/* Admin notes */}
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Admin Notes {isReviewed ? '' : '(optional)'}</div>
            <textarea
              className={styles.notesInput}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add feedback for the contributor…"
              disabled={isReviewed}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.cardFooter}>
        {!isReviewed && (
          <>
            <button className={styles.approveBtn} onClick={handleApprove} disabled={busy}>
              ✓ Approve
            </button>
            <button className={styles.rejectBtn} onClick={handleReject} disabled={busy}>
              ✕ Reject
            </button>
          </>
        )}
        <Link to={`/products/${item.product_id}/edit`} className={styles.editBtn}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit Product
        </Link>
        <div className={styles.footerSpacer} />
        {isReviewed && (
          <span className={styles.reviewedNote}>
            {item.status === 'approved' ? 'Applied to product' : 'Rejected — user can resubmit'}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Contributions() {
  const [items, setItems]   = useState<Contribution[]>([])
  const [total, setTotal]   = useState(0)
  const [stats, setStats]   = useState<Stats>({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ContribStatus | ''>('pending')
  const [field, setField]   = useState<ContribField | ''>('')
  const [page, setPage]     = useState(0)
  const [toast, setToast]   = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()

  const load = useCallback(async (pg = page, q = search, st = status, f = field) => {
    setLoading(true)
    try {
      const [res, s] = await Promise.all([
        fetchContributions({ status: st, field: f, search: q, page: pg }),
        fetchStats(),
      ])
      setItems(res.items)
      setTotal(res.total)
      setStats(s)
    } finally {
      setLoading(false)
    }
  }, [page, search, status, field])

  useEffect(() => { load(0, search, status, field) }, [status, field]) // eslint-disable-line

  const onSearch = (q: string) => {
    setSearch(q)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(0); load(0, q, status, field) }, 350)
  }

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const handleApprove = async (c: Contribution, notes: string) => {
    await patchContribution(c.id, {
      status: 'approved',
      admin_notes: notes,
      reviewed_at: new Date().toISOString(),
      reviewed_by: 'admin',
    })
    await applyContributionToProduct(c)
    setItems(prev => prev.map(x => x.id === c.id ? { ...x, status: 'approved', admin_notes: notes } : x))
    setStats(s => ({ ...s, pending: Math.max(0, s.pending - 1), approved: s.approved + 1 }))
    flash(`Contribution approved — product updated`)
  }

  const handleReject = async (c: Contribution, notes: string) => {
    await patchContribution(c.id, {
      status: 'rejected',
      admin_notes: notes,
      reviewed_at: new Date().toISOString(),
      reviewed_by: 'admin',
    })
    setItems(prev => prev.map(x => x.id === c.id ? { ...x, status: 'rejected', admin_notes: notes } : x))
    setStats(s => ({ ...s, pending: Math.max(0, s.pending - 1), rejected: s.rejected + 1 }))
    flash(`Contribution rejected`)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Contributions</h1>
          <p className={styles.subtitle}>Community submissions to improve product data quality.</p>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={`${styles.statCard} ${styles.statPending}`}>
          <span className={styles.statNum}>{stats.pending}</span>
          <span className={styles.statLabel}>Pending Review</span>
        </div>
        <div className={`${styles.statCard} ${styles.statApproved}`}>
          <span className={styles.statNum}>{stats.approved}</span>
          <span className={styles.statLabel}>Approved</span>
        </div>
        <div className={`${styles.statCard} ${styles.statRejected}`}>
          <span className={styles.statNum}>{stats.rejected}</span>
          <span className={styles.statLabel}>Rejected</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className={styles.search} placeholder="Search by product name, barcode or user…"
            value={search} onChange={e => onSearch(e.target.value)} />
        </div>
        <div className={styles.tabs}>
          {(['', 'pending', 'approved', 'rejected'] as const).map(s => (
            <button key={s}
              className={`${styles.tab}${status === s ? ' ' + styles.tabActive : ''}`}
              onClick={() => { setStatus(s); setPage(0) }}>
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              {s === 'pending' && stats.pending > 0 && (
                <span style={{ marginLeft: 5, background: '#f59e0b', color: 'white', borderRadius: 99, padding: '1px 6px', fontSize: '0.7rem', fontWeight: 700 }}>
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
        </div>
        <select className={styles.fieldFilter} value={field} onChange={e => { setField(e.target.value as ContribField | ''); setPage(0) }}>
          <option value="">All fields</option>
          <option value="image_front">Front Image</option>
          <option value="image_ingredients">Ingredients Image</option>
          <option value="image_nutrition">Nutrition Label</option>
          <option value="image_barcode">Barcode Image</option>
          <option value="ingredients_text">Ingredients Text</option>
        </select>
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}

      {loading ? (
        <div className={styles.spinnerWrap}><div className={styles.spinner} /></div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className={styles.emptyTitle}>No contributions found</div>
          <div className={styles.emptyDesc}>
            {status === 'pending' ? 'All caught up — no pending submissions.' : 'No submissions match your filters.'}
          </div>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {items.map(c => (
              <ContributionCard
                key={c.id}
                item={c}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>

          <div className={styles.pagination}>
            <span className={styles.pgInfo}>{total.toLocaleString()} submissions · page {page + 1} of {totalPages}</span>
            <div className={styles.pgBtns}>
              <button className={styles.pgBtn} disabled={page === 0}
                onClick={() => { setPage(page - 1); load(page - 1) }}>← Prev</button>
              <button className={styles.pgBtn} disabled={page >= totalPages - 1}
                onClick={() => { setPage(page + 1); load(page + 1) }}>Next →</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
