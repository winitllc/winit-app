import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  getUnknownIngredients, classifyIngredient, getProductsForIngredient, deleteUnknownIngredient,
  approveProduct, rejectProduct, getCategories,
  type UnknownIngredient, type Product, type AppCategory,
} from '../lib/supabase'
import { ProductCard } from '../components/ProductCard'
import styles from './Ingredients.module.css'

const PAGE_SIZE = 50
const PRODUCT_PAGE_SIZE = 24

const ALLERGEN_OPTIONS = [
  { id: 'gluten',    label: 'Gluten' },
  { id: 'wheat',     label: 'Wheat' },
  { id: 'milk',      label: 'Milk / Dairy' },
  { id: 'eggs',      label: 'Eggs' },
  { id: 'peanuts',   label: 'Peanuts' },
  { id: 'tree-nuts', label: 'Tree Nuts' },
  { id: 'soy',       label: 'Soy' },
  { id: 'fish',      label: 'Fish' },
  { id: 'shellfish', label: 'Shellfish' },
  { id: 'sesame',    label: 'Sesame' },
  { id: 'celery',    label: 'Celery' },
  { id: 'mustard',   label: 'Mustard' },
  { id: 'lupin',     label: 'Lupin' },
  { id: 'sulphites', label: 'Sulphites' },
  { id: 'corn',      label: 'Corn' },
]

const ALLERGEN_LABEL: Record<string, string> = Object.fromEntries(
  ALLERGEN_OPTIONS.map(a => [a.id, a.label])
)

function formatIngredientName(name: string) {
  return name.replace(/\b\w/g, c => c.toUpperCase())
}

// ── Classify modal ────────────────────────────────────────────────────────────

interface ClassifyModalProps {
  ingredient: UnknownIngredient
  onClose(): void
  onSaved(result: { affected_products: number; auto_approved: number }): void
}

