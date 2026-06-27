import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { bookingApi, scheduleApi, tourApi } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { formatDate, formatVND } from '../utils/format'
import { getUnusedRewardVouchers, loadRewardVouchers, markRewardVoucherUsed } from '../utils/rewards'
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

function addDaysToDateOnly(value, days) {
  const date = new Date(`${value}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
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
  const requestedStartDate = params.get('requestedStartDate') || ''

  const [tour, setTour] = useState(null)
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pendingBooking, setPendingBooking] = useState(null)
  const [groupRequestSuccess, setGroupRequestSuccess] = useState(null)
  const [rewardVouchers, setRewardVouchers] = useState(() => loadRewardVouchers(user))
  const [selectedVoucherId, setSelectedVoucherId] = useState('')
  const [newsletter, setNewsletter] = useState(false)
  const [contact, setContact] = useState({
    lastName: initialName.lastName,
    firstName: initialName.firstName,
    phone: '',
    email: '',
  })
  const [requestNote, setRequestNote] = useState('')
  const [groupCounts, setGroupCounts] = useState({
    adultCount: Math.max(1, guestCount),
    childCount: 0,
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
    setRewardVouchers(loadRewardVouchers(user))
  }, [user])

  useEffect(() => {
    if (bookingType === 'PrivateGroup') setSelectedVoucherId('')
  }, [bookingType])

  useEffect(() => {
    let cancelled = false

    async function loadCheckout() {
      if (!tourId || !guestCount || (bookingType === 'Shared' && !scheduleId) || (bookingType === 'PrivateGroup' && !requestedStartDate)) {
        setPageError('Thiếu thông tin đơn hàng. Vui lòng chọn lại tour.')
        setLoading(false)
        return
      }

      try {
        const tourData = await tourApi.get(tourId)
        if (cancelled) return

        if (bookingType === 'PrivateGroup') {
          setTour(tourData)
          setSchedule({
            id: null,
            startDate: requestedStartDate,
            endDate: addDaysToDateOnly(requestedStartDate, Math.max(0, (tourData.durationDays || 1) - 1)),
            status: 'Pending',
            scheduleType: 'PrivateGroup',
            price: tourData.price,
            originalPrice: tourData.originalPrice,
          })
          return
        }

        const schedules = await scheduleApi.listByTour(tourId)
        if (cancelled) return

        const selectedSchedule = (schedules || []).find(item => Number(item.id) === scheduleId)
        if (!selectedSchedule) {
          setPageError('Không tìm thấy lịch khởi hành đã chọn.')
          return
        }
        if (selectedSchedule.scheduleType === 'PrivateGroup') {
          setPageError('Lịch này không dành cho tour ghép.')
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
  }, [tourId, scheduleId, guestCount, bookingType, requestedStartDate])

  const isPrivateGroup = bookingType === 'PrivateGroup'
  const adultCount = isPrivateGroup ? groupCounts.adultCount : guestCount
  const childCount = isPrivateGroup ? groupCounts.childCount : 0
  const effectiveGuestCount = isPrivateGroup ? adultCount + childCount : guestCount
  const unitPrice = schedule ? Number(schedule.price || tour?.price || 0) : Number(tour?.price || 0)
  const totalAmount = isPrivateGroup
    ? adultCount * unitPrice + childCount * unitPrice * 0.5
    : unitPrice * guestCount
  const availableVouchers = isPrivateGroup ? [] : getUnusedRewardVouchers(rewardVouchers)
  const selectedVoucher = isPrivateGroup ? null : (availableVouchers.find(voucher => voucher.instanceId === selectedVoucherId) || null)
  const voucherDiscount = selectedVoucher ? Math.min(Number(selectedVoucher.discountAmount || 0), totalAmount) : 0
  const payableAmount = Math.max(0, totalAmount - voucherDiscount)
  const rewardAmount = Math.max(1000, Math.round(payableAmount * 0.001))
  const bookingTypeLabel = bookingType === 'PrivateGroup' ? 'Đi theo đoàn' : 'Đi lẻ / tour ghép'
  const departureStartDate = schedule?.startDate || requestedStartDate
  const departureEndDate = schedule?.endDate || departureStartDate

  function updateContact(field, value) {
    setContact(prev => ({ ...prev, [field]: value }))
    setFieldErrors(prev => ({ ...prev, [field]: '' }))
    setSubmitError('')
  }

  function validateGroupCounts() {
    if (!isPrivateGroup) return true

    const minGroupGuests = tour?.minGroupGuests || 10
    const maxGuests = tour?.maxGuests || 0
    const currentGuestCount = adultCount + childCount

    if (currentGuestCount < minGroupGuests) {
      setSubmitError(`Đi theo đoàn cần ít nhất ${minGroupGuests} hành khách.`)
      return false
    }

    if (maxGuests && currentGuestCount > maxGuests) {
      setSubmitError(`Tour này chỉ nhận tối đa ${maxGuests} hành khách cho một đoàn.`)
      return false
    }

    if (adultCount < 0 || childCount < 0) {
      setSubmitError('Số lượng người lớn/trẻ em không hợp lệ.')
      return false
    }

    return true
  }

  function validateContact() {
    const errors = {}
    if (!contact.lastName.trim()) errors.lastName = 'Vui lòng nhập'
    if (!contact.firstName.trim()) errors.firstName = 'Vui lòng nhập'
    if (!contact.phone.trim()) errors.phone = 'Vui lòng nhập'
    if (!contact.email.trim()) errors.email = 'Vui lòng nhập'
    else if (!isValidEmail(contact.email)) errors.email = 'Email không hợp lệ'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0 && validateGroupCounts()
  }

  async function handlePayment(event) {
    event.preventDefault()
    if (!validateContact() || !tour || !schedule) return

    setSubmitting(true)
    setSubmitError('')
    let booking = pendingBooking

    try {
      if (!booking) {
        const bookingPayload = {
          customerName: `${contact.lastName.trim()} ${contact.firstName.trim()}`.trim(),
          customerPhone: contact.phone.trim(),
          customerEmail: contact.email.trim(),
          guestCount: effectiveGuestCount,
          bookingType,
          voucherCode: selectedVoucher?.code || null,
          ...(isPrivateGroup
            ? {
                tourId,
                requestedStartDate,
                requestNote: requestNote.trim() || null,
                adultCount,
                childCount,
              }
            : { tourScheduleId: schedule.id }),
        }

        booking = await bookingApi.create(bookingPayload)
        setPendingBooking(booking)
        if (selectedVoucher) {
          setRewardVouchers(markRewardVoucherUsed(user, rewardVouchers, selectedVoucher.instanceId))
          setSelectedVoucherId('')
        }
      }

      if (isPrivateGroup) {
        setGroupRequestSuccess(booking)
        toast.success('Đã gửi yêu cầu hợp đồng đoàn. Sales sẽ chốt tổng hợp đồng trước khi thanh toán.')
        return
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
      ) : groupRequestSuccess ? (
        <section className="checkout-state">
          <h1>Đã gửi yêu cầu đặt đoàn</h1>
          <p>Booking #{groupRequestSuccess.id} đang chờ Sales chốt tổng hợp đồng và chọn hướng dẫn viên. Sau khi hợp đồng được xác nhận, bạn có thể thanh toán VNPay trong Tour của tôi.</p>
          <div className="payment-result-meta">
            <span>Ngày khởi hành</span>
            <strong>{formatDate(groupRequestSuccess.startDate)}</strong>
          </div>
          <div className="payment-result-meta">
            <span>Tạm tính dự kiến</span>
            <strong>{formatVND(groupRequestSuccess.totalAmount)}</strong>
          </div>
          <button className="btn-primary" onClick={() => navigate('/customer/my-tours')}>Xem Tour của tôi</button>
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
                  <small>{formatDate(departureStartDate)} - {formatDate(departureEndDate)}</small>
                </div>
              </div>
            </section>

            <section className="checkout-panel">
              <h2><span></span>Thông tin người đại diện</h2>
              <p className="checkout-muted">Người đại diện sẽ đứng tên booking và nhận thông báo về hợp đồng.</p>
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

            {isPrivateGroup && (
              <section className="checkout-panel">
                <h2><span></span>Số lượng hành khách</h2>
                <p className="checkout-muted">Không cần nhập từng người. Bạn chỉ cần cho biết số lượng người lớn và trẻ em.</p>
                <div className="checkout-contact-grid">
                  <label>
                    Người lớn
                    <input
                      type="number"
                      min="0"
                      value={groupCounts.adultCount}
                      onChange={event => setGroupCounts(prev => ({ ...prev, adultCount: Number(event.target.value || 0) }))}
                    />
                  </label>
                  <label>
                    Trẻ em
                    <input
                      type="number"
                      min="0"
                      value={groupCounts.childCount}
                      onChange={event => setGroupCounts(prev => ({ ...prev, childCount: Number(event.target.value || 0) }))}
                    />
                  </label>
                </div>
                <label style={{ marginTop: 16, display: 'grid', gap: 8 }}>
                  Ghi chú yêu cầu
                  <input value={requestNote} onChange={event => {
                    setRequestNote(event.target.value)
                    setSubmitError('')
                  }} placeholder="Yêu cầu riêng cho đoàn, lưu ý khi chốt hợp đồng..." />
                </label>
              </section>
            )}

            <section className="checkout-panel">
              <h2><span></span>Loại ưu đãi</h2>
              {isPrivateGroup ? (
                <div className="checkout-voucher-empty">
                  <span>Voucher không áp dụng ở bước yêu cầu hợp đồng đoàn. Sales sẽ nhập tổng hợp đồng cuối cùng.</span>
                </div>
              ) : availableVouchers.length === 0 ? (
                <div className="checkout-voucher-empty">
                  <span>Bạn chưa có voucher khả dụng.</span>
                  <button type="button" onClick={() => navigate('/customer/rewards')}>Đổi điểm lấy voucher</button>
                </div>
              ) : (
                <div className="checkout-voucher-list">
                  {availableVouchers.map(voucher => {
                    const active = selectedVoucherId === voucher.instanceId
                    return (
                      <button
                        className={`checkout-voucher-item ${active ? 'active' : ''}`}
                        key={voucher.instanceId}
                        type="button"
                        onClick={() => setSelectedVoucherId(active ? '' : voucher.instanceId)}
                      >
                        <span>
                          <strong>{voucher.title}</strong>
                          <small>{voucher.code}</small>
                        </span>
                        <b>-{formatVND(Math.min(voucher.discountAmount, totalAmount))}</b>
                      </button>
                    )
                  })}
                </div>
              )}
              {selectedVoucher && <p className="checkout-muted">Đang áp dụng {selectedVoucher.code}. Voucher sẽ được đánh dấu đã dùng sau khi tạo booking.</p>}
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
                <p>{isPrivateGroup ? 'Yêu cầu đoàn sẽ được gửi cho Sales tiếp nhận hợp đồng. Bạn sẽ thanh toán sau khi hợp đồng được chốt.' : 'Đơn hàng sẽ được gửi đi sau khi thanh toán. Bạn sẽ thanh toán qua VNPay ở bước tiếp theo.'}</p>
                <button className="checkout-pay-btn" type="submit" disabled={submitting}>
                  {submitting ? 'Đang xử lý...' : (isPrivateGroup ? 'Gửi yêu cầu' : 'Thanh toán')}
                </button>
              </div>
            </section>
          </section>

          <aside className="checkout-sidebar">
            <section className="checkout-summary-card">
              <h2>{tour.name}</h2>
              <p>{tour.destination}</p>
              <div><span>Ngày</span><strong>{formatDate(departureStartDate)}</strong></div>
              <div><span>Hình thức</span><strong>{bookingTypeLabel}</strong></div>
              <div><span>Đơn vị</span><strong>{effectiveGuestCount} khách</strong></div>
              {isPrivateGroup && <div><span>Cơ cấu</span><strong>{adultCount} người lớn / {childCount} trẻ em</strong></div>}
              {voucherDiscount > 0 && <div><span>Voucher</span><strong>-{formatVND(voucherDiscount)}</strong></div>}
              <div className="checkout-summary-total"><span>{isPrivateGroup ? 'Tạm tính dự kiến' : 'Tổng cộng'}</span><strong>{formatVND(payableAmount)}</strong></div>
            </section>
            <section className="checkout-summary-card checkout-pay-card">
              <div><span>{isPrivateGroup ? 'Tạm tính dự kiến' : 'Tổng cộng'}</span><strong>{formatVND(totalAmount)}</strong></div>
              {voucherDiscount > 0 && <div><span>Voucher</span><strong>-{formatVND(voucherDiscount)}</strong></div>}
              <div><span>{isPrivateGroup ? 'Số tiền sẽ chốt hợp đồng' : 'Số tiền thanh toán'}</span><strong>{formatVND(payableAmount)}</strong></div>
            </section>
            {!isPrivateGroup && <section className="checkout-summary-card checkout-xu-card">
              <h3>TraveX Xu</h3>
              <p>Bạn sẽ nhận được:</p>
              <strong>≈ {formatVND(rewardAmount)} ({Math.max(1, Math.round(rewardAmount / 250))} TraveX Xu)</strong>
              <small>Hãy sử dụng xu để tiết kiệm cho đơn hàng tiếp theo.</small>
            </section>}
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
