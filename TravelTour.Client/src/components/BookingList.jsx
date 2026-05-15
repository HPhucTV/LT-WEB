import { useEffect, useState } from 'react'
import { bookingApi, scheduleApi, tourApi } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { bookingStatusLabel, formatDate, formatVND, paymentStatusLabel } from '../utils/format'

export default function BookingList() {
  const { user } = useAuth()
  const isCustomer = user?.role?.toLowerCase() === 'customer' || !user?.role
  const toast = useToast()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [tours, setTours] = useState([])
  const [schedules, setSchedules] = useState([])
  const [selectedTourId, setSelectedTourId] = useState('')

  useEffect(() => { loadBookings() }, [])

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
    try { setSchedules((await scheduleApi.listByTour(tourId)).filter(schedule => schedule.status === 'Open')) }
    catch { setSchedules([]) }
  }

  async function handleCreate(event) {
    event.preventDefault()
    const form = new FormData(event.target)
    try {
      await bookingApi.create({
        tourScheduleId: Number(form.get('scheduleId')),
        customerName: form.get('customerName'),
        customerPhone: form.get('customerPhone'),
        guestCount: Number(form.get('guestCount')),
      })
      setFormOpen(false)
      loadBookings()
      toast.success('Đặt tour thành công!')
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await bookingApi.updateStatus(id, status)
      loadBookings()
      toast.success('Đã cập nhật trạng thái')
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleMomoPayment(id) {
    try {
      const payment = await bookingApi.payWithMomo(id)
      if (!payment.payUrl) {
        toast.warn(payment.message || 'Không nhận được liên kết thanh toán MoMo.')
        return
      }
      window.location.href = payment.payUrl
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Xác nhận xoá lượt đặt tour này?')) return
    try {
      await bookingApi.remove(id)
      loadBookings()
      toast.success('Đã xoá lượt đặt tour')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <>
      <section className="toolbar">
        <div>
          <h2>{isCustomer ? 'Tour của tôi' : 'Danh sách đặt tour'}</h2>
          <p>{isCustomer ? 'Quản lý các tour bạn đã đặt và thanh toán MoMo.' : 'Quản lý lượt đặt tour, trạng thái xử lý và thanh toán MoMo.'}</p>
        </div>
        <button className="btn-primary" onClick={openForm}>+ Đặt tour</button>
      </section>

      {formOpen && (
        <div className="modal-overlay" onClick={() => setFormOpen(false)}>
          <form className="modal-body" onClick={event => event.stopPropagation()} onSubmit={handleCreate}>
            <h2>Đặt tour mới</h2>
            <div className="form-grid">
              <label className="span-2">Chọn tour
                <select required value={selectedTourId} onChange={event => handleTourChange(event.target.value)}>
                  <option value="">-- Chọn tour --</option>
                  {tours.map(tour => <option key={tour.id} value={tour.id}>{tour.name} ({tour.code})</option>)}
                </select>
              </label>
              <label className="span-2">Chọn lịch khởi hành
                <select name="scheduleId" required>
                  <option value="">-- Chọn lịch --</option>
                  {schedules.map(schedule => <option key={schedule.id} value={schedule.id}>{formatDate(schedule.startDate)} - còn {schedule.availableSeats} chỗ</option>)}
                </select>
              </label>
              <label>Tên khách hàng<input name="customerName" required /></label>
              <label>Số điện thoại<input name="customerPhone" required /></label>
              <label>Số khách<input name="guestCount" type="number" min="1" defaultValue="1" required /></label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Huỷ</button>
              <button type="submit" className="btn-primary">Đặt tour</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="empty-msg">Đang tải...</p>
      ) : bookings.length === 0 ? (
        <p className="empty-msg">Chưa có lượt đặt tour nào.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Tour</th><th>Ngày khởi hành</th><th>Khách hàng</th><th>SĐT</th>
                <th>Số khách</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thanh toán</th><th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>{booking.tourName}</td>
                  <td>{formatDate(booking.startDate)}</td>
                  <td>{booking.customerName}</td>
                  <td>{booking.customerPhone}</td>
                  <td>{booking.guestCount}</td>
                  <td>{formatVND(booking.totalAmount)}</td>
                  <td>
                    {isCustomer ? (
                      <span className={`status-badge ${(booking.status || '').toLowerCase()}`}>{bookingStatusLabel(booking.status)}</span>
                    ) : (
                      <select className={`status-select ${(booking.status || '').toLowerCase()}`} value={booking.status} onChange={event => handleStatusChange(booking.id, event.target.value)}>
                        <option value="Pending">Chờ xác nhận</option>
                        <option value="Confirmed">Đã xác nhận</option>
                        <option value="Cancelled">Đã huỷ</option>
                      </select>
                    )}
                  </td>
                  <td><span className={`payment-badge ${(booking.paymentStatus || '').toLowerCase()}`}>{paymentStatusLabel(booking.paymentStatus)}</span></td>
                  <td className="row-actions">
                    {booking.paymentStatus !== 'Paid' && booking.status !== 'Cancelled' && (
                      <button className="btn-sm btn-momo" onClick={() => handleMomoPayment(booking.id)}>MoMo</button>
                    )}
                    {!isCustomer && <button className="btn-sm btn-danger" onClick={() => handleDelete(booking.id)}>Xoá</button>}
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
