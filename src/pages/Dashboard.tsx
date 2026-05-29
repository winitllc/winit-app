import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProductStats } from '../lib/supabase'
import styles from './Dashboard.module.css'

const SUPABASE_URL = 'https://twosrdqyaxhdfyqgefjm.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3b3NyZHF5YXhoZGZ5cWdlZmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDQzMDksImV4cCI6MjA5NTU4MDMwOX0.qJ8ZQaMobmuL29-A3swShTbF-D7SVf1oUK9LU7vO7RE'

interface Stats { pending: number; approved: number; rejected: number; total: number }

async function getUserTotal(): Promise<number> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/winit_profiles?select=id`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: 'count=exact',
      Range: '0-0',
    },
  })
  return parseInt((res.headers.get('Content-Range') || '').split('/')[1] ?? '0', 10) || 0
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [userTotal, setUserTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getProductStats(), getUserTotal()])
      .then(([s, u]) => { setStats(s); setUserTotal(u) })
      .finally(() => setLoading(false))
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
          <StatCard label="WINIT Users" value={userTotal} color="users" link="/users" />
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
          <Link to="/users" className={`${styles.btn} ${styles.btnSecondary}`}>
            View Users
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
