import { useEffect, useState, useRef } from 'react'
import styles from './Catalog.module.css'

const SUPABASE_URL = 'https://twosrdqyaxhdfyqgefjm.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3b3NyZHF5YXhoZGZ5cWdlZmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDQzMDksImV4cCI6MjA5NTU4MDMwOX0.qJ8ZQaMobmuL29-A3swShTbF-D7SVf1oUK9LU7vO7RE'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Category {
  id: string
  label: string
  icon: string
  sort_order: number
}

interface CatalogItem {
  id: string
  category_id: string
  label: string
  keywords: string[]
  description: string
  sort_order: number
}

type TabType = 'allergies' | 'diets' | 'conditions'

interface TabConfig {
  label: string
  catTable: string
  itemTable: string
  itemLabel: string
}

const TABS: Record<TabType, TabConfig> = {
  allergies:  { label: 'Allergies',   catTable: 'winit_allergy_categories',   itemTable: 'winit_allergies',   itemLabel: 'Allergy' },
  diets:      { label: 'Diets',       catTable: 'winit_diet_categories',       itemTable: 'winit_diets',       itemLabel: 'Diet' },
  conditions: { label: 'Conditions',  catTable: 'winit_condition_categories',  itemTable: 'winit_conditions',  itemLabel: 'Condition' },
}

