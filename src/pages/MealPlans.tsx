import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProfessionals, getMealPlans, deleteMealPlan, Professional, MealPlan } from '../lib/supabase'
import styles from './MealPlans.module.css'

export default function MealPlans() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [plans, setPlans] = useState<Record<string, MealPlan[]>>({})
  const [selectedProId, setSelectedProId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    getProfessionals().then(pros => {
      setProfessionals(pros)
      if (pros.length > 0) setSelectedProId(pros[0].id)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedProId) return
    if (plans[selectedProId]) return
    getMealPlans(selectedProId).then(mp => {
      setPlans(prev => ({ ...prev, [selectedProId]: mp }))
    })
  }, [selectedProId])

  const currentPlans = plans[selectedProId] ?? []
  const currentPro = professionals.find(p => p.id === selectedProId)

  async function handleDelete(planId: string) {
    if (!confirm('Delete this meal plan?')) return
    setDeleting(planId)
    await deleteMealPlan(planId)
    setPlans(prev => ({
      ...prev,
      [selectedProId]: (prev[selectedProId] ?? []).filter(p => p.id !== planId),
    }))
    setDeleting(null)
  }

  if (loading) return <div className={styles.spinner} />

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Meal Plans</h1>
        {selectedProId && (
          <Link to={`/meal-plans/new?pro=${selectedProId}`} className={styles.btnPrimary}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Meal Plan
          </Link>
        )}
      </div>

      {professionals.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          </div>
          <p>No professionals found. Create one in Professionals first.</p>
          <Link to="/professionals" className={styles.btnPrimary}>Go to Professionals</Link>
        </div>
      ) : (
        <>
          <div className={styles.proTabs}>
            {professionals.map(pro => (
              <button
                key={pro.id}
                className={`${styles.proTab} ${selectedProId === pro.id ? styles.proTabActive : ''}`}
                onClick={() => setSelectedProId(pro.id)}
              >
                {pro.photo_url ? (
                  <img src={pro.photo_url} alt={pro.name} className={styles.proTabAvatar} />
                ) : (
                  <div className={styles.proTabAvatarFallback}>
                    {pro.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                )}
                <span>{pro.name}</span>
              </button>
            ))}
          </div>

          {currentPlans.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>
              </div>
              <p>No meal plans for {currentPro?.name} yet.</p>
              <Link to={`/meal-plans/new?pro=${selectedProId}`} className={styles.btnPrimary}>
                Create First Meal Plan
              </Link>
            </div>
          ) : (
            <div className={styles.grid}>
              {currentPlans.map(plan => (
                <div key={plan.id} className={styles.card}>
                  <div className={styles.cardIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.planName}>{plan.name}</h3>
                    {plan.description && <p className={styles.planDesc}>{plan.description}</p>}
                    <div className={styles.planMeta}>
                      <span className={`${styles.badge} ${plan.is_public ? styles.badgePublic : styles.badgeDraft}`}>
                        {plan.is_public ? 'Public' : 'Draft'}
                      </span>
                      <span className={styles.planDate}>
                        {new Date(plan.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className={styles.cardActions}>
                    <Link to={`/plan/${plan.share_token}`} className={styles.actionBtn} target="_blank">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      Preview
                    </Link>
                    <Link to={`/meal-plans/${plan.id}?pro=${selectedProId}`} className={styles.actionBtn}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                    </Link>
                    <button
                      className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                      onClick={() => handleDelete(plan.id)}
                      disabled={deleting === plan.id}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
