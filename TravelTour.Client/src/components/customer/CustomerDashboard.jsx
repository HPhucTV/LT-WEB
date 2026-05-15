import { useOutletContext, Link } from 'react-router-dom'
import { formatVND, formatDate } from '../../utils/format'

const MOCK_TRIPS = [
  { id: 1, name: 'Đà Nẵng - Hội An 4N3Đ', code: 'TG123456', price: 5980000, guests: 2, date: '2026-05-20', daysLeft: 5, monthLabel: 'Tháng 5' },
  { id: 2, name: 'Phú Quốc - Hòn Thơm 3N2Đ', code: 'TG123457', price: 8750000, guests: 2, date: '2026-06-15', daysLeft: 31, monthLabel: 'Tháng 6' },
  { id: 3, name: 'Hà Nội - Sapa 3N2Đ', code: 'TG123458', price: 4200000, guests: 2, date: '2026-07-05', daysLeft: 51, monthLabel: 'Tháng 7' },
  { id: 4, name: 'Singapore - Malaysia 5N4Đ', code: 'TG123459', price: 12990000, guests: 2, date: '2026-08-18', daysLeft: 95, monthLabel: 'Tháng 8' },
]

export default function CustomerDashboard() {
  const { bookings } = useOutletContext()

  return (
    <div className="cust-dash-grid">
      {/* ─── Main Column ─── */}
      <div className="cust-dash-main">
        {/* Hero Banner */}
        <div className="cust-hero">
          <div className="cust-hero-content">
            <h2>Khám phá thế giới</h2>
            <p>Những hành trình đáng nhớ đang chờ bạn</p>
            <button className="cust-hero-btn">Khám phá ngay →</button>
          </div>
          <div className="cust-hero-dots">
            <span className="dot active"></span><span className="dot"></span><span className="dot"></span><span className="dot"></span>
          </div>
        </div>

        {/* Quick Access Buttons */}
        <div className="cust-quick-access">
          <QuickButton icon="🔍" label="Tìm tour" />
          <QuickButton icon="🏝" label="Tour trong nước" />
          <QuickButton icon="✈" label="Tour nước ngoài" />
          <QuickButton icon="🗂" label="Tour theo chủ đề" />
          <QuickButton icon="🏷" label="Ưu đãi đặc biệt" />
        </div>

        {/* Chuyến đi sắp tới */}
        <div className="cust-card">
          <div className="cust-card-header">
            <h3>Chuyến đi sắp tới</h3>
            <Link to="/customer/bookings" className="cust-view-all">Xem tất cả</Link>
          </div>
          <div className="cust-trips-list">
            {MOCK_TRIPS.map(trip => (
              <div className="cust-trip-item" key={trip.id}>
                <div className="cust-trip-thumb"></div>
                <div className="cust-trip-info">
                  <strong>{trip.name}</strong>
                  <span className="cust-trip-code">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9h-2V7h-2v5H6v-2H4v6h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-6h-2v2h-2v-5h-2v5z" /></svg>
                    Mã đặt chỗ: {trip.code}
                  </span>
                  <span className="cust-trip-price">{formatVND(trip.price)} / {trip.guests} người</span>
                </div>
                <div className="cust-trip-calendar">
                  <span className="cal-day">{trip.date.split('-')[2]}</span>
                  <span className="cal-month">{trip.monthLabel}</span>
                </div>
                <div className="cust-trip-daysleft">Còn {trip.daysLeft} ngày nữa <span className="arrow">›</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* Ưu đãi dành riêng cho bạn */}
        <div className="cust-promo-section">
          <div className="cust-card-header">
            <h3 style={{color: '#3b82f6'}}>Ưu đãi dành riêng cho bạn</h3>
            <div className="cust-promo-countdown">
              <span>Kết thúc sau:</span>
              <div className="timer-block"><strong>02</strong><small>Ngày</small></div>
              <div className="timer-block"><strong>14</strong><small>Giờ</small></div>
              <div className="timer-block"><strong>36</strong><small>Phút</small></div>
              <div className="timer-block"><strong>20</strong><small>Giây</small></div>
            </div>
            <Link to="/customer/tours" className="cust-view-all">Xem tất cả</Link>
          </div>
          <div className="cust-promo-cards">
            <div className="cust-promo-card blue">
              <span>Giảm đến 30%</span>
              <strong>Tour hè rực rỡ</strong>
              <button>Xem ngay →</button>
            </div>
            <div className="cust-promo-card gray">
              <span>Giảm đến 25%</span>
              <strong>Tour nước ngoài</strong>
              <button>Xem ngay →</button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Side Column ─── */}
      <div className="cust-dash-side">
        {/* Tổng quan */}
        <div className="cust-card">
          <div className="cust-card-header">
            <h3>Tổng quan của bạn</h3>
            <Link to="/customer/bookings" className="cust-view-all">Xem chi tiết</Link>
          </div>
          <div className="cust-overview-grid">
            <OverviewStat icon="💼" value="5" label="Tour sắp tới" color="#3b82f6" bg="#eff6ff" />
            <OverviewStat icon="📦" value="12" label="Đơn hàng" color="#10b981" bg="#ecfdf5" />
            <OverviewStat icon="💰" value="18.500.000đ" label="Tổng chi tiêu" color="#f59e0b" bg="#fffbeb" />
            <OverviewStat icon="⭐" value="320" label="Điểm thưởng" color="#8b5cf6" bg="#f5f3ff" />
          </div>
        </div>

        {/* Trạng thái đơn hàng */}
        <div className="cust-card">
          <div className="cust-card-header">
            <h3>Trạng thái đơn hàng</h3>
            <Link to="/customer/bookings" className="cust-view-all">Xem tất cả</Link>
          </div>
          <div className="cust-order-status">
            <StatusRow icon="⏳" label="Chờ xác nhận" count="2" color="#f59e0b" />
            <StatusRow icon="✅" label="Đã xác nhận" count="3" color="#10b981" />
            <StatusRow icon="✈" label="Đang thực hiện" count="1" color="#3b82f6" />
            <StatusRow icon="🛍" label="Đã hoàn thành" count="6" color="#8b5cf6" />
            <StatusRow icon="❌" label="Đã huỷ" count="0" color="#ef4444" />
          </div>
        </div>

        {/* Gợi ý cho bạn */}
        <div className="cust-card">
          <div className="cust-card-header">
            <h3>Gợi ý cho bạn</h3>
            <Link to="/customer/tours" className="cust-view-all">Xem tất cả</Link>
          </div>
          <div className="cust-suggestion-card">
            <div className="sugg-thumb">
              <button className="sugg-fav-btn">♥</button>
            </div>
            <div className="sugg-info">
              <strong>Nha Trang - Đảo Bình Ba 3N2Đ</strong>
              <div className="sugg-rating">⭐ 4.8 <span>(120)</span></div>
              <div className="sugg-price-row">
                <span className="price">3.990.000đ <small>/ người</small></span>
                <span className="old-price">5.200.000đ</span>
                <span className="discount-badge">-23%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickButton({ icon, label }) {
  return (
    <button className="cust-quick-btn">
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
