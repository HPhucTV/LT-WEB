import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { bookingApi, tourApi } from '../api'
import { useAuth } from '../contexts/AuthContext'
import travexLogo from '../assets/travex-logo.svg'

const SALES_NAV = [
  { key: 'contracts', label: 'Hợp đồng đoàn', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 14H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V7h10v2z' },
  { key: 'settings', label: 'Cài đặt', icon: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58z' },
]

function NavIcon({ d }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d={d} /></svg>
}

export default function SalesLayout() {
  const { user, logout } = useAuth()
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

  const segment = location.pathname.split('/sales/')[1]?.split('/')[0] || 'contracts'
  const title = segment === 'settings' ? 'Cài đặt' : 'Hợp đồng tour đoàn'

  return (
    <main className="staff-shell">
      <aside className="staff-sidebar">
        <div className="staff-brand">
          <div className="staff-brand-icon">
            <img src={travexLogo} alt="TraveX" />
          </div>
          <div className="staff-brand-text">
            <strong>TraveX</strong>
            <small>SALES</small>
          </div>
        </div>

        <nav className="staff-nav" aria-label="Điều hướng Sales">
          {SALES_NAV.map(item => (
            <NavLink key={item.key} to={`/sales/${item.key}`} className={({ isActive }) => `staff-nav-item ${isActive ? 'active' : ''}`}>
              <span className="staff-nav-icon"><NavIcon d={item.icon} /></span>
              <span className="staff-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="staff-sidebar-footer">
          <div className="staff-user-avatar">{(user?.fullName || 'S').charAt(0)}</div>
          <div className="staff-user-info">
            <span>{user?.fullName || user?.username}</span>
            <small>Sales</small>
          </div>
          <button className="btn-staff-logout" onClick={logout} title="Đăng xuất">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
          </button>
        </div>
      </aside>

      <section className="staff-content">
        <header className="staff-topbar">
          <div className="staff-search">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
            <input placeholder="Tìm hợp đồng..." />
          </div>
          <div className="staff-topbar-right">
            <div className="staff-topbar-user">
              <div className="staff-topbar-avatar">{(user?.fullName || 'S').charAt(0)}</div>
            </div>
          </div>
        </header>

        <div className="staff-greeting">
          <h1>{title}</h1>
          <p>Tiếp nhận yêu cầu công ty, chốt tổng hợp đồng và chọn hướng dẫn viên rảnh lịch.</p>
        </div>

        <Outlet context={{ tours, bookings, onRefresh: loadData }} />
      </section>
    </main>
  )
}
