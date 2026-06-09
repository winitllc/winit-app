import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useSearchParams } from 'react-router-dom'
import {
  getProducts, getQualityFilterCounts, getCategories, getProductStats, approveProduct, rejectProduct, updateProduct,
  type Product, type ProductStatus, type QualityFilter, type AppCategory,
} from '../lib/supabase'
import styles from './Products.module.css'

const PAGE_SIZE = 24

const ALLERGEN_LABELS: Record<string, string> = {
  'gluten': 'Gluten', 'wheat': 'Wheat', 'milk': 'Milk', 'eggs': 'Eggs',
  'peanuts': 'Peanuts', 'tree-nuts': 'Tree Nuts', 'soy': 'Soy', 'fish': 'Fish',
  'shellfish': 'Shellfish', 'sesame': 'Sesame', 'celery': 'Celery',
  'mustard': 'Mustard', 'lupin': 'Lupin', 'sulphites': 'Sulphites',
  // en: prefixed fallbacks (from raw OFF import data)
  'en:milk': 'Milk', 'en:eggs': 'Eggs', 'en:gluten': 'Gluten', 'en:peanuts': 'Peanuts',
  'en:tree-nuts': 'Tree Nuts', 'en:soy': 'Soy', 'en:fish': 'Fish', 'en:shellfish': 'Shellfish',
  'en:sesame': 'Sesame', 'en:celery': 'Celery', 'en:mustard': 'Mustard', 'en:lupin': 'Lupin',
  'en:sulphur-dioxide-and-sulphites': 'Sulphites',
}
const DIET_LABELS: Record<string, string> = {
  'vegan': 'Vegan', 'vegetarian': 'Vegetarian', 'gluten-free': 'Gluten Free',
  'dairy-free': 'Dairy Free', 'keto': 'Keto', 'paleo': 'Paleo',
  'halal': 'Halal', 'kosher': 'Kosher', 'low-sodium': 'Low Sodium',
  'low-sugar': 'Low Sugar', 'organic': 'Organic', 'non-gmo': 'Non-GMO',
  // en: prefixed fallbacks
  'en:vegan-status-by-ingredients': 'Vegan', 'en:vegetarian-status-by-ingredients': 'Vegetarian',
  'en:gluten-free': 'Gluten Free', 'en:no-gluten': 'Gluten Free', 'en:no-lactose': 'Lactose Free',
  'en:organic': 'Organic', 'en:palm-oil-free': 'Palm Oil Free', 'en:low-sugar': 'Low Sugar',
  'en:low-fat': 'Low Fat', 'en:high-protein': 'High Protein', 'en:high-fiber': 'High Fiber',
}

const fmtTag = (map: Record<string, string>, tag: string) =>
  map[tag] ?? tag.replace(/^en:/, '').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())

// Derive allergens from ingredients text — mirrors the logic in ProductEdit
const ALLERGEN_KEYWORDS: [string, string[]][] = [
  ['gluten',    ['wheat','gluten','barley','rye','oats','spelt','kamut','farro','durum','bulgur','semolina']],
  ['wheat',     ['wheat','whole grain wheat','whole wheat','durum','semolina','spelt','farro','bulgur']],
  ['milk',      ['milk','dairy','lactose','cream','butter','cheese','whey','casein','ghee']],
  ['eggs',      ['egg','eggs','albumin','mayonnaise','meringue','ovalbumin']],
  ['peanuts',   ['peanut','groundnut','arachis']],
  ['tree-nuts', ['almond','cashew','walnut','pecan','pistachio','hazelnut','filbert','brazil nut','macadamia','pine nut']],
  ['soy',       ['soy','soya','tofu','tempeh','miso','edamame','soybean','soy lecithin']],
  ['fish',      ['fish','anchovy','bass','cod','salmon','tuna','trout','herring','sardine','halibut']],
  ['shellfish', ['shellfish','shrimp','crab','lobster','crayfish','prawn','clam','oyster','scallop','mussel']],
  ['sesame',    ['sesame','tahini']],
  ['mustard',   ['mustard']],
  ['celery',    ['celery','celeriac']],
  ['lupin',     ['lupin','lupine']],
  ['sulphites', ['sulphite','sulfite','sulphur dioxide','sulfur dioxide']],
]

