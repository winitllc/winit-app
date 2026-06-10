import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProfessionals, createProfessional, updateProfessional, deleteProfessional, Professional } from '../lib/supabase'
import styles from './Professionals.module.css'

const ALL_SPECIALTIES = [
  'Gluten-Free', 'Dairy-Free', 'Vegan', 'Vegetarian', 'Keto', 'Paleo',
  'Low-FODMAP', 'Nut-Free', 'Diabetic-Friendly', 'Heart-Healthy',
]

const EMPTY_FORM: Partial<Professional> = {
  name: '', slug: '', title: '', bio: '', photo_url: '', specialties: [], website_url: '', email: '',
}

export default function Professionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editPro, setEditPro] = useState<Professional | null>(null)
  const [form, setForm] = useState<Partial<Professional>>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getProfessionals().then(setProfessionals).finally(() => setLoading(false))
  }, [])

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditPro(null)
    setError('')
    setModal('create')
  }

  function openEdit(pro: Professional) {
    setForm({ ...pro })
    setEditPro(pro)
    setError('')
    setModal('edit')
  }

  function setField(k: keyof Professional, v: unknown) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  function toggleSpecialty(s: string) {
    const curr = (form.specialties ?? []) as string[]
    setField('specialties', curr.includes(s) ? curr.filter(x => x !== s) : [...curr, s])
  }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function handleSave() {
    if (!form.name?.trim()) { setError('Name is required.'); return }
    if (!form.slug?.trim()) { setError('Profile URL slug is required.'); return }
    setSaving(true)
    setError('')
    try {
      if (modal === 'create') {
        const created = await createProfessional(form)
        setProfessionals(prev => [created, ...prev])
      } else if (editPro) {
        await updateProfessional(editPro.id, form)
        setProfessionals(prev => prev.map(p => p.id === editPro.id ? { ...p, ...form } as Professional : p))
      }
      setModal(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete ${name}? This will also delete all their meal plans.`)) return
    await deleteProfessional(id)
    setProfessionals(prev => prev.filter(p => p.id !== id))
  }

  if (loading) return <div className={styles.spinner} />

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Professionals</h1>
        <button className={styles.btnPrimary} onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Professional
        </button>
      </div>

      {professionals.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <p>No professionals yet.</p>
          <button className={styles.btnPrimary} onClick={openCreate}>Add First Professional</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {professionals.map(pro => (
            <div key={pro.id} className={styles.card}>
              <div className={styles.cardTop}>
                {pro.photo_url ? (
                  <img src={pro.photo_url} alt={pro.name} className={styles.avatar} />
                ) : (
                  <div className={styles.avatarFallback}>
                    {pro.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className={styles.cardInfo}>
                  <h3 className={styles.proName}>{pro.name}</h3>
                  {pro.title && <p className={styles.proRole}>{pro.title}</p>}
                  <code className={styles.slug}>/pro/{pro.slug}</code>
                </div>
              </div>
              {pro.specialties.length > 0 && (
                <div className={styles.specialties}>
                  {pro.specialties.slice(0, 4).map(s => (
                    <span key={s} className={styles.specialtyBadge}>{s}</span>
                  ))}
                  {pro.specialties.length > 4 && (
                    <span className={styles.specialtyBadge}>+{pro.specialties.length - 4}</span>
                  )}
                </div>
              )}
              <div className={styles.cardActions}>
                <Link to={`/pro/${pro.slug}`} className={styles.actionBtn} target="_blank">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  View Profile
                </Link>
                <Link to={`/meal-plans?pro=${pro.id}`} className={styles.actionBtn}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>
                  Meal Plans
                </Link>
                <Link to={`/referrals?pro=${pro.id}`} className={styles.actionBtn}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  Referrals
                </Link>
                <button className={styles.actionBtn} onClick={() => openEdit(pro)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                  onClick={() => handleDelete(pro.id, pro.name)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className={styles.overlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{modal === 'create' ? 'Add Professional' : 'Edit Professional'}</h2>
              <button className={styles.modalClose} onClick={() => setModal(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Full Name *</label>
                  <input
                    className={styles.input}
                    value={form.name ?? ''}
                    onChange={e => {
                      setField('name', e.target.value)
                      if (modal === 'create') setField('slug', autoSlug(e.target.value))
                    }}
                    placeholder="e.g. Sarah Mitchell"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Title / Credentials</label>
                  <input
                    className={styles.input}
                    value={form.title ?? ''}
                    onChange={e => setField('title', e.target.value)}
                    placeholder="e.g. Registered Dietitian, RD"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Profile URL Slug *</label>
                <div className={styles.slugWrap}>
                  <span className={styles.slugPrefix}>/pro/</span>
                  <input
                    className={`${styles.input} ${styles.slugInput}`}
                    value={form.slug ?? ''}
                    onChange={e => setField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="sarah-mitchell"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Bio</label>
                <textarea
                  className={styles.textarea}
                  value={form.bio ?? ''}
                  onChange={e => setField('bio', e.target.value)}
                  placeholder="Professional background, approach, and philosophy..."
                  rows={3}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Email</label>
                  <input
                    className={styles.input}
                    type="email"
                    value={form.email ?? ''}
                    onChange={e => setField('email', e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Website URL</label>
                  <input
                    className={styles.input}
                    value={form.website_url ?? ''}
                    onChange={e => setField('website_url', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Photo URL</label>
                <input
                  className={styles.input}
                  value={form.photo_url ?? ''}
                  onChange={e => setField('photo_url', e.target.value)}
                  placeholder="https://..."
                />
                {form.photo_url && (
                  <img src={form.photo_url} alt="" className={styles.photoPreview} onError={e => (e.currentTarget.style.display = 'none')} />
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Specialties</label>
                <div className={styles.specialtyPicker}>
                  {ALL_SPECIALTIES.map(s => {
                    const active = ((form.specialties ?? []) as string[]).includes(s)
                    return (
                      <button
                        key={s}
                        type="button"
                        className={`${styles.specialtyBtn} ${active ? styles.specialtyBtnActive : ''}`}
                        onClick={() => toggleSpecialty(s)}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>

              {error && <p className={styles.error}>{error}</p>}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setModal(null)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : modal === 'create' ? 'Create Professional' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
