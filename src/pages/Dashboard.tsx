import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProductStats } from '../lib/supabase'
import styles from './Dashboard.module.css'

interface Stats { pending: number; approved: number; rejected: number; total: number }

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProductStats().then(setStats).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className={styles.title}>Dashboard</h1>

      {loading ? (
        <div className={styles.spinner} />
      ) : (
        <div className={styles.grid}>
          <StatCard label="Pending Review" value={stats.pending} color="warning" link="/products?status=pending" />
          <StatCard label="Approved" value={stats.approved} color="success" link="/products?status=approved" />
          <StatCard label="Rejected" value={stats.rejected} color="danger" link="/products?status=rejected" />
          <StatCard label="Total Products" value={stats.total} color="primary" link="/products" />
        </div>
      )}

      <div className={styles.actions}>
        <h2 className={styles.subtitle}>Quick Actions</h2>
        <div className={styles.actionRow}>
          <Link to="/products?status=pending" className={`${styles.btn} ${styles.btnPrimary}`}>
            Review Pending Products
          </Link>
          <Link to="/import" className={`${styles.btn} ${styles.btnSecondary}`}>
            Import from OpenFoodFacts
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, link }: { label: string; value: number; color: string; link: string }) {
  return (
    <Link to={link} className={`${styles.card} ${styles[color]}`}>
      <div className={styles.cardValue}>{value.toLocaleString()}</div>
      <div className={styles.cardLabel}>{label}</div>
    </Link>
  )
}
