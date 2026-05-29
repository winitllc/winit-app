import { useEffect, useState, useCallback } from 'react'
import {
  getTaxonomyParents, getTaxonomySubcategories, getTaxonomyMappings,
  createTaxonomyParent, updateTaxonomyParent, deleteTaxonomyParent,
  createTaxonomySubcategory, updateTaxonomySubcategory, deleteTaxonomySubcategory,
  createTaxonomyMapping, deleteTaxonomyMapping,
  bulkReclassifyProducts,
  type TaxonomyParent, type TaxonomySubcategory, type TaxonomyOffMapping,
} from '../lib/supabase'
import styles from './Catalog.module.css'

type Tab = 'parents' | 'subcategories' | 'mappings'

export default function Catalog() {
  const [tab, setTab] = useState<Tab>('parents')
  const [parents, setParents] = useState<TaxonomyParent[]>([])
  const [subcategories, setSubcategories] = useState<TaxonomySubcategory[]>([])
  const [mappings, setMappings] = useState<TaxonomyOffMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [reclassifying, setReclassifying] = useState(false)
  const [reclassifyResult, setReclassifyResult] = useState<string | null>(null)
  const [filterParentId, setFilterParentId] = useState<string>('')
  const [search, setSearch] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const [p, s, m] = await Promise.all([
        getTaxonomyParents(),
        getTaxonomySubcategories(),
        getTaxonomyMappings(),
      ])
      setParents(p)
      setSubcategories(s)
      setMappings(m)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  const handleBulkReclassify = async () => {
    setReclassifying(true)
    setReclassifyResult(null)
    try {
      const count = await bulkReclassifyProducts()
      setReclassifyResult(`Done — reclassified ${count} products.`)
    } catch (e) {
      setReclassifyResult('Error: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setReclassifying(false)
    }
  }

  const filteredSubcategories = subcategories.filter(s =>
    (!filterParentId || s.parent_id === filterParentId) &&
    (!search || s.display_name.toLowerCase().includes(search.toLowerCase()))
  )

  const filteredMappings = mappings.filter(m =>
    (!filterParentId || m.parent_id === filterParentId) &&
    (!search || m.off_pattern.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Taxonomy</h1>
          <p className={styles.pageDesc}>
            Manage the two-level product hierarchy and OFF auto-mapping rules.
            <br />
            <span className={styles.descHint}>Parent → Subcategory → Products. Attributes (allergens, diets) are tags on each product.</span>
          </p>
        </div>
        <button className={styles.reclassifyBtn} onClick={handleBulkReclassify} disabled={reclassifying}>
          {reclassifying ? 'Reclassifying…' : 'Bulk Reclassify All Products'}
        </button>
      </div>

      {reclassifyResult && (
        <div className={reclassifyResult.startsWith('Error') ? styles.errorBanner : styles.successBanner}>
          {reclassifyResult}
        </div>
      )}

      <div className={styles.tabBar}>
        {(['parents', 'subcategories', 'mappings'] as Tab[]).map(t => (
          <button key={t} className={styles.tab + (tab === t ? ' ' + styles.tabActive : '')} onClick={() => setTab(t)}>
            {t === 'parents'       ? `Parent Categories (${parents.length})` :
             t === 'subcategories' ? `Subcategories (${subcategories.length})` :
                                     `OFF Mappings (${mappings.length})`}
          </button>
        ))}
      </div>

      {(tab === 'subcategories' || tab === 'mappings') && (
        <div className={styles.toolbar}>
          <select className={styles.filterSelect} value={filterParentId} onChange={e => { setFilterParentId(e.target.value); setSearch('') }}>
            <option value="">All parent categories</option>
            {parents.map(p => <option key={p.id} value={p.id}>{p.icon} {p.display_name}</option>)}
          </select>
          <input className={styles.searchInput} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      )}

      {loading ? (
        <div className={styles.spinnerWrap}><div className={styles.spinner} /></div>
      ) : (
        <>
          {tab === 'parents'       && <ParentsTab parents={parents} onReload={reload} />}
          {tab === 'subcategories' && <SubcategoriesTab subcategories={filteredSubcategories} parents={parents} onReload={reload} />}
          {tab === 'mappings'      && <MappingsTab mappings={filteredMappings} parents={parents} subcategories={subcategories} onReload={reload} />}
        </>
      )}
    </div>
  )
}

// ── Parents tab ───────────────────────────────────────────────────────────────

function ParentsTab({ parents, onReload }: { parents: TaxonomyParent[]; onReload(): void }) {
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ slug: '', display_name: '', icon: '', description: '', sort_order: '0' })
  const [adding, setAdding] = useState(false)
  const [newForm, setNewForm] = useState({ slug: '', display_name: '', icon: '', description: '', sort_order: '' })

  const startEdit = (p: TaxonomyParent) => {
    setEditing(p.id)
    setForm({ slug: p.slug, display_name: p.display_name, icon: p.icon, description: p.description, sort_order: String(p.sort_order) })
  }

  const save = async (id: string) => {
    await updateTaxonomyParent(id, { slug: form.slug, display_name: form.display_name, icon: form.icon, description: form.description, sort_order: parseInt(form.sort_order) || 0 })
    setEditing(null)
    onReload()
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this parent category and all its subcategories?')) return
    await deleteTaxonomyParent(id)
    onReload()
  }

  const create = async () => {
    if (!newForm.slug || !newForm.display_name) return
    await createTaxonomyParent({ slug: newForm.slug, display_name: newForm.display_name, icon: newForm.icon, description: newForm.description, sort_order: parseInt(newForm.sort_order) || 0 })
    setAdding(false)
    setNewForm({ slug: '', display_name: '', icon: '', description: '', sort_order: '' })
    onReload()
  }

  const f = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }))
  const nf = (k: keyof typeof newForm, v: string) => setNewForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead><tr><th style={{width:60}}>Order</th><th style={{width:48}}>Icon</th><th>Slug</th><th>Display Name</th><th>Description</th><th style={{width:140}}></th></tr></thead>
        <tbody>
          {parents.map(p => editing === p.id ? (
            <tr key={p.id} className={styles.editingRow}>
              <td><input className={styles.cellInput} value={form.sort_order} onChange={e => f('sort_order', e.target.value)} /></td>
              <td><input className={styles.cellInput} value={form.icon} onChange={e => f('icon', e.target.value)} placeholder="🍿" /></td>
              <td><input className={styles.cellInput} value={form.slug} onChange={e => f('slug', e.target.value)} /></td>
              <td><input className={styles.cellInput} value={form.display_name} onChange={e => f('display_name', e.target.value)} /></td>
              <td><input className={styles.cellInput} value={form.description} onChange={e => f('description', e.target.value)} /></td>
              <td className={styles.actions}>
                <button className={styles.saveBtn} onClick={() => save(p.id)}>Save</button>
                <button className={styles.cancelBtn} onClick={() => setEditing(null)}>Cancel</button>
              </td>
            </tr>
          ) : (
            <tr key={p.id}>
              <td className={styles.orderCell}>{p.sort_order}</td>
              <td className={styles.iconCell}>{p.icon}</td>
              <td><code className={styles.slug}>{p.slug}</code></td>
              <td className={styles.nameCell}><strong>{p.display_name}</strong></td>
              <td className={styles.descCell}>{p.description}</td>
              <td className={styles.actions}>
                <button className={styles.editBtn} onClick={() => startEdit(p)}>Edit</button>
                <button className={styles.deleteBtn} onClick={() => remove(p.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {adding && (
            <tr className={styles.addRow}>
              <td><input className={styles.cellInput} placeholder="0" value={newForm.sort_order} onChange={e => nf('sort_order', e.target.value)} /></td>
              <td><input className={styles.cellInput} placeholder="🍿" value={newForm.icon} onChange={e => nf('icon', e.target.value)} /></td>
              <td><input className={styles.cellInput} placeholder="slug" value={newForm.slug} onChange={e => nf('slug', e.target.value)} /></td>
              <td><input className={styles.cellInput} placeholder="Display Name" value={newForm.display_name} onChange={e => nf('display_name', e.target.value)} /></td>
              <td><input className={styles.cellInput} placeholder="Description" value={newForm.description} onChange={e => nf('description', e.target.value)} /></td>
              <td className={styles.actions}>
                <button className={styles.saveBtn} onClick={create}>Add</button>
                <button className={styles.cancelBtn} onClick={() => setAdding(false)}>Cancel</button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {!adding && <button className={styles.addRowBtn} onClick={() => setAdding(true)}>+ Add Parent Category</button>}
    </div>
  )
}

// ── Subcategories tab ─────────────────────────────────────────────────────────

function SubcategoriesTab({ subcategories, parents, onReload }: { subcategories: TaxonomySubcategory[]; parents: TaxonomyParent[]; onReload(): void }) {
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ parent_id: '', slug: '', display_name: '', sort_order: '0', off_tags: '' })
  const [adding, setAdding] = useState(false)
  const [newForm, setNewForm] = useState({ parent_id: '', slug: '', display_name: '', sort_order: '', off_tags: '' })

  const parentLabel = (id: string) => { const p = parents.find(p => p.id === id); return p ? `${p.icon} ${p.display_name}` : '' }

  const startEdit = (s: TaxonomySubcategory) => {
    setEditing(s.id)
    setForm({ parent_id: s.parent_id, slug: s.slug, display_name: s.display_name, sort_order: String(s.sort_order), off_tags: (s.off_tags ?? []).join(', ') })
  }

  const save = async (id: string) => {
    await updateTaxonomySubcategory(id, { parent_id: form.parent_id, slug: form.slug, display_name: form.display_name, sort_order: parseInt(form.sort_order) || 0, off_tags: form.off_tags.split(',').map(t => t.trim()).filter(Boolean) })
    setEditing(null)
    onReload()
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this subcategory?')) return
    await deleteTaxonomySubcategory(id)
    onReload()
  }

  const create = async () => {
    if (!newForm.slug || !newForm.display_name || !newForm.parent_id) return
    await createTaxonomySubcategory({ parent_id: newForm.parent_id, slug: newForm.slug, display_name: newForm.display_name, sort_order: parseInt(newForm.sort_order) || 0, off_tags: newForm.off_tags.split(',').map(t => t.trim()).filter(Boolean) })
    setAdding(false)
    setNewForm({ parent_id: '', slug: '', display_name: '', sort_order: '', off_tags: '' })
    onReload()
  }

  const f = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }))
  const nf = (k: keyof typeof newForm, v: string) => setNewForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead><tr><th>Parent</th><th style={{width:60}}>Order</th><th>Slug</th><th>Display Name</th><th>OFF Tags</th><th style={{width:140}}></th></tr></thead>
        <tbody>
          {subcategories.map(s => editing === s.id ? (
            <tr key={s.id} className={styles.editingRow}>
              <td>
                <select className={styles.cellSelect} value={form.parent_id} onChange={e => f('parent_id', e.target.value)}>
                  {parents.map(p => <option key={p.id} value={p.id}>{p.icon} {p.display_name}</option>)}
                </select>
              </td>
              <td><input className={styles.cellInput} value={form.sort_order} onChange={e => f('sort_order', e.target.value)} /></td>
              <td><input className={styles.cellInput} value={form.slug} onChange={e => f('slug', e.target.value)} /></td>
              <td><input className={styles.cellInput} value={form.display_name} onChange={e => f('display_name', e.target.value)} /></td>
              <td><input className={styles.cellInput} value={form.off_tags} onChange={e => f('off_tags', e.target.value)} placeholder="en:chips, en:tortilla-chips" /></td>
              <td className={styles.actions}>
                <button className={styles.saveBtn} onClick={() => save(s.id)}>Save</button>
                <button className={styles.cancelBtn} onClick={() => setEditing(null)}>Cancel</button>
              </td>
            </tr>
          ) : (
            <tr key={s.id}>
              <td><span className={styles.parentPill}>{parentLabel(s.parent_id)}</span></td>
              <td className={styles.orderCell}>{s.sort_order}</td>
              <td><code className={styles.slug}>{s.slug}</code></td>
              <td className={styles.nameCell}>{s.display_name}</td>
              <td className={styles.tagCellWrap}>{(s.off_tags ?? []).map(t => <code key={t} className={styles.offTag}>{t}</code>)}</td>
              <td className={styles.actions}>
                <button className={styles.editBtn} onClick={() => startEdit(s)}>Edit</button>
                <button className={styles.deleteBtn} onClick={() => remove(s.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {adding && (
            <tr className={styles.addRow}>
              <td>
                <select className={styles.cellSelect} value={newForm.parent_id} onChange={e => nf('parent_id', e.target.value)}>
                  <option value="">Select parent…</option>
                  {parents.map(p => <option key={p.id} value={p.id}>{p.icon} {p.display_name}</option>)}
                </select>
              </td>
              <td><input className={styles.cellInput} placeholder="0" value={newForm.sort_order} onChange={e => nf('sort_order', e.target.value)} /></td>
              <td><input className={styles.cellInput} placeholder="slug" value={newForm.slug} onChange={e => nf('slug', e.target.value)} /></td>
              <td><input className={styles.cellInput} placeholder="Display Name" value={newForm.display_name} onChange={e => nf('display_name', e.target.value)} /></td>
              <td><input className={styles.cellInput} placeholder="en:chips, en:tortilla-chips" value={newForm.off_tags} onChange={e => nf('off_tags', e.target.value)} /></td>
              <td className={styles.actions}>
                <button className={styles.saveBtn} onClick={create}>Add</button>
                <button className={styles.cancelBtn} onClick={() => setAdding(false)}>Cancel</button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {!adding && <button className={styles.addRowBtn} onClick={() => setAdding(true)}>+ Add Subcategory</button>}
    </div>
  )
}

// ── Mappings tab ──────────────────────────────────────────────────────────────

function MappingsTab({ mappings, parents, subcategories, onReload }: { mappings: TaxonomyOffMapping[]; parents: TaxonomyParent[]; subcategories: TaxonomySubcategory[]; onReload(): void }) {
  const [adding, setAdding] = useState(false)
  const [newForm, setNewForm] = useState({ off_pattern: '', match_type: 'exact', parent_id: '', subcategory_id: '', priority: '50' })

  const parentLabel = (id: string) => { const p = parents.find(p => p.id === id); return p ? `${p.icon} ${p.display_name}` : id }
  const subcatLabel = (id: string | null) => id ? (subcategories.find(s => s.id === id)?.display_name ?? id) : null
  const subsForParent = (pid: string) => subcategories.filter(s => s.parent_id === pid)

  const remove = async (id: string) => {
    if (!confirm('Delete this mapping rule?')) return
    await deleteTaxonomyMapping(id)
    onReload()
  }

  const create = async () => {
    if (!newForm.off_pattern || !newForm.parent_id) return
    await createTaxonomyMapping({ off_pattern: newForm.off_pattern, match_type: newForm.match_type as 'exact' | 'prefix' | 'contains', parent_id: newForm.parent_id, subcategory_id: newForm.subcategory_id || null, priority: parseInt(newForm.priority) || 50 })
    setAdding(false)
    setNewForm({ off_pattern: '', match_type: 'exact', parent_id: '', subcategory_id: '', priority: '50' })
    onReload()
  }

  const nf = (k: keyof typeof newForm, v: string) => setNewForm(prev => ({ ...prev, [k]: v }))

  const mtColors: Record<string, [string, string]> = { exact: ['#dbeafe','#1e40af'], prefix: ['#fef9c3','#713f12'], contains: ['#fce7f3','#9d174d'] }

  return (
    <div className={styles.tableWrap}>
      <p className={styles.mappingHint}>
        Higher priority rules win. <strong>exact</strong> = full tag match · <strong>prefix</strong> = tag starts with pattern · <strong>contains</strong> = tag includes pattern anywhere.
      </p>
      <table className={styles.table}>
        <thead><tr><th style={{width:80}}>Priority</th><th>OFF Pattern</th><th style={{width:100}}>Match</th><th>Parent</th><th>Subcategory</th><th style={{width:80}}></th></tr></thead>
        <tbody>
          {mappings.sort((a,b) => b.priority - a.priority).map(m => (
            <tr key={m.id}>
              <td className={styles.orderCell}>{m.priority}</td>
              <td><code className={styles.offTag}>{m.off_pattern}</code></td>
              <td><span className={styles.matchBadge} style={{ background: mtColors[m.match_type]?.[0], color: mtColors[m.match_type]?.[1] }}>{m.match_type}</span></td>
              <td className={styles.nameCell}>{parentLabel(m.parent_id)}</td>
              <td className={styles.nameCell}>{subcatLabel(m.subcategory_id) ?? <span className={styles.noneLabel}>— parent only</span>}</td>
              <td className={styles.actions}><button className={styles.deleteBtn} onClick={() => remove(m.id)}>Delete</button></td>
            </tr>
          ))}
          {adding && (
            <tr className={styles.addRow}>
              <td><input className={styles.cellInput} placeholder="50" value={newForm.priority} onChange={e => nf('priority', e.target.value)} /></td>
              <td><input className={styles.cellInput} placeholder="en:chips" value={newForm.off_pattern} onChange={e => nf('off_pattern', e.target.value)} /></td>
              <td>
                <select className={styles.cellSelect} value={newForm.match_type} onChange={e => nf('match_type', e.target.value)}>
                  <option value="exact">exact</option>
                  <option value="prefix">prefix</option>
                  <option value="contains">contains</option>
                </select>
              </td>
              <td>
                <select className={styles.cellSelect} value={newForm.parent_id} onChange={e => nf('parent_id', e.target.value)}>
                  <option value="">Select parent…</option>
                  {parents.map(p => <option key={p.id} value={p.id}>{p.icon} {p.display_name}</option>)}
                </select>
              </td>
              <td>
                <select className={styles.cellSelect} value={newForm.subcategory_id} onChange={e => nf('subcategory_id', e.target.value)} disabled={!newForm.parent_id}>
                  <option value="">— parent only —</option>
                  {subsForParent(newForm.parent_id).map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
                </select>
              </td>
              <td className={styles.actions}>
                <button className={styles.saveBtn} onClick={create}>Add</button>
                <button className={styles.cancelBtn} onClick={() => setAdding(false)}>Cancel</button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {!adding && <button className={styles.addRowBtn} onClick={() => setAdding(true)}>+ Add Mapping Rule</button>}
    </div>
  )
}
