import { useEffect, useState } from 'react'
import { reviewApi, tourApi } from '../../api'
import { formatDate } from '../../utils/format'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'

export default function CustomerReviews() {
  const { user } = useAuth()
  const toast = useToast()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  
  // Form state
  const [tours, setTours] = useState([])
  const [selectedReviewId, setSelectedReviewId] = useState(null)
  const [selectedTourId, setSelectedTourId] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  useEffect(() => {
    loadReviews()
  }, [])

  async function loadReviews() {
    setLoading(true)
    try { setReviews(await reviewApi.listMine()) }
    catch (err) { toast.error('Lỗi khi tải đánh giá') }
    finally { setLoading(false) }
  }

  async function handleOpenAdd() {
    try {
      const allTours = await tourApi.list()
      setTours(allTours)
      setSelectedTourId('')
      setRating(5)
      setComment('')
      setIsAddModalOpen(true)
    } catch {
      toast.error('Không tải được danh sách tour')
    }
  }

  function handleOpenEdit(review) {
    setSelectedReviewId(review.id)
    setRating(review.rating)
    setComment(review.comment)
    setIsEditModalOpen(true)
  }

  async function handleDelete(id) {
    if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return
    try {
      await reviewApi.remove(id)
      setReviews(reviews.filter(r => r.id !== id))
      toast.success('Đã xóa đánh giá')
    } catch (err) {
      toast.error('Lỗi khi xóa đánh giá')
    }
  }

  async function submitAdd(e) {
    e.preventDefault()
    if (!selectedTourId) { toast.error('Vui lòng chọn tour'); return }
    try {
      await reviewApi.create(selectedTourId, {
        customerId: user?.id,
        customerName: user?.fullName || 'Khách hàng',
        rating: Number(rating),
        comment
      })
      toast.success('Thêm đánh giá thành công')
      setIsAddModalOpen(false)
      loadReviews()
    } catch (err) { toast.error(err.message) }
  }

  async function submitEdit(e) {
    e.preventDefault()
    try {
      const updated = await reviewApi.update(selectedReviewId, { rating: Number(rating), comment })
      setReviews(reviews.map(r => r.id === updated.id ? updated : r))
      toast.success('Cập nhật thành công')
      setIsEditModalOpen(false)
    } catch (err) { toast.error(err.message) }
  }

  return (
    <>
      <section className="toolbar">
        <div>
          <h2>Đánh giá của tôi</h2>
          <p>Các đánh giá bạn đã viết cho các tour đã đi.</p>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd}>+ Viết đánh giá</button>
      </section>
      
      {loading ? <p className="empty-msg">Đang tải...</p> : reviews.length === 0 ? <p className="empty-msg">Bạn chưa viết đánh giá nào.</p> : (
        <div className="reviews-list" style={{ padding: '0 24px' }}>
          {reviews.map(r => (
            <div key={r.id} className="review-item" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div className="review-item-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: 16 }}>Tour: {r.tourName}</h4>
                  <small style={{ color: '#64748b' }}>{formatDate(r.createdAt)}</small>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="review-stars" style={{ color: '#fbbf24', fontSize: 18 }}>
                    {'★'.repeat(r.rating)}<span style={{ color: '#cbd5e1' }}>{'★'.repeat(5 - r.rating)}</span>
                  </div>
                  <button className="btn-secondary btn-sm" onClick={() => handleOpenEdit(r)}>Sửa</button>
                  <button className="btn-danger btn-sm" onClick={() => handleDelete(r.id)}>Xóa</button>
                </div>
              </div>
              <p style={{ margin: 0, color: '#334155', lineHeight: 1.6 }}>"{r.comment}"</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add Review */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <form className="modal-body" onClick={e => e.stopPropagation()} onSubmit={submitAdd}>
            <h2>Viết đánh giá mới</h2>
            <div className="form-grid">
              <label className="span-2">Chọn tour
                <select required value={selectedTourId} onChange={e => setSelectedTourId(e.target.value)}>
                  <option value="">-- Chọn tour --</option>
                  {tours.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>
              <label className="span-2">Đánh giá (Số sao)
                <select required value={rating} onChange={e => setRating(e.target.value)}>
                  <option value="5">5 Sao - Tuyệt vời</option>
                  <option value="4">4 Sao - Rất tốt</option>
                  <option value="3">3 Sao - Bình thường</option>
                  <option value="2">2 Sao - Kém</option>
                  <option value="1">1 Sao - Rất kém</option>
                </select>
              </label>
              <label className="span-2">Nội dung đánh giá
                <textarea required rows="4" value={comment} onChange={e => setComment(e.target.value)} />
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Hủy</button>
              <button type="submit" className="btn-primary">Gửi đánh giá</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Edit Review */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <form className="modal-body" onClick={e => e.stopPropagation()} onSubmit={submitEdit}>
            <h2>Sửa đánh giá</h2>
            <div className="form-grid">
              <label className="span-2">Đánh giá (Số sao)
                <select required value={rating} onChange={e => setRating(e.target.value)}>
                  <option value="5">5 Sao - Tuyệt vời</option>
                  <option value="4">4 Sao - Rất tốt</option>
                  <option value="3">3 Sao - Bình thường</option>
                  <option value="2">2 Sao - Kém</option>
                  <option value="1">1 Sao - Rất kém</option>
                </select>
              </label>
              <label className="span-2">Nội dung đánh giá
                <textarea required rows="4" value={comment} onChange={e => setComment(e.target.value)} />
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>Hủy</button>
              <button type="submit" className="btn-primary">Cập nhật</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
