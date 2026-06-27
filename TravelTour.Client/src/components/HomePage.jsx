import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tourApi } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { formatVND } from '../utils/format'
import { TOUR_CATEGORIES } from '../utils/constants'
import PromoBanner from './PromoBanner'
import travexLogo from '../assets/travex-logo.svg'

const moodPresets = [
  { key: 'relax', label: 'Nghỉ dưỡng', hint: 'Biển xanh, resort, lịch trình nhẹ', category: 'Nghỉ dưỡng', search: '', maxPrice: 12000000 },
  { key: 'deal', label: 'Săn ưu đãi', hint: 'Ưu tiên tour đang giảm giá', category: 'Tất cả', search: '', maxPrice: 20000000, discounted: true },
  { key: 'weekend', label: 'Cuối tuần', hint: 'Tour ngắn ngày, dễ chốt nhanh', category: 'Tất cả', search: '', maxPrice: 6000000, maxDays: 3 },
  { key: 'family', label: 'Gia đình', hint: 'Hành trình thoải mái cho nhóm', category: 'Gia đình', search: '', maxPrice: 15000000 },
  { key: 'explore', label: 'Khám phá', hint: 'Nhiều điểm đến và trải nghiệm mới', category: 'Khám phá', search: '', maxPrice: 20000000 },
]

