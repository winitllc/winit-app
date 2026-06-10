import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProfessionalBySlug, getMealPlans, createReferralInvite, Professional, MealPlan } from '../../lib/supabase'
import styles from './ProProfile.module.css'

const SPECIALTY_COLORS: Record<string, string> = {
  'Gluten-Free': '#10b981',
  'Dairy-Free': '#3b82f6',
  'Vegan': '#6b7280',
  'Vegetarian': '#22c55e',
  'Keto': '#f59e0b',
  'Paleo': '#ef4444',
  'Low-FODMAP': '#8b5cf6',
  'Nut-Free': '#f97316',
  'Diabetic-Friendly': '#06b6d4',
  'Heart-Healthy': '#ec4899',
}

export default function ProProfile() {
  const { slug } = useParams<{ slug: string }>()
  const [pro, setPro] = useState<Professional | null>(null)
  const [plans, setPlans] = useState<MealPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copiedPlanId, setCopiedPlanId] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    getProfessionalBySlug(slug)
      .then(async (p) => {
        if (!p) { setNotFound(true); return }
        setPro(p)
        const mp = await getMealPlans(p.id)
        setPlans(mp.filter(m => m.is_public))
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  async function shareProfileLink() {
    if (!pro) return
    try {
      const invite = await createReferralInvite(pro.id)
      const link = `${window.location.origin}/invite/${invite.token}`
      await navigator.clipboard.writeText(link)
      alert('Profile invite link copied to clipboard!')
    } catch {
      alert('Could not copy link.')
    }
  }

  async function shareMealPlan(plan: MealPlan) {
    if (!pro) return
    try {
      const invite = await createReferralInvite(pro.id, plan.id)
      const link = `${window.location.origin}/invite/${invite.token}`
      await navigator.clipboard.writeText(link)
      setCopiedPlanId(plan.id)
      setTimeout(() => setCopiedPlanId(null), 2000)
    } catch {
      alert('Could not copy link.')
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
      </div>
    )
  }

  if (notFound || !pro) {
    return (
      <div className={styles.notFound}>
        <div className={styles.notFoundIcon}>404</div>
        <h2>Professional not found</h2>
        <p>This profile doesn't exist or has been removed.</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerBg} />
          <div className={styles.headerContent}>
            <div className={styles.avatarWrap}>
              {pro.photo_url ? (
                <img src={pro.photo_url} alt={pro.name} className={styles.avatar} />
              ) : (
                <div className={styles.avatarFallback}>
                  {pro.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className={styles.headerInfo}>
              <h1 className={styles.name}>{pro.name}</h1>
              {pro.title && <p className={styles.proTitle}>{pro.title}</p>}
              <div className={styles.badge}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Verified Professional
              </div>
            </div>
            <button className={styles.shareBtn} onClick={shareProfileLink}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Share Profile
            </button>
          </div>
        </header>

        <div className={styles.body}>
          <div className={styles.main}>
            {pro.bio && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>About</h2>
                <p className={styles.bio}>{pro.bio}</p>
              </section>
            )}

            {pro.specialties.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Specialties</h2>
                <div className={styles.specialties}>
                  {pro.specialties.map(s => (
                    <span
                      key={s}
                      className={styles.specialty}
                      style={{ background: `${SPECIALTY_COLORS[s] ?? '#64748b'}18`, color: SPECIALTY_COLORS[s] ?? '#64748b', borderColor: `${SPECIALTY_COLORS[s] ?? '#64748b'}40` }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {plans.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Meal Plans</h2>
                <div className={styles.plans}>
                  {plans.map(plan => (
                    <div key={plan.id} className={styles.planCard}>
                      <div className={styles.planIcon}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
                      </div>
                      <div className={styles.planInfo}>
                        <h3 className={styles.planName}>{plan.name}</h3>
                        {plan.description && <p className={styles.planDesc}>{plan.description}</p>}
                      </div>
                      <div className={styles.planActions}>
                        <Link to={`/plan/${plan.share_token}`} className={styles.planViewBtn}>
                          View Plan
                        </Link>
                        <button
                          className={styles.planShareBtn}
                          onClick={() => shareMealPlan(plan)}
                        >
                          {copiedPlanId === plan.id ? (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                              Copied!
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                              Share
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.contactCard}>
              <h3 className={styles.contactTitle}>Contact</h3>
              {pro.email && (
                <a href={`mailto:${pro.email}`} className={styles.contactItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  {pro.email}
                </a>
              )}
              {pro.website_url && (
                <a href={pro.website_url} target="_blank" rel="noopener noreferrer" className={styles.contactItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  Website
                </a>
              )}
            </div>

            <div className={styles.appCard}>
              <div className={styles.appCardIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <h3 className={styles.appCardTitle}>Try WINIT App</h3>
              <p className={styles.appCardText}>Scan food labels, track your diet, and get personalized recommendations.</p>
              <button className={styles.appCardBtn}>Download App</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
