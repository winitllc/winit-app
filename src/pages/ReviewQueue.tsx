import { useEffect, useState, useCallback, useRef } from 'react'
import {
  getReviewQueue,
  approveClassification,
  rejectClassification,
  reclassifyProduct,
  getTaxonomyParents,
  getTaxonomySubcategories,
  type Product,
  type TaxonomyParent,
  type TaxonomySubcategory,
} from '../lib/supabase'
import styles from './ReviewQueue.module.css'

const PAGE_SIZE = 18

function confidenceColor(conf: number): string {
  if (conf >= 0.75) return '#22c55e'
  if (conf >= 0.55) return '#f59e0b'
  return '#ef4444'
}

function priorityColor(priority: number): string {
  if (priority >= 40) return '#ef4444'
  if (priority >= 20) return '#f59e0b'
  return '#22c55e'
}

interface EditState {
  parentId: string
  subcategoryId: string
  note: string
}

function ReviewCard({
  product,
  parents,
  subcats,
  onApprove,
  onReject,
  onRetry,
}: {
  product: Product
  parents: TaxonomyParent[]
  subcats: TaxonomySubcategory[]
  onApprove(p: Product, overrides?: { parentId?: string; subcategoryId?: string; note?: string }): Promise<void>
  onReject(p: Product): Promise<void>
  onRetry(p: Product): Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [edit, setEdit] = useState<EditState>({
    parentId: product.ai_category_id ?? '',
    subcategoryId: product.ai_subcategory_id ?? '',
    note: '',
  })

  const conf = product.ai_confidence ?? 0
  const catConf = product.ai_category_confidence ?? 0
  const subcatConf = product.ai_subcategory_confidence ?? 0
  const priority = product.review_priority ?? 0

  const parentName = parents.find(p => p.id === product.ai_category_id)?.display_name
  const subcatName = subcats.find(s => s.id === product.ai_subcategory_id)?.display_name
  const filteredSubcats = subcats.filter(s => s.parent_id === edit.parentId)

  const handle = async (fn: () => Promise<void>) => {
    setBusy(true)
    try { await fn() } finally { setBusy(false) }
  }

  return (
    <article className={styles.card}>
      <div className={styles.priorityStripe} style={{ background: priorityColor(priority) }} />

      <div className={styles.cardBody}>
        {/* Product header */}
        <div className={styles.productHeader}>
          {product.image_front_url
            ? <img src={product.image_front_url} alt={product.name} className={styles.productThumb}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
            : <div className={styles.productThumbEmpty}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
          }
          <div className={styles.productInfo}>
            <div className={styles.productName}>{product.name || '(unnamed product)'}</div>
            <div className={styles.productMeta}>
              {product.brand || '—'}{product.quantity ? ' · ' + product.quantity : ''}
              {product.barcode ? ' · ' + product.barcode : ''}
            </div>
          </div>
        </div>

        {/* Overall confidence */}
        <div className={styles.confidenceRow}>
          <span className={styles.confidenceLabel}>Confidence</span>
          <div className={styles.confidenceBar}>
            <div className={styles.confidenceFill}
              style={{ width: `${conf * 100}%`, background: confidenceColor(conf) }} />
          </div>
          <span className={styles.confidenceValue} style={{ color: confidenceColor(conf) }}>
            {Math.round(conf * 100)}%
          </span>
        </div>

        {/* Category confidence */}
        {catConf > 0 && (
          <div className={styles.confidenceRow}>
            <span className={styles.confidenceLabel}>Category</span>
            <div className={styles.confidenceBar}>
              <div className={styles.confidenceFill}
                style={{ width: `${catConf * 100}%`, background: '#60a5fa' }} />
            </div>
            <span className={styles.confidenceValue} style={{ color: '#60a5fa' }}>
              {Math.round(catConf * 100)}%
            </span>
          </div>
        )}

        {/* Subcategory confidence */}
        {subcatConf > 0 && (
          <div className={styles.confidenceRow}>
            <span className={styles.confidenceLabel}>Subcategory</span>
            <div className={styles.confidenceBar}>
              <div className={styles.confidenceFill}
                style={{ width: `${subcatConf * 100}%`, background: '#a78bfa' }} />
            </div>
            <span className={styles.confidenceValue} style={{ color: '#a78bfa' }}>
              {Math.round(subcatConf * 100)}%
            </span>
          </div>
        )}

        {/* AI classification */}
        <div className={styles.classRow}>
          <span className={styles.classLabel}>Category</span>
          {parentName
            ? <span className={`${styles.classPill} ${styles.classPillParent}`}>{parentName}</span>
            : <span className={styles.classPillNone}>unclassified</span>}
          {subcatName && <span className={`${styles.classPill} ${styles.classPillSub}`}>{subcatName}</span>}
        </div>

        {/* AI reason */}
        {product.ai_classification_reason && (
          <div className={styles.reason}>{product.ai_classification_reason}</div>
        )}

        {/* AI tags */}
        {(product.ai_tags ?? []).length > 0 && (
          <div className={styles.tagRow}>
            {(product.ai_tags ?? []).map(t => (
              <span key={t} className={styles.tag}>{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Edit panel */}
      {editing && (
        <div className={styles.editPanel}>
          <div className={styles.editTitle}>Override Classification</div>
          <div className={styles.editRow}>
            <label className={styles.editLabel}>Category</label>
            <select className={styles.editSelect} value={edit.parentId}
              onChange={e => setEdit(s => ({ ...s, parentId: e.target.value, subcategoryId: '' }))}>
              <option value="">— none —</option>
              {parents.map(p => <option key={p.id} value={p.id}>{p.icon} {p.display_name}</option>)}
            </select>
          </div>
          <div className={styles.editRow}>
            <label className={styles.editLabel}>Subcategory</label>
            <select className={styles.editSelect} value={edit.subcategoryId}
              onChange={e => setEdit(s => ({ ...s, subcategoryId: e.target.value }))}
              disabled={!edit.parentId}>
              <option value="">— none —</option>
              {filteredSubcats.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
            </select>
          </div>
          <div className={styles.editRow}>
            <label className={styles.editLabel}>Note</label>
            <textarea className={styles.editNote} rows={2} placeholder="Why was the AI wrong?"
              value={edit.note} onChange={e => setEdit(s => ({ ...s, note: e.target.value }))} />
          </div>
        </div>
      )}

      <div className={styles.cardFooter}>
        {editing ? (
          <>
            <button className={`${styles.btn} ${styles.btnSave}`} disabled={busy}
              onClick={() => handle(() => onApprove(product, {
                parentId: edit.parentId || undefined,
                subcategoryId: edit.subcategoryId || undefined,
                note: edit.note,
              }).then(() => setEditing(false)))}>
              Save & Approve
            </button>
            <button className={`${styles.btn} ${styles.btnCancel}`} disabled={busy}
              onClick={() => setEditing(false)}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button className={`${styles.btn} ${styles.btnApprove}`} disabled={busy}
              onClick={() => handle(() => onApprove(product))}>
              Approve
            </button>
            <button className={`${styles.btn} ${styles.btnEdit}`} disabled={busy}
              onClick={() => setEditing(true)}>
              Edit
            </button>
            <button className={`${styles.btn} ${styles.btnRetry}`} disabled={busy}
              onClick={() => handle(() => onRetry(product))}>
              Retry AI
            </button>
            <button className={`${styles.btn} ${styles.btnReject}`} disabled={busy}
              onClick={() => handle(() => onReject(product))}>
              Reject
            </button>
          </>
        )}
      </div>
    </article>
  )
}

export default function ReviewQueue() {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [parents, setParents] = useState<TaxonomyParent[]>([])
  const [subcats, setSubcats] = useState<TaxonomySubcategory[]>([])
  const [toast, setToast] = useState({ msg: '', type: 'success' })
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    Promise.all([getTaxonomyParents(), getTaxonomySubcategories()])
      .then(([p, s]) => { setParents(p); setSubcats(s) })
      .catch(console.error)
  }, [])

  const load = useCallback(async (pg = page, q = search) => {
    setLoading(true)
    try {
      const res = await getReviewQueue({ page: pg, pageSize: PAGE_SIZE, search: q })
      setProducts(res.products)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { load(0, '') }, []) // eslint-disable-line

  const flash = (msg: string, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500)
  }

  const onSearch = (q: string) => {
    setSearch(q)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => { setPage(0); load(0, q) }, 400)
  }

  const handleApprove = async (p: Product, overrides?: { parentId?: string; subcategoryId?: string; note?: string }) => {
    try {
      await approveClassification(p, overrides)
      flash(`"${p.name}" approved`)
      load(page, search)
    } catch (e) {
      flash(`Failed: ${e instanceof Error ? e.message : e}`, 'error')
    }
  }

  const handleReject = async (p: Product) => {
    try {
      await rejectClassification(p.id)
      flash(`"${p.name}" rejected`)
      load(page, search)
    } catch (e) {
      flash(`Failed: ${e instanceof Error ? e.message : e}`, 'error')
    }
  }

  const handleRetry = async (p: Product) => {
    try {
      await reclassifyProduct(p.id)
      flash(`Re-classified "${p.name}"`)
      load(page, search)
    } catch (e) {
      flash(`Failed: ${e instanceof Error ? e.message : e}`, 'error')
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>AI Review Queue</h1>
          <p className={styles.pageDesc}>Products where AI confidence is below threshold — approve, correct, or reject.</p>
        </div>
        <span className={styles.queueBadge}>{total.toLocaleString()} needs review</span>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className={styles.search} placeholder="Search by name or brand…"
            value={search} onChange={e => onSearch(e.target.value)} />
        </div>
      </div>

      {toast.msg && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.msg}
        </div>
      )}

      {loading ? (
        <div className={styles.spinnerWrap}><div className={styles.spinner}/></div>
      ) : products.length === 0 ? (
        <div className={styles.empty}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: .18 }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <p className={styles.emptyTitle}>Queue is clear!</p>
          <p className={styles.emptyDesc}>All products have been reviewed or none need attention right now.</p>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {products.map(p => (
              <ReviewCard
                key={p.id}
                product={p}
                parents={parents}
                subcats={subcats}
                onApprove={handleApprove}
                onReject={handleReject}
                onRetry={handleRetry}
              />
            ))}
          </div>
          <div className={styles.pagination}>
            <span className={styles.pgInfo}>{total.toLocaleString()} items · page {page + 1} of {totalPages}</span>
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
