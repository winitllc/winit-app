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
    const next = new Set(s)
    checked ? next.add(val) : next.delete(val)
    return next
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

  if (loading) return <div className={styles.spinner} />

  if (!product) return <div className={styles.notFound}>Product not found.</div>

  return (
    <div>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/products')}>← Back</button>
        <h1 className={styles.title}>Edit Product</h1>
      </div>

      {saved && <div className={styles.savedToast}>Saved!</div>}

      <div className={styles.layout}>
        {/* Preview column */}
        <div className={styles.preview}>
          {product.image_front_url && (
            <div className={styles.imgCard}>
              <img src={product.image_front_url} className={styles.productImg} alt=""
                onError={e => (e.currentTarget.style.display = 'none')} />
            </div>
          )}
          <div className={styles.previewInfo}>
            <div className={styles.barcode}>{product.barcode}</div>
            <div className={styles.previewName}>{form.name || '(no name)'}</div>
            <div className={styles.previewBrand}>{form.brand}</div>
            {product.nutriscore_grade && (
              <span className={`${styles.nutriscore} ${styles[`grade${product.nutriscore_grade.toUpperCase()}`]}`}>
                Nutri-Score {product.nutriscore_grade.toUpperCase()}
              </span>
            )}
            {product.nova_group && <span className={styles.nova}>NOVA {product.nova_group}</span>}
          </div>
          {product.image_nutrition_url && (
            <div className={styles.imgCard}>
              <div className={styles.imgLabel}>Nutrition label</div>
              <img src={product.image_nutrition_url} className={styles.productImg} alt=""
                onError={e => (e.currentTarget.style.display = 'none')} />
            </div>
          )}
        </div>

        {/* Form column */}
        <div className={styles.formCol}>
          <Section title="Basic Info">
            <Field label="Product Name">
              <input className={styles.input} value={form.name} onChange={e => set('name', e.target.value)} />
            </Field>
            <Row2>
              <Field label="Brand"><input className={styles.input} value={form.brand} onChange={e => set('brand', e.target.value)} /></Field>
              <Field label="Quantity"><input className={styles.input} value={form.quantity} onChange={e => set('quantity', e.target.value)} /></Field>
            </Row2>
            <Field label="Ingredients Text">
              <textarea className={styles.textarea} rows={5} value={form.ingredients_text}
                onChange={e => set('ingredients_text', e.target.value)} />
            </Field>
          </Section>

          <Section title="Categories">
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

          <Section title="Allergens">
            <div className={styles.checkGrid}>
              {KNOWN_ALLERGENS.map(a => (
                <label key={a} className={styles.checkLabel}>
                  <input type="checkbox" checked={allergenSet.has(a)}
                    onChange={e => setAllergenSet(toggleSet(allergenSet, a, e.target.checked))} />
                  {a}
                </label>
              ))}
            </div>
            <TagInput label="Custom allergen" value={tagInputs.allergen}
              onChange={v => setTagInputs(t => ({ ...t, allergen: v }))}
              onAdd={() => addTag('allergen')} tags={customAllergens}
              onRemove={t => setCustomAllergens(p => p.filter(x => x !== t))} />
          </Section>

          <Section title="Diet Flags">
            <div className={styles.checkGrid}>
              {KNOWN_DIETS.map(d => (
                <label key={d} className={styles.checkLabel}>
                  <input type="checkbox" checked={dietSet.has(d)}
                    onChange={e => setDietSet(toggleSet(dietSet, d, e.target.checked))} />
                  {d}
                </label>
              ))}
            </div>
            <TagInput label="Custom diet flag" value={tagInputs.diet}
              onChange={v => setTagInputs(t => ({ ...t, diet: v }))}
              onAdd={() => addTag('diet')} tags={customDiets}
              onRemove={t => setCustomDiets(p => p.filter(x => x !== t))} />
          </Section>

          <Section title="Custom Tags">
            <TagInput label="Add tag" value={tagInputs.custom}
              onChange={v => setTagInputs(t => ({ ...t, custom: v }))}
              onAdd={() => addTag('custom')} tags={customTags}
              onRemove={t => setCustomTags(p => p.filter(x => x !== t))} />
          </Section>

          <Section title="Admin Fields">
            <Row2>
              <Field label="Status">
                <select className={styles.select} value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </Field>
              <Field label="Health Rating (1–10)">
                <input className={styles.input} type="number" min="1" max="10" value={form.health_rating}
                  onChange={e => set('health_rating', e.target.value)} />
              </Field>
            </Row2>
            <Field label="AI Insights / Notes for Users">
              <textarea className={styles.textarea} rows={3} value={form.ai_insights}
                onChange={e => set('ai_insights', e.target.value)} />
            </Field>
            <Field label="Admin Notes (internal)">
              <textarea className={styles.textarea} rows={2} value={form.admin_notes}
                onChange={e => set('admin_notes', e.target.value)} />
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
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

function Row2({ children }: { children: React.ReactNode }) {
  return <div className={styles.row2}>{children}</div>
}

function TagInput({ label, value, onChange, onAdd, tags, onRemove }: {
  label: string; value: string; onChange: (v: string) => void
  onAdd: () => void; tags: string[]; onRemove: (t: string) => void
}) {
  return (
    <div className={styles.tagInput}>
      <div className={styles.tagRow}>
        <input className={styles.input} placeholder={label}
          value={value} onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onAdd()} />
        <button className={styles.addBtn} onClick={onAdd} type="button">Add</button>
      </div>
      {tags.length > 0 && (
        <div className={styles.tagList}>
          {tags.map(t => (
            <span key={t} className={styles.tag}>
              {t} <button onClick={() => onRemove(t)}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