const DIET_DISQUALIFY: Record<string, RegExp[]> = {
  'gluten-free': [/wheat/,/gluten/,/barley/,/\brye\b/,/\boats\b/,/spelt/,/semolina/,/durum/,/bulgur/,/farro/,/kamut/],
  'dairy-free':  [/\bmilk\b/,/\bdairy\b/,/lactose/,/\bcream\b/,/\bbutter\b/,/\bcheese\b/,/\bwhey\b/,/\bcasein\b/,/\bghee\b/],
  'vegan':       [/\bmilk\b/,/\bdairy\b/,/lactose/,/\bcream\b/,/\bbutter\b/,/\bcheese\b/,/\bwhey\b/,/\bcasein\b/,/\begg\b/,/\beggs\b/,/albumin/,/\bhoney\b/,/gelatin/,/\bmeat\b/,/chicken/,/\bbeef\b/,/\bpork\b/,/\bfish\b/,/shellfish/],
  'vegetarian':  [/\bmeat\b/,/chicken/,/\bbeef\b/,/\bpork\b/,/veal/,/\blamb\b/,/bacon/,/gelatin/,/\blard\b/,/tallow/,/\bfish\b/,/shellfish/,/anchovy/],
  'keto':        [/\bsugar\b/,/wheat/,/\bflour\b/,/\brice\b/,/\bcorn\b/,/potato/,/\boats\b/,/\bhoney\b/,/syrup/],
  'paleo':       [/wheat/,/\bflour\b/,/grain/,/\bdairy\b/,/\bmilk\b/,/\bcream\b/,/\bcheese\b/,/legume/,/\bpeanut\b/,/\bsoy\b/,/\bcorn\b/,/\bsugar\b/,/syrup/],
}

function getEffectiveTags(storedTags: string[], ingredientsText: string, type: 'allergens' | 'diets'): string[] {
  // If stored tags exist (product has been reviewed/saved), use them as-is
  if (storedTags.length > 0) return storedTags

  // Otherwise derive from ingredients text
  const text = ingredientsText?.toLowerCase() ?? ''
  if (!text) return []

  if (type === 'allergens') {
    return ALLERGEN_KEYWORDS.filter(([, kws]) => kws.some(kw => text.includes(kw))).map(([name]) => name)
  } else {
    return (['gluten-free','dairy-free','vegan','vegetarian','keto','paleo'] as const).filter(
      diet => !(DIET_DISQUALIFY[diet] ?? []).some(re => re.test(text))
    )
  }
}

const QUALITY_FILTERS: { value: QualityFilter; label: string }[] = [
  { value: 'missing_name',        label: 'Missing Name' },
  { value: 'missing_ingredients', label: 'Missing Ingredients' },
  { value: 'needs_review',        label: 'Needs Review' },
  { value: 'user_submitted',      label: 'User Submitted' },
]

function MissingBadges({ p }: { p: Product }) {
  const missing: string[] = []
  if (!p.name?.trim()) missing.push('Name')
  if (!p.ingredients_text?.trim()) missing.push('Ingredients')
  if (!p.image_front_url?.trim()) missing.push('Image')
  if (!missing.length) return null
  return (
    <div className={styles.missingRow}>
      {missing.map(m => (
        <span key={m} className={styles.missingBadge}>Missing {m}</span>
      ))}
    </div>
  )
}

type ReviewBadgeVariant = 'danger' | 'warning' | 'info' | 'neutral'

function reviewBadgeVariant(reason: string): ReviewBadgeVariant {
  const r = reason.toLowerCase()
  if (r.includes('missing') || r.includes('conflict') || r.includes('duplicate')) return 'danger'
  if (r.includes('confidence') || r.includes('unknown ingredient')) return 'warning'
  if (r.includes('user-submitted') || r.includes('allergen') || r.includes('classification')) return 'info'
  return 'neutral'
}

