import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingApi, guideApi, scheduleApi, tourApi, userApi } from '../api'
import Pagination from './Pagination'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { useToast } from '../contexts/ToastContext'
import { paginateItems } from '../utils/pagination'
import { bookingStatusLabel, formatDate, formatVND, paymentStatusLabel } from '../utils/format'

function createEmptyFormState() {
  return {
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    bookingType: 'Shared',
    scheduleId: '',
    requestedStartDate: '',
    requestNote: '',
    adultCount: 10,
    childCount: 0,
  }
}

function createContractFormState(booking) {
  const amount = Number(booking?.contractAmount || booking?.totalAmount || booking?.estimatedAmount || 0)
  return {
    salesUserId: booking?.salesUserId ? String(booking.salesUserId) : '',
    guideUserId: booking?.guideUserId ? String(booking.guideUserId) : '',
    contractAmount: amount > 0 ? String(amount) : '',
    paymentTerms: booking?.paymentTerms || '',
    cancellationTerms: booking?.cancellationTerms || '',
  }
}

function getPrivateGroupPhaseLabel(booking) {
  if (booking.status === 'Cancelled') return 'Đã hủy'
  if (booking.contractStatus !== 'Confirmed') return 'Chờ chốt hợp đồng'
  if (booking.customerSignatureStatus !== 'Signed') return 'Chờ khách ký hợp đồng'
  if (booking.depositPaymentStatus !== 'Paid') return 'Chờ đặt cọc'
  if (booking.remainingPaymentStatus === 'Paid') return 'Đã thanh toán đủ'
  if (booking.remainingDueDate && new Date(booking.remainingDueDate) < new Date(new Date().toISOString().slice(0, 10))) {
    return 'Quá hạn thanh toán'
  }
  return 'Chờ thanh toán còn lại'
}

function getPrivateGroupPaymentLabel(booking) {
  const deposit = booking.depositPaymentStatus || 'Unpaid'
  const remaining = booking.remainingPaymentStatus || 'Unpaid'

  if (remaining === 'Paid') return 'Đã thanh toán đủ'
  if (deposit === 'Paid') return 'Đã đặt cọc'
  if (deposit === 'PaymentCreated') return 'Đang chờ thanh toán cọc'
  if (remaining === 'PaymentCreated') return 'Đang chờ thanh toán còn lại'
  if (booking.contractStatus !== 'Confirmed') return 'Chờ chốt hợp đồng'
  if (booking.customerSignatureStatus !== 'Signed') return 'Chờ khách ký hợp đồng'
  return 'Chưa thanh toán'
}

