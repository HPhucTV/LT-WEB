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
            <div className="admin-search-box">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
              <input placeholder={t('adminSearchPlaceholder')} />
            </div>
            <div className="admin-topbar-right">
              <button className="topbar-icon-btn notification-btn" title={t('notificationsTitle')}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
                <span className="notification-badge">5</span>
              </button>
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
