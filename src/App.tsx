import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import ProductEdit from './pages/ProductEdit'
import Import from './pages/Import'
import Users from './pages/Users'
import Catalog from './pages/Catalog'
import ReviewQueue from './pages/ReviewQueue'
import Contributions from './pages/Contributions'
import Ingredients from './pages/Ingredients'
import Professionals from './pages/Professionals'
import MealPlans from './pages/MealPlans'
import MealPlanBuilder from './pages/MealPlanBuilder'
import MealPlanView from './pages/MealPlanView'
import ProProfile from './pages/pro/ProProfile'
import ReferralDashboard from './pages/ReferralDashboard'
import styles from './App.module.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — no sidebar */}
        <Route path="/pro/:slug" element={<ProProfile />} />
        <Route path="/plan/:token" element={<MealPlanView />} />
        <Route path="/invite/:token" element={<MealPlanView />} />

        {/* Admin routes — with sidebar */}
        <Route path="*" element={
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
                <NavLink to="/users" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Users
                </NavLink>
                <NavLink to="/catalog" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  Taxonomy
                </NavLink>
                <NavLink to="/review" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.51 0 2.93.37 4.18 1.02"/><path d="M21 3l-4 4-2-2"/></svg>
                  AI Review
                </NavLink>
                <NavLink to="/contributions" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                  Contributions
                </NavLink>
                <NavLink to="/ingredients" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
                  Ingredients
                </NavLink>

                <div className={styles.navDivider} />
                <div className={styles.navSection}>Coaching</div>

                <NavLink to="/professionals" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Professionals
                </NavLink>
                <NavLink to="/meal-plans" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
                  Meal Plans
                </NavLink>
                <NavLink to="/referrals" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  Referrals
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
                <Route path="/users" element={<Users />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/review" element={<ReviewQueue />} />
                <Route path="/contributions" element={<Contributions />} />
                <Route path="/ingredients" element={<Ingredients />} />
                <Route path="/professionals" element={<Professionals />} />
                <Route path="/meal-plans" element={<MealPlans />} />
                <Route path="/meal-plans/new" element={<MealPlanBuilder />} />
                <Route path="/meal-plans/:id" element={<MealPlanBuilder />} />
                <Route path="/referrals" element={<ReferralDashboard />} />
              </Routes>
            </main>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}
