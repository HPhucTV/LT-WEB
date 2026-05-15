import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { favoriteApi } from '../../api'
import { useToast } from '../../contexts/ToastContext'
import { formatVND } from '../../utils/format'

export default function CustomerFavorites() {
  const navigate = useNavigate()
  const toast = useToast()
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadFavorites() {
    try {
      const favorites = await favoriteApi.list()
      setTours(favorites)
    } catch {
      toast.error('Lỗi khi tải danh sách yêu thích')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFavorites() }, [])

  async function removeFavorite(tourId, event) {
    event.stopPropagation()
    try {
      await favoriteApi.remove(tourId)
      setTours(tours.filter(tour => tour.id !== tourId))
      toast.success('Đã bỏ yêu thích')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <>
      <section className="toolbar">
        <div><h2>Tour yêu thích</h2><p>Các tour bạn đã lưu để xem lại sau.</p></div>
      </section>
      
      {loading ? (
        <p className="empty-msg">Đang tải...</p>
      ) : tours.length === 0 ? (
        <p className="empty-msg">Bạn chưa lưu tour nào.</p>
      ) : (
        <div className="tour-grid" style={{ padding: '0 24px' }}>
          {tours.map(tour => (
            <article key={tour.id} className="tour-card" onClick={() => navigate(`/tours/${tour.id}`)} style={{ cursor: 'pointer' }}>
              <div className="card-image-wrap">
                {tour.imageUrl ? <img src={tour.imageUrl} alt={tour.name} /> : <div className="placeholder-img">Chưa có ảnh</div>}
                <span className="card-badge-location">{tour.destination}</span>
                <button className="favorite-btn active" onClick={event => removeFavorite(tour.id, event)} aria-label="Bỏ yêu thích">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </button>
              </div>
              <div className="tour-content">
                <span className="tour-category-tag">{tour.category}</span>
                <h3>{tour.name}</h3>
                <p className="tour-card-desc">{tour.durationDays} ngày | {tour.destination}</p>
                <div className="tour-card-price-row" style={{ marginTop: 'auto' }}>
                  <span className="price-highlight">{formatVND(tour.price)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
