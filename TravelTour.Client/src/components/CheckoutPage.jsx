import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { bookingApi, scheduleApi, tourApi } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { formatDate, formatVND } from '../utils/format'
import travexLogo from '../assets/travex-logo.svg'

function splitFullName(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return { lastName: '', firstName: parts[0] || '' }
  return { lastName: parts[0], firstName: parts.slice(1).join(' ') }
}

function isValidEmail(value) {
  const trimmed = value.trim()
  const atIndex = trimmed.indexOf('@')
  const dotIndex = trimmed.lastIndexOf('.')
  return atIndex > 0 && dotIndex > atIndex + 1 && dotIndex < trimmed.length - 1
}

export default function CheckoutPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const initialName = useMemo(() => splitFullName(user?.fullName || ''), [user])

  const tourId = Number(params.get('tourId'))
  const scheduleId = Number(params.get('scheduleId'))
  const guestCount = Math.max(1, Number(params.get('guestCount') || 1))
  const bookingType = params.get('bookingType') === 'PrivateGroup' ? 'PrivateGroup' : 'Shared'

  const [tour, setTour] = useState(null)
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pendingBooking, setPendingBooking] = useState(null)
  const [newsletter, setNewsletter] = useState(false)
  const [contact, setContact] = useState({
    lastName: initialName.lastName,
    firstName: initialName.firstName,
    phone: '',
    email: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    setContact(prev => ({
      ...prev,
      lastName: prev.lastName || initialName.lastName,
      firstName: prev.firstName || initialName.firstName,
    }))
  }, [initialName])

  useEffect(() => {
    let cancelled = false

    async function loadCheckout() {
      if (!tourId || !scheduleId || !guestCount) {
        setPageError('Thiếu thông tin đơn hàng. Vui lòng chọn lại tour.')
        setLoading(false)
        return
      }

      try {
        const [tourData, schedules] = await Promise.all([
          tourApi.get(tourId),
          scheduleApi.listByTour(tourId),
        ])
        if (cancelled) return

        const selectedSchedule = (schedules || []).find(item => Number(item.id) === scheduleId)
        if (!selectedSchedule) {
          setPageError('Không tìm thấy lịch khởi hành đã chọn.')
          return
        }
        if (selectedSchedule.status !== 'Open') {
          setPageError('Lịch khởi hành này đã đóng, vui lòng chọn lịch khác.')
          return
        }
        if (guestCount > selectedSchedule.availableSeats) {
          setPageError(`Chỉ còn ${selectedSchedule.availableSeats} chỗ trống cho lịch này.`)
          return
        }

        setTour(tourData)
        setSchedule(selectedSchedule)
      } catch (err) {
        if (!cancelled) setPageError(err.message || 'Không thể tải thông tin thanh toán.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadCheckout()
    return () => { cancelled = true }
  }, [tourId, scheduleId, guestCount])

  const totalAmount = tour ? tour.price * guestCount : 0
  const rewardAmount = Math.max(1000, Math.round(totalAmount * 0.001))
  const bookingTypeLabel = bookingType === 'PrivateGroup' ? 'Đi theo đoàn' : 'Đi lẻ / tour ghép'

  function updateContact(field, value) {
    setContact(prev => ({ ...prev, [field]: value }))
    setFieldErrors(prev => ({ ...prev, [field]: '' }))
    setSubmitError('')
  }

  function validateContact() {
    const errors = {}
    if (!contact.lastName.trim()) errors.lastName = 'Vui lòng nhập'
    if (!contact.firstName.trim()) errors.firstName = 'Vui lòng nhập'
    if (!contact.phone.trim()) errors.phone = 'Vui lòng nhập'
    if (!contact.email.trim()) errors.email = 'Vui lòng nhập'
    else if (!isValidEmail(contact.email)) errors.email = 'Email không hợp lệ'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handlePayment(event) {
    event.preventDefault()
    if (!validateContact() || !tour || !schedule) return

    setSubmitting(true)
    setSubmitError('')
    let booking = pendingBooking

    try {
      if (!booking) {
        booking = await bookingApi.create({
          tourScheduleId: schedule.id,
          customerName: `${contact.lastName.trim()} ${contact.firstName.trim()}`.trim(),
          customerPhone: contact.phone.trim(),
          customerEmail: contact.email.trim(),
          guestCount,
          bookingType,
        })
        setPendingBooking(booking)
      }

      const payment = await bookingApi.payWithVnpay(booking.id)
      const paymentUrl = payment.paymentUrl || payment.PaymentUrl
      if (!paymentUrl) throw new Error(payment.message || 'Không nhận được đường dẫn thanh toán VNPay.')

      if (paymentUrl.startsWith('/')) navigate(paymentUrl)
      else window.location.href = paymentUrl
    } catch (err) {
      const message = err.message || 'Không thể tạo thanh toán VNPay.'
      if (booking?.id) {
        setSubmitError(`Đã tạo booking #${booking.id}, nhưng chưa thể mở VNPay. Bạn có thể bấm thanh toán lại hoặc vào Tour của tôi để thanh toán sau. ${message}`)
      } else {
        setSubmitError(message)
      }
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <button className="checkout-brand" type="button" onClick={() => navigate('/')}>
          <img src={travexLogo} alt="TraveX" />
          <span><strong>Trave</strong>X</span>
        </button>
        <button className="checkout-help" type="button" onClick={() => navigate('/customer/support')}>Trợ giúp</button>
      </header>

      <nav className="checkout-steps" aria-label="Tiến trình thanh toán">
        <div className="checkout-step done"><span>✓</span><strong>Chọn đơn hàng</strong></div>
        <div className="checkout-step active"><span>2</span><strong>Điền thông tin</strong></div>
        <div className="checkout-step"><span>3</span><strong>Thanh toán</strong></div>
      </nav>

      {loading ? (
        <section className="checkout-state">Đang tải thông tin thanh toán...</section>
      ) : pageError ? (
        <section className="checkout-state">
          <h1>Không thể mở trang thanh toán</h1>
          <p>{pageError}</p>
          <button className="btn-primary" onClick={() => navigate(tourId ? `/tours/${tourId}` : '/')}>Chọn lại tour</button>
        </section>
      ) : (
        <form className="checkout-shell" onSubmit={handlePayment}>
          <section className="checkout-main">
            <div className="checkout-panel checkout-panel-title">
              <h1>Điền thông tin</h1>
            </div>

            <section className="checkout-panel">
              <h2><span></span>Thông tin đơn hàng</h2>
              <div className="checkout-order-row">
                {tour.imageUrl ? <img src={tour.imageUrl} alt={tour.name} /> : <div className="checkout-order-fallback">TraveX</div>}
                <div>
                  <h3>{tour.name}</h3>
                  <p>{tour.destination} • {tour.durationDays} ngày • {bookingTypeLabel}</p>
                  <small>{formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}</small>
                </div>
              </div>
            </section>

            <section className="checkout-panel">
              <h2><span></span>Thông tin liên hệ</h2>
              <p className="checkout-muted">Chúng tôi sẽ thông báo cho bạn nếu đơn hàng có sự thay đổi.</p>
              <div className="checkout-contact-grid">
                <label>
                  Họ *
                  <input value={contact.lastName} onChange={event => updateContact('lastName', event.target.value)} placeholder="VD: Nguyen" />
                  {fieldErrors.lastName && <small>{fieldErrors.lastName}</small>}
                </label>
                <label>
                  Tên *
                  <input value={contact.firstName} onChange={event => updateContact('firstName', event.target.value)} placeholder="VD: Minh Hoang" />
                  {fieldErrors.firstName && <small>{fieldErrors.firstName}</small>}
                </label>
                <label>
                  Số điện thoại *
                  <input value={contact.phone} onChange={event => updateContact('phone', event.target.value)} placeholder="VD: 0901234567" />
                  {fieldErrors.phone && <small>{fieldErrors.phone}</small>}
                </label>
                <label>
                  Địa chỉ email *
                  <input type="email" value={contact.email} onChange={event => updateContact('email', event.target.value)} placeholder="email@example.com" />
                  {fieldErrors.email && <small>{fieldErrors.email}</small>}
                </label>
              </div>
            </section>

            <section className="checkout-panel">
              <h2><span></span>Loại ưu đãi</h2>
              <div className="checkout-offer-row"><span>Mã ưu đãi nền tảng</span><strong>Không khả dụng</strong></div>
              <div className="checkout-offer-row"><span>Mã ưu đãi thanh toán</span><strong>Không khả dụng</strong></div>
              <p className="checkout-muted">Hiện không có mã ưu đãi nào khả dụng cho đơn hàng này.</p>
            </section>

            <section className="checkout-panel checkout-consent">
              <label>
                <input type="checkbox" checked={newsletter} onChange={event => setNewsletter(event.target.checked)} />
                <span>Đăng ký nhận ưu đãi độc quyền qua email, thông báo, SMS và ứng dụng nhắn tin.</span>
              </label>
              <p>Bằng cách tiếp tục, bạn thừa nhận và đồng ý với Điều khoản Sử dụng chung và Chính sách Bảo mật của TraveX.</p>
              <div className="checkout-info-line">Hủy miễn phí 24 giờ</div>
              <div className="checkout-warning">Vui lòng điền thông tin chính xác. Thông tin không thể chỉnh sửa sau khi gửi.</div>
              {submitError && <div className="checkout-submit-error">{submitError}</div>}
              <div className="checkout-submit-row">
                <p>Đơn hàng sẽ được gửi đi sau khi thanh toán. Bạn sẽ thanh toán qua VNPay ở bước tiếp theo.</p>
                <button className="checkout-pay-btn" type="submit" disabled={submitting}>
                  {submitting ? 'Đang xử lý...' : 'Thanh toán'}
                </button>
              </div>
            </section>
          </section>

          <aside className="checkout-sidebar">
            <section className="checkout-summary-card">
              <h2>{tour.name}</h2>
              <p>{tour.destination}</p>
              <div><span>Ngày</span><strong>{formatDate(schedule.startDate)}</strong></div>
              <div><span>Hình thức</span><strong>{bookingTypeLabel}</strong></div>
              <div><span>Đơn vị</span><strong>{guestCount} khách</strong></div>
              <div className="checkout-summary-total"><span>Tổng cộng</span><strong>{formatVND(totalAmount)}</strong></div>
            </section>
            <section className="checkout-summary-card checkout-pay-card">
              <div><span>Tổng cộng</span><strong>{formatVND(totalAmount)}</strong></div>
              <div><span>Số tiền thanh toán</span><strong>{formatVND(totalAmount)}</strong></div>
            </section>
            <section className="checkout-summary-card checkout-xu-card">
              <h3>TraveX Xu</h3>
              <p>Bạn sẽ nhận được:</p>
              <strong>≈ {formatVND(rewardAmount)} ({Math.max(1, Math.round(rewardAmount / 250))} TraveX Xu)</strong>
              <small>Hãy sử dụng xu để tiết kiệm cho đơn hàng tiếp theo.</small>
            </section>
          </aside>
        </form>
      )}

      <footer className="checkout-footer">
        <span>© 2026 TraveX. All Rights Reserved.</span>
        <div><span>f</span><span>in</span><span>yt</span></div>
      </footer>
    </main>
  )
}
