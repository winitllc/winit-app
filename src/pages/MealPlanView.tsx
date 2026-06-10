import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  getReferralInviteByToken,
  getMealPlanByToken,
  getMealPlanFull,
  getProfessional,
  recordReferralConversion,
  MealPlanFull,
  Professional,
  ReferralInvite,
} from '../lib/supabase'
import styles from './MealPlanView.module.css'

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

export default function MealPlanView() {
  const { token } = useParams<{ token: string }>()
  const [plan, setPlan] = useState<MealPlanFull | null>(null)
  const [pro, setPro] = useState<Professional | null>(null)
  const [invite, setInvite] = useState<ReferralInvite | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [signupVisible, setSignupVisible] = useState(false)

  useEffect(() => {
    if (!token) return
    async function load() {
      try {
        // Try as invite token first
        const inv = await getReferralInviteByToken(token!)
        if (inv) {
          setInvite(inv)
          await recordReferralConversion(inv.id, inv.professional_id, 'invited')

          if (inv.meal_plan_id) {
            const full = await getMealPlanFull(inv.meal_plan_id)
            if (full) {
              setPlan(full)
              const p = await getProfessional(inv.professional_id)
              setPro(p)
            }
          } else {
            const p = await getProfessional(inv.professional_id)
            setPro(p)
          }
          return
        }

        // Try as share_token on meal_plan
        const mp = await getMealPlanByToken(token!)
        if (mp) {
          const full = await getMealPlanFull(mp.id)
          if (full) {
            setPlan(full)
            const p = await getProfessional(mp.professional_id)
            setPro(p)
          }
          return
        }

        setNotFound(true)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
      </div>
    )
  }

  if (notFound || (!plan && !pro)) {
    return (
      <div className={styles.notFound}>
        <div className={styles.notFoundCode}>404</div>
        <h2>Link not found</h2>
        <p>This invite link is invalid or has expired.</p>
      </div>
    )
  }

  // Profile-only invite (no meal plan)
  if (!plan && pro) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.proIntro}>
            {pro.photo_url ? (
              <img src={pro.photo_url} alt={pro.name} className={styles.proAvatar} />
            ) : (
              <div className={styles.proAvatarFallback}>
                {pro.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className={styles.proName}>{pro.name}</h1>
              {pro.title && <p className={styles.proTitle}>{pro.title}</p>}
            </div>
          </div>
          <div className={styles.cta}>
            <h2>You've been invited by {pro.name}</h2>
            <p>Join WINIT to connect with your nutritionist and get personalized food recommendations.</p>
            <Link to={`/pro/${pro.slug}`} className={styles.viewProfileBtn}>View Full Profile</Link>
            <button className={styles.downloadBtn} onClick={() => setSignupVisible(true)}>
              Download WINIT App
            </button>
          </div>
          {signupVisible && <SignupPrompt proName={pro.name} onClose={() => setSignupVisible(false)} />}
        </div>
      </div>
    )
  }

  if (!plan) return null

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.planHeader}>
          {pro && (
            <Link to={`/pro/${pro.slug}`} className={styles.proChip}>
              {pro.photo_url ? (
                <img src={pro.photo_url} alt={pro.name} className={styles.proChipAvatar} />
              ) : (
                <div className={styles.proChipFallback}>
                  {pro.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
              <span>by {pro.name}</span>
              {pro.title && <span className={styles.proChipTitle}>&bull; {pro.title}</span>}
            </Link>
          )}

          <h1 className={styles.planTitle}>{plan.name}</h1>
          {plan.description && <p className={styles.planDesc}>{plan.description}</p>}

          <div className={styles.planStats}>
            <div className={styles.statBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {plan.days.length} Day{plan.days.length !== 1 ? 's' : ''}
            </div>
            <div className={styles.statBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>
              {plan.days.reduce((s, d) => s + d.meals.reduce((ms, m) => ms + m.foods.length, 0), 0)} Items
            </div>
          </div>
        </div>

        {/* Day list */}
        <div className={styles.days}>
          {plan.days.map((day, di) => (
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
                          <span className={styles.foodDot} />
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
                    <p className={styles.lockSub}>Download free to access all {plan.days.length} days and track your progress.</p>
                  </div>
                  <button className={styles.lockBtn} onClick={() => setSignupVisible(true)}>
                    Get App
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sticky CTA */}
        <div className={styles.stickyCta}>
          <div className={styles.stickyCtaInner}>
            <div className={styles.stickyCtaText}>
              <strong>Want personalized guidance?</strong>
              <span>Connect with {pro?.name ?? 'your nutritionist'} on WINIT</span>
            </div>
            <button className={styles.stickyCtaBtn} onClick={() => setSignupVisible(true)}>
              Download App
            </button>
          </div>
        </div>

        {signupVisible && <SignupPrompt proName={pro?.name} onClose={() => setSignupVisible(false)} />}
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
          {proName ? `${proName} invited you to join WINIT.` : 'You\'ve been invited to join WINIT.'} Scan food labels, follow your meal plan, and get personalized dietary recommendations.
        </p>
        <div className={styles.modalBtns}>
          <button className={styles.modalBtnPrimary}>
            Download on App Store
          </button>
          <button className={styles.modalBtnSecondary}>
            Get on Google Play
          </button>
        </div>
        <p className={styles.modalFooter}>Free download. No credit card required.</p>
      </div>
    </div>
  )
}
