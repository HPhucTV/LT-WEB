import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingApi, guideApi, scheduleApi, tourApi } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { useToast } from '../contexts/ToastContext'
import { bookingStatusLabel, formatDate, formatVND, paymentStatusLabel } from '../utils/format'

export default function BookingList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t, settings } = useSettings()
  const isCustomer = user?.role?.toLowerCase() === 'customer' || !user?.role
  const toast = useToast()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [tours, setTours] = useState([])
  const [schedules, setSchedules] = useState([])
  const [selectedTourId, setSelectedTourId] = useState('')
  const [bookingType, setBookingType] = useState('Shared')
  const [requestedStartDate, setRequestedStartDate] = useState('')
  const [assignBooking, setAssignBooking] = useState(null)
  const [availableGuides, setAvailableGuides] = useState([])

  useEffect(() => { loadBookings() }, [])

  useEffect(() => {
    if (!assignBooking) {
      setAvailableGuides([])
      return
    }

    guideApi.available(assignBooking.startDate, assignBooking.endDate || assignBooking.startDate)
      .then(data => setAvailableGuides(data || []))
      .catch(() => setAvailableGuides([]))
  }, [assignBooking])

  function bookingLabel(status) {
    if (settings.language === 'vi') return bookingStatusLabel(status)
    if (status === 'Pending') return t('confirmPending')
    if (status === 'Confirmed') return t('confirmed')
    if (status === 'Cancelled') return t('cancelled')
    return status
  }

  function bookingDisplayLabel(booking) {
    if (booking.bookingType === 'PrivateGroup' && booking.status === 'Pending') return 'Chờ phân lịch'
    if (booking.bookingType === 'PrivateGroup' && booking.status === 'Confirmed') return 'Đã phân lịch'
    return bookingLabel(booking.status)
  }

  function paymentLabel(status) {
    if (settings.language === 'vi') return paymentStatusLabel(status)
    if (status === 'Paid') return t('paid')
    if (status === 'PaymentCreated') return t('vnpayWaiting')
    if (status === 'PaymentFailed') return t('failed')
    return t('unpaid')
  }

  async function loadBookings() {
    setLoading(true)
    try {
      let data = await bookingApi.list()
      if (isCustomer && user) {
        data = data.filter(booking => booking.customerName === user.fullName || booking.customerName === user.username)
      }
      setBookings(data)
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  async function openForm() {
    try {
      setTours(await tourApi.list())
      setSchedules([])
      setSelectedTourId('')
      setBookingType('Shared')
      setRequestedStartDate('')
      setFormOpen(true)
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleTourChange(tourId) {
    setSelectedTourId(tourId)
    if (!tourId) {
      setSchedules([])
      return
    }
    try { setSchedules((await scheduleApi.listByTour(tourId)).filter(schedule => schedule.status === 'Open' && schedule.scheduleType !== 'PrivateGroup')) }
    catch { setSchedules([]) }
  }

  async function handleCreate(event) {
    event.preventDefault()
    const form = new FormData(event.target)
    try {
      const nextBookingType = form.get('bookingType')
      const payload = {
        customerName: form.get('customerName'),
        customerPhone: form.get('customerPhone'),
        customerEmail: form.get('customerEmail'),
        guestCount: Number(form.get('guestCount')),
        bookingType: nextBookingType,
        ...(nextBookingType === 'PrivateGroup'
          ? { tourId: Number(selectedTourId), requestedStartDate: form.get('requestedStartDate') }
          : { tourScheduleId: Number(form.get('scheduleId')) }),
      }

      await bookingApi.create(payload)
      setFormOpen(false)
      loadBookings()
      toast.success(t('bookTour'))
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await bookingApi.updateStatus(id, status)
      loadBookings()
      toast.success(t('update'))
    } catch (err) {
      toast.error(err.message)
    }
  }

  function handleBookingTypeChange(value) {
    setBookingType(value)
    if (value === 'PrivateGroup') {
      setSchedules([])
    } else if (selectedTourId) {
      handleTourChange(selectedTourId)
    }
  }

  async function handleAssignGuide(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const guideUserId = Number(form.get('guideUserId'))
    if (!assignBooking || !guideUserId) return

    try {
      await bookingApi.assignGuide(assignBooking.id, guideUserId)
      setAssignBooking(null)
      loadBookings()
      toast.success('Đã phân nhân viên cho booking đoàn.')
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleVnpayPayment(id) {
    try {
      const payment = await bookingApi.payWithVnpay(id)
      if (!payment.paymentUrl) {
        toast.warn(payment.message || t('vnpayWaiting'))
        return
      }
      if (payment.paymentUrl.startsWith('/')) {
        navigate(payment.paymentUrl)
      } else {
        window.location.href = payment.paymentUrl
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this booking?')) return
    try {
      await bookingApi.remove(id)
      loadBookings()
      toast.success(t('delete'))
    } catch (err) {
      toast.error(err.message)
    }
  }

  function bookingTypeLabel(type) {
    return type === 'PrivateGroup' ? 'Đi theo đoàn' : 'Tour ghép'
  }

  function canPay(booking) {
    if (booking.paymentStatus === 'Paid' || booking.status === 'Cancelled') return false
    if (booking.bookingType === 'PrivateGroup') return booking.status === 'Confirmed'
    return true
  }

  const selectedTour = tours.find(tour => String(tour.id) === String(selectedTourId))
  const todayDate = new Date().toISOString().slice(0, 10)

  return (
    <>
      <section className="toolbar">
        <div>
          <h2>{isCustomer ? t('myTours') : t('bookingsListTitle')}</h2>
          <p>{isCustomer ? t('myToursHelp') : t('bookingsListHelp')}</p>
        </div>
        <button className="btn-primary" onClick={openForm}>+ {t('bookTour')}</button>
      </section>

      {formOpen && (
        <div className="modal-overlay" onClick={() => setFormOpen(false)}>
          <form className="modal-body" onClick={event => event.stopPropagation()} onSubmit={handleCreate}>
            <h2>{t('newBooking')}</h2>
            <div className="form-grid">
              <label className="span-2">{t('chooseTour')}
                <select required value={selectedTourId} onChange={event => handleTourChange(event.target.value)}>
                  <option value="">{t('chooseTourPlaceholder')}</option>
                  {tours.map(tour => <option key={tour.id} value={tour.id}>{tour.name} ({tour.code})</option>)}
                </select>
              </label>
              <label>Hình thức
                <select name="bookingType" value={bookingType} onChange={event => handleBookingTypeChange(event.target.value)}>
                  <option value="Shared">Đi lẻ / tour ghép</option>
                  <option value="PrivateGroup">Đi theo đoàn</option>
                </select>
              </label>
              {bookingType === 'PrivateGroup' ? (
                <label>Ngày khởi hành mong muốn
                  <input name="requestedStartDate" type="date" min={todayDate} required value={requestedStartDate} onChange={event => setRequestedStartDate(event.target.value)} />
                </label>
              ) : (
                <label>{t('chooseSchedule')}
                  <select name="scheduleId" required>
                    <option value="">{t('chooseSchedulePlaceholder')}</option>
                    {schedules.map(schedule => <option key={schedule.id} value={schedule.id}>{formatDate(schedule.startDate)} - {schedule.availableSeats} {t('seatsLeft')}</option>)}
                  </select>
                </label>
              )}
              <label>{t('customerName')}<input name="customerName" required /></label>
              <label>{t('phone')}<input name="customerPhone" required /></label>
              <label>Email<input name="customerEmail" type="email" required /></label>
              <label>{t('guestCount')}<input name="guestCount" type="number" min={bookingType === 'PrivateGroup' ? (selectedTour?.minGroupGuests || 10) : 1} max={selectedTour?.maxGuests || undefined} defaultValue="1" required /></label>
              {bookingType === 'PrivateGroup' && <p className="booking-hint span-2">Đi theo đoàn cần ít nhất {selectedTour?.minGroupGuests || 10} khách. Booking đoàn sẽ chờ admin phân nhân viên trước khi thanh toán.</p>}
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>{t('cancel')}</button>
              <button type="submit" className="btn-primary">{t('bookTour')}</button>
            </div>
          </form>
        </div>
      )}

      {assignBooking && (
        <div className="modal-overlay" onClick={() => setAssignBooking(null)}>
          <form className="modal-body" onClick={event => event.stopPropagation()} onSubmit={handleAssignGuide}>
            <h2>Phân nhân viên cho đoàn</h2>
            <div className="form-grid">
              <label className="span-2">Tour
                <input value={assignBooking.tourName} disabled />
              </label>
              <label>Ngày đi
                <input value={`${formatDate(assignBooking.startDate)} - ${formatDate(assignBooking.endDate || assignBooking.startDate)}`} disabled />
              </label>
              <label>Số khách
                <input value={`${assignBooking.guestCount} khách`} disabled />
              </label>
              <label className="span-2">Nhân viên / hướng dẫn viên
                <select name="guideUserId" required defaultValue={assignBooking.guideUserId || ''}>
                  <option value="">Chọn nhân viên rảnh</option>
                  {assignBooking.guideUserId && !availableGuides.some(guide => guide.id === assignBooking.guideUserId) && (
                    <option value={assignBooking.guideUserId}>{assignBooking.guideName || 'Nhân viên hiện tại'}</option>
                  )}
                  {availableGuides.map(guide => (
                    <option key={guide.id} value={guide.id}>{guide.fullName}{guide.availabilityNote ? ` - ${guide.availabilityNote}` : ''}</option>
                  ))}
                </select>
                <small>Chỉ hiển thị nhân viên đã khai báo rảnh và chưa bị trùng lịch.</small>
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setAssignBooking(null)}>{t('cancel')}</button>
              <button type="submit" className="btn-primary">Xác nhận phân lịch</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="empty-msg">{t('loading')}</p>
      ) : bookings.length === 0 ? (
        <p className="empty-msg">{t('noBookings')}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th><th>{t('tour')}</th><th>{t('departureSchedule')}</th><th>Hình thức</th><th>{t('customerName')}</th><th>{t('phone')}</th>
                <th>{t('guestCount')}</th><th>{t('totalAmount')}</th><th>{t('status')}</th><th>{t('payment')}</th><th>{t('action')}</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>{booking.tourName}</td>
                  <td>
                    <div className="booking-date-cell">
                      <strong>{formatDate(booking.startDate)}</strong>
                      {booking.endDate && booking.endDate !== booking.startDate && <small>đến {formatDate(booking.endDate)}</small>}
                      {booking.guideName && <small>NV: {booking.guideName}</small>}
                    </div>
                  </td>
                  <td><span className={`booking-type-badge ${(booking.bookingType || '').toLowerCase()}`}>{bookingTypeLabel(booking.bookingType)}</span></td>
                  <td>{booking.customerName}</td>
                  <td>{booking.customerPhone}</td>
                  <td>{booking.guestCount}</td>
                  <td>{formatVND(booking.totalAmount)}</td>
                  <td>
                    {isCustomer ? (
                      <span className={`status-badge ${(booking.status || '').toLowerCase()}`}>{bookingDisplayLabel(booking)}</span>
                    ) : (
                      <select className={`status-select ${(booking.status || '').toLowerCase()}`} value={booking.status} onChange={event => handleStatusChange(booking.id, event.target.value)}>
                        <option value="Pending">{t('confirmPending')}</option>
                        <option value="Confirmed">{t('confirmed')}</option>
                        <option value="Cancelled">{t('cancelled')}</option>
                      </select>
                    )}
                  </td>
                  <td><span className={`payment-badge ${(booking.paymentStatus || '').toLowerCase()}`}>{paymentLabel(booking.paymentStatus)}</span></td>
                  <td className="row-actions">
                    {canPay(booking) && (
                      <button className="btn-sm btn-vnpay" onClick={() => handleVnpayPayment(booking.id)}>VNPay</button>
                    )}
                    {!isCustomer && booking.bookingType === 'PrivateGroup' && booking.status !== 'Cancelled' && (
                      <button className="btn-sm" onClick={() => setAssignBooking(booking)}>
                        {booking.guideName ? 'Đổi nhân viên' : 'Phân nhân viên'}
                      </button>
                    )}
                    {!isCustomer && <button className="btn-sm btn-danger" onClick={() => handleDelete(booking.id)}>{t('delete')}</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