function ReviewReasonBadges({ p, active }: { p: Product; active: boolean }) {
  if (!active) return null

  // Combine DB-stored reasons with any client-detectable ones not yet backfilled
  const reasons: string[] = [...(p.review_reasons ?? [])]

  if (!p.name?.trim() && !reasons.some(r => r.toLowerCase().includes('missing product name')))
    reasons.push('Missing product name')
  if (!p.ingredients_text?.trim() && !reasons.some(r => r.toLowerCase().includes('missing ingredient')))
    reasons.push('Missing ingredients')
  if (!p.off_id && !reasons.some(r => r.toLowerCase().includes('user-submitted')))
    reasons.push('User-submitted changes pending approval')
  if ((p.ai_confidence ?? 1) < 0.55 && p.ai_confidence !== null && !reasons.some(r => r.toLowerCase().includes('confidence')))
    reasons.push('AI confidence below threshold')
  if (!p.categorization_status || p.categorization_status === 'unclassified') {
    if (p.name?.trim() && p.ingredients_text?.trim() && !reasons.some(r => r.toLowerCase().includes('allergen')))
      reasons.push('Missing allergen classification')
  }

  // Fallback: if nothing specific, the product is just awaiting admin sign-off
  if (reasons.length === 0) reasons.push('Pending admin approval')

  const variantClass: Record<ReviewBadgeVariant, string> = {
    danger:  styles.reviewReasonDanger,
    warning: styles.reviewReasonWarning,
    info:    styles.reviewReasonInfo,
    neutral: styles.reviewReasonNeutral,
  }

  return (
    <div className={styles.reviewReasonRow}>
      {reasons.map(r => (
        <span key={r} className={`${styles.reviewReasonBadge} ${variantClass[reviewBadgeVariant(r)]}`}>{r}</span>
      ))}
    </div>
  )
}

function IngredientsPreview({ text }: { text: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const hasText = !!text?.trim()

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasText) return
    const rect = e.currentTarget.getBoundingClientRect()
    setPos({ x: rect.left, y: rect.top })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasText || !pos) return
    setPos({ x: e.clientX, y: e.clientY })
  }

  const tooltip = pos && hasText
    ? createPortal(
        <div
          className={styles.ingredientsTooltip}
          style={{ left: pos.x, top: pos.y }}
        >
          <div className={styles.ingredientsTooltipLabel}>Full Ingredients</div>
          <div className={styles.ingredientsTooltipText}>{text}</div>
        </div>,
        document.body
      )
    : null

  return (
    <div
      className={styles.ingredientsBlock + (hasText ? ' ' + styles.ingredientsBlockHoverable : '')}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setPos(null)}
    >
      <span className={styles.ingredientsLabel}>
        Ingredients
        {hasText && <span className={styles.ingredientsHint}>hover to expand</span>}
      </span>
      {hasText
        ? <p className={styles.ingredientsSnippet}>{text}</p>
        : <p className={styles.ingredientsMissing}>No ingredients listed</p>
      }
      {tooltip}
    </div>
  )
}