// ── API helpers ───────────────────────────────────────────────────────────────
const H = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: H, ...init })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `HTTP ${res.status}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : ([] as unknown as T)
}

async function loadCatalog(tab: TabType): Promise<{ categories: Category[]; items: CatalogItem[] }> {
  const { catTable, itemTable } = TABS[tab]
  const [categories, items] = await Promise.all([
    apiFetch<Category[]>(`${catTable}?select=*&order=sort_order`),
    apiFetch<CatalogItem[]>(`${itemTable}?select=*&order=sort_order`),
  ])
  return { categories, items }
}

// ── Inline editable keyword tag list ─────────────────────────────────────────
function KeywordTags({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const add = () => {
    const kw = draft.trim().toLowerCase()
    if (kw && !value.includes(kw)) onChange([...value, kw])
    setDraft('')
  }

  const remove = (kw: string) => onChange(value.filter(k => k !== kw))

  return (
    <div className={styles.kwWrap}>
      {value.map(kw => (
        <span key={kw} className={styles.kwTag}>
          {kw}
          <button className={styles.kwRemove} onClick={() => remove(kw)} type="button">✕</button>
        </span>
      ))}
      <input
        ref={inputRef}
        className={styles.kwInput}
        value={draft}
        placeholder="Add keyword…"
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
        onBlur={add}
      />
    </div>
  )
}

// ── Item row (inline edit) ────────────────────────────────────────────────────
function ItemRow({
  item, itemTable, onSave, onDelete,
}: {
  item: CatalogItem
  itemTable: string
  onSave: (updated: CatalogItem) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<CatalogItem>(item)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await apiFetch(`${itemTable}?id=eq.${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          label: draft.label,
          keywords: draft.keywords,
          description: draft.description,
          sort_order: draft.sort_order,
        }),
      })
      onSave({ ...item, ...draft })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const del = async () => {
    if (!confirm(`Delete "${item.label}"?`)) return
    await apiFetch(`${itemTable}?id=eq.${item.id}`, { method: 'DELETE' })
    onDelete(item.id)
  }

  if (!editing) {
    return (
      <div className={styles.itemRow}>
        <div className={styles.itemMain}>
          <span className={styles.itemLabel}>{item.label}</span>
          {item.description && <span className={styles.itemDesc}>{item.description}</span>}
          <div className={styles.kwList}>
            {item.keywords.map(k => <span key={k} className={styles.kwBadge}>{k}</span>)}
            {item.keywords.length === 0 && <span className={styles.kwNone}>No keywords</span>}
          </div>
        </div>
        <div className={styles.itemActions}>
          <button className={styles.editBtn} onClick={() => { setDraft({ ...item }); setEditing(true) }}>Edit</button>
          <button className={styles.deleteBtn} onClick={del}>Delete</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.itemRow} ${styles.itemRowEditing}`}>
      <div className={styles.editForm}>
        <div className={styles.editRow}>
          <label className={styles.editLabel}>Label</label>
          <input
            className={styles.editInput}
            value={draft.label}
            onChange={e => setDraft(d => ({ ...d, label: e.target.value }))}
          />
        </div>
        <div className={styles.editRow}>
          <label className={styles.editLabel}>ID</label>
          <input className={`${styles.editInput} ${styles.editInputDisabled}`} value={draft.id} disabled />
        </div>
        <div className={styles.editRow}>
          <label className={styles.editLabel}>Description</label>
          <input
            className={styles.editInput}
            value={draft.description}
            placeholder="Short description…"
            onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
          />
        </div>
        <div className={styles.editRow}>
          <label className={styles.editLabel}>Keywords</label>
          <KeywordTags value={draft.keywords} onChange={kws => setDraft(d => ({ ...d, keywords: kws }))} />
        </div>
        <div className={styles.editRow}>
          <label className={styles.editLabel}>Order</label>
          <input
            className={styles.editInput}
            style={{ width: 64 }}
            type="number"
            value={draft.sort_order}
            onChange={e => setDraft(d => ({ ...d, sort_order: +e.target.value }))}
          />
        </div>
      </div>
      <div className={styles.editFooter}>
        <button className={styles.cancelBtn} onClick={() => setEditing(false)}>Cancel</button>
        <button className={styles.saveBtn} onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ── Add item form ─────────────────────────────────────────────────────────────
function AddItemForm({
  categoryId, itemTable, itemLabel, onAdded,
}: {
  categoryId: string
  itemTable: string
  itemLabel: string
  onAdded: (item: CatalogItem) => void
}) {
  const blank = (): CatalogItem => ({ id: '', category_id: categoryId, label: '', keywords: [], description: '', sort_order: 0 })
  const [form, setForm] = useState<CatalogItem>(blank)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    if (!form.id.trim() || !form.label.trim()) { setError('ID and Label are required'); return }
    setSaving(true)
    setError('')
    try {
      const rows = await apiFetch<CatalogItem[]>(itemTable, {
        method: 'POST',
        body: JSON.stringify({ ...form, id: form.id.trim().toLowerCase().replace(/\s+/g, '_') }),
      })
      onAdded(rows[0])
      setForm(blank())
      setOpen(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button className={styles.addItemBtn} onClick={() => setOpen(true)}>
        + Add {itemLabel}
      </button>
    )
  }

  return (
    <div className={styles.addForm}>
      <div className={styles.addFormTitle}>New {itemLabel}</div>
      {error && <div className={styles.formError}>{error}</div>}
      <div className={styles.editRow}>
        <label className={styles.editLabel}>ID <span className={styles.hint}>(unique, e.g. "brazil_nuts")</span></label>
        <input className={styles.editInput} value={form.id} placeholder="unique_id"
          onChange={e => setForm(d => ({ ...d, id: e.target.value }))} />
      </div>
      <div className={styles.editRow}>
        <label className={styles.editLabel}>Label</label>
        <input className={styles.editInput} value={form.label} placeholder="Display name"
          onChange={e => setForm(d => ({ ...d, label: e.target.value }))} />
      </div>
      <div className={styles.editRow}>
        <label className={styles.editLabel}>Description</label>
        <input className={styles.editInput} value={form.description} placeholder="Short description"
          onChange={e => setForm(d => ({ ...d, description: e.target.value }))} />
      </div>
      <div className={styles.editRow}>
        <label className={styles.editLabel}>Keywords <span className={styles.hint}>(press Enter or comma to add)</span></label>
        <KeywordTags value={form.keywords} onChange={kws => setForm(d => ({ ...d, keywords: kws }))} />
      </div>
      <div className={styles.editRow}>
        <label className={styles.editLabel}>Sort order</label>
        <input className={styles.editInput} style={{ width: 64 }} type="number" value={form.sort_order}
          onChange={e => setForm(d => ({ ...d, sort_order: +e.target.value }))} />
      </div>
      <div className={styles.editFooter}>
        <button className={styles.cancelBtn} onClick={() => { setOpen(false); setError('') }}>Cancel</button>
        <button className={styles.saveBtn} onClick={save} disabled={saving}>{saving ? 'Saving…' : `Add ${itemLabel}`}</button>
      </div>
    </div>
  )
}

// ── Category card ─────────────────────────────────────────────────────────────
function CategoryCard({
  category, items, catTable, itemTable, itemLabel,
  onCategoryUpdate, onCategoryDelete, onItemsChange,
}: {
  category: Category
  items: CatalogItem[]
  catTable: string
  itemTable: string
  itemLabel: string
  onCategoryUpdate: (c: Category) => void
  onCategoryDelete: (id: string) => void
  onItemsChange: (items: CatalogItem[]) => void
}) {
  const [editingCat, setEditingCat] = useState(false)
  const [catDraft, setCatDraft] = useState<Category>(category)
  const [savingCat, setSavingCat] = useState(false)
  const [expanded, setExpanded] = useState(true)

  const saveCat = async () => {
    setSavingCat(true)
    try {
      await apiFetch(`${catTable}?id=eq.${category.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ label: catDraft.label, icon: catDraft.icon, sort_order: catDraft.sort_order }),
      })
      onCategoryUpdate({ ...category, ...catDraft })
      setEditingCat(false)
    } finally {
      setSavingCat(false)
    }
  }

  const deleteCat = async () => {
    if (!confirm(`Delete category "${category.label}" and ALL its items?`)) return
    await apiFetch(`${catTable}?id=eq.${category.id}`, { method: 'DELETE' })
    onCategoryDelete(category.id)
  }

  const handleItemSave = (updated: CatalogItem) => {
    onItemsChange(items.map(i => i.id === updated.id ? updated : i))
  }

  const handleItemDelete = (id: string) => {
    onItemsChange(items.filter(i => i.id !== id))
  }

  const handleItemAdded = (item: CatalogItem) => {
    onItemsChange([...items, item])
  }

  return (
    <div className={styles.catCard}>
      {/* Category header */}
      <div className={styles.catHeader}>
        <button className={styles.catExpand} onClick={() => setExpanded(e => !e)}>
          {expanded ? '▾' : '▸'}
        </button>
        {editingCat ? (
          <div className={styles.catEditInline}>
            <input className={styles.catIconInput} value={catDraft.icon}
              placeholder="🥛" onChange={e => setCatDraft(d => ({ ...d, icon: e.target.value }))} />
            <input className={styles.catLabelInput} value={catDraft.label}
              onChange={e => setCatDraft(d => ({ ...d, label: e.target.value }))} />
            <input className={`${styles.editInput}`} style={{ width: 56 }} type="number" value={catDraft.sort_order}
              placeholder="Order" onChange={e => setCatDraft(d => ({ ...d, sort_order: +e.target.value }))} />
            <button className={styles.saveBtn} onClick={saveCat} disabled={savingCat}>{savingCat ? '…' : 'Save'}</button>
            <button className={styles.cancelBtn} onClick={() => { setCatDraft(category); setEditingCat(false) }}>Cancel</button>
          </div>
        ) : (
          <>
            <span className={styles.catIcon}>{category.icon}</span>
            <span className={styles.catLabel}>{category.label}</span>
            <span className={styles.catCount}>{items.length} items</span>
            <div className={styles.catActions}>
              <button className={styles.editBtn} onClick={() => { setCatDraft({ ...category }); setEditingCat(true) }}>Edit</button>
              <button className={styles.deleteBtn} onClick={deleteCat}>Delete</button>
            </div>
          </>
        )}
      </div>

      {/* Items list */}
      {expanded && (
        <div className={styles.itemsList}>
          {items.length === 0 && !editingCat && (
            <div className={styles.emptyItems}>No items yet — add one below.</div>
          )}
          {items.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              itemTable={itemTable}
              onSave={handleItemSave}
              onDelete={handleItemDelete}
            />
          ))}
          <AddItemForm
            categoryId={category.id}
            itemTable={itemTable}
            itemLabel={itemLabel}
            onAdded={handleItemAdded}
          />
        </div>
      )}
    </div>
  )
}

