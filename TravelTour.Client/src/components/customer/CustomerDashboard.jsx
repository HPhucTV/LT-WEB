import { useMemo } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { formatVND } from '../../utils/format'

const QUICK_ACTIONS = [
  { icon: '🔍', label: 'Tìm tour', to: '/customer/tours' },
  { icon: '🏝', label: 'Tour trong nước', to: '/customer/tours?search=Việt Nam' },
  { icon: '✈', label: 'Tour nước ngoài', to: '/customer/tours?search=Singapore' },
  { icon: '🗂', label: 'Tour theo chủ đề', to: '/customer/tours?search=Khám phá' },
  { icon: '🏷', label: 'Ưu đãi đặc biệt', to: '/promotions' },
]

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const { bookings = [], tours = [] } = useOutletContext()

  const today = useMemo(() => startOfDay(new Date()), [])

  const upcomingTrips = useMemo(() => {
    return bookings
      .filter(booking => booking.status !== 'Cancelled' && startOfDay(booking.startDate) >= today)
      .sort((a, b) => startOfDay(a.startDate) - startOfDay(b.startDate))
      .slice(0, 4)
  }, [bookings, today])

  const stats = useMemo(() => {
    const totalSpent = bookings
      .filter(booking => booking.paymentStatus === 'Paid' || booking.status === 'Confirmed')
      .reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0)
    const completed = bookings.filter(booking => booking.status !== 'Cancelled' && startOfDay(booking.startDate) < today).length

    return {
      upcoming: upcomingTrips.length,
      totalOrders: bookings.length,
      totalSpent,
      points: Math.floor(totalSpent / 100000) + completed * 20,
      pending: bookings.filter(booking => booking.status === 'Pending').length,
      confirmed: bookings.filter(booking => booking.status === 'Confirmed' && startOfDay(booking.startDate) >= today).length,
      active: bookings.filter(booking => booking.status !== 'Cancelled' && isTripActive(booking.startDate, today)).length,
      completed,
      cancelled: bookings.filter(booking => booking.status === 'Cancelled').length,
    }
  }, [bookings, today, upcomingTrips.length])

  const suggestedTour = useMemo(() => {
    const activeTours = tours.filter(tour => tour.isActive)
    const discounted = activeTours
      .filter(tour => tour.originalPrice && tour.originalPrice > tour.price)
      .sort((a, b) => discountPercent(b) - discountPercent(a))
    return discounted[0] || activeTours.sort((a, b) => Number(a.price || 0) - Number(b.price || 0))[0] || null
  }, [tours])

  return (
    <div className="cust-dash-grid">
      <div className="cust-dash-main">
        <div className="cust-hero">
          <div className="cust-hero-content">
            <h2>Khám phá thế giới</h2>
            <p>Những hành trình đáng nhớ đang chờ bạn</p>
            <button className="cust-hero-btn" onClick={() => navigate('/customer/tours')}>Khám phá ngay →</button>
          </div>
          <div className="cust-hero-dots">
            <span className="dot active"></span><span className="dot"></span><span className="dot"></span><span className="dot"></span>
          </div>
        </div>

        <div className="cust-quick-access">
          {QUICK_ACTIONS.map(action => (
            <QuickButton key={action.label} icon={action.icon} label={action.label} onClick={() => navigate(action.to)} />
          ))}
        </div>

        <div className="cust-card">
          <div className="cust-card-header">
            <h3>Chuyến đi sắp tới</h3>
            <Link to="/customer/my-tours" className="cust-view-all">Xem tất cả</Link>
          </div>

          {upcomingTrips.length === 0 ? (
            <div className="cust-empty-state">
              <strong>Bạn chưa có chuyến đi sắp tới</strong>
              <span>Chọn một tour yêu thích và lịch khởi hành phù hợp để bắt đầu.</span>
              <button onClick={() => navigate('/customer/tours')}>Tìm tour ngay</button>
            </div>
          ) : (
            <div className="cust-trips-list">
              {upcomingTrips.map(trip => (
                <button className="cust-trip-item" key={trip.id} onClick={() => navigate('/customer/my-tours')}>
                  <div className="cust-trip-thumb">
                    <span>{getInitials(trip.tourName)}</span>
                  </div>
                  <div className="cust-trip-info">
                    <strong>{trip.tourName}</strong>
                    <span className="cust-trip-code">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9h-2V7h-2v5H6v-2H4v6h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-6h-2v2h-2v-5h-2v5z" /></svg>
                      Mã đặt chỗ: TG{String(trip.id).padStart(6, '0')}
                    </span>
                    <span className="cust-trip-price">{formatVND(trip.totalAmount)} / {trip.guestCount} người</span>
                  </div>
                  <div className="cust-trip-calendar">
                    <span className="cal-day">{getDay(trip.startDate)}</span>
                    <span className="cal-month">{getMonthLabel(trip.startDate)}</span>
                  </div>
                  <div className="cust-trip-daysleft">{daysUntil(trip.startDate, today)} <span className="arrow">›</span></div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="cust-promo-section">
          <div className="cust-card-header">
            <h3 style={{ color: '#3b82f6' }}>Ưu đãi dành riêng cho bạn</h3>
            <div className="cust-promo-countdown">
              <span>Kết thúc sau:</span>
              <div className="timer-block"><strong>02</strong><small>Ngày</small></div>
              <div className="timer-block"><strong>14</strong><small>Giờ</small></div>
              <div className="timer-block"><strong>36</strong><small>Phút</small></div>
            </div>
            <Link to="/promotions" className="cust-view-all">Xem tất cả</Link>
          </div>
          <div className="cust-promo-cards">
            <div className="cust-promo-card blue">
              <span>Giảm đến 30%</span>
              <strong>Tour hè rực rỡ</strong>
              <Link to="/promotions">Xem ngay →</Link>
            </div>
            <div className="cust-promo-card gray">
              <span>Ưu tiên khách thân thiết</span>
              <strong>Dùng {stats.points || 0} điểm để đổi ưu đãi</strong>
              <Link to="/customer/tours">Chọn tour →</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="cust-dash-side">
        <div className="cust-card">
          <div className="cust-card-header">
            <h3>Tổng quan của bạn</h3>
            <Link to="/customer/my-tours" className="cust-view-all">Xem chi tiết</Link>
          </div>
          <div className="cust-overview-grid">
            <OverviewStat icon="💼" value={stats.upcoming} label="Tour sắp tới" color="#3b82f6" bg="#eff6ff" />
            <OverviewStat icon="📦" value={stats.totalOrders} label="Đơn hàng" color="#10b981" bg="#ecfdf5" />
            <OverviewStat icon="💰" value={formatVND(stats.totalSpent)} label="Tổng chi tiêu" color="#f59e0b" bg="#fffbeb" />
            <OverviewStat icon="⭐" value={stats.points} label="Điểm thưởng" color="#8b5cf6" bg="#f5f3ff" />
          </div>
        </div>

        <div className="cust-card">
          <div className="cust-card-header">
            <h3>Trạng thái đơn hàng</h3>
            <Link to="/customer/my-tours" className="cust-view-all">Xem tất cả</Link>
          </div>
          <div className="cust-order-status">
            <StatusRow icon="⏳" label="Chờ xác nhận" count={stats.pending} color="#f59e0b" />
            <StatusRow icon="✅" label="Đã xác nhận" count={stats.confirmed} color="#10b981" />
            <StatusRow icon="✈" label="Đang thực hiện" count={stats.active} color="#3b82f6" />
            <StatusRow icon="🛍" label="Đã hoàn thành" count={stats.completed} color="#8b5cf6" />
            <StatusRow icon="❌" label="Đã huỷ" count={stats.cancelled} color="#ef4444" />
          </div>
        </div>

        <div className="cust-card">
          <div className="cust-card-header">
            <h3>Gợi ý cho bạn</h3>
            <Link to="/customer/tours" className="cust-view-all">Xem tất cả</Link>
          </div>
          {suggestedTour ? (
            <button className="cust-suggestion-card" onClick={() => navigate(`/tours/${suggestedTour.id}`)}>
              <div className="sugg-thumb" style={suggestedTour.imageUrl ? { backgroundImage: `url(${suggestedTour.imageUrl})` } : undefined}>
                <span className="sugg-fav-btn">♥</span>
              </div>
              <div className="sugg-info">
                <strong>{suggestedTour.name}</strong>
                <div className="sugg-rating">⭐ {suggestedTour.destination} <span>· {suggestedTour.durationDays} ngày</span></div>
                <div className="sugg-price-row">
                  <span className="price">{formatVND(suggestedTour.price)} <small>/ người</small></span>
                  {suggestedTour.originalPrice > suggestedTour.price && <span className="old-price">{formatVND(suggestedTour.originalPrice)}</span>}
                  {suggestedTour.originalPrice > suggestedTour.price && <span className="discount-badge">-{discountPercent(suggestedTour)}%</span>}
                </div>
              </div>
            </button>
          ) : (
            <div className="cust-empty-state compact">
              <strong>Chưa có tour gợi ý</strong>
              <span>Danh sách tour đang được cập nhật.</span>
              <button onClick={() => navigate('/customer/tours')}>Xem tour</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function QuickButton({ icon, label, onClick }) {
  return (
    <button className="cust-quick-btn" onClick={onClick}>
      <div className="icon">{icon}</div>
      <span>{label}</span>
    </button>
  )
}

function OverviewStat({ icon, value, label, color, bg }) {
  return (
    <div className="cust-overview-stat" style={{ '--bg': bg, '--c': color }}>
      <div className="icon">{icon}</div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function StatusRow({ icon, label, count, color }) {
  return (
    <div className="cust-status-row">
      <div className="icon" style={{ color }}>{icon}</div>
      <span className="label">{label}</span>
      <strong className="count">{count}</strong>
    </div>
  )
}

function startOfDay(value) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function isTripActive(startDate, today) {
  const start = startOfDay(startDate)
  const diffDays = Math.floor((today - start) / 86400000)
  return diffDays >= 0 && diffDays <= 3
}

function daysUntil(startDate, today) {
  const days = Math.ceil((startOfDay(startDate) - today) / 86400000)
  if (days <= 0) return 'Hôm nay'
  return `Còn ${days} ngày nữa`
}

function getDay(date) {
  return String(new Date(date).getDate()).padStart(2, '0')
}

function getMonthLabel(date) {
  return `Tháng ${new Date(date).getMonth() + 1}`
}

function getInitials(value = '') {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('')
}

function discountPercent(tour) {
  if (!tour.originalPrice || tour.originalPrice <= tour.price) return 0
  return Math.round((1 - tour.price / tour.originalPrice) * 100)
}
