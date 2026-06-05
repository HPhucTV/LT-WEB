import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { bookingApi, tourApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import travexLogo from '../../assets/travex-logo.svg'

const CUSTOMER_NAV = [
  { key: 'dashboard', label: 'Trang chủ', icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
  { key: 'tours', label: 'Tìm tour', icon: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' },
  { key: 'my-tours', label: 'Tour của tôi', icon: 'M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z' },
  { key: 'reviews', label: 'Đánh giá của tôi', icon: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z' },
  { key: 'rewards', label: 'Đổi điểm', icon: 'M20 7h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.15 0-2.16.65-2.66 1.6L12 5.25l-.34-.65C11.16 3.65 10.15 3 9 3 7.34 3 6 4.34 6 6c0 .35.07.69.18 1H4c-1.11 0-2 .89-2 2v2h20V9c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1h-1.69l.65-1.24C14.14 5.43 14.54 5 15 5zM9 5c.46 0 .86.43 1.04.76L10.69 7H9c-.55 0-1-.45-1-1s.45-1 1-1zm-5 8v7c0 1.11.89 2 2 2h5v-9H4zm9 9h5c1.11 0 2-.89 2-2v-7h-7v9z' },
  { key: 'settings', label: 'Cài đặt', icon: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z' },
]

function NavIcon({ d }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d={d} /></svg>
}

export default function CustomerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tours, setTours] = useState([])
  const [bookings, setBookings] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [tourData, bookingData] = await Promise.all([tourApi.list(), bookingApi.list()])
      setTours(tourData || [])
      setBookings((bookingData || []).filter(item => item.customerName === (user?.fullName || user?.username) || !user?.fullName))
    } catch {
      setTours([])
      setBookings([])
    }
  }, [user])

  useEffect(() => {
    let cancelled = false
    Promise.all([tourApi.list(), bookingApi.list()])
      .then(([tourData, bookingData]) => {
        if (cancelled) return
        setTours(tourData || [])
        setBookings((bookingData || []).filter(item => item.customerName === (user?.fullName || user?.username) || !user?.fullName))
      })
      .catch(() => {
        if (cancelled) return
        setTours([])
        setBookings([])
      })
    return () => { cancelled = true }
  }, [user])

  function handleSearch(event) {
    event.preventDefault()
    const query = searchTerm.trim()
    navigate(query ? `/customer/tours?search=${encodeURIComponent(query)}` : '/customer/tours')
  }

  return (
    <main className="cust-shell">
      <aside className="cust-sidebar">
        <div className="cust-brand">
          <div className="cust-brand-icon">
            <img src={travexLogo} alt="TraveX" />
          </div>
          <div className="cust-brand-text">
            <strong>TraveX</strong>
            <small>Khám phá thế giới</small>
          </div>
        </div>

        <nav className="cust-nav" aria-label="Điều hướng khách hàng">
          {CUSTOMER_NAV.map(item => (
            <NavLink key={item.key} to={`/customer/${item.key}`} className={({ isActive }) => `cust-nav-item ${isActive ? 'active' : ''}`}>
              <span className="cust-nav-icon"><NavIcon d={item.icon} /></span>
              <span className="cust-nav-label">{item.label}</span>
              {item.badge && <span className="cust-nav-badge">{item.badge}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="cust-referral-card">
          <div className="cust-referral-content">
            <strong>Đổi điểm thưởng</strong>
            <p>Lấy voucher giảm giá</p>
            <h3>Voucher</h3>
            <button className="cust-referral-btn" onClick={() => navigate('/customer/rewards')}>Đổi ngay →</button>
          </div>
        </div>

        <div className="cust-sidebar-footer">
          <div className="cust-user-avatar">{(user?.fullName || 'C').charAt(0)}</div>
          <div className="cust-user-info">
            <span>{user?.fullName || user?.username}</span>
            <small>Khách hàng</small>
          </div>
          <button className="btn-cust-logout" onClick={() => { logout(); navigate('/') }} title="Đăng xuất">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
          </button>
        </div>
      </aside>

      <section className="cust-content">
        <header className="cust-topbar">
          <div className="cust-greeting">
            <h1>Xin chào, {user?.fullName || user?.username}! 👋</h1>
            <p>Cùng lên kế hoạch cho chuyến đi tiếp theo của bạn</p>
          </div>
          <div className="cust-topbar-actions">
            <form className="cust-search" onSubmit={handleSearch}>
              <input
                placeholder="Tìm kiếm tour, điểm đến..."
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
              />
              <button className="cust-search-btn" type="submit">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
              </button>
            </form>
          </div>
        </header>

        <Outlet context={{ tours, bookings, onRefresh: loadData }} />
      </section>
    </main>
  )
}
