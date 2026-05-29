import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getProduct, updateProduct, getCategories, getProductCategoryIds, setProductCategories,
  type Product, type AppCategory,
} from '../lib/supabase'
import styles from './ProductEdit.module.css'

const KNOWN_ALLERGENS = ['gluten','wheat','milk','eggs','peanuts','tree-nuts','soy','fish','shellfish','sesame','mustard','celery','lupin','sulphites']
const KNOWN_DIETS = ['vegan','vegetarian','gluten-free','dairy-free','keto','paleo','halal','kosher','low-sodium','low-sugar','organic','non-gmo']

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<AppCategory[]>([])
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set())
  const [allergenSet, setAllergenSet] = useState<Set<string>>(new Set())
  const [dietSet, setDietSet] = useState<Set<string>>(new Set())
  const [customAllergens, setCustomAllergens] = useState<string[]>([])
  const [customDiets, setCustomDiets] = useState<string[]>([])
  const [customTags, setCustomTags] = useState<string[]>([])
  const [form, setForm] = useState({ name: '', brand: '', quantity: '', ingredients_text: '', status: 'pending', health_rating: '', ai_insights: '', admin_notes: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tagInputs, setTagInputs] = useState({ allergen: '', diet: '', custom: '' })

  useEffect(() => {
    if (!id) return
    Promise.all([getProduct(id), getCategories(), getProductCategoryIds(id)]).then(([p, cats, catIds]) => {
      setProduct(p)
      setCategories(cats)
      setSelectedCats(new Set(catIds))
      setForm({
        name: p.name, brand: p.brand, quantity: p.quantity,
        ingredients_text: p.ingredients_text, status: p.status,
        health_rating: p.health_rating != null ? String(p.health_rating) : '',
        ai_insights: p.ai_insights, admin_notes: p.admin_notes,
      })
      const knownA = new Set<string>(), customA: string[] = []
      for (const a of (p.allergen_tags ?? [])) {
        if (KNOWN_ALLERGENS.includes(a)) knownA.add(a); else customA.push(a)
      }
      const knownD = new Set<string>(), customD: string[] = []
      for (const d of (p.diet_tags ?? [])) {
        if (KNOWN_DIETS.includes(d)) knownD.add(d); else customD.push(d)
      }
      setAllergenSet(knownA)
      setCustomAllergens(customA)
      setDietSet(knownD)
      setCustomDiets(customD)
      setCustomTags([...(p.custom_tags ?? [])])
    }).finally(() => setLoading(false))
  }, [id])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const toggleSet = (s: Set<string>, val: string, checked: boolean): Set<string> => {
    const next = new Set(s); checked ? next.add(val) : next.delete(val); return next
  }

  const addTag = (kind: 'allergen' | 'diet' | 'custom') => {
    const val = tagInputs[kind].trim().toLowerCase()
    if (!val) return
    if (kind === 'allergen') setCustomAllergens(p => [...p, val])
    if (kind === 'diet') setCustomDiets(p => [...p, val])
    if (kind === 'custom') setCustomTags(p => [...p, val])
    setTagInputs(t => ({ ...t, [kind]: '' }))
  }

  const save = async () => {
    if (!product) return
    setSaving(true)
    try {
      const updates: Partial<Product> = {
        ...form,
        health_rating: form.health_rating ? parseInt(form.health_rating, 10) : null,
        status: form.status as Product['status'],
        allergen_tags: [...allergenSet, ...customAllergens],
        diet_tags: [...dietSet, ...customDiets],
        custom_tags: customTags,
        approved_at: form.status === 'approved' ? (product.approved_at ?? new Date().toISOString()) : product.approved_at,
      }
      await updateProduct(product.id, updates)
      await setProductCategories(product.id, [...selectedCats])
      setSaved(true)
      setTimeout(() => { setSaved(false); navigate('/products') }, 1200)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className={styles.spinnerWrap}><div className={styles.spinner} /></div>
  if (!product) return <div className={styles.notFound}>Product not found.</div>

  const grade = product.nutriscore_grade?.toUpperCase()

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate('/products')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to Products
        </button>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Edit Product</h1>
          {product.barcode && <p className={styles.titleSub}>{product.barcode}</p>}
        </div>
      </div>

      {saved && (
        <div className={styles.savedToast}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Changes saved
        </div>
      )}

      <div className={styles.layout}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          {/* Product image */}
          <div className={styles.sideCard}>
            <div className={styles.imgWrap}>
              {product.image_front_url
                ? <img src={product.image_front_url} className={styles.productImg} alt=""
                    onError={e => (e.currentTarget.style.display = 'none')} />
                : (
                  <div className={styles.imgPlaceholder}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <rect x="3" y="3" width="18" height="18" rx="3"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    No image
                  </div>
                )
              }
            </div>
            <div className={styles.sideCardBody}>
              <div className={styles.barcode}>{product.barcode}</div>
              <div className={styles.previewName}>{form.name || '(no name)'}</div>
              {form.brand && <div className={styles.previewBrand}>{form.brand}</div>}
              <div className={styles.badgeRow}>
                {grade && (
                  <span className={`${styles.nutriScore} ${styles['grade' + grade]}`}>
                    Nutri-Score {grade}
                  </span>
                )}
                {product.nova_group && (
                  <span className={styles.novaTag}>NOVA {product.nova_group}</span>
                )}
                <span className={`${styles.statusBadge} ${styles['status' + form.status.charAt(0).toUpperCase() + form.status.slice(1)]}`}>
                  {form.status}
                </span>
              </div>
            </div>
          </div>

          {/* Nutrition label image */}
          {product.image_nutrition_url && (
            <div className={styles.sideCard}>
              <div className={styles.imgSectionLabel}>Nutrition label</div>
              <div className={styles.imgWrap} style={{ height: 180 }}>
                <img src={product.image_nutrition_url} className={styles.productImg} alt=""
                  onError={e => (e.currentTarget.style.display = 'none')} />
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <div className={styles.formCol}>
          <Section
            icon="📋" iconBg="#f0f7ff"
            title="Basic Info"
            subtitle="Core product details"
          >
            <Field label="Product Name">
              <input className={styles.input} value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Organic Greek Yogurt" />
            </Field>
            <div className={styles.row2}>
              <Field label="Brand">
                <input className={styles.input} value={form.brand}
                  onChange={e => set('brand', e.target.value)}
                  placeholder="e.g. Chobani" />
              </Field>
              <Field label="Quantity / Size">
                <input className={styles.input} value={form.quantity}
                  onChange={e => set('quantity', e.target.value)}
                  placeholder="e.g. 500g" />
              </Field>
            </div>
            <Field label="Ingredients Text">
              <textarea className={styles.textarea} rows={5} value={form.ingredients_text}
                onChange={e => set('ingredients_text', e.target.value)}
                placeholder="Full ingredient list as printed on packaging…" />
            </Field>
          </Section>

          <Section icon="🏷️" iconBg="#fef3c7" title="Categories" subtitle="Product classification">
            <div className={styles.checkGrid}>
              {categories.map(cat => (
                <label key={cat.id} className={styles.checkLabel}>
                  <input type="checkbox" checked={selectedCats.has(cat.id)}
                    onChange={e => setSelectedCats(toggleSet(selectedCats, cat.id, e.target.checked))} />
                  {cat.display_name}
                </label>
              ))}
            </div>
          </Section>

          <Section icon="⚠️" iconBg="#fff1f2" title="Allergens" subtitle="Known and custom allergen flags">
            <div className={styles.checkGrid}>
              {KNOWN_ALLERGENS.map(a => (
                <label key={a} className={styles.checkLabel}>
                  <input type="checkbox" checked={allergenSet.has(a)}
                    onChange={e => setAllergenSet(toggleSet(allergenSet, a, e.target.checked))} />
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </label>
              ))}
            </div>
            <TagInput label="Custom allergen…" value={tagInputs.allergen}
              onChange={v => setTagInputs(t => ({ ...t, allergen: v }))}
              onAdd={() => addTag('allergen')} tags={customAllergens}
              onRemove={t => setCustomAllergens(p => p.filter(x => x !== t))} />
          </Section>

          <Section icon="🥗" iconBg="#f0fdf4" title="Diet Flags" subtitle="Dietary suitability labels">
            <div className={styles.checkGrid}>
              {KNOWN_DIETS.map(d => (
                <label key={d} className={styles.checkLabel}>
                  <input type="checkbox" checked={dietSet.has(d)}
                    onChange={e => setDietSet(toggleSet(dietSet, d, e.target.checked))} />
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </label>
              ))}
            </div>
            <TagInput label="Custom diet flag…" value={tagInputs.diet}
              onChange={v => setTagInputs(t => ({ ...t, diet: v }))}
              onAdd={() => addTag('diet')} tags={customDiets}
              onRemove={t => setCustomDiets(p => p.filter(x => x !== t))} />
          </Section>

          <Section icon="🔖" iconBg="#f5f3ff" title="Custom Tags" subtitle="Internal search and filter tags">
            <TagInput label="Add tag…" value={tagInputs.custom}
              onChange={v => setTagInputs(t => ({ ...t, custom: v }))}
              onAdd={() => addTag('custom')} tags={customTags}
              onRemove={t => setCustomTags(p => p.filter(x => x !== t))} />
          </Section>

          <Section icon="⚙️" iconBg="#f8faff" title="Admin Fields" subtitle="Status, ratings, and internal notes">
            <div className={styles.row2}>
              <Field label="Review Status">
                <select className={styles.select} value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </Field>
              <Field label="Health Rating (1–10)">
                <input className={styles.input} type="number" min="1" max="10"
                  value={form.health_rating} onChange={e => set('health_rating', e.target.value)}
                  placeholder="—" />
              </Field>
            </div>
            <Field label="AI Insights / Notes for Users">
              <textarea className={styles.textarea} rows={3} value={form.ai_insights}
                onChange={e => set('ai_insights', e.target.value)}
                placeholder="Personalized insights shown to the user in the app…" />
            </Field>
            <Field label="Admin Notes (internal)">
              <textarea className={styles.textarea} rows={2} value={form.admin_notes}
                onChange={e => set('admin_notes', e.target.value)}
                placeholder="Internal notes — not visible to users" />
            </Field>
          </Section>

          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => navigate('/products')}>Cancel</button>
            <button className={styles.saveBtn} onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function Section({ icon, iconBg, title, subtitle, children }: {
  icon: string; iconBg: string; title: string; subtitle?: string; children: React.ReactNode
}) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon} style={{ background: iconBg }}>{icon}</div>
        <div>
          <div className={styles.sectionTitle}>{title}</div>
          {subtitle && <div className={styles.sectionSubtitle}>{subtitle}</div>}
        </div>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {children}
    </div>
  )
}

function TagInput({ label, value, onChange, onAdd, tags, onRemove }: {
  label: string; value: string; onChange: (v: string) => void
  onAdd: () => void; tags: string[]; onRemove: (t: string) => void
}) {
  return (
    <div className={styles.tagSection}>
      <div className={styles.tagInputRow}>
        <input className={styles.input} placeholder={label}
          value={value} onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onAdd()} />
        <button className={styles.addBtn} onClick={onAdd} type="button">Add</button>
      </div>
      {tags.length > 0 && (
        <div className={styles.tagList}>
          {tags.map(t => (
            <span key={t} className={styles.tag}>
              {t}
              <button onClick={() => onRemove(t)} type="button" title="Remove">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
