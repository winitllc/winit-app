import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  getMealPlanByProSlug,
  getMealPlanFull,
  createReferralInvite,
  recordReferralConversion,
  MealPlanPublic,
  MealPlanFull,
} from '../../lib/supabase'
import styles from '../MealPlanView.module.css'
import proStyles from './ProProfile.module.css'

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
}
const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
}

const APP_SCHEME = 'winit://'

function tryOpenApp(slug: string, planSlug: string) {
  const deepLink = `${APP_SCHEME}pro/${slug}/meal-plan/${planSlug}`
  window.location.href = deepLink
}

export default function MealPlanPage() {
  const { slug, planSlug } = useParams<{ slug: string; planSlug: string }>()
  const [planMeta, setPlanMeta] = useState<MealPlanPublic | null>(null)
  const [planFull, setPlanFull] = useState<MealPlanFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [signupVisible, setSignupVisible] = useState(false)
  const [referralToken, setReferralToken] = useState<string | null>(null)

  useEffect(() => {
    if (!slug || !planSlug) return

    // Capture referral token from URL if present
    const urlParams = new URLSearchParams(window.location.search)
    const ref = urlParams.get('ref')
    if (ref) setReferralToken(ref)

    async function load() {
      try {
        const meta = await getMealPlanByProSlug(slug!, planSlug!)
        if (!meta) { setNotFound(true); return }
        setPlanMeta(meta)

        const full = await getMealPlanFull(meta.id)
        if (full) setPlanFull(full)

        // Record referral click if ref token present
        if (ref) {
          try {
            // Look up the invite and record it
            const inviteRes = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL ?? 'https://twosrdqyaxhdfyqgefjm.supabase.co'}/rest/v1/referral_invites?token=eq.${ref}&select=*`,
              { headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3b3NyZHF5YXhoZGZ5cWdlZmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDQzMDksImV4cCI6MjA5NTU4MDMwOX0.qJ8ZQaMobmuL29-A3swShTbF-D7SVf1oUK9LU7vO7RE', Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3b3NyZHF5YXhoZGZ5cWdlZmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDQzMDksImV4cCI6MjA5NTU4MDMwOX0.qJ8ZQaMobmuL29-A3swShTbF-D7SVf1oUK9LU7vO7RE` } }
            )
            if (inviteRes.ok) {
              const invites = await inviteRes.json()
              if (invites?.[0]) {
                await recordReferralConversion(invites[0].id, invites[0].professional_id, 'invited')
              }
            }
          } catch { /* non-critical */ }
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug, planSlug])

  async function shareLink() {
    if (!planMeta) return
    try {
      const invite = await createReferralInvite(planMeta.professional_id, planMeta.id)
      const base = `${window.location.origin}/pro/${slug}/meal-plan/${planSlug}`
      const link = `${base}?ref=${invite.token}`
      await navigator.clipboard.writeText(link)
      alert('Plan link copied!')
    } catch {
      alert('Could not copy link.')
    }
  }

  if (loading) {
    return <div className={styles.loadingWrap}><div className={styles.spinner} /></div>
  }

  if (notFound || !planMeta) {
    return (
      <div className={styles.notFound}>
        <div className={styles.notFoundCode}>404</div>
        <h2>Meal plan not found</h2>
        <p>This plan may have been removed or made private.</p>
        {slug && <Link to={`/pro/${slug}`} style={{ color: 'var(--primary)', marginTop: 16, display: 'inline-block' }}>View professional's profile</Link>}
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Plan header */}
        <div className={styles.planHeader}>
          <Link to={`/pro/${planMeta.professional_slug}`} className={styles.proChip}>
            {planMeta.professional_photo_url ? (
              <img src={planMeta.professional_photo_url} alt={planMeta.professional_name} className={styles.proChipAvatar} />
            ) : (
              <div className={styles.proChipFallback}>
                {planMeta.professional_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <span>by {planMeta.professional_name}</span>
            {planMeta.professional_title && <span className={styles.proChipTitle}>&bull; {planMeta.professional_title}</span>}
          </Link>

          <h1 className={styles.planTitle}>{planMeta.name}</h1>
          {planMeta.description && <p className={styles.planDesc}>{planMeta.description}</p>}

          {planFull && (
            <div className={styles.planStats}>
              <div className={styles.statBadge}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {planFull.days.length} Day{planFull.days.length !== 1 ? 's' : ''}
              </div>
              <div className={styles.statBadge}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>
                {planFull.days.reduce((s, d) => s + d.meals.reduce((ms, m) => ms + m.foods.length, 0), 0)} Items
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button
              className={proStyles.shareBtn}
              onClick={() => tryOpenApp(planMeta.professional_slug, planSlug!)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              Open in App
            </button>
            <button
              className={proStyles.planShareBtn}
              onClick={shareLink}
              style={{ marginBottom: 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Share Plan
            </button>
          </div>
        </div>

        {/* Day list */}
        {planFull && (
          <div className={styles.days}>
            {planFull.days.map((day, di) => (
              <div key={day.id} className={styles.dayCard}>
                <div className={styles.dayLabel}>
                  <span className={styles.dayNum}>{day.day_number}</span>
                  <span className={styles.dayTitle}>{day.label || `Day ${day.day_number}`}</span>
                </div>

                <div className={styles.mealsGrid}>
                  {day.meals.filter(m => m.foods.length > 0).map(meal => (
                    <div key={meal.id} className={styles.mealCard}>
                      <div className={styles.mealHeader}>
                        <span className={styles.mealEmoji}>{MEAL_ICONS[meal.meal_type] ?? '🍽️'}</span>
                        <span className={styles.mealName}>{MEAL_LABELS[meal.meal_type] ?? meal.meal_type}</span>
                      </div>
                      <ul className={styles.foodList}>
                        {meal.foods.map(food => (
                          <li key={food.id} className={styles.foodItem}>
                            <span className={styles.foodName}>{food.name}</span>
                            {food.notes && <span className={styles.foodNotes}>{food.notes}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {day.meals.every(m => m.foods.length === 0) && (
                    <p className={styles.noMeals}>No meals added for this day.</p>
                  )}
                </div>

                {di === 1 && (
                  <div className={styles.lockBanner}>
                    <div className={styles.lockIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <div className={styles.lockContent}>
                      <p className={styles.lockTitle}>See the full plan in the WINIT app</p>
                      <p className={styles.lockSub}>Download free to access all {planFull.days.length} days and track your progress.</p>
                    </div>
                    <button className={styles.lockBtn} onClick={() => setSignupVisible(true)}>Get App</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sticky CTA */}
        <div className={styles.stickyCta}>
          <div className={styles.stickyCtaInner}>
            <div className={styles.stickyCtaText}>
              <strong>Want personalized guidance?</strong>
              <span>Connect with {planMeta.professional_name} on WINIT</span>
            </div>
            <button className={styles.stickyCtaBtn} onClick={() => setSignupVisible(true)}>
              Download App
            </button>
          </div>
        </div>

        {signupVisible && <SignupPrompt proName={planMeta.professional_name} onClose={() => setSignupVisible(false)} />}
      </div>
    </div>
  )
}

function SignupPrompt({ proName, onClose }: { proName?: string; onClose: () => void }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div className={styles.modalIcon}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </div>
        <h2 className={styles.modalTitle}>Join WINIT</h2>
        <p className={styles.modalText}>
          {proName ? `${proName} shared this plan with you.` : 'You\'ve been invited to join WINIT.'} Scan food labels, follow your meal plan, and get personalized dietary recommendations.
        </p>
        <div className={styles.modalBtns}>
          <button className={styles.modalBtnPrimary}>Download on App Store</button>
          <button className={styles.modalBtnSecondary}>Get on Google Play</button>
        </div>
        <p className={styles.modalFooter}>Free download. No credit card required.</p>
      </div>
    </div>
  )
}
