import { useEffect, useState, useRef } from 'react'
import styles from './Users.module.css'

const SUPABASE_URL = 'https://twosrdqyaxhdfyqgefjm.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3b3NyZHF5YXhoZGZ5cWdlZmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDQzMDksImV4cCI6MjA5NTU4MDMwOX0.qJ8ZQaMobmuL29-A3swShTbF-D7SVf1oUK9LU7vO7RE'

const PAGE_SIZE = 25

interface WinitUser {
  id: string
  email: string
  first_name: string
  last_name: string
  display_name: string
  points_balance: number
  points_all_time: number
  scans_all_time: number
  onboarding_completed: boolean
  is_active: boolean
  created_at: string
}

const headers: HeadersInit = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

async function fetchUsers(search: string, page: number): Promise<{ users: WinitUser[]; total: number }> {
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const url = new URL(`${SUPABASE_URL}/rest/v1/winit_profiles`)
  if (search.trim()) {
    url.searchParams.set('or', `(email.ilike.*${search}*,first_name.ilike.*${search}*,last_name.ilike.*${search}*,display_name.ilike.*${search}*)`)
  }
  url.searchParams.set('order', 'created_at.desc')
  url.searchParams.set('select', '*')
  const res = await fetch(url.toString(), {
    headers: { ...headers, Range: `${from}-${to}`, Prefer: 'count=exact' },
  })
  if (!res.ok) throw new Error(`Failed: ${res.status}`)
  const total = parseInt((res.headers.get('Content-Range') || '').split('/')[1] ?? '0', 10) || 0
  const users: WinitUser[] = await res.json()
  return { users, total }
}

async function setActive(id: string, active: boolean) {
  await fetch(`${SUPABASE_URL}/rest/v1/winit_profiles?id=eq.${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ is_active: active }),
  })
}

export default function Users() {
  const [users, setUsers] = useState<WinitUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [toast, setToast] = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()

  const load = async (pg = page, q = search) => {
    setLoading(true)
    try {
      const res = await fetchUsers(q, pg)
      setUsers(res.users)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(0, '') }, []) // eslint-disable-line

  const onSearch = (q: string) => {
    setSearch(q)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(0); load(0, q) }, 350)
  }

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const toggleActive = async (u: WinitUser) => {
    await setActive(u.id, !u.is_active)
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !u.is_active } : x))
    flash(`${u.display_name || u.email} ${!u.is_active ? 'activated' : 'deactivated'}`)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const onPage = (pg: number) => { setPage(pg); load(pg, search) }

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Users</h1>
        <span className={styles.totalBadge}>{total.toLocaleString()} total</span>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by name or email…"
          value={search}
          onChange={e => onSearch(e.target.value)}
        />
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}

      {loading ? (
        <div className={styles.spinner} />
      ) : users.length === 0 ? (
        <div className={styles.empty}>No users found.</div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Status</th>
                  <th>Onboarded</th>
                  <th>Points</th>
                  <th>Scans</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className={styles.row}>
                    <td>
                      <div className={styles.avatar}>
                        {(u.first_name?.[0] ?? u.email[0]).toUpperCase()}
                      </div>
                      <div className={styles.userInfo}>
                        <div className={styles.userName}>
                          {u.display_name || `${u.first_name} ${u.last_name}`.trim() || '—'}
                        </div>
                        <div className={styles.userEmail}>{u.email}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${u.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${u.onboarding_completed ? styles.badgeDone : styles.badgePending}`}>
                        {u.onboarding_completed ? 'Complete' : 'Pending'}
                      </span>
                    </td>
                    <td className={styles.points}>{u.points_balance.toLocaleString()}</td>
                    <td>{u.scans_all_time.toLocaleString()}</td>
                    <td className={styles.date}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className={`${styles.toggleBtn} ${u.is_active ? styles.toggleDeactivate : styles.toggleActivate}`}
                        onClick={() => toggleActive(u)}
                        title={u.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              {total.toLocaleString()} users · page {page + 1} of {totalPages}
            </span>
            <div className={styles.paginationBtns}>
              <button className={styles.pageBtn} disabled={page === 0} onClick={() => onPage(page - 1)}>← Prev</button>
              <button className={styles.pageBtn} disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}>Next →</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
