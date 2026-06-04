import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { reviewApi, scheduleApi, tourApi } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { formatDate, formatVND } from '../utils/format'
import travexLogo from '../assets/travex-logo.svg'

export default function TourDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const [tour, setTour] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSchedule, setSelectedSchedule] = useState('')
  const [requestedStartDate, setRequestedStartDate] = useState('')
  const [bookingType, setBookingType] = useState('Shared')
  const [guestCount, setGuestCount] = useState(1)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [hoverRating, setHoverRating] = useState(0)

  useEffect(() => {
    async function loadData() {
      try {
        const [tourData, scheduleData, reviewData] = await Promise.all([
          tourApi.get(id),
          scheduleApi.listByTour(id),
          reviewApi.listByTour(id),
        ])
        setTour(tourData)
        setSchedules(scheduleData.filter(schedule => schedule.status === 'Open' && schedule.scheduleType !== 'PrivateGroup'))
        setReviews(reviewData)
      } catch {
        toast.error('Không thể tải thông tin tour')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, user])

  async function handleBook(event) {
    event.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }
    const query = new URLSearchParams({
      tourId: String(id),
      guestCount: String(guestCount),
      bookingType,
    })

    if (bookingType === 'PrivateGroup') {
      if (!requestedStartDate) {
        toast.error('Vui lòng chọn ngày khởi hành mong muốn.')
        return
      }
      query.set('requestedStartDate', requestedStartDate)
    } else {
      if (!selectedSchedule) {
        toast.error('Vui lòng chọn lịch khởi hành.')
        return
      }
      query.set('scheduleId', String(selectedSchedule))
    }

    navigate(`/checkout?${query.toString()}`)
  }

  async function handleReview(event) {
    event.preventDefault()
    try {
      const newReview = await reviewApi.create(id, {
        customerId: user?.id,
        customerName: user ? user.fullName : 'Khách hàng ẩn danh',
        rating: Number(rating),
        comment,
      })
      setReviews([newReview, ...reviews])
      setComment('')
      setRating(5)
      toast.success('Cảm ơn bạn đã đánh giá!')
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>
  if (!tour) return <div style={{ padding: 40, textAlign: 'center' }}>Không tìm thấy tour</div>

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : null
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(review => review.rating === star).length,
    pct: reviews.length ? Math.round((reviews.filter(review => review.rating === star).length / reviews.length) * 100) : 0,
  }))
  const hasDiscount = tour.originalPrice && tour.originalPrice > tour.price
  const minGroupGuests = tour.minGroupGuests || 10
  const todayDate = new Date().toISOString().slice(0, 10)
  const canShowTotal = bookingType === 'PrivateGroup' ? requestedStartDate : selectedSchedule

  function handleBookingTypeChange(value) {
    setBookingType(value)
    if (value === 'PrivateGroup' && Number(guestCount) < minGroupGuests) {
      setGuestCount(minGroupGuests)
    }
    if (value === 'Shared' && Number(guestCount) < 1) {
      setGuestCount(1)
    }
  }

  return (
    <div className="tour-details-page">
      <nav className="home-navbar navbar-scrolled">
        <div className="nav-content">
          <a href="#" className="home-brand" onClick={event => { event.preventDefault(); navigate('/') }}>
            <div className="home-brand-icon"><img src={travexLogo} alt="TraveX" /></div>
            <div className="home-brand-text"><span className="text-travel">Trave</span><span className="text-pro">X</span></div>
          </a>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn-nav" onClick={() => navigate((user.role || '').toLowerCase() === 'admin' ? '/admin' : (user.role || '').toLowerCase() === 'staff' ? '/staff' : '/customer')}>Bảng điều khiển</button>
              <span className="nav-user-name">Chào, {user.fullName}</span>
            </div>
          ) : <button className="btn-nav" onClick={() => navigate('/login')}>Đăng nhập</button>}
        </div>
      </nav>

      <div className="details-container home-container">
        <nav className="breadcrumb">
          <a href="#" onClick={event => { event.preventDefault(); navigate('/') }}>Trang chủ</a>
          <span className="breadcrumb-sep">›</span>
          <a href="#" onClick={event => {
            event.preventDefault()
            if (!user) {
              navigate('/#tours')
              return
            }
            const role = (user.role || '').toLowerCase()
            navigate(role === 'admin' ? '/admin/tours' : role === 'staff' ? '/staff/schedule' : '/customer/tours')
          }}>Tour</a>
          <span className="breadcrumb-sep">›</span><span className="breadcrumb-current">{tour.name}</span>
        </nav>

        <div className="tour-details-grid">
          <div className="tour-main-info">
            <div className="details-image-wrap">
              {tour.imageUrl ? <img src={tour.imageUrl} alt={tour.name} className="details-hero-img" /> : <div className="placeholder-img" style={{ height: 400 }}>Chưa có ảnh</div>}
              {hasDiscount && <span className="card-badge-discount" style={{ fontSize: 16, padding: '8px 16px' }}>-{Math.round((1 - tour.price / tour.originalPrice) * 100)}%</span>}
            </div>

            <div className="details-header">
              <div>
                <span className="tour-category-tag">{tour.category}</span>
                <h1>{tour.name}</h1>
                <p className="details-meta">📍 {tour.destination} &nbsp;|&nbsp; 🕐 {tour.durationDays} ngày &nbsp;|&nbsp; 👥 Tối đa {tour.maxGuests} khách</p>
              </div>
              {avgRating && <div className="details-rating-badge"><span className="details-rating-number">{avgRating}</span><span className="star">★</span><span className="details-rating-count">{reviews.length} đánh giá</span></div>}
            </div>

            <div className="details-description"><h3>Mô tả chi tiết</h3><p>{tour.description || 'Chưa có mô tả chi tiết cho tour này.'}</p></div>

            {hasDiscount && (tour.promotionTitle || tour.promotionDescription || tour.discountStartDate || tour.discountEndDate) && (
              <div className="details-promo-box">
                <h3>{tour.promotionTitle || 'Ưu đãi đang áp dụng'}</h3>
                {tour.promotionDescription && <p>{tour.promotionDescription}</p>}
                {(tour.discountStartDate || tour.discountEndDate) && (
                  <small>
                    {tour.discountStartDate ? formatDate(tour.discountStartDate) : '...'} - {tour.discountEndDate ? formatDate(tour.discountEndDate) : '...'}
                  </small>
                )}
              </div>
            )}

            <div className="details-reviews-section">
              <h3>Đánh giá từ khách hàng ({reviews.length})</h3>
              {reviews.length > 0 && (
                <div className="rating-distribution">
                  <div className="rating-summary">
                    <div className="rating-big-number">{avgRating}</div>
                    <div className="rating-stars-row">{[1, 2, 3, 4, 5].map(star => <span key={star} className={`star ${star <= Math.round(avgRating) ? '' : 'star-empty'}`}>★</span>)}</div>
                    <p>{reviews.length} đánh giá</p>
                  </div>
                  <div className="rating-bars">{ratingDist.map(item => <div key={item.star} className="rating-bar-row"><span>{item.star} ★</span><div className="rating-bar-track"><div className="rating-bar-fill" style={{ width: `${item.pct}%` }} /></div><span className="rating-bar-count">{item.count}</span></div>)}</div>
                </div>
              )}

              <form className="review-form" onSubmit={handleReview}>
                <h4>Viết đánh giá của bạn</h4>
                <div className="review-stars-input">{[1, 2, 3, 4, 5].map(star => <span key={star} className={`star-input ${star <= (hoverRating || rating) ? 'active' : ''}`} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(star)}>★</span>)}</div>
                <textarea required placeholder="Chia sẻ cảm nhận của bạn về tour du lịch..." value={comment} onChange={event => setComment(event.target.value)} rows={3} />
                <button type="submit" className="btn-primary">Gửi đánh giá</button>
              </form>

              <div className="reviews-list">
                {reviews.map(review => (
                  <div key={review.id} className="review-item">
                    <div className="review-item-header">
                      <div className="review-avatar">{review.customerName.charAt(0).toUpperCase()}</div>
                      <div><strong>{review.customerName}</strong><small>{formatDate(review.createdAt)}</small></div>
                      <span className="review-stars">{'★'.repeat(review.rating)}<span className="star-empty">{'★'.repeat(5 - review.rating)}</span></span>
                    </div>
                    <p className="review-comment">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="tour-sidebar">
            <div className="booking-card">
              <div className="booking-price-display">
                {hasDiscount && <span className="price-original">{formatVND(tour.originalPrice)}</span>}
                <span className="booking-price">{formatVND(tour.price)}</span>
                <span className="booking-price-unit">/ người</span>
              </div>
              <h3>Đặt tour ngay</h3>
              <form onSubmit={handleBook}>
                <div className="booking-field"><label>Hình thức</label><select value={bookingType} onChange={event => handleBookingTypeChange(event.target.value)}><option value="Shared">Đi lẻ / tour ghép</option><option value="PrivateGroup">Đi theo đoàn</option></select></div>
                {bookingType === 'PrivateGroup' ? (
                  <div className="booking-field"><label>Ngày khởi hành mong muốn</label><input type="date" min={todayDate} required value={requestedStartDate} onChange={event => setRequestedStartDate(event.target.value)} /></div>
                ) : (
                  <div className="booking-field"><label>Lịch khởi hành</label><select required value={selectedSchedule} onChange={event => setSelectedSchedule(event.target.value)}><option value="">-- Chọn lịch --</option>{schedules.map(schedule => <option key={schedule.id} value={schedule.id}>{formatDate(schedule.startDate)} - Còn {schedule.availableSeats} chỗ</option>)}</select></div>
                )}
                <div className="booking-field"><label>Số khách</label><input type="number" min={bookingType === 'PrivateGroup' ? minGroupGuests : 1} max={tour.maxGuests || undefined} required value={guestCount} onChange={event => setGuestCount(event.target.value)} /></div>
                {bookingType === 'PrivateGroup' && <p className="booking-hint">Đi theo đoàn cần ít nhất {minGroupGuests} khách. Bạn chọn ngày riêng, TraveX sẽ phân nhân viên và xác nhận trước khi thanh toán.</p>}
                {canShowTotal && <div className="booking-total"><span>Tạm tính:</span><strong>{formatVND(tour.price * Number(guestCount || 0))}</strong></div>}
                {!user ? <button type="button" className="btn-primary full-width booking-submit" onClick={() => navigate('/login')}>Đăng nhập để đặt tour</button> : <button type="submit" className="btn-primary full-width booking-submit">{bookingType === 'PrivateGroup' ? 'Gửi yêu cầu đặt đoàn' : 'Tiếp tục thanh toán'}</button>}
              </form>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
