import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getProducts, getQualityFilterCounts, getCategories, getProductStats, approveProduct, rejectProduct,
  type Product, type ProductStatus, type QualityFilter, type AppCategory,
} from '../lib/supabase'
import { ProductCard } from '../components/ProductCard'
import styles from './Products.module.css'

const PAGE_SIZE = 24

const QUALITY_FILTERS: { value: QualityFilter; label: string }[] = [
  { value: 'missing_name',        label: 'Missing Name' },
  { value: 'missing_ingredients', label: 'Missing Ingredients' },
  { value: 'needs_review',        label: 'Needs Review' },
  { value: 'user_submitted',      label: 'User Submitted' },
]

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ProductStatus | ''>(
    (searchParams.get('status') as ProductStatus | null) ?? 'pending'
  )
  const [qualityFilter, setQualityFilter] = useState<QualityFilter | ''>(
    (searchParams.get('quality') as QualityFilter | null) ?? ''
  )
  const [filterCounts, setFilterCounts] = useState<Record<QualityFilter, number> | null>(null)
  const [statusCounts, setStatusCounts] = useState<{ pending: number; approved: number; rejected: number; total: number } | null>(null)
  const [categories, setCategories] = useState<Map<string, string>>(new Map())
  const [toast, setToast] = useState('')
  const [loadError, setLoadError] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const refreshCounts = useCallback((st = status) => {
    getQualityFilterCounts(st).then(setFilterCounts).catch(() => {})
    getProductStats().then(setStatusCounts).catch(() => {})
  }, [status])

  const load = useCallback(async (pg = page, q = search, st = status, qf = qualityFilter) => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await getProducts({ status: st, search: q, page: pg, pageSize: PAGE_SIZE, qualityFilter: qf })
      setProducts(res.products)
      setTotal(res.total)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setLoadError(msg)
      console.error('getProducts failed:', msg)
    } finally {
      setLoading(false)
    }
  }, [page, search, status, qualityFilter])

  useEffect(() => { load(0, search, status, qualityFilter) }, [status, qualityFilter]) // eslint-disable-line

  useEffect(() => {
    refreshCounts(status)
    getCategories().then((cats: AppCategory[]) => {
      setCategories(new Map(cats.map(c => [c.id, c.display_name])))
    }).catch(() => {})
  }, [status]) // eslint-disable-line

  const onSearch = (q: string) => {
    setSearch(q)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => { setPage(0); load(0, q, status, qualityFilter) }, 400)
  }

  const onStatus = (st: ProductStatus | '') => {
    setStatus(st); setPage(0)
    const p: Record<string, string> = {}
    if (st) p.status = st
    if (qualityFilter) p.quality = qualityFilter
    setSearchParams(p)
  }

  const onQualityFilter = (qf: QualityFilter | '') => {
    setQualityFilter(qf); setPage(0)
    const p: Record<string, string> = {}
    if (status) p.status = status
    if (qf) p.quality = qf
    setSearchParams(p)
  }

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }
  const approve = async (p: Product) => { await approveProduct(p.id); flash('"' + (p.name || 'Product') + '" approved'); load(); refreshCounts() }
  const reject  = async (p: Product) => { await rejectProduct(p.id);  flash('"' + (p.name || 'Product') + '" rejected');  load(); refreshCounts() }

  const handleNameSaved = (id: string, name: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, name } : p))
    flash('Name saved')
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Products</h1>
          <p className={styles.pageDesc}>Review, approve, or reject imported products.</p>
        </div>
        <span className={styles.totalBadge}>{total.toLocaleString()} products</span>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className={styles.search} placeholder="Search by name, brand or barcode…"
            value={search} onChange={e => onSearch(e.target.value)} />
        </div>
        <div className={styles.tabs}>
          {(['', 'pending', 'approved', 'rejected'] as const).map(s => {
            const count = s === '' ? statusCounts?.total
              : s === 'pending' ? statusCounts?.pending
              : s === 'approved' ? statusCounts?.approved
              : statusCounts?.rejected
            return (
              <button key={s}
                className={styles.tab + (status === s ? ' ' + styles.tabActive : '') + (s ? ' ' + styles['tab_' + s] : '')}
                onClick={() => onStatus(s)}>
                {s === '' ? 'All' : s[0].toUpperCase() + s.slice(1)}
                {count != null && (
                  <span className={styles.tabCount + (status === s ? ' ' + styles.tabCountActive : '')}>
                    {count.toLocaleString()}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className={styles.qualityFilters}>
        <span className={styles.qualityLabel}>Filter:</span>
        <div className={styles.qualityChips}>
          {QUALITY_FILTERS.map(f => (
            <button
              key={f.value}
              className={styles.qualityChip + (qualityFilter === f.value ? ' ' + styles.qualityChipActive : '')}
              onClick={() => onQualityFilter(qualityFilter === f.value ? '' : f.value)}
            >
              {f.label}
              {filterCounts && (
                <span className={styles.chipCount + (qualityFilter === f.value ? ' ' + styles.chipCountActive : '')}>
                  {filterCounts[f.value].toLocaleString()}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}

      {loading ? (
        <div className={styles.spinnerWrap}><div className={styles.spinner}/></div>
      ) : loadError ? (
        <div className={styles.empty}>
          <p style={{ color: 'var(--error-500)', fontWeight: 600 }}>Failed to load products</p>
          <p style={{ fontSize: '0.85rem', marginTop: 4, color: 'var(--neutral-400)', fontFamily: 'monospace' }}>{loadError}</p>
          <button style={{ marginTop: 12, padding: '6px 16px', borderRadius: 6, border: '1px solid var(--neutral-300)', cursor: 'pointer', background: 'white' }} onClick={() => load()}>Retry</button>
        </div>
      ) : products.length === 0 ? (
        <div className={styles.empty}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: .18, marginBottom: 16 }}>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
          <p>No products found.</p>
          <p style={{ fontSize: '0.85rem', marginTop: 4, color: 'var(--neutral-400)' }}>Try a different filter or import some products.</p>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {products.map(p => (
              <ProductCard
                key={p.id}
                p={p}
                categories={categories}
                showReviewReasons={qualityFilter === 'needs_review'}
                onApprove={approve}
                onReject={reject}
                onNameSaved={handleNameSaved}
              />
            ))}
          </div>
          <div className={styles.pagination}>
            <span className={styles.pgInfo}>{total.toLocaleString()} products · page {page + 1} of {totalPages}</span>
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