const quizSteps = [
  {
    key: 'style',
    title: 'Bạn đang muốn một chuyến đi như thế nào?',
    options: [
      { value: 'relax', label: 'Nghỉ dưỡng nhẹ nhàng', category: 'Nghỉ dưỡng', destinations: ['Phú Quốc', 'Đà Nẵng'] },
      { value: 'explore', label: 'Khám phá nhiều điểm', category: 'Khám phá', destinations: ['Đà Lạt', 'Hạ Long'] },
      { value: 'family', label: 'Đi cùng gia đình', category: 'Gia đình', destinations: ['Đà Nẵng', 'Hội An'] },
    ],
  },
  {
    key: 'budget',
    title: 'Ngân sách mỗi khách bạn thấy thoải mái?',
    options: [
      { value: 'low', label: 'Dưới 3 triệu', maxPrice: 3000000 },
      { value: 'mid', label: '3 - 5 triệu', maxPrice: 5000000 },
      { value: 'high', label: 'Trên 5 triệu', maxPrice: 20000000 },
    ],
  },
  {
    key: 'duration',
    title: 'Bạn muốn đi trong bao lâu?',
    options: [
      { value: 'short', label: '2-3 ngày', maxDays: 3 },
      { value: 'medium', label: '4 ngày', minDays: 4, maxDays: 4 },
      { value: 'long', label: '5 ngày trở lên', minDays: 5 },
    ],
  },
]

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
  const [inspirationIndex, setInspirationIndex] = useState(0)
  const [selectedMood, setSelectedMood] = useState('')
  const [quizStep, setQuizStep] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizResult, setQuizResult] = useState([])
  const [spotlightTour, setSpotlightTour] = useState(null)

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

      } catch (err) {
        console.error('Không tải được danh sách tour', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (tours.length <= 3) return undefined
    const timer = setInterval(() => {
      setInspirationIndex(prev => (prev + 1) % tours.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [tours.length])

  const selectedMoodPreset = moodPresets.find(mood => mood.key === selectedMood)
  const filteredTours = tours.filter(t => {
    const q = searchTerm.toLowerCase()
    const matchSearch = t.name.toLowerCase().includes(q) || t.destination.toLowerCase().includes(q)
    const matchCategory = selectedCategory === 'Tất cả' || t.category === selectedCategory
    const matchPrice = t.price <= priceRange
    const matchMoodDays = !selectedMoodPreset?.maxDays || t.durationDays <= selectedMoodPreset.maxDays
    const matchMoodDiscount = !selectedMoodPreset?.discounted || (t.originalPrice && t.originalPrice > t.price)
    return matchSearch && matchCategory && matchPrice && matchMoodDays && matchMoodDiscount
  })

  const fallbackInspirationTours = [
    { id: 'fallback-da-lat', name: 'Đà Lạt nghỉ dưỡng', destination: 'Đà Lạt', durationDays: 3 },
    { id: 'fallback-phu-quoc', name: 'Phú Quốc biển xanh', destination: 'Phú Quốc', durationDays: 3 },
    { id: 'fallback-ha-long', name: 'Hạ Long du thuyền', destination: 'Hạ Long', durationDays: 2 }
  ]
  const inspirationTours = tours.length ? tours : fallbackInspirationTours
  const visibleInspirationTours = Array.from(
    { length: Math.min(3, inspirationTours.length) },
    (_, offset) => inspirationTours[(inspirationIndex + offset) % inspirationTours.length]
  )

  function scrollToTours() {
    document.getElementById('tours')?.scrollIntoView({ behavior: 'smooth' })
  }

  function normalizeText(value = '') {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
  }

  function isDiscounted(tour) {
    return tour.originalPrice && tour.originalPrice > tour.price
  }

  function applyMood(mood) {
    setSelectedMood(mood.key)
    setSelectedCategory(mood.category)
    setPriceRange(mood.maxPrice)
    setSearchTerm(mood.search)
    scrollToTours()
  }

  function getMoodTours(mood) {
    return tours.filter(tour => {
      const category = normalizeText(tour.category)
      const destination = normalizeText(tour.destination)
      const name = normalizeText(tour.name)
      const moodCategory = normalizeText(mood.category)
      const matchCategory = mood.category === 'Tất cả' || category === moodCategory
      const matchSearch = !mood.search || destination.includes(normalizeText(mood.search)) || name.includes(normalizeText(mood.search))
      const matchPrice = tour.price <= mood.maxPrice
      const matchDays = !mood.maxDays || tour.durationDays <= mood.maxDays
      const matchDiscount = !mood.discounted || isDiscounted(tour)
      return matchCategory && matchSearch && matchPrice && matchDays && matchDiscount
    })
  }

  function scoreTour(tour, answers) {
    let score = 0
    const style = quizSteps[0].options.find(option => option.value === answers.style)
    const budget = quizSteps[1].options.find(option => option.value === answers.budget)
    const duration = quizSteps[2].options.find(option => option.value === answers.duration)
    const tourCategory = normalizeText(tour.category)
    const tourDestination = normalizeText(tour.destination)

    if (style?.category && tourCategory === normalizeText(style.category)) score += 4
    if (style?.destinations?.some(destination => tourDestination.includes(normalizeText(destination)))) score += 2
    if (budget?.maxPrice && tour.price <= budget.maxPrice) score += 3
    if (duration?.maxDays && tour.durationDays <= duration.maxDays) score += 2
    if (duration?.minDays && tour.durationDays >= duration.minDays) score += 2
    if (isDiscounted(tour)) score += 1
    return score
  }

  function calculateQuizResult(answers) {
    const ranked = [...tours]
      .map(tour => ({ tour, score: scoreTour(tour, answers) }))
      .sort((a, b) => b.score - a.score || a.tour.price - b.tour.price)
      .map(item => item.tour)
    const withMatches = ranked.filter(tour => scoreTour(tour, answers) > 0)
    setQuizResult((withMatches.length ? withMatches : ranked).slice(0, 3))
  }

  function chooseQuizOption(option) {
    const step = quizSteps[quizStep]
    const nextAnswers = { ...quizAnswers, [step.key]: option.value }
    setQuizAnswers(nextAnswers)

    if (quizStep === quizSteps.length - 1) {
      calculateQuizResult(nextAnswers)
      return
    }

    setQuizStep(prev => prev + 1)
  }

  function resetQuiz() {
    setQuizStep(0)
    setQuizAnswers({})
    setQuizResult([])
  }

  function pickSpotlightTour() {
    if (!tours.length) return
    const pool = spotlightTour && tours.length > 1
      ? tours.filter(tour => tour.id !== spotlightTour.id)
      : tours
    setSpotlightTour(pool[Math.floor(Math.random() * pool.length)])
  }

  const activeMood = selectedMoodPreset
  const moodMatches = activeMood ? getMoodTours(activeMood).slice(0, 3) : []
  const currentQuizStep = quizSteps[quizStep]

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
              <button className="btn-nav" onClick={() => {
                const role = (user.role || '').toLowerCase()
                navigate(role === 'admin' ? '/admin' : role === 'sales' ? '/sales' : role === 'staff' ? '/staff' : '/customer')
              }}>Bảng điều khiển</button>
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
          <div className="hero-copy">
            <span className="hero-kicker">Tour nội địa tuyển chọn 2026</span>
            <h1>Khám phá Việt Nam theo cách nhẹ nhàng hơn</h1>
            <p>Chọn tour trọn gói, xem lịch trình rõ ràng và đặt chỗ nhanh với những hành trình được TraveX chọn lọc.</p>

            <div className="home-search glass">
              <input
                type="text"
                placeholder="Bạn muốn đi đâu? (VD: Đà Lạt, Phú Quốc...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="btn-primary search-btn" onClick={scrollToTours}>Tìm kiếm</button>
            </div>

            <div className="hero-actions">
              <button className="hero-secondary-btn" onClick={() => navigate('/promotions')}>Xem ưu đãi hè</button>
              <a href="#destinations">Khám phá điểm đến</a>
            </div>

            <div className="hero-stats" aria-label="Điểm nổi bật của TraveX">
              <div>
                <strong>{tours.length || '100+'}</strong>
                <span>tour đang mở bán</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>hỗ trợ đặt tour</span>
              </div>
              <div>
                <strong>4.8/5</strong>
                <span>đánh giá trung bình</span>
              </div>
            </div>
          </div>

          <aside className="hero-trip-card" aria-label="Tour gợi ý">
            <span>Tour gợi ý tuần này</span>
            <h2>Phú Quốc 3N2Đ</h2>
            <p>Biển trong, resort ven bờ và lịch trình thư giãn cho gia đình.</p>
            <button onClick={() => {
              setSearchTerm('Phú Quốc')
              scrollToTours()
            }}>
              Xem tour phù hợp
            </button>
          </aside>
        </div>
      </header>

      {/* ─── Promo Banner ─── */}
      <PromoBanner />

      <section className="trip-playground home-container" aria-label="Công cụ gợi ý chuyến đi">
        <div className="section-header section-header-left trip-playground-header">
          <span className="section-eyebrow">Chọn nhanh cảm hứng</span>
          <h2>Để TraveX gợi ý chuyến đi hợp gu hơn</h2>
          <p>Chọn mood, trả lời vài câu hoặc bấm gợi ý bất kỳ để tìm tour phù hợp mà không cần tự lọc quá nhiều.</p>
        </div>

        <div className="mood-strip" aria-label="Bộ lọc cảm hứng">
          {moodPresets.map(mood => (
            <button
              key={mood.key}
              className={`mood-chip ${selectedMood === mood.key ? 'active' : ''}`}
              onClick={() => applyMood(mood)}
            >
              <strong>{mood.label}</strong>
              <span>{mood.hint}</span>
            </button>
          ))}
        </div>

        {activeMood && (
          <div className="mood-summary">
            <div>
              <span>Đang xem theo mood</span>
              <strong>{activeMood.label}</strong>
            </div>
            <p>{moodMatches.length ? `${moodMatches.length} tour nổi bật đang khớp với lựa chọn này.` : 'Chưa có tour nào khớp hoàn toàn, bạn có thể thử mood khác.'}</p>
            <button
              type="button"
              onClick={() => {
                setSelectedMood('')
                setSelectedCategory('Tất cả')
                setSearchTerm('')
                setPriceRange(20000000)
              }}
            >
              Xóa mood
            </button>
          </div>
        )}

        <div className="trip-playground-grid">
          <div className="trip-quiz-panel">
            <div className="quiz-panel-heading">
              <span>Quiz gợi ý tour</span>
              <strong>{quizResult.length ? 'Kết quả phù hợp với bạn' : `Bước ${quizStep + 1}/${quizSteps.length}`}</strong>
            </div>

            {quizResult.length ? (
              <>
                <div className="quiz-result-grid">
                  {quizResult.map(tour => (
                    <article key={tour.id} className="quiz-result-item">
                      {tour.imageUrl ? <img src={tour.imageUrl} alt={tour.name} /> : <div className="quiz-result-placeholder">Chưa có ảnh</div>}
                      <div>
                        <span>{tour.durationDays} ngày tại {tour.destination}</span>
                        <h3>{tour.name}</h3>
                        <strong>{formatVND(tour.price)}</strong>
                        <button type="button" onClick={() => navigate(`/tours/${tour.id}`)}>Xem chi tiết</button>
                      </div>
                    </article>
                  ))}
                </div>
                <button type="button" className="quiz-reset-btn" onClick={resetQuiz}>Làm lại quiz</button>
              </>
            ) : (
              <>
                <h3>{currentQuizStep.title}</h3>
                <div className="quiz-options">
                  {currentQuizStep.options.map(option => (
                    <button key={option.value} type="button" onClick={() => chooseQuizOption(option)}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <aside className="spotlight-panel">
            <div>
              <span>Gợi ý bất kỳ</span>
              <h3>{spotlightTour ? spotlightTour.name : 'Bấm để TraveX chọn giúp một tour'}</h3>
              <p>
                {spotlightTour
                  ? `${spotlightTour.durationDays} ngày tại ${spotlightTour.destination} · ${formatVND(spotlightTour.price)}`
                  : 'Một cách nhanh để khách bắt đầu khám phá khi chưa biết nên đi đâu.'}
              </p>
            </div>
            {spotlightTour?.imageUrl && <img src={spotlightTour.imageUrl} alt={spotlightTour.name} />}
            <div className="spotlight-actions">
              <button type="button" onClick={pickSpotlightTour} disabled={!tours.length}>
                {spotlightTour ? 'Đổi gợi ý' : 'Gợi ý cho tôi'}
              </button>
              {spotlightTour && (
                <button type="button" className="spotlight-detail-btn" onClick={() => navigate(`/tours/${spotlightTour.id}`)}>
                  Xem tour này
                </button>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section className="home-destinations home-container" id="destinations">
        <div className="section-header section-header-left">
          <span className="section-eyebrow">Điểm đến được quan tâm</span>
          <h2>Lấy cảm hứng cho chuyến đi tiếp theo</h2>
          <p>Các tour đang tự động chuyển lần lượt để bạn xem thêm lựa chọn mà không cần cuộn nhiều.</p>
        </div>
        <div className="destination-grid rotating-destination-grid">
          {visibleInspirationTours.map((tour, index) => (
            <article
              className="destination-card"
              key={`${tour.id}-${inspirationIndex}`}
              onClick={() => {
                if (!String(tour.id).startsWith('fallback')) {
                  navigate(`/tours/${tour.id}`)
                } else {
                  setSearchTerm(tour.destination)
                  scrollToTours()
                }
              }}
            >
              {tour.imageUrl ? (
                <img src={tour.imageUrl} alt={tour.name} />
              ) : (
                <div className={`destination-fallback destination-fallback-${index + 1}`} />
              )}
              <div>
                <span>{tour.durationDays || 3} ngày · {tour.destination}</span>
                <h3>{tour.name}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ─── Tour Section ─── */}
      <section className="home-tours home-container" id="tours">
        <div className="section-header">
          <span className="section-eyebrow">Gợi ý cho bạn</span>
          <h2>Tour nổi bật</h2>
          <p>Những điểm đến được yêu thích nhất do TraveX đề xuất.</p>
        </div>

        {/* Category Tabs */}
        <div className="tour-toolbar">
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
          </div>
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

      <section className="home-about" id="about">
        <div className="home-container about-grid">
          <div>
            <span className="section-eyebrow">Vì sao chọn TraveX</span>
            <h2>Đặt tour rõ ràng từ giá đến lịch trình</h2>
            <p>Trang chủ mới nhấn mạnh vào thao tác tìm tour, xem ưu đãi và chọn điểm đến nhanh hơn. Các thông tin quan trọng được đưa lên trước để khách hàng không phải đoán bước tiếp theo.</p>
          </div>
          <div className="about-points">
            <article>
              <strong>Lịch trình minh bạch</strong>
              <span>Thông tin thời lượng, điểm đến và giá được đặt ngay trên từng card.</span>
            </article>
            <article>
              <strong>Ưu đãi dễ thấy</strong>
              <span>Khuyến mãi và tour giảm giá có vị trí riêng, không lẫn trong nội dung phụ.</span>
            </article>
            <article>
              <strong>Thao tác nhanh</strong>
              <span>Tìm kiếm, lọc giá và chọn danh mục đều nằm gần danh sách tour.</span>
            </article>
          </div>
        </div>
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
