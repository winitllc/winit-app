import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import ProductEdit from './pages/ProductEdit'
import Import from './pages/Import'
import styles from './App.module.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
            <span className={styles.brandIcon}>🥦</span>
            <span className={styles.brandName}>WII Admin</span>
          </div>
          <nav className={styles.nav}>
            <NavLink to="/dashboard" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              Dashboard
            </NavLink>
            <NavLink to="/products" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              Products
            </NavLink>
            <NavLink to="/import" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Import
            </NavLink>
          </nav>
        </aside>
        <main className={styles.content}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id/edit" element={<ProductEdit />} />
            <Route path="/import" element={<Import />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
