import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { updateProduct, type Product } from '../lib/supabase'
import styles from './ProductCard.module.css'

export const ALLERGEN_LABELS: Record<string, string> = {
  'gluten': 'Gluten', 'wheat': 'Wheat', 'milk': 'Milk', 'eggs': 'Eggs',
  'peanuts': 'Peanuts', 'tree-nuts': 'Tree Nuts', 'soy': 'Soy', 'fish': 'Fish',
  'shellfish': 'Shellfish', 'sesame': 'Sesame', 'celery': 'Celery',
  'mustard': 'Mustard', 'lupin': 'Lupin', 'sulphites': 'Sulphites',
  'en:milk': 'Milk', 'en:eggs': 'Eggs', 'en:gluten': 'Gluten', 'en:peanuts': 'Peanuts',
  'en:tree-nuts': 'Tree Nuts', 'en:soy': 'Soy', 'en:fish': 'Fish', 'en:shellfish': 'Shellfish',
  'en:sesame': 'Sesame', 'en:celery': 'Celery', 'en:mustard': 'Mustard', 'en:lupin': 'Lupin',
  'en:sulphur-dioxide-and-sulphites': 'Sulphites',
}
export const DIET_LABELS: Record<string, string> = {
  'vegan': 'Vegan', 'vegetarian': 'Vegetarian', 'gluten-free': 'Gluten Free',
  'dairy-free': 'Dairy Free', 'keto': 'Keto', 'paleo': 'Paleo',
  'halal': 'Halal', 'kosher': 'Kosher', 'low-sodium': 'Low Sodium',
  'low-sugar': 'Low Sugar', 'organic': 'Organic', 'non-gmo': 'Non-GMO',
  'en:vegan-status-by-ingredients': 'Vegan', 'en:vegetarian-status-by-ingredients': 'Vegetarian',
  'en:gluten-free': 'Gluten Free', 'en:no-gluten': 'Gluten Free', 'en:no-lactose': 'Lactose Free',
  'en:organic': 'Organic', 'en:palm-oil-free': 'Palm Oil Free', 'en:low-sugar': 'Low Sugar',
  'en:low-fat': 'Low Fat', 'en:high-protein': 'High Protein', 'en:high-fiber': 'High Fiber',
}

export const fmtTag = (map: Record<string, string>, tag: string) =>
  map[tag] ?? tag.replace(/^en:/, '').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())

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

export function getEffectiveTags(storedTags: string[], ingredientsText: string, type: 'allergens' | 'diets'): string[] {
  if (storedTags.length > 0) return storedTags
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

// ── Sub-components ─────────────────────────────────────────────────────────────

export function MissingBadges({ p }: { p: Product }) {
  const missing: string[] = []
  if (!p.name?.trim()) missing.push('Name')
  if (!p.ingredients_text?.trim()) missing.push('Ingredients')
  if (!p.image_front_url?.trim()) missing.push('Image')
  if (!missing.length) return null
  return (
    <div className={styles.missingRow}>
      {missing.map(m => <span key={m} className={styles.missingBadge}>Missing {m}</span>)}
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

export function ReviewReasonBadges({ p, active }: { p: Product; active: boolean }) {
  if (!active) return null
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

export function IngredientsPreview({ text }: { text: string }) {
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
        <div className={styles.ingredientsTooltip} style={{ left: pos.x, top: pos.y }}>
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

// ── ProductCard ────────────────────────────────────────────────────────────────

export interface ProductCardProps {
  p: Product
  categories: Map<string, string>
  showReviewReasons: boolean
  onApprove(p: Product): void
  onReject(p: Product): void
  onNameSaved(id: string, name: string): void
}

export function ProductCard({ p, categories, showReviewReasons, onApprove, onReject, onNameSaved }: ProductCardProps) {
  const allergens = getEffectiveTags(p.allergen_tags ?? [], p.ingredients_text, 'allergens').slice(0, 5)
  const diets = getEffectiveTags(p.diet_tags ?? [], p.ingredients_text, 'diets').slice(0, 4)
  const isUserSubmitted = !p.off_id
  const isMissingName = !p.name?.trim()
  const isPending = p.status === 'pending'

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
        {isUserSubmitted && <span className={styles.userSubmittedPill}>👤 User</span>}
      </Link>

      <div className={styles.cardBody}>
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
              <button className={styles.inlineNameSave} onClick={handleSaveName} disabled={saving}>
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

        {categoryNames.length > 0 && (
          <div className={styles.metaRow}>
            {categoryNames.slice(0, 3).map(name => (
              <span key={name} className={styles.categoryTag}>{name}</span>
            ))}
            {categoryNames.length > 3 && <span className={styles.moreTag}>+{categoryNames.length - 3}</span>}
          </div>
        )}

        <div className={styles.tagRow}>
          <span className={styles.tagRowLabel}>Allergens</span>
          <div className={styles.tagList}>
            {allergens.length > 0 ? (
              <>
                {allergens.map(t => <span key={t} className={styles.allergenTag}>{fmtTag(ALLERGEN_LABELS, t)}</span>)}
                {getEffectiveTags(p.allergen_tags ?? [], p.ingredients_text, 'allergens').length > 5 && (
                  <span className={styles.moreTag}>+{getEffectiveTags(p.allergen_tags ?? [], p.ingredients_text, 'allergens').length - 5}</span>
                )}
              </>
            ) : <span className={styles.noneTag}>None listed</span>}
          </div>
        </div>

        <div className={styles.tagRow}>
          <span className={styles.tagRowLabel}>Diet</span>
          <div className={styles.tagList}>
            {diets.length > 0 ? (
              <>
                {diets.map(t => <span key={t} className={styles.dietTag}>{fmtTag(DIET_LABELS, t)}</span>)}
                {getEffectiveTags(p.diet_tags ?? [], p.ingredients_text, 'diets').length > 4 && (
                  <span className={styles.moreTag}>+{getEffectiveTags(p.diet_tags ?? [], p.ingredients_text, 'diets').length - 4}</span>
                )}
              </>
            ) : <span className={styles.noneTag}>None listed</span>}
          </div>
        </div>

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
