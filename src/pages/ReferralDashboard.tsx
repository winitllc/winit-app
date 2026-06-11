import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getProfessionals, getAllReferralStats, getMealPlans,
  Professional, MealPlan, ProReferralStats,
} from '../lib/supabase'
import styles from './ReferralDashboard.module.css'

type SortKey = 'name' | 'invited' | 'downloaded' | 'active' | 'conversion'

interface ProRow {
  pro: Professional
  stats: ProReferralStats
}

export default function ReferralDashboard() {
  const [rows, setRows] = useState<ProRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedPlans, setExpandedPlans] = useState<MealPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [sort, setSort] = useState<SortKey>('invited')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')

  useEffect(() => {
    Promise.all([getProfessionals(), getAllReferralStats()]).then(([pros, statsMap]) => {
      setRows(pros.map(pro => ({
        pro,
        stats: statsMap[pro.id] ?? { invited: 0, downloaded: 0, active: 0, total_clicks: 0 },
      })))
    }).finally(() => setLoading(false))
  }, [])

  function toggleSort(key: SortKey) {
    if (sort === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSort(key); setSortDir('desc') }
  }

  async function toggleExpand(proId: string) {
    if (expandedId === proId) { setExpandedId(null); return }
    setExpandedId(proId)
    setExpandedPlans([])
    setPlansLoading(true)
    try {
      const plans = await getMealPlans(proId)
      setExpandedPlans(plans)
    } finally {
      setPlansLoading(false)
    }
  }

  const totals = rows.reduce(
    (acc, { stats }) => ({
      invited: acc.invited + stats.invited,
      downloaded: acc.downloaded + stats.downloaded,
      active: acc.active + stats.active,
      total_clicks: acc.total_clicks + stats.total_clicks,
    }),
    { invited: 0, downloaded: 0, active: 0, total_clicks: 0 },
  )

  const sorted = [...rows].sort((a, b) => {
    let va = 0, vb = 0
    if (sort === 'name') {
      const cmp = a.pro.name.localeCompare(b.pro.name)
      return sortDir === 'asc' ? cmp : -cmp
    }
    if (sort === 'invited') { va = a.stats.invited; vb = b.stats.invited }
    else if (sort === 'downloaded') { va = a.stats.downloaded; vb = b.stats.downloaded }
    else if (sort === 'active') { va = a.stats.active; vb = b.stats.active }
    else if (sort === 'conversion') {
      va = a.stats.invited > 0 ? a.stats.active / a.stats.invited : 0
      vb = b.stats.invited > 0 ? b.stats.active / b.stats.invited : 0
    }
    return sortDir === 'desc' ? vb - va : va - vb
  })

  if (loading) return <div className={styles.spinner} />

  const expandedPro = rows.find(r => r.pro.id === expandedId)?.pro ?? null

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Referral Dashboard</h1>
          <p className={styles.subtitle}>App downloads and conversions from all practitioners</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <p>No professionals yet.</p>
          <Link to="/professionals" className={styles.btnPrimary}>Go to Professionals</Link>
        </div>
      ) : (
        <>
          {/* Totals */}
          <div className={styles.totalsRow}>
            <TotalCard label="Total Invites" value={totals.invited} color="primary" />
            <TotalCard label="App Downloads" value={totals.downloaded} color="success" />
            <TotalCard label="Active Users" value={totals.active} color="teal" />
            <TotalCard label="Link Clicks" value={totals.total_clicks} color="orange" />
          </div>

          {/* Table */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>
                    <SortBtn label="Practitioner" col="name" active={sort} dir={sortDir} onClick={toggleSort} />
                  </th>
                  <th className={styles.th}>Status</th>
                  <th className={`${styles.th} ${styles.thNum}`}>
                    <SortBtn label="Invites" col="invited" active={sort} dir={sortDir} onClick={toggleSort} />
                  </th>
                  <th className={`${styles.th} ${styles.thNum}`}>
                    <SortBtn label="Downloads" col="downloaded" active={sort} dir={sortDir} onClick={toggleSort} />
                  </th>
                  <th className={`${styles.th} ${styles.thNum}`}>
                    <SortBtn label="Active" col="active" active={sort} dir={sortDir} onClick={toggleSort} />
                  </th>
                  <th className={`${styles.th} ${styles.thNum}`}>
                    <SortBtn label="Conversion" col="conversion" active={sort} dir={sortDir} onClick={toggleSort} />
                  </th>
                  <th className={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(({ pro, stats }) => {
                  const convRate = stats.invited > 0 ? Math.round((stats.active / stats.invited) * 100) : 0
                  const isExpanded = expandedId === pro.id
                  return (
                    <>
                      <tr key={pro.id} className={`${styles.tr} ${isExpanded ? styles.trExpanded : ''}`}>
                        <td className={styles.td}>
                          <div className={styles.proCell}>
                            {pro.photo_url ? (
                              <img src={pro.photo_url} alt={pro.name} className={styles.avatar} />
                            ) : (
                              <div className={styles.avatarFallback}>
                                {pro.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className={styles.proName}>{pro.name}</div>
                              {pro.title && <div className={styles.proTitle}>{pro.title}</div>}
                            </div>
                          </div>
                        </td>
                        <td className={styles.td}>
                          <span className={`${styles.statusPill} ${styles[`status_${pro.status}`]}`}>
                            {pro.status}
                          </span>
                        </td>
                        <td className={`${styles.td} ${styles.tdNum}`}>{stats.invited.toLocaleString()}</td>
                        <td className={`${styles.td} ${styles.tdNum}`}>{stats.downloaded.toLocaleString()}</td>
                        <td className={`${styles.td} ${styles.tdNum}`}>{stats.active.toLocaleString()}</td>
                        <td className={`${styles.td} ${styles.tdNum}`}>
                          <span className={`${styles.convBadge} ${convRate >= 20 ? styles.convHigh : convRate >= 5 ? styles.convMed : styles.convLow}`}>
                            {convRate}%
                          </span>
                        </td>
                        <td className={styles.td}>
                          <button className={styles.detailBtn} onClick={() => toggleExpand(pro.id)}>
                            {isExpanded ? 'Hide' : 'Details'}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}><polyline points="9 18 15 12 9 6"/></svg>
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr key={`${pro.id}-detail`} className={styles.detailRow}>
                          <td colSpan={7} className={styles.detailCell}>
                            <div className={styles.detailContent}>
                              {/* Funnel for this pro */}
                              <div className={styles.detailFunnel}>
                                <FunnelBar label="Clicks" value={stats.total_clicks} max={Math.max(stats.total_clicks, 1)} color="#6366f1" />
                                <FunnelBar label="Invites" value={stats.invited} max={Math.max(stats.total_clicks, 1)} color="#2563eb" />
                                <FunnelBar label="Downloads" value={stats.downloaded} max={Math.max(stats.invited, 1)} color="#16a34a" />
                                <FunnelBar label="Active" value={stats.active} max={Math.max(stats.downloaded, 1)} color="#0891b2" />
                              </div>

                              <div className={styles.detailLinks}>
                                {/* Profile link */}
                                <div className={styles.linkGroup}>
                                  <p className={styles.linkGroupTitle}>Profile Link</p>
                                  <div className={styles.planLinkRow}>
                                    <div className={styles.planLinkIcon}>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                    </div>
                                    <div className={styles.planLinkInfo}>
                                      <span className={styles.planLinkName}>{pro.name}'s Profile</span>
                                      <code className={styles.planLinkUrl}>/pro/{pro.slug}</code>
                                    </div>
                                    <div className={styles.planLinkActions}>
                                      <Link to={`/pro/${pro.slug}`} target="_blank" className={styles.planLinkBtn}>View</Link>
                                      <CopyBtn text={`${window.location.origin}/pro/${pro.slug}`} />
                                    </div>
                                  </div>
                                </div>

                                {/* Meal plan links */}
                                {plansLoading ? (
                                  <div className={styles.miniSpinner} />
                                ) : expandedPlans.length > 0 ? (
                                  <div className={styles.linkGroup}>
                                    <p className={styles.linkGroupTitle}>Meal Plan Links</p>
                                    {expandedPlans.map(plan => (
                                      <div key={plan.id} className={styles.planLinkRow}>
                                        <div className={styles.planLinkIcon}>
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>
                                        </div>
                                        <div className={styles.planLinkInfo}>
                                          <span className={styles.planLinkName}>{plan.name}</span>
                                          <code className={styles.planLinkUrl}>/pro/{expandedPro?.slug}/meal-plan/{plan.slug}</code>
                                        </div>
                                        <div className={styles.planLinkActions}>
                                          <Link
                                            to={`/pro/${expandedPro?.slug}/meal-plan/${plan.slug}`}
                                            target="_blank"
                                            className={styles.planLinkBtn}
                                          >
                                            Preview
                                          </Link>
                                          <CopyBtn text={`${window.location.origin}/pro/${expandedPro?.slug}/meal-plan/${plan.slug}`} />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function TotalCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`${styles.totalCard} ${styles[`statCard_${color}`]}`}>
      <div className={styles.totalVal}>{value.toLocaleString()}</div>
      <div className={styles.totalLabel}>{label}</div>
    </div>
  )
}

function SortBtn({ label, col, active, dir, onClick }: {
  label: string; col: SortKey; active: SortKey; dir: 'asc' | 'desc'
  onClick: (col: SortKey) => void
}) {
  const isActive = active === col
  return (
    <button className={`${styles.sortBtn} ${isActive ? styles.sortBtnActive : ''}`} onClick={() => onClick(col)}>
      {label}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        style={{ opacity: isActive ? 1 : 0.3, transform: isActive && dir === 'asc' ? 'rotate(180deg)' : 'none' }}>
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>
  )
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className={styles.funnelItem}>
      <div className={styles.funnelItemLabel}>{label}</div>
      <div className={styles.funnelItemBarWrap}>
        <div className={styles.funnelItemBar} style={{ width: `${Math.max(pct, 2)}%`, background: color }} />
      </div>
      <div className={styles.funnelItemVal} style={{ color }}>{value.toLocaleString()}</div>
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
        <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
      ) : (
        <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy</>
      )}
    </button>
  )
}
