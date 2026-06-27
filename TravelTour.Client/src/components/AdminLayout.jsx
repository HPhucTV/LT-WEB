import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { bookingApi, tourApi } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { NAV_ICONS, SIDEBAR_MAIN, SIDEBAR_MANAGEMENT } from '../utils/constants'
import travexLogo from '../assets/travex-logo.svg'

const PAGE_TITLE_KEYS = {
  dashboard: 'navDashboard',
  tours: 'tour',
  bookings: 'navBookings',
  schedule: 'navSchedule',
  customers: 'navCustomers',
  reports: 'navReports',
  vnpay: 'navVnpay',
  users: 'navUsers',
  settings: 'settingsTitle',
  promotions: 'campaignTitle',
}

function roleLabel(role, t) {
  switch ((role || '').toLowerCase()) {
    case 'admin': return t('adminRole')
    case 'sales': return t('salesRole')
    case 'staff': return t('staffRole')
    case 'customer': return t('customerRole')
    default: return t('adminRole')
  }
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { t } = useSettings()
  const location = useLocation()
  const [tours, setTours] = useState([])
  const [bookings, setBookings] = useState([])

  const loadData = useCallback(async () => {
    try {
      const [tourData, bookingData] = await Promise.all([tourApi.list(), bookingApi.list()])
      setTours(tourData || [])
      setBookings(bookingData || [])
    } catch {
      setTours([])
      setBookings([])
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const segment = location.pathname.split('/admin/')[1]?.split('/')[0] || 'dashboard'
  const pageTitle = t(PAGE_TITLE_KEYS[segment] || 'navDashboard')
  const navLabel = key => t(PAGE_TITLE_KEYS[key] || key)

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <img src={travexLogo} alt="TraveX" />
          </div>
          <span className="admin-brand-text">TraveX <small>{t('adminRole')}</small></span>
        </div>

        <nav className="admin-nav" aria-label={t('management')}>
          {SIDEBAR_MAIN.map(item => (
            <NavLink key={item.key} to={`/admin/${item.key}`} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{NAV_ICONS[item.icon]}</span>
              <span>{navLabel(item.key)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-nav-section-label">{t('management')}</div>
        <nav className="admin-nav" aria-label={t('management')}>
          {SIDEBAR_MANAGEMENT.map(item => (
            <NavLink key={item.key} to={`/admin/${item.key}`} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{NAV_ICONS[item.icon]}</span>
              <span>{navLabel(item.key)}</span>
            </NavLink>
          ))}
        </nav>

        <NavLink to="/admin/promotions" className="sidebar-promo">
          <div className="promo-img-placeholder">%</div>
          <strong>{t('campaignTitle')}</strong>
          <p>{t('campaignAdminText')}</p>
          <span className="btn-promo">{t('viewDeals')}</span>
        </NavLink>

        <div className="admin-sidebar-footer">
          <div className="sidebar-user-avatar">{(user?.fullName || 'U').charAt(0)}</div>
          <div className="sidebar-user-info">
            <span>{user?.fullName || user?.username}</span>
            <small>{roleLabel(user?.role, t)}</small>
          </div>
          <button className="btn-sidebar-logout" onClick={logout} title={t('logout')}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
          </button>
        </div>
      </aside>

      <section className="admin-content">
        <header className="admin-topbar">
          <h1 className="admin-page-title">{pageTitle}</h1>
          <div className="admin-topbar-actions">
            <div className="admin-topbar-right">
              <div className="admin-user-pill">
                <div className="admin-user-avatar-sm">{(user?.fullName || 'A').charAt(0)}</div>
                <div className="admin-user-meta">
                  <span className="admin-user-name">{user?.fullName || t('adminRole')}</span>
                  <small className="admin-user-role">{roleLabel(user?.role, t)}</small>
                </div>
              </div>
            </div>
          </div>
        </header>
        <Outlet context={{ tours, bookings, onRefresh: loadData }} />
      </section>
    </main>
  )
}
