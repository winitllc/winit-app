import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProfessionals, updateProfessional, deleteProfessional, Professional } from '../lib/supabase'
import styles from './Professionals.module.css'

type StatusFilter = 'all' | 'pending' | 'approved' | 'blocked'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  blocked: 'Blocked',
}

const STATUS_COLOR: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#16a34a',
  blocked: '#dc2626',
}

export default function Professionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('pending')
  const [actioning, setActioning] = useState<string | null>(null)

  useEffect(() => {
    getProfessionals().then(setProfessionals).finally(() => setLoading(false))
  }, [])

  async function setStatus(pro: Professional, status: 'approved' | 'blocked') {
    setActioning(pro.id)
    try {
      await updateProfessional(pro.id, { status } as Partial<Professional>)
      setProfessionals(prev => prev.map(p => p.id === pro.id ? { ...p, status } : p))
    } catch { /* ignore */ } finally {
      setActioning(null)
    }
  }

  async function handleDelete(pro: Professional) {
    if (!confirm(`Delete ${pro.name}? This will also delete all their meal plans.`)) return
    await deleteProfessional(pro.id)
    setProfessionals(prev => prev.filter(p => p.id !== pro.id))
  }

  const counts = {
    all: professionals.length,
    pending: professionals.filter(p => p.status === 'pending').length,
    approved: professionals.filter(p => p.status === 'approved').length,
    blocked: professionals.filter(p => p.status === 'blocked').length,
  }

  const visible = filter === 'all' ? professionals : professionals.filter(p => p.status === filter)

  if (loading) return <div className={styles.spinner} />

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Professionals</h1>
          <p style={{ color: 'var(--neutral-500)', fontSize: '0.88rem', marginTop: 2 }}>
            Review sign-up requests and manage access.
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className={styles.filterRow}>
        {(['pending', 'approved', 'blocked', 'all'] as StatusFilter[]).map(f => (
          <button
            key={f}
            className={`${styles.filterTab} ${filter === f ? styles.filterTabActive : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : STATUS_LABEL[f]}
            <span className={`${styles.filterCount} ${filter === f ? styles.filterCountActive : ''}`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <p>No {filter === 'all' ? '' : STATUS_LABEL[filter].toLowerCase() + ' '}professionals.</p>
          {filter === 'pending' && <p style={{ fontSize: '0.83rem', color: 'var(--neutral-400)' }}>New sign-ups will appear here for review.</p>}
        </div>
      ) : (
        <div className={styles.list}>
          {visible.map(pro => (
            <div key={pro.id} className={styles.row}>
              <div className={styles.rowLeft}>
                {pro.photo_url ? (
                  <img src={pro.photo_url} alt={pro.name} className={styles.avatar} />
                ) : (
                  <div className={styles.avatarFallback}>
                    {pro.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className={styles.rowInfo}>
                  <div className={styles.rowNameLine}>
                    <span className={styles.proName}>{pro.name}</span>
                    <span
                      className={styles.statusPill}
                      style={{ background: `${STATUS_COLOR[pro.status]}18`, color: STATUS_COLOR[pro.status], borderColor: `${STATUS_COLOR[pro.status]}40` }}
                    >
                      {STATUS_LABEL[pro.status] ?? pro.status}
                    </span>
                  </div>
                  {pro.title && <p className={styles.proRole}>{pro.title}</p>}
                  <div className={styles.rowMeta}>
                    <span className={styles.metaItem}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      {pro.email}
                    </span>
                    <code className={styles.slug}>/pro/{pro.slug}</code>
                    {pro.specialties?.length > 0 && (
                      <span className={styles.metaItem} style={{ color: 'var(--neutral-400)' }}>
                        {pro.specialties.slice(0, 3).join(', ')}{pro.specialties.length > 3 ? ` +${pro.specialties.length - 3}` : ''}
                      </span>
                    )}
                  </div>
                  {pro.bio && <p className={styles.proBio}>{pro.bio}</p>}
                </div>
              </div>

              <div className={styles.rowActions}>
                {pro.status === 'pending' && (
                  <>
                    <button
                      className={`${styles.actionBtn} ${styles.approveBtn}`}
                      onClick={() => setStatus(pro, 'approved')}
                      disabled={actioning === pro.id}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Approve
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.blockBtn}`}
                      onClick={() => setStatus(pro, 'blocked')}
                      disabled={actioning === pro.id}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                      Block
                    </button>
                  </>
                )}
                {pro.status === 'approved' && (
                  <>
                    <Link to={`/pro/${pro.slug}`} className={styles.actionBtn} target="_blank" rel="noopener noreferrer">
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
                    <button
                      className={`${styles.actionBtn} ${styles.blockBtn}`}
                      onClick={() => setStatus(pro, 'blocked')}
                      disabled={actioning === pro.id}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                      Block
                    </button>
                  </>
                )}
                {pro.status === 'blocked' && (
                  <button
                    className={`${styles.actionBtn} ${styles.approveBtn}`}
                    onClick={() => setStatus(pro, 'approved')}
                    disabled={actioning === pro.id}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Restore
                  </button>
                )}
                <button
                  className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                  onClick={() => handleDelete(pro)}
                  disabled={actioning === pro.id}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
