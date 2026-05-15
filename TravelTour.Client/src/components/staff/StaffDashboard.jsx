import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { scheduleApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { bookingStatusLabel, formatDate } from '../../utils/format'

function normalize(value) {
  return (value || '').trim().toLowerCase()
}

function isAssignedToGuide(schedule, user) {
  const guide = normalize(schedule.guideName)
  if (!guide) return false
  return guide === normalize(user?.fullName) || guide === normalize(user?.username)
}

export default function StaffDashboard() {
  const { user } = useAuth()
  const { bookings } = useOutletContext()
  const [schedules, setSchedules] = useState([])

  useEffect(() => {
    async function loadSchedules() {
      try { setSchedules(await scheduleApi.list()) }
      catch { setSchedules([]) }
    }
    loadSchedules()
  }, [])

  const mySchedules = useMemo(
    () => schedules.filter(schedule => isAssignedToGuide(schedule, user)),
    [schedules, user],
  )

  const upcomingSchedules = mySchedules
    .filter(schedule => new Date(schedule.startDate) >= new Date().setHours(0, 0, 0, 0))
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))

  const assignedTourNames = new Set(mySchedules.map(schedule => schedule.tourName))
  const myBookings = bookings.filter(booking => assignedTourNames.has(booking.tourName))
  const pendingGuests = myBookings
    .filter(booking => booking.status !== 'Cancelled')
    .reduce((sum, booking) => sum + (booking.guestCount || 0), 0)

  return (
    <div className="staff-dash">
      <div className="staff-metrics">
        <Metric label="Chuyến được phân công" value={mySchedules.length} />
        <Metric label="Sắp khởi hành" value={upcomingSchedules.length} />
        <Metric label="Khách cần chăm sóc" value={pendingGuests} />
        <Metric label="Lịch đang mở" value={mySchedules.filter(item => item.status === 'Open').length} />
      </div>

      <div className="staff-dash-grid">
        <div className="staff-dash-main">
          <div className="staff-card">
            <div className="staff-card-header">
              <h3>Lịch sắp tới</h3>
            </div>
            {upcomingSchedules.length === 0 ? (
              <p className="empty-msg">Chưa có lịch nào được phân công cho bạn.</p>
            ) : (
              <div className="guide-schedule-list">
                {upcomingSchedules.slice(0, 5).map(schedule => (
                  <article className="guide-schedule-item" key={schedule.id}>
                    <div>
                      <strong>{schedule.tourName}</strong>
                      <span>{formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}</span>
                    </div>
                    <small>{schedule.bookedSeats || 0} khách đã đặt, còn {schedule.availableSeats} chỗ</small>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="staff-dash-side">
          <div className="staff-card">
            <div className="staff-card-header">
              <h3>Đặt tour liên quan</h3>
            </div>
            {myBookings.length === 0 ? (
              <p className="empty-msg">Chưa có lượt đặt tour nào cho các tour bạn phụ trách.</p>
            ) : (
              <div className="staff-booking-list">
                {myBookings.slice(0, 5).map(booking => (
                  <div className="staff-booking-item" key={booking.id}>
                    <div className="staff-booking-avatar">{booking.customerName.charAt(0)}</div>
                    <div className="staff-booking-info">
                      <strong>{booking.customerName}</strong>
                      <small>{booking.tourName}</small>
                    </div>
                    <span className={`staff-status-badge staff-status-${booking.status.toLowerCase()}`}>
                      {bookingStatusLabel(booking.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <article className="staff-metric">
      <div className="staff-metric-body">
        <span className="staff-metric-label">{label}</span>
        <strong className="staff-metric-value">{value}</strong>
      </div>
    </article>
  )
}
