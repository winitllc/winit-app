import { useEffect, useState, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getProducts, approveProduct, rejectProduct, type Product, type ProductStatus } from '../lib/supabase'
import styles from './Products.module.css'

const PAGE_SIZE = 24

const ALLERGEN_LABELS: Record<string, string> = {
  'en:milk': 'Milk', 'en:eggs': 'Eggs', 'en:gluten': 'Gluten', 'en:peanuts': 'Peanuts',
  'en:tree-nuts': 'Tree Nuts', 'en:soy': 'Soy', 'en:fish': 'Fish', 'en:shellfish': 'Shellfish',
  'en:sesame': 'Sesame', 'en:celery': 'Celery', 'en:mustard': 'Mustard', 'en:lupin': 'Lupin',
  'en:sulphur-dioxide-and-sulphites': 'Sulphites',
}
const DIET_LABELS: Record<string, string> = {
  'en:vegan-status-by-ingredients': 'Vegan', 'en:vegetarian-status-by-ingredients': 'Vegetarian',
  'en:gluten-free': 'Gluten Free', 'en:no-gluten': 'Gluten Free', 'en:no-lactose': 'Lactose Free',
  'en:organic': 'Organic', 'en:palm-oil-free': 'Palm Oil Free', 'en:low-sugar': 'Low Sugar',
  'en:low-fat': 'Low Fat', 'en:high-protein': 'High Protein', 'en:high-fiber': 'High Fiber',
}

const fmtTag = (map: Record<string, string>, tag: string) =>
  map[tag] ?? tag.replace(/^en:/, '').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())

function NutriScore({ grade }: { grade?: string }) {
  if (!grade || grade === '') return null
  const g = grade.toUpperCase()
  const colors: Record<string, string> = { A: '#038141', B: '#85bb2f', C: '#fecb02', D: '#ee8100', E: '#e63e11' }
  const bg = colors[g]
  if (!bg) return null
  return (
    <span className={styles.nutriBadge} style={{ background: bg, color: g === 'C' ? '#333' : 'white' }}>
      {g}
    </span>
  )
}

function ProductCard({ p, onApprove, onReject }: { p: Product; onApprove(p: Product): void; onReject(p: Product): void }) {
  const allergens = (p.allergen_tags ?? []).slice(0, 4)
  const diets = (p.diet_tags ?? []).slice(0, 3)
  const hasIngredients = p.ingredients_text && p.ingredients_text.trim().length > 0

  return (
    <article className={styles.card}>
      <Link to={'/products/' + p.id + '/edit'} className={styles.imgArea}>
        {p.image_front_url
          ? <img src={p.image_front_url} alt={p.name} className={styles.img}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          : <div className={styles.noImg}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
        }
        <span className={styles.statusPill + ' ' + styles['sp_' + p.status]}>
          {p.status === 'approved' ? '● Approved' : p.status === 'rejected' ? '● Rejected' : '● Pending'}
        </span>
      </Link>

      <div className={styles.cardBody}>
        <div className={styles.nameRow}>
          <p className={styles.productName}>{p.name || '(unnamed product)'}</p>
          <NutriScore grade={p.nutriscore_grade} />
        </div>
        {p.brand && <p className={styles.brandName}>{p.brand}{p.quantity ? ' · ' + p.quantity : ''}</p>}

        {p.nova_group != null && (
          <span className={styles.novaTag}>NOVA {p.nova_group}</span>
        )}

        {allergens.length > 0 && (
          <div className={styles.tagRow}>
            <span className={styles.tagRowLabel}>Allergens</span>
            <div className={styles.tagList}>
              {allergens.map(t => (
                <span key={t} className={styles.allergenTag}>{fmtTag(ALLERGEN_LABELS, t)}</span>
              ))}
              {(p.allergen_tags ?? []).length > 4 && (
                <span className={styles.moreTag}>+{(p.allergen_tags ?? []).length - 4}</span>
              )}
            </div>
          </div>
        )}

        {diets.length > 0 && (
          <div className={styles.tagRow}>
            <span className={styles.tagRowLabel}>Diet</span>
            <div className={styles.tagList}>
              {diets.map(t => (
                <span key={t} className={styles.dietTag}>{fmtTag(DIET_LABELS, t)}</span>
              ))}
            </div>
          </div>
        )}

        {hasIngredients && (
          <p className={styles.ingredientsSnippet}>
            {p.ingredients_text!.slice(0, 110)}{p.ingredients_text!.length > 110 ? '…' : ''}
          </p>
        )}
      </div>

      <div className={styles.cardFooter}>
        <Link to={'/products/' + p.id + '/edit'} className={styles.footerBtn + ' ' + styles.footerEdit}>Edit</Link>
        {p.status !== 'approved' && (
          <button className={styles.footerBtn + ' ' + styles.footerApprove} onClick={() => onApprove(p)}>Approve</button>
        )}
        {p.status !== 'rejected' && (
          <button className={styles.footerBtn + ' ' + styles.footerReject} onClick={() => onReject(p)}>Reject</button>
        )}
      </div>
    </article>
  )
}

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
  const [toast, setToast] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const load = useCallback(async (pg = page, q = search, st = status) => {
    setLoading(true)
    try {
      const res = await getProducts({ status: st, search: q, page: pg, pageSize: PAGE_SIZE })
      setProducts(res.products)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [page, search, status])

  useEffect(() => { load(0, search, status) }, [status]) // eslint-disable-line

  const onSearch = (q: string) => {
    setSearch(q)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => { setPage(0); load(0, q, status) }, 400)
  }

  const onStatus = (st: ProductStatus | '') => {
    setStatus(st); setPage(0); setSearchParams(st ? { status: st } : {})
  }

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }
  const approve = async (p: Product) => { await approveProduct(p.id); flash('"' + p.name + '" approved'); load() }
  const reject  = async (p: Product) => { await rejectProduct(p.id);  flash('"' + p.name + '" rejected');  load() }

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
          {(['', 'pending', 'approved', 'rejected'] as const).map(s => (
            <button key={s}
              className={styles.tab + (status === s ? ' ' + styles.tabActive : '') + (s ? ' ' + styles['tab_' + s] : '')}
              onClick={() => onStatus(s)}>
              {s === '' ? 'All' : s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}

      {loading ? (
        <div className={styles.spinnerWrap}><div className={styles.spinner}/></div>
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
            {products.map(p => <ProductCard key={p.id} p={p} onApprove={approve} onReject={reject} />)}
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
