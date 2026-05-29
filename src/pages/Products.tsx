import { useEffect, useState, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getProducts, approveProduct, rejectProduct, type Product, type ProductStatus } from '../lib/supabase'
import styles from './Products.module.css'

const PAGE_SIZE = 25

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
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [actionMsg, setActionMsg] = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()

  const load = useCallback(async (pg = page, q = search, st = status) => {
    setLoading(true)
    setSelected(new Set())
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
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(0); load(0, q, status) }, 400)
  }

  const onStatus = (st: ProductStatus | '') => {
    setStatus(st)
    setPage(0)
    setSearchParams(st ? { status: st } : {})
  }

  const onPage = (pg: number) => { setPage(pg); load(pg, search, status) }

  const flash = (msg: string) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 3000) }

  const approve = async (p: Product) => {
    await approveProduct(p.id)
    flash(`"${p.name}" approved`)
    load()
  }

  const reject = async (p: Product) => {
    await rejectProduct(p.id)
    flash(`"${p.name}" rejected`)
    load()
  }

  const bulkApprove = async () => {
    await Promise.all([...selected].map(approveProduct))
    flash(`${selected.size} products approved`)
    load()
  }

  const bulkReject = async () => {
    await Promise.all([...selected].map(rejectProduct))
    flash(`${selected.size} products rejected`)
    load()
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <h1 className={styles.title}>Products</h1>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by name, brand, or barcode…"
          value={search}
          onChange={e => onSearch(e.target.value)}
        />
        <select className={styles.select} value={status} onChange={e => onStatus(e.target.value as ProductStatus | '')}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        {selected.size > 0 && (
          <div className={styles.bulkActions}>
            <button className={`${styles.btn} ${styles.btnSuccess}`} onClick={bulkApprove}>
              Approve ({selected.size})
            </button>
            <button className={`${styles.btn} ${styles.btnDanger}`} onClick={bulkReject}>
              Reject ({selected.size})
            </button>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setSelected(new Set())}>
              Clear
            </button>
          </div>
        )}
      </div>

      {actionMsg && <div className={styles.toast}>{actionMsg}</div>}

      {loading ? (
        <div className={styles.spinner} />
      ) : products.length === 0 ? (
        <div className={styles.empty}>No products found.</div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th></th>
                  <th></th>
                  <th>Product</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Rating</th>
                  <th>Imported</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className={styles.row}>
                    <td>
                      <input type="checkbox" checked={selected.has(p.id)}
                        onChange={() => toggleSelect(p.id)} />
                    </td>
                    <td>
                      {p.image_front_url
                        ? <img src={p.image_front_url} className={styles.thumb} alt=""
                            onError={e => (e.currentTarget.style.display = 'none')} />
                        : <div className={styles.noImg} />}
                    </td>
                    <td>
                      <div className={styles.productName}>{p.name || '(no name)'}</div>
                      <div className={styles.productMeta}>{p.brand}</div>
                      <div className={styles.productBarcode}>{p.barcode}</div>
                    </td>
                    <td>
                      <span className={`${styles.nutriscore} ${styles[`grade${p.nutriscore_grade?.toUpperCase()}`]}`}>
                        {p.nutriscore_grade?.toUpperCase() || '—'}
                      </span>
                    </td>
                    <td><span className={`${styles.statusBadge} ${styles[p.status]}`}>{p.status}</span></td>
                    <td>{p.health_rating ?? '—'}</td>
                    <td>{new Date(p.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <Link to={`/products/${p.id}/edit`} className={styles.iconBtn} title="Edit">✏️</Link>
                        {p.status !== 'approved' && (
                          <button className={`${styles.iconBtn} ${styles.approveBtn}`} onClick={() => approve(p)} title="Approve">✓</button>
                        )}
                        {p.status !== 'rejected' && (
                          <button className={`${styles.iconBtn} ${styles.rejectBtn}`} onClick={() => reject(p)} title="Reject">✕</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              {total.toLocaleString()} products · page {page + 1} of {totalPages}
            </span>
            <div className={styles.paginationBtns}>
              <button className={styles.pageBtn} disabled={page === 0} onClick={() => onPage(page - 1)}>← Prev</button>
              <button className={styles.pageBtn} disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}>Next →</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
