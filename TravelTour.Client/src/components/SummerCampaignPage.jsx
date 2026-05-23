import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { tourApi } from '../api'
import { useSettings } from '../contexts/SettingsContext'
import { formatVND } from '../utils/format'
import travexLogo from '../assets/travex-logo.svg'

const CATEGORY_KEYS = ['all', 'island', 'family', 'resort', 'explore']
const CAMPAIGN_END = new Date('2026-08-31T23:59:59+07:00')

function discountPercent(tour) {
  if (tour.originalPrice && tour.originalPrice > tour.price) {
    return Math.round((1 - tour.price / tour.originalPrice) * 100)
  }
  return tour.destination?.toLowerCase().includes('phú quốc') ? 20 : 12
}

function campaignCategory(tour) {
  const text = `${tour.name || ''} ${tour.destination || ''} ${tour.category || ''}`.toLowerCase()
  if (text.includes('phú quốc') || text.includes('nha trang') || text.includes('biển')) return 'island'
  if (text.includes('gia đình')) return 'family'
  if (text.includes('resort') || text.includes('nghỉ')) return 'resort'
  return 'explore'
}

function getDaysLeft() {
  const diff = CAMPAIGN_END.getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function SummerCampaignPage({ audience = 'admin' }) {
  const navigate = useNavigate()
  const { t } = useSettings()
  const isPublic = audience === 'public'
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [budget, setBudget] = useState(20000000)
  const [query, setQuery] = useState('')
  const [daysLeft, setDaysLeft] = useState(getDaysLeft)

  useEffect(() => {
    async function load() {
      try {
        const data = await tourApi.list()
        setTours((data || []).filter(t => t.isActive !== false))
      } catch {
        setTours([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setDaysLeft(getDaysLeft()), 60000)
    return () => clearInterval(timer)
  }, [])

  const campaignTours = useMemo(() => {
    return tours
      .filter(tour => tour.originalPrice && tour.originalPrice > tour.price)
      .map(tour => ({
        ...tour,
        campaignCategory: campaignCategory(tour),
        discount: discountPercent(tour),
      }))
      .filter(tour => {
        const q = query.trim().toLowerCase()
        const matchQuery = !q || tour.name?.toLowerCase().includes(q) || tour.destination?.toLowerCase().includes(q)
        const matchCategory = category === 'all' || tour.campaignCategory === category
        return matchQuery && matchCategory && tour.price <= budget
      })
      .sort((a, b) => b.discount - a.discount)
  }, [budget, category, query, t, tours])

  const bestDiscount = campaignTours[0]?.discount || 0

  const content = (
    <>
      <section className={`campaign-hero ${isPublic ? 'campaign-hero-public' : ''}`}>
        <div className="campaign-hero-main">
          <span className="campaign-kicker">{t('campaignTitle')}</span>
          <h2>{isPublic ? t('campaignPublicHeadline') : t('campaignAdminHeadline')}</h2>
          <p>
            {isPublic
              ? t('campaignPublicText')
              : t('campaignAdminText')}
          </p>
          <div className="campaign-actions">
            <button className="btn-primary" onClick={() => document.getElementById('campaign-tours')?.scrollIntoView({ behavior: 'smooth' })}>
              {t('viewDeals')}
            </button>
            {isPublic ? (
              <button className="btn-secondary" onClick={() => navigate('/')}>{t('backHome')}</button>
            ) : (
              <button className="btn-secondary" onClick={() => navigate('/admin/tours')}>{t('manageTours')}</button>
            )}
          </div>
        </div>
        <div className="campaign-stats">
          <article>
            <span>{t('appliedTours')}</span>
            <strong>{campaignTours.length}</strong>
          </article>
          <article>
            <span>{t('bestDiscount')}</span>
            <strong>{bestDiscount}%</strong>
          </article>
          <article>
            <span>{t('daysLeft')}</span>
            <strong>{daysLeft} {t('days')}</strong>
          </article>
        </div>
      </section>

      <section className="toolbar campaign-toolbar" id="campaign-tours">
        <div>
          <h2>{isPublic ? t('publicCampaignTours') : t('adminCampaignTours')}</h2>
          <p>{isPublic ? t('publicCampaignHelp') : t('adminCampaignHelp')}</p>
        </div>
        <div className="toolbar-actions">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('searchTour')} />
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORY_KEYS.map(item => <option key={item} value={item}>{t(item)}</option>)}
          </select>
        </div>
      </section>

      <div className="campaign-budget">
        <label>{t('maxBudget')}: <strong>{formatVND(budget)}</strong></label>
        <input type="range" min="1000000" max="20000000" step="500000" value={budget} onChange={e => setBudget(Number(e.target.value))} />
      </div>

      {loading ? (
        <p className="empty-msg">{t('loadingCampaign')}</p>
      ) : campaignTours.length === 0 ? (
        <p className="empty-msg">{t('emptyCampaign')}</p>
      ) : (
        <div className="campaign-grid">
          {campaignTours.map(tour => {
            return (
              <article className="campaign-card" key={tour.id}>
                <div className="campaign-card-image">
                  {tour.imageUrl ? <img src={tour.imageUrl} alt={tour.name} /> : <div className="campaign-placeholder">{t('summerPlaceholder')}</div>}
                  <span>-{tour.discount}%</span>
                </div>
                <div className="campaign-card-body">
                  <div className="campaign-card-meta">
                    <span>{t(tour.campaignCategory)}</span>
                    <small>{tour.durationDays || 3} {t('days')}</small>
                  </div>
                  <h3>{tour.name}</h3>
                  <p>{tour.destination}</p>
                  <div className="campaign-price-row">
                    <span className="price-original">{formatVND(tour.originalPrice)}</span>
                    <strong>{formatVND(tour.price)}</strong>
                  </div>
                  <p className={`campaign-promo-title ${tour.promotionTitle ? '' : 'campaign-promo-title-empty'}`}>
                    {tour.promotionTitle || 'Không có ưu đãi riêng'}
                  </p>
                  <button className="btn-primary full-width" onClick={() => navigate(`/tours/${tour.id}`)}>
                    {isPublic ? t('seeAndBook') : t('seeDetails')}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )

  if (!isPublic) return content

  return (
    <main className="campaign-public-page">
      <nav className="campaign-public-nav">
        <Link to="/" className="home-brand">
          <div className="home-brand-icon">
            <img src={travexLogo} alt="TraveX" />
          </div>
          <div className="home-brand-text">
            <span className="text-travel">Trave</span><span className="text-pro">X</span>
          </div>
        </Link>
        <div className="campaign-public-links">
          <Link to="/">{t('home')}</Link>
          <Link to="/#tours">{t('tour')}</Link>
          <Link to="/login" className="btn-nav">{t('login')}</Link>
        </div>
      </nav>
      <div className="home-container campaign-public-content">
        {content}
      </div>
    </main>
  )
}