// ── Add category form ─────────────────────────────────────────────────────────
function AddCategoryForm({
  catTable, onAdded,
}: {
  catTable: string
  onAdded: (cat: Category) => void
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ id: '', label: '', icon: '', sort_order: 0 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    if (!form.id.trim() || !form.label.trim()) { setError('ID and Label are required'); return }
    setSaving(true)
    setError('')
    try {
      const rows = await apiFetch<Category[]>(catTable, {
        method: 'POST',
        body: JSON.stringify({ ...form, id: form.id.trim().toLowerCase().replace(/\s+/g, '_') }),
      })
      onAdded(rows[0])
      setForm({ id: '', label: '', icon: '', sort_order: 0 })
      setOpen(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button className={styles.addCatBtn} onClick={() => setOpen(true)}>
        + Add Category
      </button>
    )
  }

  return (
    <div className={styles.addForm}>
      <div className={styles.addFormTitle}>New Category</div>
      {error && <div className={styles.formError}>{error}</div>}
      <div className={styles.editRow}>
        <label className={styles.editLabel}>ID <span className={styles.hint}>(unique, e.g. "tree_nuts")</span></label>
        <input className={styles.editInput} value={form.id} placeholder="unique_id"
          onChange={e => setForm(d => ({ ...d, id: e.target.value }))} />
      </div>
      <div className={styles.editRow}>
        <label className={styles.editLabel}>Label</label>
        <input className={styles.editInput} value={form.label} placeholder="Display name"
          onChange={e => setForm(d => ({ ...d, label: e.target.value }))} />
      </div>
      <div className={styles.editRow}>
        <label className={styles.editLabel}>Icon <span className={styles.hint}>(emoji)</span></label>
        <input className={styles.editInput} style={{ width: 72 }} value={form.icon} placeholder="🌿"
          onChange={e => setForm(d => ({ ...d, icon: e.target.value }))} />
      </div>
      <div className={styles.editRow}>
        <label className={styles.editLabel}>Sort order</label>
        <input className={styles.editInput} style={{ width: 64 }} type="number" value={form.sort_order}
          onChange={e => setForm(d => ({ ...d, sort_order: +e.target.value }))} />
      </div>
      <div className={styles.editFooter}>
        <button className={styles.cancelBtn} onClick={() => { setOpen(false); setError('') }}>Cancel</button>
        <button className={styles.saveBtn} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Add Category'}</button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Catalog() {
  const [tab, setTab] = useState<TabType>('allergies')
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    loadCatalog(tab)
      .then(({ categories, items }) => { setCategories(categories); setItems(items) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [tab])

  const itemsForCategory = (catId: string) =>
    items.filter(i => i.category_id === catId &&
      (!search.trim() || i.label.toLowerCase().includes(search.toLowerCase()) ||
        i.keywords.some(k => k.includes(search.toLowerCase()))))

  const visibleCategories = search.trim()
    ? categories.filter(c => itemsForCategory(c.id).length > 0 ||
        c.label.toLowerCase().includes(search.toLowerCase()))
    : categories

  const totalItems = items.length

  const handleCategoryUpdate = (updated: Category) =>
    setCategories(cs => cs.map(c => c.id === updated.id ? updated : c))

  const handleCategoryDelete = (id: string) => {
    setCategories(cs => cs.filter(c => c.id !== id))
    setItems(is => is.filter(i => i.category_id !== id))
  }

  const handleItemsChange = (catId: string, newItems: CatalogItem[]) =>
    setItems(is => [...is.filter(i => i.category_id !== catId), ...newItems])

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Health Catalog</h1>
          <p className={styles.subtitle}>Manage allergen, diet, and condition categories and their ingredient keywords.</p>
        </div>
      </div>

      {/* Tab strip */}
      <div className={styles.tabs}>
        {(Object.entries(TABS) as [TabType, TabConfig][]).map(([key, cfg]) => (
          <button
            key={key}
            className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`}
            onClick={() => { setTab(key); setSearch('') }}
          >
            {cfg.label}
            {tab === key && <span className={styles.tabCount}>{totalItems}</span>}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder={`Search ${TABS[tab].label.toLowerCase()} or keywords…`}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className={styles.searchMeta}>
          {visibleCategories.length} categories · {totalItems} items
        </span>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {loading ? (
        <div className={styles.spinner} />
      ) : (
        <div className={styles.catList}>
          {visibleCategories.map(cat => (
            <CategoryCard
              key={cat.id}
              category={cat}
              items={itemsForCategory(cat.id)}
              catTable={TABS[tab].catTable}
              itemTable={TABS[tab].itemTable}
              itemLabel={TABS[tab].itemLabel}
              onCategoryUpdate={handleCategoryUpdate}
              onCategoryDelete={handleCategoryDelete}
              onItemsChange={newItems => handleItemsChange(cat.id, newItems)}
            />
          ))}

          {visibleCategories.length === 0 && (
            <div className={styles.empty}>No results for "{search}"</div>
          )}

          <AddCategoryForm
            catTable={TABS[tab].catTable}
            onAdded={cat => setCategories(cs => [...cs, cat])}
          />
        </div>
      )}
    </div>
  )
}
