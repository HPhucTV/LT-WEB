import { useState, useEffect } from 'react'

const PROMOS = [
  {
    id: 1,
    title: 'Giảm 20% Tour Phú Quốc',
    subtitle: 'Khám phá đảo ngọc với giá ưu đãi. Áp dụng đến hết tháng 5.',
    code: 'PQ2026',
    bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    emoji: '🏝️'
  },
  {
    id: 2,
    title: 'Combo Đà Nẵng - Hội An',
    subtitle: 'Đặt tour 4N3Đ chỉ từ 4.500.000đ. Bao gồm vé máy bay.',
    code: 'DANANG50',
    bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    emoji: '✈️'
  },
  {
    id: 3,
    title: 'Ưu đãi chớp nhoáng mỗi Thứ 6',
    subtitle: 'Giảm đến 30% cho 50 đơn đầu tiên mỗi tuần.',
    code: 'FLASH30',
    bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    emoji: '⚡'
  }
]

export default function PromoBanner() {
  const [current, setCurrent] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % PROMOS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const promo = PROMOS[current]

  return (
    <section className="promo-section home-container" id="promotions">
      <div className="promo-carousel" style={{ background: promo.bg }}>
        <div className="promo-content">
          <span className="promo-emoji">{promo.emoji}</span>
          <div>
            <h3>{promo.title}</h3>
            <p>{promo.subtitle}</p>
          </div>
          <button className="promo-code-btn" onClick={() => copyCode(promo.code)}>
            {copied ? '✓ Đã sao chép!' : `Mã: ${promo.code}`}
          </button>
        </div>
        <div className="promo-dots">
          {PROMOS.map((_, i) => (
            <button
              key={i}
              className={`promo-dot ${i === current ? 'active' : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`Ưu đãi ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
