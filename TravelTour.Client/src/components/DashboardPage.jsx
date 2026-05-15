import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Line } from 'react-chartjs-2'
import { CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js'
import { reportApi } from '../api'
import { bookingStatusLabel, formatVND } from '../utils/format'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} phút trước`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} giờ trước`
  return `${Math.floor(hrs / 24)} ngày trước`
}

export default function DashboardPage() {
  const { tours, bookings } = useOutletContext()
  const [summary, setSummary] = useState(null)

  useEffect(() => { reportApi.summary().then(setSummary).catch(() => {}) }, [])

  const activeTours = tours.filter(tour => tour.isActive).length
  const pendingBookings = bookings.filter(booking => booking.status === 'Pending').length
  const confirmedBookings = bookings.filter(booking => booking.status !== 'Cancelled')
  const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + booking.totalAmount, 0)
  const momoRevenue = confirmedBookings.filter(booking => booking.paymentStatus === 'Paid').reduce((sum, booking) => sum + booking.totalAmount, 0)
  const recentBookings = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
  const momoPayments = confirmedBookings.filter(booking => booking.paymentStatus === 'Paid' || booking.paymentStatus === 'PaymentCreated').slice(0, 5)

  const revenueByTour = {}
  confirmedBookings.forEach(booking => { revenueByTour[booking.tourName] = (revenueByTour[booking.tourName] || 0) + booking.totalAmount })
  const chartLabels = Object.keys(revenueByTour)
  const chartValues = Object.values(revenueByTour)
  const maxRevenue = Math.max(...chartValues, 1)
  const tourPerf = chartLabels
    .map((name, index) => ({ name, revenue: chartValues[index], pct: Math.round((chartValues[index] / maxRevenue) * 100) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const lineChartData = {
    labels: chartLabels.length > 0 ? chartLabels : ['Chưa có dữ liệu'],
    datasets: [{
      label: 'Doanh thu',
      data: chartValues.length > 0 ? chartValues : [0],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#10b981',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
    }],
  }

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => formatVND(ctx.raw) } },
    },
    scales: {
      y: { ticks: { callback: value => `${(value / 1000000).toFixed(0)}M` }, grid: { color: '#f0f0f0' } },
      x: { grid: { display: false }, ticks: { maxRotation: 45 } },
    },
  }

  return (
    <div className="dash">
      <div className="dash-metrics">
        <MetricCard tone="green" label="Tổng doanh thu" value={formatVND(summary?.totalRevenue ?? totalRevenue)} note="+18.6% so với kỳ trước" />
        <MetricCard tone="blue" label="Tour đang mở" value={summary?.activeTours ?? activeTours} note={`${tours.length - activeTours} tour đã đóng`} />
        <MetricCard tone="orange" label="Đặt tour chờ xử lý" value={pendingBookings} note={`${pendingBookings} yêu cầu cần xem`} />
        <MetricCard tone="purple" label="Thanh toán MoMo" value={formatVND(momoRevenue)} note="+22.4% so với kỳ trước" />
      </div>

      <div className="dash-grid">
        <div className="dash-main">
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>Doanh thu</h3>
            </div>
            <div className="dash-chart-wrap">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card-header">
              <h3>Hiệu quả tour</h3>
              <a className="view-all-link" href="#/admin/reports">Xem tất cả</a>
            </div>
            <div className="perf-bars">
              {tourPerf.map(tour => (
                <div className="perf-bar-row" key={tour.name}>
                  <div className="perf-bar-info">
                    <span className="perf-tour-name">{tour.name}</span>
                    <span className="perf-pct">{tour.pct}%</span>
                  </div>
                  <div className="perf-bar-track">
                    <div className="perf-bar-fill" style={{ width: `${tour.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card-header">
              <h3>Tour</h3>
              <a className="view-all-link" href="#/admin/tours">Xem tất cả tour</a>
            </div>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr><th>Tour</th><th>Danh mục</th><th>Thời gian</th><th>Giá từ</th><th>Lượt đặt</th><th>Trạng thái</th></tr>
                </thead>
                <tbody>
                  {tours.slice(0, 5).map(tour => {
                    const tourBookings = bookings.filter(booking => booking.tourName === tour.name && booking.status !== 'Cancelled').length
                    return (
                      <tr key={tour.id}>
                        <td>
                          <div className="tour-table-cell">
                            {tour.imageUrl ? <img src={tour.imageUrl} alt="" className="tour-thumb" /> : <div className="tour-thumb-placeholder">🏝</div>}
                            <span>{tour.name}</span>
                          </div>
                        </td>
                        <td>{tour.category}</td>
                        <td>{tour.durationDays} ngày</td>
                        <td>{formatVND(tour.price)}</td>
                        <td>{tourBookings}</td>
                        <td><span className={`status-badge ${tour.isActive ? 'active' : 'inactive'}`}>{tour.isActive ? 'Đang mở' : 'Đã đóng'}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="dash-card">
            <h3 style={{ padding: '0 0 12px' }}>Hoạt động gần đây</h3>
            <div className="activity-feed">
              {recentBookings.slice(0, 4).map((booking, index) => (
                <div className="activity-item" key={booking.id}>
                  <div className={`activity-icon ${index % 2 === 0 ? 'act-booking' : 'act-payment'}`}>
                    {index % 2 === 0 ? '📋' : '💳'}
                  </div>
                  <div className="activity-body">
                    <strong>{index % 2 === 0 ? 'Yêu cầu đặt tour mới' : 'Đã nhận thanh toán'}</strong>
                    <span>{booking.tourName}</span>
                  </div>
                  <small className="activity-time">{timeAgo(booking.createdAt)}</small>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dash-side">
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>Đặt tour gần đây</h3>
              <a className="view-all-link" href="#/admin/bookings">Xem tất cả</a>
            </div>
            <div className="recent-list">
              {recentBookings.map(booking => (
                <div className="recent-item" key={booking.id}>
                  <div className="recent-avatar">{booking.customerName.charAt(0)}</div>
                  <div className="recent-info">
                    <strong>{booking.customerName}</strong>
                    <small>{booking.tourName}</small>
                  </div>
                  <div className="recent-right">
                    <span className="recent-amount">{formatVND(booking.totalAmount)}</span>
                    <span className={`mini-badge ${booking.status.toLowerCase()}`}>{bookingStatusLabel(booking.status)}</span>
                    <small className="recent-time">{timeAgo(booking.createdAt)}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dash-card momo-card">
            <div className="dash-card-header">
              <h3>Thanh toán MoMo</h3>
              <a className="view-all-link" href="#/admin/momo">Xem tất cả</a>
            </div>
            <div className="recent-list">
              {(momoPayments.length > 0 ? momoPayments : recentBookings.slice(0, 3)).map(booking => (
                <div className="recent-item" key={`momo-${booking.id}`}>
                  <div className="momo-avatar">
                    <svg viewBox="0 0 24 24" fill="#a50064" width="20" height="20"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
                  </div>
                  <div className="recent-info">
                    <strong>MOMO-{String(booking.id).padStart(3, '0')}</strong>
                    <small>{booking.customerName}</small>
                  </div>
                  <div className="recent-right">
                    <span className="recent-amount">{formatVND(booking.totalAmount)}</span>
                    <span className={`mini-badge ${booking.paymentStatus === 'Paid' ? 'confirmed' : 'pending'}`}>
                      {booking.paymentStatus === 'Paid' ? 'Thành công' : 'Đang chờ'}
                    </span>
                  </div>
                </div>
              ))}
              {confirmedBookings.length > 0 && (
                <div className="momo-total">
                  <span>Tổng doanh thu MoMo</span>
                  <strong>{formatVND(momoRevenue)}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ tone, label, value, note }) {
  return (
    <article className="dash-metric">
      <div className={`metric-icon metric-icon-${tone}`}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>
      </div>
      <div className="metric-body">
        <span className="metric-label">{label}</span>
        <strong className="metric-value">{value}</strong>
        <span className="metric-trend trend-up">{note}</span>
      </div>
    </article>
  )
}
