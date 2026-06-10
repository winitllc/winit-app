import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getProfessionals, getReferralStats, getMealPlans, Professional, MealPlan } from '../lib/supabase'
import styles from './ReferralDashboard.module.css'

interface Stats { invited: number; downloaded: number; active: number; total_clicks: number }

export default function ReferralDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedProId = searchParams.get('pro') ?? ''

  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [plans, setPlans] = useState<MealPlan[]>([])
  const [stats, setStats] = useState<Stats>({ invited: 0, downloaded: 0, active: 0, total_clicks: 0 })
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    getProfessionals().then(pros => {
      setProfessionals(pros)
      if (!selectedProId && pros.length > 0) {
        setSearchParams({ pro: pros[0].id }, { replace: true })
      }
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedProId) return
    setStatsLoading(true)
    Promise.all([
      getReferralStats(selectedProId),
      getMealPlans(selectedProId),
    ]).then(([s, mp]) => {
      setStats(s)
      setPlans(mp)
    }).finally(() => setStatsLoading(false))
  }, [selectedProId])

  const currentPro = professionals.find(p => p.id === selectedProId)
  const conversionRate = stats.invited > 0 ? Math.round((stats.active / stats.invited) * 100) : 0

  if (loading) return <div className={styles.spinner} />

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Referral Dashboard</h1>
          <p className={styles.subtitle}>Track client invites, downloads, and activations</p>
        </div>
      </div>

      {professionals.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <p>No professionals yet.</p>
          <Link to="/professionals" className={styles.btnPrimary}>Add a Professional</Link>
        </div>
      ) : (
        <>
          <div className={styles.proTabs}>
            {professionals.map(pro => (
              <button
                key={pro.id}
                className={`${styles.proTab} ${selectedProId === pro.id ? styles.proTabActive : ''}`}
                onClick={() => setSearchParams({ pro: pro.id })}
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

          {statsLoading ? (
            <div className={styles.spinner} />
          ) : (
            <>
              {/* Stats grid */}
              <div className={styles.statsGrid}>
                <StatCard
                  icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>}
                  label="Total Invited"
                  value={stats.invited}
                  color="primary"
                  description="Clients who opened an invite link"
                />
                <StatCard
                  icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
                  label="App Downloads"
                  value={stats.downloaded}
                  color="success"
                  description="Clients who downloaded the app"
                />
                <StatCard
                  icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
                  label="Active Users"
                  value={stats.active}
                  color="teal"
                  description="Clients actively using the app"
                />
                <StatCard
                  icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  label="Link Clicks"
                  value={stats.total_clicks}
                  color="orange"
                  description="Total invite link opens"
                />
              </div>

              {/* Conversion funnel */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Conversion Funnel</h2>
                <div className={styles.funnel}>
                  <FunnelStep label="Invited" value={stats.invited} max={Math.max(stats.total_clicks, 1)} color="#2563eb" icon="👋" />
                  <FunnelArrow />
                  <FunnelStep label="Downloaded" value={stats.downloaded} max={Math.max(stats.invited, 1)} color="#16a34a" icon="📱" />
                  <FunnelArrow />
                  <FunnelStep label="Active" value={stats.active} max={Math.max(stats.downloaded, 1)} color="#0891b2" icon="✅" />
                </div>
                {stats.invited > 0 && (
                  <p className={styles.conversionNote}>
                    Overall conversion rate: <strong>{conversionRate}%</strong> ({stats.active} of {stats.invited} invited clients are active)
                  </p>
                )}
              </div>

              {/* Meal plans with share links */}
              {plans.length > 0 && currentPro && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Share Meal Plans</h2>
                  <p className={styles.sectionDesc}>
                    Share these links to invite clients. Each click is tracked automatically.
                  </p>
                  <div className={styles.planLinks}>
                    {plans.map(plan => (
                      <div key={plan.id} className={styles.planLinkRow}>
                        <div className={styles.planLinkIcon}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>
                        </div>
                        <div className={styles.planLinkInfo}>
                          <span className={styles.planLinkName}>{plan.name}</span>
                          <code className={styles.planLinkUrl}>/plan/{plan.share_token}</code>
                        </div>
                        <div className={styles.planLinkActions}>
                          <Link to={`/plan/${plan.share_token}`} target="_blank" className={styles.planLinkBtn}>
                            Preview
                          </Link>
                          <CopyBtn text={`${window.location.origin}/plan/${plan.share_token}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Profile link */}
              {currentPro && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Profile Link</h2>
                  <div className={styles.profileLinkRow}>
                    <div className={styles.profileLinkInfo}>
                      <span className={styles.planLinkName}>{currentPro.name}'s Public Profile</span>
                      <code className={styles.planLinkUrl}>/pro/{currentPro.slug}</code>
                    </div>
                    <div className={styles.planLinkActions}>
                      <Link to={`/pro/${currentPro.slug}`} target="_blank" className={styles.planLinkBtn}>View</Link>
                      <CopyBtn text={`${window.location.origin}/pro/${currentPro.slug}`} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color, description }: {
  icon: React.ReactNode; label: string; value: number; color: string; description: string
}) {
  return (
    <div className={`${styles.statCard} ${styles[`statCard_${color}`]}`}>
      <div className={styles.statCardIcon}>{icon}</div>
      <div className={styles.statCardValue}>{value.toLocaleString()}</div>
      <div className={styles.statCardLabel}>{label}</div>
      <div className={styles.statCardDesc}>{description}</div>
    </div>
  )
}

function FunnelStep({ label, value, max, color, icon }: {
  label: string; value: number; max: number; color: string; icon: string
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className={styles.funnelStep}>
      <div className={styles.funnelIcon}>{icon}</div>
      <div className={styles.funnelBarWrap}>
        <div className={styles.funnelBar} style={{ width: `${Math.max(pct, 4)}%`, background: color }} />
      </div>
      <div className={styles.funnelValue} style={{ color }}>{value.toLocaleString()}</div>
      <div className={styles.funnelLabel}>{label}</div>
    </div>
  )
}

function FunnelArrow() {
  return (
    <div className={styles.funnelArrow}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  )
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button className={`${styles.planLinkBtn} ${copied ? styles.planLinkBtnCopied : ''}`} onClick={copy}>
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy Link
        </>
      )}
    </button>
  )
}