export default function BookingList({ contractOnly = false }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t, settings } = useSettings()
  const toast = useToast()
  const role = (user?.role || '').toLowerCase()
  const isCustomer = role === 'customer' || !role
  const isSales = role === 'sales'
  const canManageBookingStatus = !isCustomer && !isSales
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [tours, setTours] = useState([])
  const [schedules, setSchedules] = useState([])
  const [selectedTourId, setSelectedTourId] = useState('')
  const [formState, setFormState] = useState(createEmptyFormState)
  const [assignBooking, setAssignBooking] = useState(null)
  const [contractForm, setContractForm] = useState(() => createContractFormState(null))
  const [availableGuides, setAvailableGuides] = useState([])
  const [salesUsers, setSalesUsers] = useState([])
  const [bookingSearchTerm, setBookingSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => { loadBookings() }, [])

  useEffect(() => {
    if (!assignBooking) {
      setAvailableGuides([])
      setSalesUsers([])
      return
    }

    setContractForm(createContractFormState(assignBooking))
    Promise.all([
      guideApi.available(assignBooking.startDate, assignBooking.endDate || assignBooking.startDate).catch(() => []),
      userApi.sales().catch(() => []),
    ]).then(([guides, sales]) => {
      setAvailableGuides(guides || [])
      setSalesUsers(sales || [])
    })
  }, [assignBooking])

  const selectedTour = tours.find(tour => String(tour.id) === String(selectedTourId))
  const minGroupGuests = selectedTour?.minGroupGuests || 10
  const maxGroupGuests = selectedTour?.maxGuests || 0
  const todayDate = new Date().toISOString().slice(0, 10)
  const searchTerm = bookingSearchTerm.trim().toLowerCase()
  const adultCount = Number(formState.adultCount || 0)
  const childCount = Number(formState.childCount || 0)
  const totalGuests = adultCount + childCount
  const estimatedGroupAmount = Number(selectedTour?.price || 0) * adultCount + Number(selectedTour?.price || 0) * childCount * 0.5
  const salesOptions = salesUsers.length > 0
    ? salesUsers
    : (isSales && user?.id ? [{ id: user.id, fullName: user.fullName || user.username, username: user.username }] : [])

  const visibleBookings = useMemo(() => {
    const scopedBookings = contractOnly ? bookings.filter(booking => booking.bookingType === 'PrivateGroup') : bookings
    if (!searchTerm || isCustomer) return scopedBookings
    return scopedBookings.filter(booking =>
      (booking.customerName || '').toLowerCase().includes(searchTerm)
      || (booking.tourName || '').toLowerCase().includes(searchTerm)
      || (booking.customerPhone || '').toLowerCase().includes(searchTerm))
  }, [bookings, contractOnly, isCustomer, searchTerm])
  const pagination = useMemo(() => paginateItems(visibleBookings, page, pageSize), [page, pageSize, visibleBookings])

  useEffect(() => {
    setPage(1)
  }, [contractOnly, searchTerm])

  useEffect(() => {
    if (pagination.currentPage !== page) {
      setPage(pagination.currentPage)
    }
  }, [page, pagination.currentPage])

  function bookingLabel(status) {
    if (settings.language === 'vi') return bookingStatusLabel(status)
    if (status === 'Pending') return t('confirmPending')
    if (status === 'Confirmed') return t('confirmed')
    if (status === 'Cancelled') return t('cancelled')
    return status
  }

  function bookingDisplayLabel(booking) {
    if (booking.bookingType === 'PrivateGroup') return getPrivateGroupPhaseLabel(booking)
    return bookingLabel(booking.status)
  }

  function paymentLabel(booking) {
    if (booking.bookingType === 'PrivateGroup') return getPrivateGroupPaymentLabel(booking)
    if (settings.language === 'vi') return paymentStatusLabel(booking.paymentStatus)
    if (booking.paymentStatus === 'Paid') return t('paid')
    if (booking.paymentStatus === 'PaymentCreated') return t('vnpayWaiting')
    if (booking.paymentStatus === 'PaymentFailed') return t('failed')
    return t('unpaid')
  }

  async function loadBookings() {
    setLoading(true)
    try {
      const data = isCustomer ? await bookingApi.mine() : await bookingApi.list()
      setBookings(data)
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  async function openForm() {
    try {
      const tourData = await tourApi.list()
      setTours(tourData)
      setSchedules([])
      setSelectedTourId('')
      setFormState(createEmptyFormState())
      setFormOpen(true)
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleTourChange(tourId) {
    setSelectedTourId(tourId)
    setFormState(prev => ({
      ...prev,
      scheduleId: '',
      adultCount: prev.bookingType === 'PrivateGroup'
        ? tours.find(tour => String(tour.id) === String(tourId))?.minGroupGuests || 10
        : prev.adultCount,
    }))
    if (!tourId) {
      setSchedules([])
      return
    }
    try {
      const nextSchedules = await scheduleApi.listByTour(tourId)
      setSchedules((nextSchedules || []).filter(schedule => schedule.status === 'Open' && schedule.scheduleType !== 'PrivateGroup'))
    } catch {
      setSchedules([])
    }
  }

  function handleFormStateChange(field, value) {
    setFormState(prev => ({ ...prev, [field]: value }))
  }

  function handleBookingTypeChange(value) {
    setFormState(prev => ({
      ...prev,
      bookingType: value,
      scheduleId: '',
      requestedStartDate: value === 'PrivateGroup' ? prev.requestedStartDate : '',
      adultCount: value === 'PrivateGroup' ? selectedTour?.minGroupGuests || 10 : 1,
      childCount: value === 'PrivateGroup' ? 0 : 0,
    }))
    if (value !== 'PrivateGroup' && selectedTourId) {
      handleTourChange(selectedTourId)
    }
  }

  function validateGroupForm() {
    if (adultCount < 0 || childCount < 0) {
      throw new Error('Số lượng người lớn/trẻ em không hợp lệ.')
    }
    if (totalGuests < minGroupGuests) {
      throw new Error(`Tour đoàn cần ít nhất ${minGroupGuests} khách.`)
    }
    if (maxGroupGuests && totalGuests > maxGroupGuests) {
      throw new Error(`Tour này chỉ nhận tối đa ${maxGroupGuests} khách cho một đoàn.`)
    }
  }

  async function handleCreate(event) {
    event.preventDefault()
    if (!selectedTourId) {
      toast.error('Vui lòng chọn tour.')
      return
    }

    try {
      const payload = {
        customerName: formState.customerName.trim(),
        customerPhone: formState.customerPhone.trim(),
        customerEmail: formState.customerEmail.trim(),
        bookingType: formState.bookingType,
      }

      if (formState.bookingType === 'PrivateGroup') {
        validateGroupForm()
        Object.assign(payload, {
          guestCount: totalGuests,
          tourId: Number(selectedTourId),
          requestedStartDate: formState.requestedStartDate,
          requestNote: formState.requestNote.trim() || null,
          adultCount,
          childCount,
        })
      } else {
        Object.assign(payload, {
          guestCount: 1,
          tourScheduleId: Number(formState.scheduleId),
        })
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

  function handleContractFormChange(field, value) {
    setContractForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleAssignGuide(event) {
    event.preventDefault()
    const salesUserId = Number(contractForm.salesUserId)
    const guideUserId = Number(contractForm.guideUserId)
    const contractAmount = Number(contractForm.contractAmount)
    if (!assignBooking || !salesUserId || !guideUserId || contractAmount <= 0) return

    try {
      await bookingApi.confirmContract(assignBooking.id, {
        salesUserId,
        guideUserId,
        contractAmount,
        paymentTerms: contractForm.paymentTerms.trim() || null,
        cancellationTerms: contractForm.cancellationTerms.trim() || null,
      })
      setAssignBooking(null)
      loadBookings()
      toast.success('Đã chốt hợp đồng đoàn.')
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleVnpayPayment(id, stage = 'shared') {
    try {
      const payment = await bookingApi.payWithVnpay(id, stage)
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
    if (!confirm('Bạn có chắc muốn xóa đặt tour này?')) return
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

  function canPaySharedBooking(booking) {
    return booking.bookingType !== 'PrivateGroup' && booking.paymentStatus !== 'Paid' && booking.status !== 'Cancelled'
  }

  function openContractPage(bookingId) {
    navigate(`/customer/contracts/${bookingId}`)
  }

  const depositPreview = Math.round(Number(contractForm.contractAmount || 0) * 0.3)
  const remainingPreview = Math.max(0, Number(contractForm.contractAmount || 0) - depositPreview)
  const remainingDuePreview = assignBooking?.startDate
    ? new Date(new Date(`${assignBooking.startDate}T00:00:00`).getTime() - (5 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10)
    : ''

  return (
    <>
      <section className="toolbar">
        <div>
          <h2>{contractOnly ? 'Hợp đồng tour đoàn' : (isCustomer ? t('myTours') : t('bookingsListTitle'))}</h2>
          <p>{contractOnly ? 'Tiếp nhận yêu cầu đoàn, chốt tổng hợp đồng và phân hướng dẫn viên.' : (isCustomer ? t('myToursHelp') : t('bookingsListHelp'))}</p>
        </div>
        <div className="toolbar-actions">
          {!isCustomer && (
            <label className="booking-search-box">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
              <input
                value={bookingSearchTerm}
                onChange={event => setBookingSearchTerm(event.target.value)}
                placeholder={t('adminSearchPlaceholder')}
                aria-label={t('adminSearchPlaceholder')}
              />
            </label>
          )}
          {!contractOnly && <button className="btn-primary" onClick={openForm}>+ {t('bookTour')}</button>}
        </div>
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
                <select value={formState.bookingType} onChange={event => handleBookingTypeChange(event.target.value)}>
                  <option value="Shared">Đi lẻ / tour ghép</option>
                  <option value="PrivateGroup">Đi theo đoàn</option>
                </select>
              </label>
              {formState.bookingType === 'PrivateGroup' ? (
                <label>Ngày khởi hành mong muốn
                  <input
                    type="date"
                    min={todayDate}
                    required
                    value={formState.requestedStartDate}
                    onChange={event => handleFormStateChange('requestedStartDate', event.target.value)}
                  />
                </label>
              ) : (
                <label>{t('chooseSchedule')}
                  <select required value={formState.scheduleId} onChange={event => handleFormStateChange('scheduleId', event.target.value)}>
                    <option value="">{t('chooseSchedulePlaceholder')}</option>
                    {schedules.map(schedule => (
                      <option key={schedule.id} value={schedule.id}>
                        {formatDate(schedule.startDate)} - {schedule.availableSeats} {t('seatsLeft')} - {formatVND(schedule.price)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>{t('customerName')}
                <input required value={formState.customerName} onChange={event => handleFormStateChange('customerName', event.target.value)} />
              </label>
              <label>{t('phone')}
                <input required value={formState.customerPhone} onChange={event => handleFormStateChange('customerPhone', event.target.value)} />
              </label>
              <label>Email
                <input type="email" required value={formState.customerEmail} onChange={event => handleFormStateChange('customerEmail', event.target.value)} />
              </label>
              {formState.bookingType === 'Shared' && (
                <label>{t('guestCount')}
                  <input value="1" disabled />
                </label>
              )}
              {formState.bookingType === 'PrivateGroup' && (
                <>
                  <label className="span-2">Ghi chú yêu cầu
                    <textarea rows="3" value={formState.requestNote} onChange={event => handleFormStateChange('requestNote', event.target.value)} />
                  </label>
                  <label>Người lớn
                    <input type="number" min="0" value={formState.adultCount} onChange={event => handleFormStateChange('adultCount', Number(event.target.value || 0))} />
                  </label>
                  <label>Trẻ em
                    <input type="number" min="0" value={formState.childCount} onChange={event => handleFormStateChange('childCount', Number(event.target.value || 0))} />
                  </label>
                  <p className="booking-hint span-2">
                    Tour đoàn cần ít nhất {minGroupGuests} khách{maxGroupGuests ? ` và tối đa ${maxGroupGuests} khách` : ''}.
                    Tạm tính: {adultCount} người lớn / {childCount} trẻ em - {formatVND(estimatedGroupAmount)}.
                  </p>
                </>
              )}
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
            <h2>Chốt hợp đồng đoàn</h2>
            <div className="form-grid">
              <label className="span-2">Tour
                <input value={assignBooking.tourName} disabled />
              </label>
              <label>Ngày đi
                <input value={`${formatDate(assignBooking.startDate)} - ${formatDate(assignBooking.endDate || assignBooking.startDate)}`} disabled />
              </label>
              <label>Cơ cấu đoàn
                <input value={`${assignBooking.adultCount || 0} người lớn / ${assignBooking.childCount || 0} trẻ em`} disabled />
              </label>
              <label>Sales tiếp nhận
                <select required value={contractForm.salesUserId} onChange={event => handleContractFormChange('salesUserId', event.target.value)}>
                  <option value="">Chọn Sales</option>
                  {salesOptions.map(sales => (
                    <option key={sales.id} value={sales.id}>{sales.fullName || sales.username}</option>
                  ))}
                </select>
              </label>
              <label>Tổng hợp đồng
                <input type="number" min="1" required value={contractForm.contractAmount} onChange={event => handleContractFormChange('contractAmount', event.target.value)} />
              </label>
              <label className="span-2">Hướng dẫn viên
                <select required value={contractForm.guideUserId} onChange={event => handleContractFormChange('guideUserId', event.target.value)}>
                  <option value="">Chọn hướng dẫn viên rảnh</option>
                  {assignBooking.guideUserId && !availableGuides.some(guide => guide.id === assignBooking.guideUserId) && (
                    <option value={assignBooking.guideUserId}>{assignBooking.guideName || 'Hướng dẫn viên hiện tại'}</option>
                  )}
                  {availableGuides.map(guide => (
                    <option key={guide.id} value={guide.id}>{guide.fullName}{guide.availabilityNote ? ` - ${guide.availabilityNote}` : ''}</option>
                  ))}
                </select>
                <small>Chỉ hiển thị hướng dẫn viên đã khai báo rảnh và không bị trùng lịch.</small>
              </label>
              <label className="span-2">Điều Khoản Thanh Toán
                <textarea rows="4" value={contractForm.paymentTerms} onChange={event => handleContractFormChange('paymentTerms', event.target.value)} />
              </label>
              <label className="span-2">Điều Khoản Hoàn/Hủy Tour
                <textarea rows="4" value={contractForm.cancellationTerms} onChange={event => handleContractFormChange('cancellationTerms', event.target.value)} />
              </label>
              <label>Tiền cọc 30%
                <input value={formatVND(depositPreview)} disabled />
              </label>
              <label>Còn lại 70%
                <input value={formatVND(remainingPreview)} disabled />
              </label>
              <label className="span-2">Hạn thanh toán còn lại
                <input value={remainingDuePreview ? formatDate(remainingDuePreview) : ''} disabled />
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setAssignBooking(null)}>{t('cancel')}</button>
              <button type="submit" className="btn-primary">Chốt hợp đồng</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="empty-msg">{t('loading')}</p>
      ) : bookings.length === 0 ? (
        <p className="empty-msg">{t('noBookings')}</p>
      ) : visibleBookings.length === 0 ? (
        <p className="empty-msg">Không tìm thấy đặt tour phù hợp.</p>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('tour')}</th>
                  <th>{t('departureSchedule')}</th>
                  <th>Hình thức</th>
                  <th>{t('customerName')}</th>
                  <th>{t('phone')}</th>
                  <th>{t('guestCount')}</th>
                  <th>{t('totalAmount')}</th>
                  <th>{t('status')}</th>
                  <th>{t('payment')}</th>
                  <th>{t('action')}</th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.map(booking => {
                  const isGroupBooking = booking.bookingType === 'PrivateGroup'
                  const displayAmount = isGroupBooking && booking.contractStatus !== 'Confirmed'
                    ? (booking.estimatedAmount || booking.totalAmount)
                    : booking.totalAmount

                  return (
                    <tr key={booking.id}>
                      <td>{booking.id}</td>
                      <td>{booking.tourName}</td>
                      <td>
                        <div className="booking-date-cell">
                          <strong>{formatDate(booking.startDate)}</strong>
                          {booking.endDate && booking.endDate !== booking.startDate && <small>đến {formatDate(booking.endDate)}</small>}
                          {booking.guideName && <small>HDV: {booking.guideName}</small>}
                          {isGroupBooking && booking.salesName && <small>Sales: {booking.salesName}</small>}
                        </div>
                      </td>
                      <td><span className={`booking-type-badge ${(booking.bookingType || '').toLowerCase()}`}>{bookingTypeLabel(booking.bookingType)}</span></td>
                      <td>
                        <div className="booking-date-cell">
                          <strong>{booking.customerName}</strong>
                          {isGroupBooking && <small>{booking.adultCount || 0} người lớn / {booking.childCount || 0} trẻ em</small>}
                        </div>
                      </td>
                      <td>{booking.customerPhone}</td>
                      <td>{booking.guestCount}</td>
                      <td>
                        <div className="booking-date-cell">
                          <strong>{formatVND(displayAmount)}</strong>
                          {isGroupBooking && <small>{booking.contractStatus === 'Confirmed' ? 'Tổng hợp đồng đã chốt' : 'Tạm tính dự kiến'}</small>}
                        </div>
                      </td>
                      <td>
                        {!canManageBookingStatus || isGroupBooking ? (
                          <span className={`status-badge ${(booking.status || '').toLowerCase()}`}>{bookingDisplayLabel(booking)}</span>
                        ) : (
                          <select className={`status-select ${(booking.status || '').toLowerCase()}`} value={booking.status} onChange={event => handleStatusChange(booking.id, event.target.value)}>
                            <option value="Pending">{t('confirmPending')}</option>
                            <option value="Confirmed">{t('confirmed')}</option>
                            <option value="Cancelled">{t('cancelled')}</option>
                          </select>
                        )}
                      </td>
                      <td>
                        <div className="booking-date-cell">
                          <span className={`payment-badge ${(booking.paymentStatus || '').toLowerCase()}`}>{paymentLabel(booking)}</span>
                          {isGroupBooking && (
                            <>
                              <small>Ký KH: {booking.customerSignatureStatus === 'Signed' ? 'Đã ký' : 'Chưa ký'}</small>
                              <small>Cọc: {booking.depositPaymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</small>
                              <small>Còn lại: {booking.remainingPaymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</small>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="row-actions">
                        {isCustomer && isGroupBooking && (
                          <button className="btn-sm" onClick={() => openContractPage(booking.id)}>Xem hợp đồng</button>
                        )}
                        {isCustomer && canPaySharedBooking(booking) && (
                          <button className="btn-sm btn-vnpay" onClick={() => handleVnpayPayment(booking.id, 'shared')}>VNPay</button>
                        )}
                        {!isCustomer && isGroupBooking && booking.status !== 'Cancelled' && (
                          <button className="btn-sm" onClick={() => setAssignBooking(booking)}>
                            {booking.contractStatus === 'Confirmed' ? 'Cập nhật hợp đồng' : 'Chốt hợp đồng'}
                          </button>
                        )}
                        {canManageBookingStatus && !isGroupBooking && (
                          <button className="btn-sm btn-danger" onClick={() => handleDelete(booking.id)}>{t('delete')}</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            startItem={pagination.startItem}
            endItem={pagination.endItem}
            pageSize={pagination.pageSize}
            onPageChange={setPage}
            onPageSizeChange={value => {
              setPageSize(value)
              setPage(1)
            }}
            itemLabel="đặt tour"
          />
        </>
      )}
    </>
  )
}