function ClassifyModal({ ingredient, onClose, onSaved }: ClassifyModalProps) {
  const [allergens, setAllergens] = useState<Set<string>>(
    new Set(ingredient.allergen_tags)
  )
  const [notes, setNotes] = useState(ingredient.notes)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const toggle = (id: string) =>
    setAllergens(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleSubmit = async () => {
    setSaving(true)
    setError('')
    try {
      const result = await classifyIngredient(ingredient.name, [...allergens], notes)
      onSaved(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setSaving(false)
    }
  }

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return createPortal(
    <div className={styles.modalBackdrop} onClick={handleBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Classify Ingredient</h2>
            <p className={styles.modalSubtitle}>
              Found in{' '}
              <strong>{ingredient.product_count.toLocaleString()}</strong>{' '}
              pending product{ingredient.product_count !== 1 ? 's' : ''}
            </p>
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.ingredientName}>
            {formatIngredientName(ingredient.name)}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Allergens this ingredient contains</label>
            <p className={styles.fieldHint}>
              Leave all unchecked if this ingredient is allergen-free (it will be added to the
              known-safe list and products will be reprocessed).
            </p>
            <div className={styles.allergenGrid}>
              {ALLERGEN_OPTIONS.map(a => (
                <label key={a.id} className={styles.allergenOption + (allergens.has(a.id) ? ' ' + styles.allergenOptionActive : '')}>
                  <input
                    type="checkbox"
                    checked={allergens.has(a.id)}
                    onChange={() => toggle(a.id)}
                    className={styles.allergenCheck}
                  />
                  <span>{a.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="notes">Notes (optional)</label>
            <textarea
              id="notes"
              className={styles.notesInput}
              placeholder="e.g. Vitamin B1 supplement, no allergen concerns"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {error && <p className={styles.modalError}>{error}</p>}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnCancel} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className={styles.btnSave} onClick={handleSubmit} disabled={saving}>
            {saving ? 'Classifying…' : 'Classify & Reprocess'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Delete confirmation modal ─────────────────────────────────────────────────

interface DeleteConfirmProps {
  ingredient: UnknownIngredient
  onClose(): void
  onDeleted(result: { deleted_products: number }): void
}

function DeleteConfirmModal({ ingredient, onClose, onDeleted }: DeleteConfirmProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      const result = await deleteUnknownIngredient(ingredient.name)
      onDeleted(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setDeleting(false)
    }
  }

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return createPortal(
    <div className={styles.modalBackdrop} onClick={handleBackdrop}>
      <div className={styles.modal} style={{ maxWidth: 440 }}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Delete Ingredient?</h2>
            <p className={styles.modalSubtitle}>This action cannot be undone.</p>
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.deleteWarning}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <p className={styles.deleteWarningTitle}>
                Permanently delete <strong>"{formatIngredientName(ingredient.name)}"</strong>
              </p>
              <p className={styles.deleteWarningDesc}>
                This will also permanently delete{' '}
                <strong>{ingredient.product_count.toLocaleString()} product{ingredient.product_count !== 1 ? 's' : ''}</strong>{' '}
                associated with this ingredient. The ingredient will be added to the safe-word list
                so it won't be flagged again on future imports.
              </p>
            </div>
          </div>
          {error && <p className={styles.modalError}>{error}</p>}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnCancel} onClick={onClose} disabled={deleting}>
            Cancel
          </button>
          <button className={styles.btnDelete} onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : `Delete & Remove ${ingredient.product_count.toLocaleString()} Product${ingredient.product_count !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Ingredient detail panel ───────────────────────────────────────────────────

interface DetailPanelProps {
  ingredient: UnknownIngredient
  categories: Map<string, string>
  onClose(): void
  onClassify(): void
  onDelete(): void
  onFlash(msg: string): void
  onProductChanged(): void
}

function DetailPanel({ ingredient, categories, onClose, onClassify, onDelete, onFlash, onProductChanged }: DetailPanelProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const load = useCallback(async (pg = 0) => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await getProductsForIngredient(ingredient.name, { page: pg, pageSize: PRODUCT_PAGE_SIZE })
      setProducts(res.products)
      setTotal(res.total)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [ingredient.name])

  useEffect(() => { load(0) }, [load])

  const totalPages = Math.max(1, Math.ceil(total / PRODUCT_PAGE_SIZE))

  const handleApprove = async (p: Product) => {
    await approveProduct(p.id)
    onFlash('"' + (p.name || 'Product') + '" approved')
    load(page)
    onProductChanged()
  }

  const handleReject = async (p: Product) => {
    await rejectProduct(p.id)
    onFlash('"' + (p.name || 'Product') + '" rejected')
    load(page)
    onProductChanged()
  }

  const handleNameSaved = (_id: string, _name: string) => {
    onFlash('Name saved')
  }

  return (
    <div className={styles.detailPanel}>
      <div className={styles.detailPanelHeader}>
        <div className={styles.detailPanelTitle}>
          <button className={styles.detailPanelClose} onClick={onClose} aria-label="Close panel">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <div>
            <h2 className={styles.detailIngredientName}>{formatIngredientName(ingredient.name)}</h2>
            <p className={styles.detailIngredientMeta}>
              {ingredient.product_count.toLocaleString()} pending product{ingredient.product_count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className={styles.detailPanelActions}>
          <button className={styles.detailClassifyBtn} onClick={onClassify}>
            {ingredient.is_classified ? 'Edit Classification' : 'Classify'}
          </button>
          <button className={styles.detailDeleteBtn} onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      <div className={styles.detailPanelBody}>
        {loading ? (
          <div className={styles.spinnerWrap}><div className={styles.spinner}/></div>
        ) : loadError ? (
          <div className={styles.empty}>
            <p className={styles.emptyError}>Failed to load products</p>
            <p className={styles.emptyMono}>{loadError}</p>
            <button className={styles.retryBtn} onClick={() => load(page)}>Retry</button>
          </div>
        ) : products.length === 0 ? (
          <div className={styles.empty}>
            <p>No pending products for this ingredient.</p>
          </div>
        ) : (
          <>
            <div className={styles.detailGrid}>
              {products.map(p => (
                <ProductCard
                  key={p.id}
                  p={p}
                  categories={categories}
                  showReviewReasons={false}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onNameSaved={handleNameSaved}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <span className={styles.pgInfo}>
                  {total.toLocaleString()} product{total !== 1 ? 's' : ''} · page {page + 1} of {totalPages}
                </span>
                <div className={styles.pgBtns}>
                  <button className={styles.pgBtn} disabled={page === 0}
                    onClick={() => { const p = page - 1; setPage(p); load(p) }}>
                    ← Prev
                  </button>
                  <button className={styles.pgBtn} disabled={page >= totalPages - 1}
                    onClick={() => { const p = page + 1; setPage(p); load(p) }}>
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Ingredients() {
  const [items, setItems] = useState<UnknownIngredient[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [classifying, setClassifying] = useState<UnknownIngredient | null>(null)
  const [deleting, setDeleting] = useState<UnknownIngredient | null>(null)
  const [selected, setSelected] = useState<UnknownIngredient | null>(null)
  const [categories, setCategories] = useState<Map<string, string>>(new Map())
  const [toast, setToast] = useState('')
  const [filter, setFilter] = useState<'all' | 'unclassified' | 'classified'>('unclassified')
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const load = useCallback(async (pg = page, q = search) => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await getUnknownIngredients({ search: q, page: pg, pageSize: PAGE_SIZE })
      setItems(res.items)
      setTotal(res.total)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    load(0, search)
    getCategories().then((cats: AppCategory[]) => {
      setCategories(new Map(cats.map(c => [c.id, c.display_name])))
    }).catch(() => {})
  }, []) // eslint-disable-line

  const onSearch = (q: string) => {
    setSearch(q)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => { setPage(0); load(0, q) }, 350)
  }

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 5000)
  }

  const handleSaved = (result: { affected_products: number; auto_approved: number }) => {
    setClassifying(null)
    flash(
      `Classified! ${result.affected_products.toLocaleString()} product${result.affected_products !== 1 ? 's' : ''} reprocessed` +
      (result.auto_approved > 0 ? ` · ${result.auto_approved.toLocaleString()} auto-approved` : '')
    )
    if (selected) {
      setSelected(prev => prev ? { ...prev, is_classified: true } : null)
    }
    load(page, search)
  }

  const handleDeleted = (result: { deleted_products: number }) => {
    const name = deleting?.name ?? ''
    setDeleting(null)
    setSelected(null)
    flash(`Deleted "${formatIngredientName(name)}" and ${result.deleted_products.toLocaleString()} product${result.deleted_products !== 1 ? 's' : ''}`)
    load(page, search)
  }

  const visibleItems = items.filter(item => {
    if (filter === 'classified')   return item.is_classified
    if (filter === 'unclassified') return !item.is_classified
    return true
  })

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className={styles.page + (selected ? ' ' + styles.pageWithPanel : '')}>
      <div className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Ingredients</h1>
            <p className={styles.pageDesc}>
              Classify unknown ingredients to auto-approve products with no remaining unknowns.
            </p>
          </div>
          <div className={styles.headerStats}>
            <div className={styles.statPill}>
              <span className={styles.statNum}>{total.toLocaleString()}</span>
              <span className={styles.statLabel}>unknown</span>
            </div>
            <div className={styles.statPill}>
              <span className={styles.statNum}>{items.filter(i => i.is_classified).length.toLocaleString()}</span>
              <span className={styles.statLabel}>classified</span>
            </div>
          </div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className={styles.search}
              placeholder="Search ingredients…"
              value={search}
              onChange={e => onSearch(e.target.value)}
            />
          </div>
          <div className={styles.filterTabs}>
            {(['unclassified', 'all', 'classified'] as const).map(f => (
              <button
                key={f}
                className={styles.filterTab + (filter === f ? ' ' + styles.filterTabActive : '')}
                onClick={() => setFilter(f)}
              >
                {f === 'unclassified' ? 'Needs Classification' : f === 'classified' ? 'Classified' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {toast && (
          <div className={styles.toast}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            {toast}
          </div>
        )}

        {loading ? (
          <div className={styles.spinnerWrap}><div className={styles.spinner}/></div>
        ) : loadError ? (
          <div className={styles.empty}>
            <p className={styles.emptyError}>Failed to load ingredients</p>
            <p className={styles.emptyMono}>{loadError}</p>
            <button className={styles.retryBtn} onClick={() => load()}>Retry</button>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className={styles.empty}>
            {filter === 'unclassified'
              ? <p>All ingredients have been classified!</p>
              : <p>No ingredients found{search ? ' matching your search' : ''}.</p>}
          </div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.thName}>Ingredient</th>
                    <th className={styles.thCount}>Products</th>
                    <th className={styles.thAllergens}>Allergens</th>
                    <th className={styles.thNotes}>Notes</th>
                    <th className={styles.thStatus}>Status</th>
                    <th className={styles.thAction}></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map(item => (
                    <tr
                      key={item.name}
                      className={
                        styles.row +
                        (item.is_classified ? ' ' + styles.rowClassified : '') +
                        (selected?.name === item.name ? ' ' + styles.rowSelected : '')
                      }
                      onClick={() => setSelected(selected?.name === item.name ? null : item)}
                    >
                      <td className={styles.tdName}>
                        {formatIngredientName(item.name)}
                      </td>
                      <td className={styles.tdCount}>
                        <span className={styles.countBadge}>{item.product_count.toLocaleString()}</span>
                      </td>
                      <td className={styles.tdAllergens}>
                        {item.allergen_tags.length > 0 ? (
                          <div className={styles.allergenTagList}>
                            {item.allergen_tags.map(t => (
                              <span key={t} className={styles.allergenTag}>
                                {ALLERGEN_LABEL[t] ?? formatIngredientName(t)}
                              </span>
                            ))}
                          </div>
                        ) : item.is_classified ? (
                          <span className={styles.safeTag}>None</span>
                        ) : (
                          <span className={styles.unknownDash}>—</span>
                        )}
                      </td>
                      <td className={styles.tdNotes}>
                        <span className={styles.notesText}>{item.notes || ''}</span>
                      </td>
                      <td className={styles.tdStatus}>
                        {item.is_classified ? (
                          <span className={styles.statusClassified}>Classified</span>
                        ) : (
                          <span className={styles.statusUnknown}>Unknown</span>
                        )}
                      </td>
                      <td className={styles.tdAction} onClick={e => e.stopPropagation()}>
                        <button
                          className={styles.classifyBtn + (item.is_classified ? ' ' + styles.classifyBtnEdit : '')}
                          onClick={() => setClassifying(item)}
                        >
                          {item.is_classified ? 'Edit' : 'Classify'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.pagination}>
              <span className={styles.pgInfo}>
                {total.toLocaleString()} ingredient{total !== 1 ? 's' : ''} · page {page + 1} of {totalPages}
              </span>
              <div className={styles.pgBtns}>
                <button className={styles.pgBtn} disabled={page === 0}
                  onClick={() => { const p = page - 1; setPage(p); load(p) }}>
                  ← Prev
                </button>
                <button className={styles.pgBtn} disabled={page >= totalPages - 1}
                  onClick={() => { const p = page + 1; setPage(p); load(p) }}>
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selected && (
        <DetailPanel
          ingredient={selected}
          categories={categories}
          onClose={() => setSelected(null)}
          onClassify={() => setClassifying(selected)}
          onDelete={() => setDeleting(selected)}
          onFlash={flash}
          onProductChanged={() => load(page, search)}
        />
      )}

      {classifying && (
        <ClassifyModal
          ingredient={classifying}
          onClose={() => setClassifying(null)}
          onSaved={handleSaved}
        />
      )}

      {deleting && (
        <DeleteConfirmModal
          ingredient={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
