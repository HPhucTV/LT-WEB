import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tourApi, favoriteApi } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { formatVND } from '../utils/format'
import { TOUR_CATEGORIES } from '../utils/constants'
import PromoBanner from './PromoBanner'
import travexLogo from '../assets/travex-logo.svg'

export default function HomePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tất cả')
  const [priceRange, setPriceRange] = useState(20000000)
  const [scrolled, setScrolled] = useState(false)
  const [tourRatings, setTourRatings] = useState({})
  const [favorites, setFavorites] = useState(new Set())

  useEffect(() => {
    async function load() {
      try {
        const [toursData, ratingsData] = await Promise.all([
          tourApi.list(),
          tourApi.ratings()
        ])
        const activeTours = (toursData || []).filter(t => t.isActive)
        setTours(activeTours)

        // Convert ratings array to lookup map
        const ratingsMap = {}
        ;(ratingsData || []).forEach(r => {
          ratingsMap[r.tourId] = { avg: r.averageRating.toFixed(1), count: r.reviewCount }
        })
        setTourRatings(ratingsMap)

        if (user && user.role !== 'Admin' && user.role !== 'Staff') {
          try {
            const favs = await favoriteApi.list()
            setFavorites(new Set(favs.map(f => f.id)))
          } catch (e) { console.error('Không tải được danh sách yêu thích', e) }
        }
      } catch (err) {
        console.error('Không tải được danh sách tour', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  async function toggleFavorite(tourId, e) {
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    try {
      if (favorites.has(tourId)) {
        await favoriteApi.remove(tourId)
        setFavorites(prev => { const n = new Set(prev); n.delete(tourId); return n })
      } else {
        await favoriteApi.add(tourId)
        setFavorites(prev => { const n = new Set(prev); n.add(tourId); return n })
      }
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const filteredTours = tours.filter(t => {
    const q = searchTerm.toLowerCase()
    const matchSearch = t.name.toLowerCase().includes(q) || t.destination.toLowerCase().includes(q)
    const matchCategory = selectedCategory === 'Tất cả' || t.category === selectedCategory
    const matchPrice = t.price <= priceRange
    return matchSearch && matchCategory && matchPrice
  })

  return (
    <div className="home-page">
      {/* ─── Sticky Navbar ─── */}
      <nav className={`home-navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="nav-content">
          <a href="#" className="home-brand" onClick={e => e.preventDefault()}>
            <div className="home-brand-icon">
              <img src={travexLogo} alt="TraveX" />
            </div>
            <div className="home-brand-text">
              <span className="text-travel">Trave</span><span className="text-pro">X</span>
            </div>
          </a>

          <ul className="home-nav-links">
            <li><a href="#tours">Tour</a></li>
            <li><a href="#destinations">Điểm đến</a></li>
            <li><a href="#promotions">Khuyến mãi</a></li>
            <li><a href="/promotions" onClick={(e) => { e.preventDefault(); navigate('/promotions') }}>Ưu đãi</a></li>
            <li><a href="#about">Giới thiệu</a></li>
          </ul>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn-nav" onClick={() => navigate((user.role || '').toLowerCase() === 'admin' ? '/admin' : (user.role || '').toLowerCase() === 'staff' ? '/staff' : '/customer')}>Bảng điều khiển</button>
              <span className="nav-user-name">Chào, {user.fullName || user.username}</span>
              <button className="btn-nav btn-nav-outline" onClick={logout}>Đăng xuất</button>
            </div>
          ) : (
            <button className="btn-nav" onClick={() => navigate('/login')}>Đăng nhập</button>
          )}
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <header className="home-hero">
        <div className="login-overlay"></div>
        <div className="home-container hero-content">
          <h1>Khám phá Việt Nam tuyệt đẹp</h1>
          <p>Đặt tour du lịch trọn gói với giá tốt nhất. Hơn 100+ điểm đến hấp dẫn đang chờ bạn.</p>

          <div className="home-search glass">
            <input
              type="text"
              placeholder="Bạn muốn đi đâu? (VD: Đà Lạt, Phú Quốc...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn-primary search-btn">Tìm kiếm</button>
          </div>
        </div>
      </header>

      {/* ─── Promo Banner ─── */}
      <PromoBanner />

      {/* ─── Tour Section ─── */}
      <section className="home-tours home-container" id="tours">
        <div className="section-header">
          <h2>Tour nổi bật</h2>
          <p>Những điểm đến được yêu thích nhất do TraveX đề xuất.</p>
        </div>

        {/* Category Tabs */}
        <div className="category-tabs">
          {TOUR_CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
          <div className="price-filter">
            <label>Tối đa: <strong>{formatVND(priceRange)}</strong></label>
            <input
              type="range"
              min="1000000"
              max="20000000"
              step="500000"
              value={priceRange}
              onChange={e => setPriceRange(Number(e.target.value))}
            />
          </div>
        </div>

        {loading ? (
          <p className="empty-msg">Đang tải danh sách tour...</p>
        ) : filteredTours.length === 0 ? (
          <p className="empty-msg">Hiện chưa có tour nào phù hợp với tìm kiếm của bạn.</p>
        ) : (
          <div className="tour-grid">
            {filteredTours.map((t) => {
              const rating = tourRatings[t.id]
              const hasDiscount = t.originalPrice && t.originalPrice > t.price
              return (
                <article key={t.id} className="tour-card" onClick={() => navigate(`/tours/${t.id}`)} style={{ cursor: 'pointer' }}>
                  <div className="card-image-wrap">
                    {t.imageUrl ? (
                      <img src={t.imageUrl} alt={t.name} />
                    ) : (
                      <div className="placeholder-img">Chưa có ảnh</div>
                    )}
                    <span className="card-badge-location">{t.destination}</span>
                    {hasDiscount && (
                      <span className="card-badge-discount">
                        -{Math.round((1 - t.price / t.originalPrice) * 100)}%
                      </span>
                    )}
                    <button className={`favorite-btn ${favorites.has(t.id) ? 'active' : ''}`} onClick={(e) => toggleFavorite(t.id, e)} aria-label="Yêu thích">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </button>
                  </div>
                  <div className="tour-content">
                    <div className="tour-heading">
                      <span className="tour-category-tag">{t.category}</span>
                      {rating && (
                        <span className="rating-inline">
                          <span className="star">★</span> {rating.avg}
                          <span className="rating-count">({rating.count})</span>
                        </span>
                      )}
                    </div>
                    <h3>{t.name}</h3>
                    <p className="tour-card-desc">{t.durationDays} ngày | {t.destination}</p>
                    <div className="tour-card-price-row" style={{ marginTop: 'auto' }}>
                      {hasDiscount && (
                        <span className="price-original">{formatVND(t.originalPrice)}</span>
                      )}
                      <span className="price-highlight">{formatVND(t.price)}</span>
                    </div>
                    <button className="btn-primary full-width" onClick={(e) => { e.stopPropagation(); navigate(`/tours/${t.id}`) }}>
                      Xem chi tiết
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* ─── Footer ─── */}
      <footer className="home-footer">
        <div className="home-container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="footer-brand">
                <span className="text-travel">Trave</span><span className="text-pro">X</span>
              </div>
              <p>Hệ thống đặt tour du lịch trọn gói hàng đầu Việt Nam. Uy tín - Chất lượng - Giá tốt.</p>
            </div>
            <div className="footer-col">
              <h4>Liên kết</h4>
              <ul>
                <li><a href="#tours">Tour du lịch</a></li>
                <li><a href="#promotions">Khuyến mãi</a></li>
                <li><a href="#about">Giới thiệu</a></li>
                <li><a href="#">Điều khoản</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Hỗ trợ</h4>
              <ul>
                <li><a href="#">Câu hỏi thường gặp</a></li>
                <li><a href="#">Chính sách hoàn tiền</a></li>
                <li><a href="#">Liên hệ</a></li>
                <li><a href="#">Hướng dẫn đặt tour</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Liên hệ</h4>
              <ul>
                <li>📞 1900 1234</li>
                <li>✉️ support@travex.vn</li>
                <li>📍 TP. Hồ Chí Minh, Việt Nam</li>
              </ul>
              <div className="footer-social">
                <a href="#" aria-label="Facebook">f</a>
                <a href="#" aria-label="Instagram">in</a>
                <a href="#" aria-label="Youtube">yt</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 TraveX. Đã đăng ký bản quyền.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