function ProductCard({
  p,
  categories,
  showReviewReasons,
  onApprove,
  onReject,
  onNameSaved,
}: {
  p: Product
  categories: Map<string, string>
  showReviewReasons: boolean
  onApprove(p: Product): void
  onReject(p: Product): void
  onNameSaved(id: string, name: string): void
}) {
  const allergens = getEffectiveTags(p.allergen_tags ?? [], p.ingredients_text, 'allergens').slice(0, 5)
  const diets = getEffectiveTags(p.diet_tags ?? [], p.ingredients_text, 'diets').slice(0, 4)
  const hasIngredients = p.ingredients_text?.trim().length > 0
  const isUserSubmitted = !p.off_id
  const isMissingName = !p.name?.trim()
  const isPending = p.status === 'pending'

  // Resolve category names from the join table (human-assigned) first, fall back to AI category
  const catIds = (p.product_categories ?? []).map(r => r.category_id)
  const categoryNames = catIds.length > 0
    ? catIds.map(id => categories.get(id)).filter(Boolean) as string[]
    : (p.ai_category_id ? [categories.get(p.ai_category_id)].filter(Boolean) as string[] : [])

  const [nameInput, setNameInput] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSaveName = async () => {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      await updateProduct(p.id, { name: trimmed })
      onNameSaved(p.id, trimmed)
      setNameInput('')
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName()
    if (e.key === 'Escape') setNameInput('')
  }

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
        {isUserSubmitted && (
          <span className={styles.userSubmittedPill}>👤 User</span>
        )}
      </Link>

      <div className={styles.cardBody}>
        {/* Name row — inline edit for pending products with missing name */}
        {isMissingName && isPending ? (
          <div className={styles.inlineNameEdit}>
            <input
              ref={inputRef}
              className={styles.inlineNameInput + (nameInput.trim() ? ' ' + styles.inlineNameInputActive : '')}
              placeholder="Enter product name…"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {nameInput.trim() && (
              <button
                className={styles.inlineNameSave}
                onClick={handleSaveName}
                disabled={saving}
              >
                {saving ? '…' : 'Save'}
              </button>
            )}
          </div>
        ) : (
          <p className={styles.productName}>{p.name || <span className={styles.unnamed}>(unnamed)</span>}</p>
        )}

        {p.brand && <p className={styles.brandName}>{p.brand}{p.quantity ? ' · ' + p.quantity : ''}</p>}

        <MissingBadges p={p} />
        <ReviewReasonBadges p={p} active={showReviewReasons} />

        {/* Categories */}
        {categoryNames.length > 0 && (
          <div className={styles.metaRow}>
            {categoryNames.slice(0, 3).map(name => (
              <span key={name} className={styles.categoryTag}>{name}</span>
            ))}
            {categoryNames.length > 3 && (
              <span className={styles.moreTag}>+{categoryNames.length - 3}</span>
            )}
          </div>
        )}

        {/* Allergens */}
        <div className={styles.tagRow}>
          <span className={styles.tagRowLabel}>Allergens</span>
          <div className={styles.tagList}>
            {allergens.length > 0 ? (
              <>
                {allergens.map(t => (
                  <span key={t} className={styles.allergenTag}>{fmtTag(ALLERGEN_LABELS, t)}</span>
                ))}
                {getEffectiveTags(p.allergen_tags ?? [], p.ingredients_text, 'allergens').length > 5 && (
                  <span className={styles.moreTag}>+{getEffectiveTags(p.allergen_tags ?? [], p.ingredients_text, 'allergens').length - 5}</span>
                )}
              </>
            ) : (
              <span className={styles.noneTag}>None listed</span>
            )}
          </div>
        </div>

        {/* Diet flags */}
        <div className={styles.tagRow}>
          <span className={styles.tagRowLabel}>Diet</span>
          <div className={styles.tagList}>
            {diets.length > 0 ? (
              <>
                {diets.map(t => (
                  <span key={t} className={styles.dietTag}>{fmtTag(DIET_LABELS, t)}</span>
                ))}
                {getEffectiveTags(p.diet_tags ?? [], p.ingredients_text, 'diets').length > 4 && (
                  <span className={styles.moreTag}>+{getEffectiveTags(p.diet_tags ?? [], p.ingredients_text, 'diets').length - 4}</span>
                )}
              </>
            ) : (
              <span className={styles.noneTag}>None listed</span>
            )}
          </div>
        </div>

        {/* Ingredients */}
        <IngredientsPreview text={p.ingredients_text} />
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
  const [qualityFilter, setQualityFilter] = useState<QualityFilter | ''>(
    (searchParams.get('quality') as QualityFilter | null) ?? ''
  )
  const [filterCounts, setFilterCounts] = useState<Record<QualityFilter, number> | null>(null)
  const [statusCounts, setStatusCounts] = useState<{ pending: number; approved: number; rejected: number; total: number } | null>(null)
  const [categories, setCategories] = useState<Map<string, string>>(new Map())
  const [toast, setToast] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const refreshCounts = useCallback((st = status) => {
    getQualityFilterCounts(st).then(setFilterCounts).catch(() => {})
    getProductStats().then(setStatusCounts).catch(() => {})
  }, [status])

  const load = useCallback(async (pg = page, q = search, st = status, qf = qualityFilter) => {
    setLoading(true)
    try {
      const res = await getProducts({ status: st, search: q, page: pg, pageSize: PAGE_SIZE, qualityFilter: qf })
      setProducts(res.products)
      setTotal(res.total)
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
